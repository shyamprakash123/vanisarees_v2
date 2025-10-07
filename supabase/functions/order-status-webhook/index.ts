import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { order_id, new_status, old_status } = await req.json();

    if (!order_id || !new_status) {
      return new Response(
        JSON.stringify({ error: "order_id and new_status are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, sellers(id, commission_rate, seller_wallet_balance)")
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (new_status === "delivered" && old_status !== "delivered" && order.seller_id) {
      const seller = order.sellers;
      const commissionRate = seller?.commission_rate || 10;
      const orderTotal = Number(order.total);
      const commissionAmount = (orderTotal * commissionRate) / 100;
      const gstAmount = (commissionAmount * 18) / 100;
      const sellerAmount = orderTotal - commissionAmount - gstAmount;

      const currentBalance = Number(seller?.seller_wallet_balance || 0);
      const newBalance = currentBalance + sellerAmount;

      const { error: updateError } = await supabase
        .from("sellers")
        .update({ seller_wallet_balance: newBalance })
        .eq("id", order.seller_id);

      if (updateError) {
        console.error("Failed to update seller wallet:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update seller wallet" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert({
          seller_id: order.seller_id,
          type: "credit",
          amount: sellerAmount,
          balance_after: newBalance,
          description: `Payment for order #${order.order_number}`,
          reference_type: "order",
          reference_id: order.id,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          gst_amount: gstAmount,
          meta: {
            order_id: order.id,
            order_number: order.order_number,
            order_total: orderTotal,
          },
        });

      if (transactionError) {
        console.error("Failed to create transaction:", transactionError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Seller wallet credited successfully",
          credited_amount: sellerAmount,
          commission_amount: commissionAmount,
          gst_amount: gstAmount,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if ((new_status === "cancelled" || new_status === "refunded") && order.wallet_used > 0) {
      const { data: userData } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", order.user_id)
        .maybeSingle();

      if (userData) {
        const currentBalance = Number(userData.wallet_balance || 0);
        const refundAmount = Number(order.wallet_used);
        const newBalance = currentBalance + refundAmount;

        const { error: updateError } = await supabase
          .from("users")
          .update({ wallet_balance: newBalance })
          .eq("id", order.user_id);

        if (updateError) {
          console.error("Failed to update user wallet:", updateError);
        } else {
          await supabase
            .from("wallet_transactions")
            .insert({
              user_id: order.user_id,
              type: "credit",
              amount: refundAmount,
              balance_after: newBalance,
              description: `Refund for ${new_status} order #${order.order_number}`,
              reference_type: "order",
              reference_id: order.id,
              meta: {
                order_id: order.id,
                order_number: order.order_number,
                refund_type: new_status,
              },
            });

          return new Response(
            JSON.stringify({
              success: true,
              message: "Wallet refunded successfully",
              refunded_amount: refundAmount,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order status updated, no wallet action required",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in order status webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
