import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../hooks/useToast";
import { Check, X, Eye } from "lucide-react";
import { Modal } from "../../components/ui/Modal";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  images: string[];
  admin_approved: boolean;
  approval_notes: string | null;
  submitted_for_approval_at: string;
  created_at: string;
  seller_id: string;
  sellers?: {
    business_name: string;
    id: string;
    users?: {
      name: string;
      email: string;
    };
  };
}

export function ProductApprovals() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from("products")
        .select("*, sellers(business_name, id, users(name, email))");

      if (filter === "pending") {
        query = query
          .is("admin_approved", null)
          .not("submitted_for_approval_at", "is", null);
      } else if (filter === "approved") {
        query = query.eq("admin_approved", true);
      } else if (filter === "rejected") {
        query = query.eq("admin_approved", false);
      }

      const { data, error } = await query.order("submitted_for_approval_at", {
        ascending: false,
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

  const handleApproveReject = async (approved: boolean) => {
    if (!selectedProduct) return;

    try {
      const { data, error } = await supabase.rpc("admin_review_product", {
        product_id: selectedProduct.id,
        approved,
        notes: approvalNotes || null,
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(
          approved ? "Product approved successfully" : "Product rejected"
        );
        setShowModal(false);
        setSelectedProduct(null);
        setApprovalNotes("");
        fetchProducts();
      } else {
        toast.error(data?.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const openApprovalModal = (product: Product) => {
    setSelectedProduct(product);
    setApprovalNotes(product.approval_notes || "");
    setShowModal(true);
  };

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
        <h1 className="text-3xl font-bold mb-4">Product Approvals</h1>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg ${
              filter === "pending"
                ? "bg-red-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Pending (
            {
              products.filter(
                (p) => !p.admin_approved && p.submitted_for_approval_at
              ).length
            }
            )
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-lg ${
              filter === "approved"
                ? "bg-red-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-lg ${
              filter === "rejected"
                ? "bg-red-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Rejected
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
                    Seller
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
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description?.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {product.sellers?.business_name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.sellers?.users?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{product.price}
                      </div>
                      {product.mrp && product.mrp > product.price && (
                        <div className="text-sm text-gray-500 line-through">
                          ₹{product.mrp}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {product.stock}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          product.admin_approved === true
                            ? "bg-green-100 text-green-800"
                            : product.admin_approved === false
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {product.admin_approved === true
                          ? "Approved"
                          : product.admin_approved === false
                          ? "Rejected"
                          : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.submitted_for_approval_at
                        ? new Date(
                            product.submitted_for_approval_at
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openApprovalModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Review"
                        >
                          <Eye size={16} />
                        </button>
                        {filter === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                handleApproveReject(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found
          </div>
        )}
      </div>

      {showModal && selectedProduct && (
        <Modal onClose={() => setShowModal(false)} title="Review Product">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {selectedProduct.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedProduct.description}
              </p>

              {selectedProduct.images?.[0] && (
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500">Price:</span>
                  <p className="font-semibold">₹{selectedProduct.price}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Stock:</span>
                  <p className="font-semibold">{selectedProduct.stock}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                rows={4}
                placeholder="Add notes for seller..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApproveReject(true)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleApproveReject(false)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
