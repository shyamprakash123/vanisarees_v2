import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, Pencil, Trash2, Tag, Calendar } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Modal } from "../../components/ui/Modal";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order: number;
  max_discount: number | null;
  max_uses: number | null;
  uses_per_user: number;
  valid_from: string;
  valid_to: string | null;
  active: boolean;
  description: string | null;
  created_at: string;
}

export function SellerCoupons() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    min_order: "",
    max_discount: "",
    max_uses: "",
    uses_per_user: "1",
    valid_from: new Date().toISOString().split("T")[0],
    valid_to: "",
    description: "",
    active: true,
  });

  useEffect(() => {
    loadSellerInfo();
  }, [user]);

  const loadSellerInfo = async () => {
    if (!user) return;

    try {
      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (seller) {
        fetchCoupons();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading seller info:", error);
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("seller_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      addToast("Failed to load coupons", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      type: "percentage",
      value: "",
      min_order: "",
      max_discount: "",
      max_uses: "",
      uses_per_user: "1",
      valid_from: new Date().toISOString().split("T")[0],
      valid_to: "",
      description: "",
      active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      min_order: coupon.min_order.toString(),
      max_discount: coupon.max_discount?.toString() || "",
      max_uses: coupon.max_uses?.toString() || "",
      uses_per_user: coupon.uses_per_user.toString(),
      valid_from: coupon.valid_from.split("T")[0],
      valid_to: coupon.valid_to ? coupon.valid_to.split("T")[0] : "",
      description: coupon.description || "",
      active: coupon.active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.value) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        min_order: parseFloat(formData.min_order) || 0,
        max_discount: formData.max_discount
          ? parseFloat(formData.max_discount)
          : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        uses_per_user: parseInt(formData.uses_per_user),
        valid_from: formData.valid_from,
        valid_to: formData.valid_to || null,
        description: formData.description || null,
        active: formData.active,
        seller_id: user?.id,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", editingCoupon.id);

        if (error) throw error;
        addToast("Coupon updated successfully", "success");
      } else {
        const { error } = await supabase.from("coupons").insert(couponData);

        if (error) throw error;
        addToast("Coupon created successfully", "success");
      }

      setShowModal(false);
      fetchCoupons();
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      addToast(error.message || "Failed to save coupon", "error");
    }
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", couponId);

      if (error) throw error;

      addToast("Coupon deleted successfully", "success");
      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      addToast("Failed to delete coupon", "error");
    }
  };

  const toggleActive = async (couponId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ active: !currentStatus })
        .eq("id", couponId);

      if (error) throw error;

      addToast("Coupon status updated", "success");
      fetchCoupons();
    } catch (error) {
      console.error("Error updating coupon:", error);
      addToast("Failed to update coupon", "error");
    }
  };

  const isExpired = (validTo: string | null) => {
    if (!validTo) return false;
    return new Date(validTo) < new Date();
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Coupons</h1>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
          >
            <Plus size={20} />
            Create Coupon
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="text-red-600" size={20} />
                  <div>
                    <h3 className="font-bold text-lg">{coupon.code}</h3>
                    {coupon.description && (
                      <p className="text-sm text-gray-600">
                        {coupon.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(coupon.id, coupon.active)}
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    coupon.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {coupon.active ? "Active" : "Inactive"}
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold">
                    {coupon.type === "percentage"
                      ? `${coupon.value}%`
                      : `₹${coupon.value}`}
                    {coupon.type === "percentage" && coupon.max_discount && (
                      <span className="text-xs text-gray-500">
                        {" "}
                        (max ₹{coupon.max_discount})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Min Order:</span>
                  <span className="font-semibold">₹{coupon.min_order}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uses per User:</span>
                  <span className="font-semibold">{coupon.uses_per_user}</span>
                </div>
                {coupon.max_uses && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Uses:</span>
                    <span className="font-semibold">{coupon.max_uses}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} />
                  <span>
                    {new Date(coupon.valid_from).toLocaleDateString()}
                    {coupon.valid_to && (
                      <>
                        {" → "}
                        <span
                          className={
                            isExpired(coupon.valid_to) ? "text-red-600" : ""
                          }
                        >
                          {new Date(coupon.valid_to).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </span>
                </div>
                {isExpired(coupon.valid_to) && (
                  <span className="inline-block mt-2 text-xs text-red-600 font-semibold">
                    Expired
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(coupon)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => deleteCoupon(coupon.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {coupons.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Tag className="mx-auto mb-4 text-gray-300" size={48} />
            <p>No coupons yet. Create your first coupon to offer discounts!</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCoupon ? "Edit Coupon" : "Create New Coupon"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coupon Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 uppercase"
              placeholder="e.g., SAVE20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "percentage" | "fixed",
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === "percentage" ? "Percentage *" : "Amount *"}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
                placeholder={
                  formData.type === "percentage" ? "e.g., 20" : "e.g., 100"
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Order Value
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.min_order}
                onChange={(e) =>
                  setFormData({ ...formData, min_order: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
                placeholder="0"
              />
            </div>
            {formData.type === "percentage" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Discount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.max_discount}
                  onChange={(e) =>
                    setFormData({ ...formData, max_discount: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
                  placeholder="No limit"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uses per User *
              </label>
              <input
                type="number"
                value={formData.uses_per_user}
                onChange={(e) =>
                  setFormData({ ...formData, uses_per_user: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Max Uses
              </label>
              <input
                type="number"
                value={formData.max_uses}
                onChange={(e) =>
                  setFormData({ ...formData, max_uses: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid From *
              </label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) =>
                  setFormData({ ...formData, valid_from: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid To
              </label>
              <input
                type="date"
                value={formData.valid_to}
                onChange={(e) =>
                  setFormData({ ...formData, valid_to: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              rows={2}
              placeholder="Brief description of this coupon"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="w-4 h-4 text-red-800 border-gray-300 rounded focus:ring-red-800"
            />
            <label
              htmlFor="active"
              className="text-sm font-medium text-gray-700"
            >
              Active
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
            >
              {editingCoupon ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
