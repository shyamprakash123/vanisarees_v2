import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Truck, Loader } from "lucide-react";

interface ShiprocketButtonProps {
  orderId: string;
  orderNumber: string;
  onSuccess?: (trackingNumber: string) => void;
}

export function ShiprocketButton({
  orderId,
  orderNumber,
  onSuccess,
}: ShiprocketButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createShipment = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      const apiUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/functions/v1/shiprocket-create-order`;
      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      };

      const totalWeight = order.items.reduce((sum: number, item: any) => {
        return sum + (item.weight || 0.5) * item.quantity;
      }, 0);

      const payload = {
        orderId: order.id,
        orderNumber: order.id,
        items: order.items,
        shippingAddress: order.shipping_address,
        billingAddress: order.billing_address || order.shipping_address,
        subtotal: order.subtotal,
        weight: totalWeight > 0 ? totalWeight : 0.5,
        dimensions: {
          length: 10,
          breadth: 10,
          height: 10,
        },
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create shipment");
      }

      const trackingNumber = result.awb_code || result.shipment_id || "PENDING";

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          tracking_number: trackingNumber,
          status: "shipped",
          shipped_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      alert(`Shipment created successfully! Tracking: ${trackingNumber}`);

      if (onSuccess) {
        onSuccess(trackingNumber);
      }
    } catch (err) {
      console.error("Shipment creation error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create shipment";
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={createShipment}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            Creating Shipment...
          </>
        ) : (
          <>
            <Truck className="h-4 w-4" />
            Create Shiprocket Shipment
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
