import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Modal } from "../../components/ui/Modal";
import { ProductForm } from "../../components/product/ProductForm";
import { formatCurrency } from "../../utils/format";

interface Product {
  id: string;
  title: string;
  slug: string;
  codes: string[];
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  active: boolean;
  seller_id: string | null;
  category_id: string | null;
  created_at: string;
  tax_slab: number;
  hsn_code: string;
  description: string;
  features: string[];
  product_images: string[];
  youtube_ids: string[];
  admin_approved: boolean | null;
  approval_notes: string | null;
  submitted_for_approval_at: string | null;
}

export function SellerProducts() {
  const { user } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);

  useEffect(() => {
    loadSellerData();
  }, [user]);

  const loadSellerData = async () => {
    if (!user) return;

    try {
      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (seller) {
        setSellerId(seller.id);
        fetchProducts(seller.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading seller data:", error);
      setLoading(false);
    }
  };

  const fetchProducts = async (sellerIdParam: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `*, product_images(
          id,
          image_url,
          alt_text,
          sort_order,
          is_primary
        )`
        )
        .eq("seller_id", sellerIdParam)
        .order("created_at", {
          ascending: false,
          foreignTable: "product_images",
        });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSuccess = () => {
    closeModal();
    if (sellerId) {
      fetchProducts(sellerId);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("seller_id", sellerId);

      if (error) throw error;

      toast.success("Product deleted successfully");
      if (sellerId) {
        fetchProducts(sellerId);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const updateStock = async (productId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", productId)
        .eq("seller_id", sellerId);

      if (error) throw error;

      toast.success("Stock updated successfully");
      if (sellerId) {
        fetchProducts(sellerId);
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
    }
  };

  const toggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ active: !currentStatus })
        .eq("id", productId)
        .eq("seller_id", sellerId);

      if (error) throw error;

      toast.success("Product status updated");
      if (sellerId) {
        fetchProducts(sellerId);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const submitForApproval = async (productId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/submit-product-approval`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: productId,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to submit product");
      }

      toast.success("Product submitted for approval");
      if (sellerId) {
        fetchProducts(sellerId);
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit product"
      );
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.codes.some((code) =>
        code.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!sellerId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">
            Seller account not found. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Products</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search products by name, code, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU / Codes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product?.images?.[0] && (
                          <img
                            src={product.product_images[0].image_url}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product.sku}</div>
                      <div className="text-sm text-gray-500">
                        {product.codes.slice(0, 2).join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(product.price)}
                      </div>
                      {product.mrp > product.price && (
                        <div className="text-sm text-gray-500 line-through">
                          {formatCurrency(product.mrp)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={product.stock}
                        onChange={(e) =>
                          updateStock(product.id, parseInt(e.target.value) || 0)
                        }
                        className={`w-20 px-2 py-1 text-sm border rounded ${
                          product.stock > 10
                            ? "border-green-300 text-green-600"
                            : product.stock > 0
                            ? "border-yellow-300 text-yellow-600"
                            : "border-red-300 text-red-600"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(product.id, product.active)}
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          product.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {product.admin_approved === true ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : product.admin_approved === false ? (
                        <div>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Rejected
                          </span>
                          {product.approval_notes && (
                            <div className="text-xs text-gray-500 mt-1">
                              {product.approval_notes}
                            </div>
                          )}
                        </div>
                      ) : product.submitted_for_approval_at ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => submitForApproval(product.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Submit for Approval
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchQuery
              ? "No products found"
              : "No products yet. Start by adding your first product!"}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        size="large"
      >
        <ProductForm
          productId={editingProduct?.id}
          initialData={editingProduct || undefined}
          onSuccess={handleSuccess}
          onCancel={closeModal}
          sellerId={sellerId}
          isSeller={true}
        />
      </Modal>
    </div>
  );
}
