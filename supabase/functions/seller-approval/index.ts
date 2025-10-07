import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ApprovalRequest {
  seller_id: string;
  action: 'approve' | 'reject';
  rejection_reason?: string;
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

    const userRole = user.app_metadata?.role;

    if (userRole !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { seller_id, action, rejection_reason }: ApprovalRequest = await req.json();

    if (!seller_id || !action) {
      return new Response(
        JSON.stringify({ error: "seller_id and action are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("*, users!inner(id, email, name)")
      .eq("id", seller_id)
      .maybeSingle();

    if (sellerError || !seller) {
      return new Response(
        JSON.stringify({ error: "Seller not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const updateData: any = {
      approved_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.approved_at = new Date().toISOString();
      updateData.rejection_reason = null;

      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        seller.users.id,
        {
          app_metadata: {
            role: 'seller'
          }
        }
      );

      if (authUpdateError) {
        console.error("Failed to update user role:", authUpdateError);
        return new Response(
          JSON.stringify({ error: "Failed to update user role in auth system" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.rejection_reason = rejection_reason || 'Application rejected';
      updateData.approved_at = null;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Must be 'approve' or 'reject'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: updatedSeller, error: updateError } = await supabase
      .from("sellers")
      .update(updateData)
      .eq("id", seller_id)
      .select("*, users!inner(email, name)")
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
        seller: updatedSeller,
        message: `Seller ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      }),
      {
        status: 200,
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
