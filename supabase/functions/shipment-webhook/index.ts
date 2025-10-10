import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ShipmentScan {
  date: string;
  activity: string;
  location: string;
}

interface ShiprocketWebhookPayload {
  awb: string | number;
  current_status: string;
  order_id: string;
  current_timestamp: string;
  etd: string;
  current_status_id: number;
  shipment_status: string;
  shipment_status_id: number;
  channel_order_id: string;
  channel: string;
  courier_name: string;
  scans: ShipmentScan[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const payload: ShiprocketWebhookPayload = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: validationData, error: validationError } = await supabase.rpc(
      "validate_webhook_token",
      { p_token: token }
    );

    if (validationError) {
      console.error("Token validation error:", validationError);
      return new Response(JSON.stringify({ error: "Invalid webhook token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sellerId = validationData;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, seller_id")
      .eq("id", payload.order_id)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup error:", orderError);
      return new Response(JSON.stringify({ error: "Failed to lookup order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order) {
      return new Response(
        JSON.stringify({
          error: "Order not found or does not belong to seller",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Function to filter customer-relevant scans
    const getCustomerRelevantScans = (scans) => {
      const customerRelevantStatuses = [
        "PICKED UP",
        "SHIPPED",
        "IN TRANSIT",
        "OUT FOR DELIVERY",
        "DELIVERED",
        "EXCEPTION",
        "DELIVERY FAILED",
        "RTO DELIVERED", // Only final RTO status, not intermediate
      ];

      const irrelevantActivities = [
        "Manifested",
        "Added to Bag",
        "Bag Added To Trip",
        "Bag Received at Facility",
        "System weight captured",
        "Added to Trip",
        "Scanned",
        "weight captured",
        "Bag Created",
      ];

      return scans.filter((scan) => {
        // Include if status is customer-relevant
        if (customerRelevantStatuses.includes(scan["sr-status-label"])) {
          return true;
        }

        // Exclude internal operations
        const isInternalActivity = irrelevantActivities.some((activity) =>
          scan.activity?.toLowerCase().includes(activity.toLowerCase())
        );

        // Include major milestone activities
        const isMajorMilestone = [
          "picked up",
          "shipped",
          "received at facility",
          "trip arrived",
          "out for delivery",
          "delivered",
          "delivery attempt",
          "exception",
          "delayed",
        ].some((milestone) =>
          scan.activity?.toLowerCase().includes(milestone.toLowerCase())
        );

        return !isInternalActivity && isMajorMilestone;
      });
    };

    const parseDate = (value?: string) => {
      if (!value) return null;
      // Normalize to ISO format safely
      const formatted = value.replace(" ", "T");
      const date = new Date(
        formatted.endsWith("Z") ? formatted : `${formatted}Z`
      );
      return isNaN(date.getTime()) ? null : date.toISOString();
    };

    const statusTimestamp = parseDate(payload?.current_timestamp);
    const etd = parseDate(payload?.etd);

    const { scans, ...restPayload } = payload;

    const { error: insertError } = await supabase
      .from("shipment_tracking_events")
      .upsert(
        {
          order_id: order.id,
          awb: String(payload.awb),
          current_status: payload.current_status,
          current_status_id: payload.current_status_id,
          shipment_status: payload.shipment_status,
          shipment_status_id: payload.shipment_status_id,
          channel_order_id: payload.channel_order_id,
          channel: payload.channel,
          courier_name: payload.courier_name,
          status_timestamp: statusTimestamp,
          etd: etd,
          scans: getCustomerRelevantScans(scans || []),
          raw_payload: restPayload,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "order_id", // Only one latest record per order
        }
      );

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store tracking event" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: shipmentUpdateError } = await supabase
      .from("shiprocket_shipments")
      .update({
        awb_code: String(payload.awb),
        status: payload.current_status,
        tracking_data: payload,
        ...(payload.pickup_scheduled_date ? { pickup_scheduled: true } : {}),
      })
      .eq("order_id", order.id);

    if (shipmentUpdateError) {
      console.error("Shipment update error:", shipmentUpdateError);
      // Not critical, so we don't return an error response
    }

    const shipment_status_map = {
      2: "processing",
      6: "shipped",
      17: "out_for_delivery",
      19: "delivered",
      7: "cancelled",
      38: "returned",
    };

    const shipment_status =
      shipment_status_map[payload.shipment_status_id] || null;

    const shipment_status_id = payload.shipment_status_id;
    if (shipment_status_id) {
      const updateData: Record<string, any> = {
        ...(shipment_status ? { status: shipment_status } : {}),
        tracking_number: String(payload.awb),
      };

      if (shipment_status_id === 6 && !order.shipped_at) {
        updateData.shipped_at = new Date().toISOString();
      } else if (shipment_status_id === 19 && !order.delivered_at) {
        updateData.delivered_at = new Date().toISOString();
      } else if (shipment_status_id === 7 && !order.cancelled_at) {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", order.id);

      if (updateError) {
        console.error("Order status update error:", updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
        order_id: order.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
