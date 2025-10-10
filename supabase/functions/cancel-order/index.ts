import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CancelOrderRequest {
  order_id: string;
  reason?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { order_id, reason }: CancelOrderRequest = await req.json();

    if (!order_id) {
      throw new Error("Order ID is required");
    }

    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found or unauthorized");
    }

    if (!["pending", "paid", "confirmed"].includes(order.status)) {
      throw new Error("Order cannot be cancelled at this stage");
    }

    if (order.status === "shipped" || order.status === "delivered") {
      throw new Error("Cannot cancel shipped or delivered orders");
    }

    const { data: shipment } = await supabaseClient
      .from("shiprocket_shipments")
      .select("*")
      .eq("order_id", order_id)
      .maybeSingle();

    if (shipment && shipment.pickup_scheduled) {
      throw new Error("Cannot cancel order after pickup has been scheduled");
    }

    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        notes: reason ? `Cancellation reason: ${reason}` : order.notes,
      })
      .eq("id", order_id);

    if (updateError) {
      throw new Error("Failed to cancel order");
    }

    if (order.wallet_used > 0 || order.payment_status === "paid") {
      const refundAmount = order.total;

      const { data: userData } = await supabaseClient
        .from("users")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      const newBalance = (userData?.wallet_balance || 0) + refundAmount;

      await supabaseClient
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", user.id);

      await supabaseClient.from("wallet_transactions").insert({
        user_id: user.id,
        type: "credit",
        amount: refundAmount,
        balance_after: newBalance,
        description: `Refund for cancelled order ${order.id}`,
        reference_type: "order",
        reference_id: order.id,
      });
    }

    const productIds = order.items.map((item: any) => item.product_id);
    const { data: products } = await supabaseClient
      .from("products")
      .select("id, stock")
      .in("id", productIds);

    if (products) {
      for (const item of order.items) {
        const product = products.find((p: any) => p.id === item.product_id);
        if (product) {
          await supabaseClient
            .from("products")
            .update({ stock: product.stock + item.quantity })
            .eq("id", item.product_id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order cancelled successfully",
        refund_amount:
          order.wallet_used > 0 || order.payment_status === "paid"
            ? order.total
            : 0,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Cancel order error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
