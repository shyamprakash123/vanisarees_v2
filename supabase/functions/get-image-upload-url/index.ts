import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  S3Client,
  PutObjectCommand,
} from "https://esm.sh/@aws-sdk/client-s3@3";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const s3 = new S3Client({
  region: Deno.env.get("AWS_REGION"),
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
  },
});

Deno.serve(async (req) => {
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
    if (
      user.user_metadata.role !== "admin" &&
      user.user_metadata.role !== "seller"
    ) {
      throw new Error("Forbidden");
    }
    if (user.user_metadata.role === "seller" && user.id) {
      const { data: seller, error: sellerError } = await supabaseClient
        .from("users")
        .select("status")
        .eq("id", user.id)
        .single();
      if (sellerError || !seller) {
        throw new Error("Forbidden");
      }
      if (seller.status !== "approved") {
        throw new Error("Forbidden");
      }
    } else {
      throw new Error("Forbidden");
    }
    const { filenames, contentTypes } = await req.json();
    if (!filenames || !contentTypes) {
      return new Response(
        JSON.stringify({ error: "Missing file name or content type" }),
        {
          status: 400,
        }
      );
    }

    const urls = [];

    const bucket = Deno.env.get("S3_BUCKET")!;

    for (let i = 0; i < filenames.length; i++) {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: `products/${crypto.randomUUID()}-${filenames[i]}`,
        ContentType: contentTypes[i],
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

      const publicUrl = `https://${bucket}.s3.${Deno.env.get(
        "AWS_REGION"
      )}.amazonaws.com/${command.input.Key}`;

      urls.push({ uploadUrl, publicUrl });
    }

    return new Response(JSON.stringify({ urls }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
