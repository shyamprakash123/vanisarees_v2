import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TransactionRequest {
  user_id?: string;
  seller_id?: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  order_id?: string;
  commission_rate?: number;
  gst_amount?: number;
}

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

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestData: TransactionRequest = await req.json();
    const {
      user_id,
      seller_id,
      type,
      amount,
      description,
      reference_type,
      reference_id,
      order_id,
      commission_rate,
      gst_amount,
    } = requestData;

    if (!type || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({
          error: "Valid type and positive amount are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!user_id && !seller_id) {
      return new Response(
        JSON.stringify({ error: "Either user_id or seller_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let currentBalance = 0;
    let newBalance = 0;
    let tableName = "";
    let targetId = "";

    if (user_id) {
      const { data: userData } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", user_id)
        .maybeSingle();

      if (!userData) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      currentBalance = Number(userData.wallet_balance);
      tableName = "users";
      targetId = user_id;
    } else if (seller_id) {
      const { data: sellerData } = await supabase
        .from("sellers")
        .select("seller_wallet_balance")
        .eq("id", seller_id)
        .maybeSingle();

      if (!sellerData) {
        return new Response(JSON.stringify({ error: "Seller not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      currentBalance = Number(sellerData.seller_wallet_balance);
      tableName = "sellers";
      targetId = seller_id;
    }

    if (type === "debit") {
      if (currentBalance < amount) {
        return new Response(JSON.stringify({ error: "Insufficient balance" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      newBalance = currentBalance - amount;
    } else {
      newBalance = currentBalance + amount;
    }

    const walletColumn =
      tableName === "users" ? "wallet_balance" : "seller_wallet_balance";
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ [walletColumn]: newBalance })
      .eq("id", targetId);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const commission_amount = commission_rate
      ? (amount * commission_rate) / 100
      : null;

    const transactionData: any = {
      type,
      amount,
      balance_after: newBalance,
      description,
      reference_type,
      reference_id,
      commission_rate,
      commission_amount,
      gst_amount,
      admin_id: user.id,
      meta: { order_id },
    };

    if (user_id) {
      transactionData.user_id = user_id;
    }
    if (seller_id) {
      transactionData.seller_id = seller_id;
    }

    const { data: transaction, error: transactionError } = await supabase
      .from("wallet_transactions")
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      return new Response(JSON.stringify({ error: transactionError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction,
        new_balance: newBalance,
        message: `Wallet ${type} successful`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
