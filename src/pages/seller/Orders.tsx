import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Eye, Package, Truck, CheckCircle } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Link } from "react-router-dom";
import { Modal } from "../../components/ui/Modal";

interface Order {
  id: string;
  user_id: string;
  subtotal: number;
  taxes: number;
  shipping: number;
  total: number;
  status: string;
  tracking_number: string | null;
  shipping_address: any;
  items: any[];
  created_at: string;
  updated_at: string;
  users?: {
    email: string;
    name: string;
    phone: string;
  };
  shipment_id?: string;
  awb_code?: string;
  courier_name?: string;
  shipment_status?: string;
  tracking_data?: any;
}

export function SellerOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");

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
        setSellerId(seller.id);
        fetchOrders(seller.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading seller info:", error);
      setLoading(false);
    }
  };

  const fetchOrders = async (sellerIdParam: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", sellerIdParam)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "shipped" && !selectedOrder?.tracking_number) {
        toast({
          title: "Error",
          description: "Please add tracking number before marking as shipped",
          variant: "error",
        });
        return;
      }

      if (newStatus === "shipped") {
        updateData.shipped_at = new Date().toISOString();
      } else if (newStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .eq("seller_id", sellerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully",
        variant: "success",
      });
      if (sellerId) fetchOrders(sellerId);
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "error",
      });
    }
  };

  const openTrackingModal = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || "");
    setShowTrackingModal(true);
  };

  const saveTrackingNumber = async () => {
    if (!selectedOrder || !trackingNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking number",
        variant: "error",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          tracking_number: trackingNumber,
          status: "shipped",
          shipped_at: new Date().toISOString(),
        })
        .eq("id", selectedOrder.id)
        .eq("seller_id", sellerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tracking number saved and order marked as shipped",
        variant: "success",
      });
      setShowTrackingModal(false);
      setSelectedOrder(null);
      setTrackingNumber("");
      if (sellerId) fetchOrders(sellerId);
    } catch (error) {
      console.error("Error saving tracking number:", error);
      toast({
        title: "Error",
        description: "Failed to save tracking number",
        variant: "error",
      });
    }
  };

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
      case "processing":
        return <Package size={16} className="inline mr-1" />;
      case "shipped":
        return <Truck size={16} className="inline mr-1" />;
      case "delivered":
        return <CheckCircle size={16} className="inline mr-1" />;
      default:
        return null;
    }
  };

  const getNextStatus = (currentStatus: string): string[] => {
    const statusFlow: Record<string, string[]> = {
      paid: ["confirmed"],
      confirmed: ["processing"],
      processing: ["shipped"],
      shipped: ["delivered"],
      delivered: [],
    };
    return statusFlow[currentStatus] || [];
  };

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
          <p className="text-gray-500">Seller account not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Orders</h1>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === "all"
                ? "bg-red-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            All Orders ({orders.length})
          </button>
          {["paid", "confirmed", "processing", "shipped", "delivered"].map(
            (status) => {
              const count = orders.filter((o) => o.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    statusFilter === status
                      ? "bg-red-800 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {status} ({count})
                </button>
              );
            }
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const nextStatuses = getNextStatus(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id || order.id.substring(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.users?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.users?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {Array.isArray(order.items) ? order.items.length : 0}{" "}
                          items
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{order.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full capitalize inline-flex items-center ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.awb_code ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {order.awb_code}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.courier_name}
                            </div>
                            <div
                              className={`text-xs mt-1 inline-block px-2 py-1 rounded-full ${
                                order.shipment_status === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : order.shipment_status === "in_transit"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {order.shipment_status || "pending"}
                            </div>
                          </div>
                        ) : order.tracking_number ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {order.tracking_number}
                            </div>
                            <button
                              onClick={() => openTrackingModal(order)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Update
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openTrackingModal(order)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Add Tracking
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 items-center">
                          {nextStatuses.length > 0 && (
                            <div className="flex gap-1">
                              {nextStatuses.map((nextStatus) => (
                                <button
                                  key={nextStatus}
                                  onClick={() =>
                                    updateOrderStatus(order.id, nextStatus)
                                  }
                                  className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 capitalize"
                                  title={`Mark as ${nextStatus}`}
                                >
                                  → {nextStatus}
                                </button>
                              ))}
                            </div>
                          )}
                          <Link
                            to={`/seller/order/${order.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded inline-block"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {statusFilter === "all"
              ? "No orders yet"
              : `No ${statusFilter} orders`}
          </div>
        )}
      </div>

      <Modal
        isOpen={showTrackingModal}
        onClose={() => {
          setShowTrackingModal(false);
          setSelectedOrder(null);
          setTrackingNumber("");
        }}
        title="Add/Update Tracking Number"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Number
            </label>
            <div className="text-gray-900 font-medium">
              #{selectedOrder?.id || selectedOrder?.id.substring(0, 8)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracking Number *
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              placeholder="Enter tracking number"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Adding a tracking number will automatically mark the order as
              "Shipped"
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowTrackingModal(false);
                setSelectedOrder(null);
                setTrackingNumber("");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveTrackingNumber}
              className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
            >
              Save & Mark as Shipped
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
