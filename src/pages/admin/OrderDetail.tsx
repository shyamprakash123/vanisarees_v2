import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
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
  User,
  Store,
} from "lucide-react";
import { OrderTrackingTimeline } from "../../components/order/OrderTrackingTimeline";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { ShiprocketButton } from "../../components/order/ShiprocketButton";

interface Order {
  id: string;
  order_number: string;
  total: number;
  subtotal: number;
  taxes: number;
  tax_breakdown: any;
  shipping: number;
  wallet_used: number;
  coupon_discount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  payment_meta?: any;
  items: any[];
  shipping_address: any;
  billing_address?: any;
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
  seller_id?: string;
}

interface UserProfile {
  email: string;
  name: string;
  phone: string;
}

interface SellerProfile {
  business_name: string;
  email: string;
  phone: string;
}

export function AdminOrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null
  );
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
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const { data: userData } = await supabase
        .from("users")
        .select("email, name, phone")
        .eq("id", data.user_id)
        .single();

      setUserProfile(userData || null);

      if (data.seller_id) {
        const { data: sellerData } = await supabase
          .from("sellers")
          .select("business_name, email, phone")
          .eq("id", data.seller_id)
          .single();

        setSellerProfile(sellerData || null);
      }

      setOrder(data);
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
        status: "processing",
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
  const billAddr = order.billing_address;
  const canShip = ["confirmed"].includes(order.status);
  const canUpdateStatus = !["delivered", "cancelled", "refunded"].includes(
    order.status
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Admin Dashboard", path: "/admin/dashboard" },
          { label: "Orders", path: "/admin/orders" },
          { label: order.order_number },
        ]}
        className="mb-6"
      />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
            <p className="text-gray-600 mt-1">
              Placed on {formatDateTime(order.created_at)}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getOrderStatusColor(
                order.status
              )}`}
            >
              {order.status.toUpperCase()}
            </span>
            {canShip && (
              <ShiprocketButton
                orderId={order.id}
                orderNumber={order.order_number}
                onSuccess={handleShipmentSuccess}
              />
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {userProfile && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-blue-700" />
                <h3 className="font-semibold text-blue-900">
                  Customer Details
                </h3>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <span className="font-medium">Name:</span> {userProfile.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {userProfile.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {userProfile.phone}
                </p>
              </div>
            </div>
          )}

          {sellerProfile && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Store className="h-5 w-5 text-green-700" />
                <h3 className="font-semibold text-green-900">Seller Details</h3>
              </div>
              <div className="text-sm text-green-800 space-y-1">
                <p>
                  <span className="font-medium">Business:</span>{" "}
                  {sellerProfile.business_name}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {sellerProfile.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {sellerProfile.phone}
                </p>
              </div>
            </div>
          )}
        </div>

        {canUpdateStatus && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-3">
              Order Actions:
            </p>
            <div className="flex gap-2 flex-wrap">
              {order.payment_status === "paid" &&
                order.status === "pending" && (
                  <button
                    onClick={() => updateOrderStatus("confirmed")}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    Confirm Order
                  </button>
                )}
              {["confirmed"].includes(order.status) && (
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
              {!["shipped", "delivered", "cancelled"].includes(
                order.status
              ) && (
                <>
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
                </>
              )}
              {["cancelled"].includes(order.status) &&
                order.payment_status === "paid" &&
                order.payment_method === "prepaid" && (
                  <button
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to refund this order?")
                      ) {
                        updateOrderStatus("refunded");
                      }
                    }}
                    disabled={updating}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
                  >
                    Refund Order
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

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex gap-4 pb-4 border-b last:border-0"
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title || "Product"}</h3>
                    {item.sku && (
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                    )}
                    {item.variant && Object.keys(item.variant).length > 0 && (
                      <p className="text-sm text-gray-500">
                        Variant: {JSON.stringify(item.variant)}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-600">
                      Unit Price: {formatCurrency(item.price)}
                    </p>
                    {item.tax && (
                      <p className="text-xs text-gray-500">
                        Tax: {formatCurrency(item.tax)}
                      </p>
                    )}
                    <p className="text-sm font-semibold mt-1">
                      Total: {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </h2>
              <div className="text-gray-700 text-sm">
                <p className="font-medium">{addr.name}</p>
                <p>{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>
                  {addr.city}, {addr.state} {addr.postal_code}
                </p>
                <p>{addr.country || "India"}</p>
                <p className="mt-2">Phone: {addr.phone}</p>
              </div>
            </div>

            {billAddr && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Billing Address
                </h2>
                <div className="text-gray-700 text-sm">
                  <p className="font-medium">{billAddr.name}</p>
                  <p>{billAddr.address_line1}</p>
                  {billAddr.address_line2 && <p>{billAddr.address_line2}</p>}
                  <p>
                    {billAddr.city}, {billAddr.state} {billAddr.postal_code}
                  </p>
                  <p>{billAddr.country || "India"}</p>
                  <p className="mt-2">Phone: {billAddr.phone}</p>
                </div>
              </div>
            )}
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
              {order.tax_breakdown &&
                Object.keys(order.tax_breakdown).length > 0 && (
                  <div className="pl-4 text-xs text-gray-600">
                    {Object.entries(order.tax_breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span>{formatCurrency(value as number)}</span>
                      </div>
                    ))}
                  </div>
                )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {order.shipping === 0
                    ? "FREE"
                    : formatCurrency(order.shipping)}
                </span>
              </div>
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
            </div>

            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <p className="text-gray-600">
                Payment Status:{" "}
                <span
                  className={`font-medium ${
                    order.payment_status === "paid"
                      ? "text-green-600"
                      : "text-gray-900"
                  }`}
                >
                  {order.payment_status}
                </span>
              </p>
              {order.payment_method && (
                <p className="text-gray-600">
                  Payment Method:{" "}
                  <span className="font-medium text-gray-900">
                    {order.payment_method}
                  </span>
                </p>
              )}
              {order.payment_meta &&
                Object.keys(order.payment_meta).length > 0 && (
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <p className="font-medium mb-1">Payment Metadata:</p>
                    <pre className="text-gray-600">
                      {JSON.stringify(order.payment_meta, null, 2)}
                    </pre>
                  </div>
                )}
              <p className="text-gray-600">
                Invoice Status:{" "}
                <span
                  className={`font-medium ${
                    order.invoiced ? "text-green-600" : "text-gray-900"
                  }`}
                >
                  {order.invoiced ? "Generated" : "Pending"}
                </span>
              </p>
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

          <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600">
            <p>
              <strong>Order ID:</strong> {order.id}
            </p>
            <p className="mt-1">
              <strong>Created:</strong> {formatDateTime(order.created_at)}
            </p>
            {order.shipped_at && (
              <p className="mt-1">
                <strong>Shipped:</strong> {formatDateTime(order.shipped_at)}
              </p>
            )}
            {order.delivered_at && (
              <p className="mt-1">
                <strong>Delivered:</strong> {formatDateTime(order.delivered_at)}
              </p>
            )}
            {order.cancelled_at && (
              <p className="mt-1">
                <strong>Cancelled:</strong> {formatDateTime(order.cancelled_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
