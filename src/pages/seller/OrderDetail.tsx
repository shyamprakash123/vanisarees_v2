import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

import {
  formatCurrency,
  formatDateTime,
  getOrderStatusColor,
} from "../../utils/format";
import {
  Package,
  MapPin,
  CreditCard,
  FileText,
  Truck,
  AlertCircle,
  ImageOff,
  User,
  Mail,
  Phone,
  Home,
} from "lucide-react";
import { OrderTrackingTimeline } from "../../components/order/OrderTrackingTimeline";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { ShiprocketManager } from "../../components/shiprocket/ShiprocketManager";
import { Modal } from "../../components/ui/Modal";
import { ShipmentTracker } from "../../components/ui/ShipmentTrackerComponent";
import { getMethodBadge, getStatusBadge } from "../../utils/badges";

interface Order {
  id: string;
  total: number;
  subtotal: number;
  taxes: number;
  shipping: number;
  wallet_used: number;
  coupon_discount: number;
  status: string;
  cod_charges: number;
  payment_status: string;
  payment_method?: string;
  paid_amount: number;
  items: any[];
  shipping_address: any;
  gift_wrap: boolean;
  gift_message?: string;
  notes?: string;
  tracking_number?: string;
  created_at: string;
  invoiced: boolean;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  user_id: string;
}

interface UserProfile {
  email: string;
  name: string;
  phone: string;
}

export default function SellerOrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [shipmentData, setShipmentData] = useState<any | null>(null);
  const [isTrackingDetailsOpen, setIsTrackingDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin");
      return;
    }
    loadOrder();
  }, [id, user]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
      *,
      users: user_id (
        email,
        name,
        phone
      )
    `
        )
        .eq("id", id)
        .single();

      if (data && data.shiprocket_shipment_id) {
        const { data: shipmentData, error: shipmentError } = await supabase
          .from("shiprocket_shipments")
          .select("*")
          .eq("order_id", data.id)
          .single();
        setShipmentData(shipmentData || null);
      }

      if (error) throw error;

      setOrder(data);
      setUserProfile(data.users || null);
    } catch (error) {
      console.error("Load order error:", error);
      navigate("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "shipped" && !order.shipped_at) {
        updateData.shipped_at = new Date().toISOString();
      } else if (newStatus === "delivered" && !order.delivered_at) {
        updateData.delivered_at = new Date().toISOString();
      } else if (newStatus === "cancelled" && !order.cancelled_at) {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", order.id);

      if (error) throw error;

      setOrder({ ...order, ...updateData });
      alert("Order status updated successfully");
    } catch (error) {
      console.error("Update status error:", error);
      alert("Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const handleShipmentSuccess = (trackingNumber: string) => {
    if (order) {
      setOrder({
        ...order,
        tracking_number: trackingNumber,
        status: "shipped",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Order not found</div>
      </div>
    );
  }

  const addr = order.shipping_address;
  const canShip = ["paid", "confirmed", "processing"].includes(order.status);
  const canUpdateStatus = !["delivered", "cancelled", "refunded"].includes(
    order.status
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Seller Dashboard", path: "/seller/dashboard" },
          { label: "Orders", path: "/seller/orders" },
          { label: order.id },
        ]}
        className="mb-6"
      />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Order {order.id}</h1>
            <p className="text-gray-600 mt-1">
              Placed on {formatDateTime(order.created_at)}
            </p>
            {userProfile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary-600" />
                  Customer Details
                </h3>

                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>
                      <span className="font-medium">Name:</span>{" "}
                      {userProfile.name || "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>
                      <span className="font-medium">Email:</span>{" "}
                      {userProfile.email || "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>
                      <span className="font-medium">Phone:</span>{" "}
                      {userProfile.phone || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            {canShip && !order.tracking_number && (
              <ShiprocketManager
                orderId={order.id}
                order={order}
                shipmentData={shipmentData}
                onSuccess={handleShipmentSuccess}
              />
            )}
            {shipmentData && (
              <button
                onClick={() => setIsTrackingDetailsOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Tracking Details
              </button>
            )}
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getOrderStatusColor(
                order.status
              )}`}
            >
              {order.status.toUpperCase()}
            </span>
          </div>
        </div>

        {canUpdateStatus && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-3">
              Update Order Status:
            </p>
            <div className="flex gap-2 flex-wrap">
              {order.status === "paid" && (
                <button
                  onClick={() => updateOrderStatus("confirmed")}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  Confirm Order
                </button>
              )}
              {["confirmed", "paid"].includes(order.status) && (
                <button
                  onClick={() => updateOrderStatus("processing")}
                  disabled={updating}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm"
                >
                  Start Processing
                </button>
              )}
              {order.status === "shipped" && (
                <button
                  onClick={() => updateOrderStatus("delivered")}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  Mark as Delivered
                </button>
              )}
              {!["shipped", "delivered"].includes(order.status) && (
                <button
                  onClick={() => {
                    if (
                      confirm("Are you sure you want to cancel this order?")
                    ) {
                      updateOrderStatus("cancelled");
                    }
                  }}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <OrderTrackingTimeline
            status={order.status}
            createdAt={order.created_at}
          />

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2 text-gray-800">
              <Package className="h-5 w-5 text-primary-500" />
              Order Items
            </h2>

            <div className="space-y-4">
              {order.items.map((item: any, index: number) => {
                const primaryImage =
                  item.product_images?.find((img: any) => img.sort_order === 0)
                    ?.image_url || item.product_images?.[0]?.image_url;

                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-50 border">
                      {primaryImage ? (
                        <LazyLoadImage
                          src={primaryImage}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          effect="blur"
                          wrapperClassName="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <ImageOff className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 line-clamp-1">
                        {item.title || "Product"}
                      </h3>

                      {item.variant && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          Variant: {item.variant}
                        </p>
                      )}

                      <p className="text-sm text-gray-600 mt-1">
                        Quantity:{" "}
                        <span className="font-medium text-gray-800">
                          {item.quantity}
                        </span>
                      </p>

                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Unit Price: {formatCurrency(item.price)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Section */}
            <div className="pt-4 mt-4 border-t border-gray-200 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCurrency(order.shipping)}</span>
              </div>
              {order.cod_charges > 0 && (
                <div className="flex justify-between">
                  <span>COD Charges</span>
                  <span>{formatCurrency(order.cod_charges)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900 mt-2">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 transition-all hover:shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <MapPin className="h-5 w-5 text-primary-600" />
              Shipping Address
            </h2>

            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900">{addr.name}</span>
              </div>

              <div className="flex items-start gap-2">
                <Home className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p>{addr.address_line1}</p>
                  {addr.address_line2 && <p>{addr.address_line2}</p>}
                  <p>
                    {addr.city}, {addr.state} {addr.pincode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{addr.phone}</span>
              </div>
            </div>
          </div>

          {order.tracking_number && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-5 w-5 text-green-700" />
                <p className="text-sm font-medium text-green-900">
                  Tracking Information
                </p>
              </div>
              <p className="text-green-700 font-mono text-lg">
                {order.tracking_number}
              </p>
              {order.shipped_at && (
                <p className="text-sm text-green-600 mt-1">
                  Shipped on {formatDateTime(order.shipped_at)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes</span>
                <span>{formatCurrency(order.taxes)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {order.shipping === 0
                    ? "FREE"
                    : formatCurrency(order.shipping)}
                </span>
              </div>
              {order.cod_charges > 0 && (
                <div className="flex justify-between">
                  <span>COD Charges</span>
                  <span>{formatCurrency(order.cod_charges)}</span>
                </div>
              )}
              {order.coupon_discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-{formatCurrency(order.coupon_discount)}</span>
                </div>
              )}
              {order.wallet_used > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Wallet</span>
                  <span>-{formatCurrency(order.wallet_used)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <div className="border-t text-red-500 pt-2 flex justify-between font-bold text-lg">
                <span>Total Paid</span>
                <span>{formatCurrency(order.paid_amount)}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200">
              {order.payment_method === "prepaid" && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  Payment Status: {getStatusBadge(order.payment_status)}
                </p>
              )}

              {order.payment_method && (
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                  Payment Method: {getMethodBadge(order.payment_method)}
                </p>
              )}
            </div>
          </div>

          {(order.gift_wrap || order.notes) && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Additional Info
              </h2>
              {order.gift_wrap && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    Gift Wrap:{" "}
                    <span className="text-green-600 font-medium">Yes</span>
                  </p>
                  {order.gift_message && (
                    <p className="text-sm text-gray-700 mt-1 italic bg-yellow-50 p-2 rounded">
                      "{order.gift_message}"
                    </p>
                  )}
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Order Notes:
                  </p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={isTrackingDetailsOpen}
        onClose={() => setIsTrackingDetailsOpen(false)}
        title="Tracking Details"
        size="lg"
      >
        <ShipmentTracker
          trackingData={{
            ...shipmentData?.tracking_data,
            updated_at: order?.updated_at,
          }}
        />
      </Modal>
    </div>
  );
}
