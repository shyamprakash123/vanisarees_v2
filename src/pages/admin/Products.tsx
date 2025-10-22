import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Pencil, Trash2, Plus, Search, Eye } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Modal } from "../../components/ui/Modal";
import { ProductForm } from "../../components/product/ProductForm";
import { formatCurrency } from "../../utils/format";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface Product {
  id: string;
  title: string;
  slug: string;
  codes: string[];
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  featured: boolean;
  trending: boolean;
  active: boolean;
  seller_id: string | null;
  category_id: string | null;
  created_at: string;
  tax_slab: number;
  hsn_code: string;
  description: string;
  features: string[];
  images: string[];
  youtube_ids: string[];
}

export default function AdminProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterActive, setFilterActive] = useState<string>("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "error",
      });
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
    fetchProducts();
  };

  const toggleFeatured = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ featured: !currentStatus })
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully",
        variant: "success",
      });
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "error",
      });
    }
  };

  const toggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ active: !currentStatus })
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product status updated",
        variant: "success",
      });
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "error",
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
        variant: "success",
      });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "error",
      });
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.codes.some((code) =>
        code.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterActive === "all" ||
      (filterActive === "active" && product.active) ||
      (filterActive === "inactive" && !product.active) ||
      (filterActive === "featured" && product.featured);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Product Management</h1>

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

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterActive("all")}
            className={`px-4 py-2 rounded-lg ${
              filterActive === "all"
                ? "bg-red-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterActive("active")}
            className={`px-4 py-2 rounded-lg ${
              filterActive === "active"
                ? "bg-red-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterActive("inactive")}
            className={`px-4 py-2 rounded-lg ${
              filterActive === "inactive"
                ? "bg-red-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Inactive
          </button>
          <button
            onClick={() => setFilterActive("featured")}
            className={`px-4 py-2 rounded-lg ${
              filterActive === "featured"
                ? "bg-red-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Featured
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.product_images[0].image_url && (
                          <LazyLoadImage
                            src={product.product_images[0].image_url}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded"
                            effect="blur"
                            wrapperClassName="w-12 h-12 object-cover rounded"
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
                      <span
                        className={`text-sm ${
                          product.stock > 10
                            ? "text-green-600"
                            : product.stock > 0
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() =>
                            toggleActive(product.id, product.active)
                          }
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            product.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {product.active ? "Active" : "Inactive"}
                        </button>
                        {product.featured && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Featured
                          </span>
                        )}
                      </div>
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
                          onClick={() =>
                            toggleFeatured(product.id, product.featured)
                          }
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded"
                          title="Toggle Featured"
                        >
                          <Eye size={16} />
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
            No products found
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
          isSeller={false}
        />
      </Modal>
    </div>
  );
}
