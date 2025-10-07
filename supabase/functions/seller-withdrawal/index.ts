import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WithdrawalRequest {
  seller_id?: string;
  amount?: number;
  bank_details?: any;
}

interface WithdrawalUpdate {
  request_id: string;
  action: 'approve' | 'reject' | 'complete';
  transaction_id?: string;
  rejection_reason?: string;
  notes?: string;
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST") {
      const { seller_id, amount, bank_details }: WithdrawalRequest = await req.json();

      if (!seller_id || !amount || !bank_details) {
        return new Response(
          JSON.stringify({ error: "seller_id, amount, and bank_details are required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: seller } = await supabase
        .from("sellers")
        .select("seller_wallet_balance, user_id")
        .eq("id", seller_id)
        .maybeSingle();

      if (!seller) {
        return new Response(
          JSON.stringify({ error: "Seller not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (seller.user_id !== user.id) {
        const { data: adminUser } = await supabase
          .from("users")
          .select("email")
          .eq("id", user.id)
          .maybeSingle();

        if (!adminUser || !adminUser.email.endsWith("@vanisarees.com")) {
          return new Response(
            JSON.stringify({ error: "Unauthorized to create withdrawal request" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      if (seller.seller_wallet_balance < amount) {
        return new Response(
          JSON.stringify({ error: "Insufficient wallet balance" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: withdrawal, error: insertError } = await supabase
        .from("seller_withdrawal_requests")
        .insert({
          seller_id,
          amount,
          bank_details,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          withdrawal,
          message: "Withdrawal request created successfully"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "PUT") {
      const { data: adminUser } = await supabase
        .from("users")
        .select("email")
        .eq("id", user.id)
        .maybeSingle();

      if (!adminUser || !adminUser.email.endsWith("@vanisarees.com")) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { request_id, action, transaction_id, rejection_reason, notes }: WithdrawalUpdate = await req.json();

      if (!request_id || !action) {
        return new Response(
          JSON.stringify({ error: "request_id and action are required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: withdrawalRequest } = await supabase
        .from("seller_withdrawal_requests")
        .select("*, sellers!inner(seller_wallet_balance, id)")
        .eq("id", request_id)
        .maybeSingle();

      if (!withdrawalRequest) {
        return new Response(
          JSON.stringify({ error: "Withdrawal request not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const updateData: any = {
        processed_by: user.id,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (action === 'approve') {
        updateData.status = 'approved';
        updateData.notes = notes;
      } else if (action === 'reject') {
        updateData.status = 'rejected';
        updateData.rejection_reason = rejection_reason || 'Withdrawal request rejected';
      } else if (action === 'complete') {
        if (!transaction_id) {
          return new Response(
            JSON.stringify({ error: "transaction_id is required for completing withdrawal" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        updateData.status = 'completed';
        updateData.transaction_id = transaction_id;
        updateData.notes = notes;

        const newBalance = withdrawalRequest.sellers.seller_wallet_balance - withdrawalRequest.amount;

        const { error: balanceError } = await supabase
          .from("sellers")
          .update({ seller_wallet_balance: newBalance })
          .eq("id", withdrawalRequest.seller_id);

        if (balanceError) {
          return new Response(
            JSON.stringify({ error: balanceError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        await supabase
          .from("wallet_transactions")
          .insert({
            seller_id: withdrawalRequest.seller_id,
            type: 'debit',
            amount: withdrawalRequest.amount,
            balance_after: newBalance,
            description: `Withdrawal to bank account - ${transaction_id}`,
            reference_type: 'withdrawal',
            reference_id: request_id,
            admin_id: user.id,
          });
      } else {
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: updatedWithdrawal, error: updateError } = await supabase
        .from("seller_withdrawal_requests")
        .update(updateData)
        .eq("id", request_id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          withdrawal: updatedWithdrawal,
          message: `Withdrawal request ${action}d successfully`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
