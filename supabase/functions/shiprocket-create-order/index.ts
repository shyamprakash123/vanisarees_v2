import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ShiprocketOrder {
  order_id: string;
  order_number: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount: number;
    tax: number;
    hsn: number;
  }>;
  payment_method: string;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

async function getShiprocketToken(): Promise<string> {
  const SHIPROCKET_EMAIL = Deno.env.get("SHIPROCKET_EMAIL");
  const SHIPROCKET_PASSWORD = Deno.env.get("SHIPROCKET_PASSWORD");

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error("Shiprocket credentials not configured");
  }

  const response = await fetch(
    "https://apiv2.shiprocket.in/v1/external/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: SHIPROCKET_EMAIL,
        password: SHIPROCKET_PASSWORD,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to authenticate with Shiprocket");
  }

  const data = await response.json();
  return data.token;
}

async function createShiprocketOrder(
  token: string,
  orderData: ShiprocketOrder
) {
  const response = await fetch(
    "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Shiprocket API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      orderId,
      orderNumber,
      items,
      shippingAddress,
      billingAddress,
      subtotal,
      weight,
      dimensions,
    } = await req.json();

    if (!orderId || !orderNumber || !items || !shippingAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const token = await getShiprocketToken();

    const nameParts = shippingAddress.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const billingNameParts = billingAddress
      ? billingAddress.name.split(" ")
      : nameParts;
    const billingFirstName = billingNameParts[0] || firstName;
    const billingLastName = billingNameParts.slice(1).join(" ") || lastName;

    const shiprocketOrder: ShiprocketOrder = {
      order_id: orderId,
      order_number: orderNumber,
      order_date: new Date().toISOString().split("T")[0],
      pickup_location: "Primary",
      billing_customer_name: billingFirstName,
      billing_last_name: billingLastName,
      billing_address:
        billingAddress?.address_line1 || shippingAddress.address_line1,
      billing_address_2:
        billingAddress?.address_line2 || shippingAddress.address_line2 || "",
      billing_city: billingAddress?.city || shippingAddress.city,
      billing_pincode: billingAddress?.pincode || shippingAddress.pincode,
      billing_state: billingAddress?.state || shippingAddress.state,
      billing_country:
        billingAddress?.country || shippingAddress.country || "India",
      billing_email:
        billingAddress?.email ||
        shippingAddress.email ||
        "customer@example.com",
      billing_phone: billingAddress?.phone || shippingAddress.phone,
      shipping_is_billing: !billingAddress,
      order_items: items.map((item: any) => ({
        name: item.title || item.name,
        sku:
          item.sku ||
          `SKU-${item.id || Math.random().toString(36).substr(2, 9)}`,
        units: item.quantity,
        selling_price: item.price,
        discount: item.discount || 0,
        tax: item.tax || 0,
        hsn: item.hsn_code || 0,
      })),
      payment_method: "Prepaid",
      sub_total: subtotal,
      length: dimensions?.length || 10,
      breadth: dimensions?.breadth || 10,
      height: dimensions?.height || 10,
      weight: weight || 0.5,
    };

    if (!shiprocketOrder.shipping_is_billing) {
      shiprocketOrder.shipping_customer_name = firstName;
      shiprocketOrder.shipping_last_name = lastName;
      shiprocketOrder.shipping_address = shippingAddress.address_line1;
      shiprocketOrder.shipping_address_2 = shippingAddress.address_line2 || "";
      shiprocketOrder.shipping_city = shippingAddress.city;
      shiprocketOrder.shipping_pincode = shippingAddress.postal_code;
      shiprocketOrder.shipping_country = shippingAddress.country || "India";
      shiprocketOrder.shipping_state = shippingAddress.state;
      shiprocketOrder.shipping_email =
        shippingAddress.email || "customer@example.com";
      shiprocketOrder.shipping_phone = shippingAddress.phone;
    }

    const result = await createShiprocketOrder(token, shiprocketOrder);

    return new Response(
      JSON.stringify({
        success: true,
        shiprocket_order_id: result.order_id,
        shipment_id: result.shipment_id,
        awb_code: result.awb_code,
        courier_name: result.courier_name,
        message: "Shipment created successfully",
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
    console.error("Shiprocket order creation error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to create shipment",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
