import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  formatCurrency,
  formatDateTime,
  getOrderStatusColor,
} from "../utils/format";
import {
  Package,
  MapPin,
  CreditCard,
  FileText,
  XCircle,
  ImageOff,
  User,
  Home,
  Phone,
} from "lucide-react";
import { OrderTrackingTimeline } from "../components/order/OrderTrackingTimeline";
import { Breadcrumb } from "../components/ui/Breadcrumb";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import {
  ShipmentTracker,
  ShipmentTrackingData,
} from "../components/ui/ShipmentTrackerComponent";
import { getMethodBadge, getStatusBadge } from "../utils/badges";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface Order {
  id: string;
  order_number: string;
  total: number;
  subtotal: number;
  taxes: number;
  shipping: number;
  cod_charges: number;
  wallet_used: number;
  coupon_discount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  items: any[];
  shipping_address: any;
  gift_wrap: boolean;
  gift_message?: string;
  notes?: string;
  tracking_number?: string;
  created_at: string;
  invoiced: boolean;
  tracking_data?: ShipmentTrackingData;
}

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isTrackingDetailsOpen, setIsTrackingDetailsOpen] = useState(false);

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
    tracking_data:shipment_tracking_events!order_id (*)
  `
        )
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error("Load order error:", error);
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    setCancelling(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-order`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: order.id,
            reason: cancelReason,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to cancel order");
      }

      alert(result.message || "Order cancelled successfully");
      setShowCancelDialog(false);
      loadOrder();
    } catch (error) {
      console.error("Cancel order error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to cancel order. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  };

  const canCancelOrder =
    order && ["pending", "paid", "confirmed"].includes(order.status);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading order...</div>;
  }

  if (!order) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Order not found</div>;
  }

  const addr = order.shipping_address;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Orders", path: "/orders" },
          { label: order.order_number },
        ]}
        className="mb-6"
      />
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
          <div className="flex items-center gap-3">
            {["shipped", "out_for_delivery", "delivered"].includes(
              order.status
            ) && (
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
            {canCancelOrder && (
              <button
                onClick={() => setShowCancelDialog(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-600">
          Placed on {formatDateTime(order.created_at)}
        </p>
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
              Delivery Address
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
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Tracking Number
              </p>
              <p className="text-blue-700 font-mono">{order.tracking_number}</p>
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
                <span>Total Paid</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                Payment Status: {getStatusBadge(order.payment_status)}
              </p>

              {order.payment_method && (
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                  Payment Method: {getMethodBadge(order.payment_method)}
                </p>
              )}
            </div>

            {order.invoiced && (
              <button className="w-full mt-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <FileText className="h-4 w-4" />
                Download Invoice
              </button>
            )}
          </div>

          {(order.gift_wrap || order.notes) && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Additional Info</h2>
              {order.gift_wrap && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    Gift Wrap: <span className="text-green-600">Yes</span>
                  </p>
                  {order.gift_message && (
                    <p className="text-sm text-gray-700 mt-1 italic">
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
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelOrder}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText={cancelling ? "Cancelling..." : "Yes, Cancel Order"}
        cancelText="No, Keep Order"
        type="danger"
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for cancellation (optional)
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please tell us why you're cancelling this order..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            rows={3}
          />
        </div>
      </ConfirmDialog>

      <Modal
        isOpen={isTrackingDetailsOpen}
        onClose={() => setIsTrackingDetailsOpen(false)}
        title="Tracking Details"
        size="lg"
      >
        <ShipmentTracker trackingData={order.tracking_data} />
      </Modal>
    </div>
  );
}
