import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const paymentData: VerifyPaymentRequest = await req.json();

    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret not configured');
    }

    const generatedSignature = createHmac('sha256', razorpayKeySecret)
      .update(`${paymentData.razorpay_order_id}|${paymentData.razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== paymentData.razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', paymentData.order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'paid',
        payment_meta: {
          ...order.payment_meta,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
          verified_at: new Date().toISOString(),
        },
      })
      .eq('id', paymentData.order_id);

    if (updateError) {
      throw new Error('Failed to update order');
    }

    const productIds = order.items.map((item: any) => item.product_id);
    const { data: products } = await supabaseClient
      .from('products')
      .select('id, stock')
      .in('id', productIds);

    if (products) {
      for (const item of order.items) {
        const product = products.find((p: any) => p.id === item.product_id);
        if (product && product.stock >= item.quantity) {
          await supabaseClient
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.product_id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        message: 'Payment verified successfully',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
