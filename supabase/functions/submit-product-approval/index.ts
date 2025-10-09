import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SubmitRequest {
  product_id: string;
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

    const { product_id }: SubmitRequest = await req.json();

    if (!product_id) {
      throw new Error("product_id is required");
    }

    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (sellerError || !seller) {
      throw new Error("Seller account not found");
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", product_id)
      .eq("seller_id", seller.id)
      .maybeSingle();

    if (productError || !product) {
      throw new Error("Product not found or unauthorized");
    }

    if (product.submitted_for_approval_at && product.admin_approved === null) {
      throw new Error("Product is already pending approval");
    }

    if (product.admin_approved === true) {
      throw new Error("Product is already approved");
    }

    if (!product.title || !product.description || !product.price || product.images.length === 0) {
      throw new Error("Product must have title, description, price, and at least one image");
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        submitted_for_approval_at: new Date().toISOString(),
        admin_approved: null,
        approval_notes: null,
      })
      .eq("id", product_id)
      .eq("seller_id", seller.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to submit product: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        product: updatedProduct,
        message: "Product submitted for approval successfully",
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
    console.error("Submit product approval error:", error);
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