import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ShipmentScan {
  date: string;
  activity: string;
  location: string;
}

interface ShiprocketWebhookPayload {
  awb: string | number;
  current_status: string;
  order_id: string;
  current_timestamp: string;
  etd: string;
  current_status_id: number;
  shipment_status: string;
  shipment_status_id: number;
  channel_order_id: string;
  channel: string;
  courier_name: string;
  scans: ShipmentScan[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const payload: ShiprocketWebhookPayload = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: validationData, error: validationError } = await supabase.rpc(
      'validate_webhook_token',
      { p_token: token }
    );

    if (validationError) {
      console.error('Token validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const sellerId = validationData;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, seller_id')
      .eq('order_number', payload.order_id)
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (orderError) {
      console.error('Order lookup error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to lookup order' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found or does not belong to seller' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const statusTimestamp = new Date(payload.current_timestamp).toISOString();
    const etd = payload.etd ? new Date(payload.etd).toISOString() : null;

    const { error: insertError } = await supabase
      .from('shipment_tracking_events')
      .insert({
        order_id: order.id,
        awb: String(payload.awb),
        current_status: payload.current_status,
        current_status_id: payload.current_status_id,
        shipment_status: payload.shipment_status,
        shipment_status_id: payload.shipment_status_id,
        channel_order_id: payload.channel_order_id,
        channel: payload.channel,
        courier_name: payload.courier_name,
        status_timestamp: statusTimestamp,
        etd: etd,
        scans: payload.scans || [],
        raw_payload: payload,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store tracking event' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const orderStatusMap: Record<number, string> = {
      6: 'delivered',
      7: 'delivered',
      8: 'cancelled',
      9: 'cancelled',
      10: 'cancelled',
      11: 'cancelled',
      19: 'shipped',
    };

    const newOrderStatus = orderStatusMap[payload.shipment_status_id];
    if (newOrderStatus) {
      const updateData: Record<string, any> = {
        status: newOrderStatus,
        tracking_number: String(payload.awb),
      };

      if (newOrderStatus === 'shipped' && !order.shipped_at) {
        updateData.shipped_at = new Date().toISOString();
      } else if (newOrderStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (newOrderStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (updateError) {
        console.error('Order status update error:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        order_id: order.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
