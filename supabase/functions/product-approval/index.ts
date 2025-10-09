import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ApprovalRequest {
  product_id: string;
  action: "approve" | "reject";
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const userRole = user.app_metadata?.role;
    if (userRole !== "admin") {
      throw new Error("Admin access required");
    }

    const { product_id, action, notes }: ApprovalRequest = await req.json();

    if (!product_id || !action) {
      throw new Error("product_id and action are required");
    }

    if (action !== "approve" && action !== "reject") {
      throw new Error("Invalid action. Must be 'approve' or 'reject'");
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*, sellers(id, business_name, users(email, name))")
      .eq("id", product_id)
      .maybeSingle();

    if (productError || !product) {
      throw new Error("Product not found");
    }

    if (!product.submitted_for_approval_at) {
      throw new Error("Product has not been submitted for approval");
    }

    const approved = action === "approve";
    const updateData: any = {
      admin_approved: approved,
      approval_notes: notes || null,
      approved_by: user.id,
      approved_at: approved ? new Date().toISOString() : null,
    };

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", product_id)
      .select("*, sellers(id, business_name, users(email, name))")
      .single();

    if (updateError) {
      throw new Error(`Failed to update product: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        product: updatedProduct,
        message: `Product ${approved ? "approved" : "rejected"} successfully`,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Product approval error:", error);
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