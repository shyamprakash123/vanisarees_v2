import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  formatCurrency,
  formatDateTime,
  getOrderStatusColor,
} from "../utils/format";
import { Package, MapPin, CreditCard, FileText } from "lucide-react";
import { OrderTrackingTimeline } from "../components/order/OrderTrackingTimeline";
import { Breadcrumb } from "../components/ui/Breadcrumb";

interface Order {
  id: string;
  order_number: string;
  total: number;
  subtotal: number;
  taxes: number;
  shipping: number;
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
}

export function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${getOrderStatusColor(
              order.status
            )}`}
          >
            {order.status.toUpperCase()}
          </span>
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
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title || "Product"}</h3>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </h2>
            <div className="text-gray-700">
              <p className="font-medium">{addr.name}</p>
              <p>{addr.address_line1}</p>
              {addr.address_line2 && <p>{addr.address_line2}</p>}
              <p>
                {addr.city}, {addr.state} {addr.pincode}
              </p>
              <p className="mt-2">Phone: {addr.phone}</p>
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

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Payment Status:{" "}
                <span className="font-medium text-gray-900">
                  {order.payment_status}
                </span>
              </p>
              {order.payment_method && (
                <p className="text-sm text-gray-600 mt-1">
                  Payment Method:{" "}
                  <span className="font-medium text-gray-900">
                    {order.payment_method}
                  </span>
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
    </div>
  );
}
