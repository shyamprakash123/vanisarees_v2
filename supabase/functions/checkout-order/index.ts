import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CheckoutRequest {
  items: Array<{
    product_id: string;
    variant?: Record<string, any>;
    quantity: number;
    price: number;
  }>;
  shipping_address: {
    name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  billing_address?: Record<string, any>;
  payment_method: 'razorpay' | 'cod' | 'wallet';
  coupon_code?: string;
  wallet_amount?: number;
  gift_wrap?: boolean;
  gift_message?: string;
  notes?: string;
}

interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
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

    const checkoutData: CheckoutRequest = await req.json();

    let subtotal = 0;
    let taxBreakdown: Record<string, number> = {};
    let totalTax = 0;

    const productIds = checkoutData.items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('id, title, price, tax_slab, seller_id, stock')
      .in('id', productIds);

    if (productsError || !products) {
      throw new Error('Failed to fetch products');
    }

    for (const item of checkoutData.items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.title}`);
      }

      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      const taxRate = product.tax_slab || 5;
      const itemTax = (itemTotal * taxRate) / 100;
      totalTax += itemTax;

      if (!taxBreakdown[`${taxRate}%`]) {
        taxBreakdown[`${taxRate}%`] = 0;
      }
      taxBreakdown[`${taxRate}%`] += itemTax;
    }

    let couponDiscount = 0;
    let couponId = null;

    if (checkoutData.coupon_code) {
      const { data: coupon, error: couponError } = await supabaseClient
        .from('coupons')
        .select('*')
        .eq('code', checkoutData.coupon_code)
        .eq('active', true)
        .maybeSingle();

      if (coupon && !couponError) {
        const now = new Date();
        const validFrom = new Date(coupon.valid_from);
        const validTo = coupon.valid_to ? new Date(coupon.valid_to) : null;

        if (now >= validFrom && (!validTo || now <= validTo)) {
          if (subtotal >= (coupon.min_order || 0)) {
            const { data: usageCount } = await supabaseClient
              .from('coupon_usage')
              .select('id', { count: 'exact' })
              .eq('coupon_id', coupon.id)
              .eq('user_id', user.id);

            const userUsageCount = usageCount?.length || 0;

            if (userUsageCount < (coupon.uses_per_user || 1)) {
              if (coupon.type === 'percentage') {
                couponDiscount = (subtotal * coupon.value) / 100;
                if (coupon.max_discount) {
                  couponDiscount = Math.min(couponDiscount, coupon.max_discount);
                }
              } else {
                couponDiscount = coupon.value;
              }
              couponId = coupon.id;
            }
          }
        }
      }
    }

    const shipping = 0;
    const walletUsed = Math.min(checkoutData.wallet_amount || 0, subtotal + totalTax - couponDiscount);
    const total = subtotal + totalTax + shipping - couponDiscount - walletUsed;

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    let razorpayOrderId = null;
    let paymentStatus = 'pending';

    if (checkoutData.payment_method === 'razorpay' && total > 0) {
      const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
      const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

      if (!razorpayKeyId || !razorpayKeySecret) {
        throw new Error('Razorpay credentials not configured');
      }

      const orderData = {
        amount: Math.round(total * 100),
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          user_id: user.id,
          order_number: orderNumber,
        },
      };

      const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!razorpayResponse.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const razorpayOrder: RazorpayOrderResponse = await razorpayResponse.json();
      razorpayOrderId = razorpayOrder.id;
    } else if (checkoutData.payment_method === 'wallet' && total === 0) {
      paymentStatus = 'paid';
    }

    const firstProduct = products[0];
    const sellerId = firstProduct?.seller_id || null;

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        seller_id: sellerId,
        items: checkoutData.items,
        subtotal,
        tax_breakdown: taxBreakdown,
        taxes: totalTax,
        shipping,
        wallet_used: walletUsed,
        coupon_id: couponId,
        coupon_discount: couponDiscount,
        total,
        status: paymentStatus === 'paid' ? 'paid' : 'pending',
        payment_status: paymentStatus,
        payment_method: checkoutData.payment_method,
        payment_meta: razorpayOrderId ? { razorpay_order_id: razorpayOrderId } : {},
        shipping_address: checkoutData.shipping_address,
        billing_address: checkoutData.billing_address || checkoutData.shipping_address,
        gift_wrap: checkoutData.gift_wrap || false,
        gift_message: checkoutData.gift_message,
        notes: checkoutData.notes,
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error('Failed to create order');
    }

    if (walletUsed > 0) {
      const { data: userData } = await supabaseClient
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      const newBalance = (userData?.wallet_balance || 0) - walletUsed;

      await supabaseClient
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'debit',
          amount: walletUsed,
          balance_after: newBalance,
          description: `Used for order ${orderNumber}`,
          reference_type: 'order',
          reference_id: order.id,
        });
    }

    if (couponId) {
      await supabaseClient
        .from('coupon_usage')
        .insert({
          coupon_id: couponId,
          user_id: user.id,
          order_id: order.id,
          discount_amount: couponDiscount,
        });
    }

    await supabaseClient
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        order,
        razorpay_order_id: razorpayOrderId,
        razorpay_key_id: razorpayOrderId ? Deno.env.get('RAZORPAY_KEY_ID') : null,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({
        success: false,
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
