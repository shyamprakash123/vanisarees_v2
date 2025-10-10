/*
  # Shiprocket Webhook Integration Tables

  1. New Tables
    - `webhook_tokens`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, foreign key to sellers)
      - `token` (text, unique) - Authentication token for webhook calls
      - `is_active` (boolean) - Whether the token is active
      - `created_at` (timestamptz)
      - `last_used_at` (timestamptz) - Track last webhook usage

    - `shipment_tracking_events`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `awb` (text) - Air waybill number
      - `current_status` (text) - Current shipment status
      - `current_status_id` (int) - Status ID from Shiprocket
      - `shipment_status` (text)
      - `shipment_status_id` (int)
      - `channel_order_id` (text)
      - `channel` (text)
      - `courier_name` (text)
      - `status_timestamp` (timestamptz) - Timestamp from webhook
      - `etd` (timestamptz) - Estimated delivery time
      - `scans` (jsonb) - Array of scan events
      - `raw_payload` (jsonb) - Store complete webhook payload
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Sellers can view their own tokens
    - Sellers can view tracking events for their orders
    - Customers can view tracking for their orders

  3. Indexes
    - Index on webhook_tokens.token for fast lookups
    - Index on shipment_tracking_events.order_id for querying
    - Index on shipment_tracking_events.awb for lookups

  4. Helper Functions
    - `generate_webhook_token()` - Generate new token for seller
    - `validate_webhook_token()` - Validate token and return seller_id
*/

-- Create webhook_tokens table
CREATE TABLE IF NOT EXISTS webhook_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

-- Create shipment_tracking_events table
CREATE TABLE IF NOT EXISTS shipment_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  awb text,
  current_status text,
  current_status_id int,
  shipment_status text,
  shipment_status_id int,
  channel_order_id text,
  channel text,
  courier_name text,
  status_timestamp timestamptz,
  etd timestamptz,
  scans jsonb DEFAULT '[]'::jsonb,
  raw_payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_tokens_token ON webhook_tokens(token);
CREATE INDEX IF NOT EXISTS idx_webhook_tokens_seller ON webhook_tokens(seller_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_order ON shipment_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_awb ON shipment_tracking_events(awb);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_created ON shipment_tracking_events(created_at DESC);

-- Enable RLS
ALTER TABLE webhook_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_tracking_events ENABLE ROW LEVEL SECURITY;

-- Policies for webhook_tokens
CREATE POLICY "Sellers can view own tokens"
  ON webhook_tokens FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = webhook_tokens.seller_id
      AND sellers.id = auth.uid() AND sellers.status = 'approved' AND is_seller()
    )
  );

-- Policies for shipment_tracking_events
CREATE POLICY "Sellers can view own order tracking"
  ON shipment_tracking_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN sellers ON sellers.id = orders.seller_id
      WHERE orders.id = shipment_tracking_events.order_id
      AND sellers.id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their order tracking"
  ON shipment_tracking_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = shipment_tracking_events.order_id
      AND orders.id = auth.uid()
    )
  );

-- Function to generate webhook token for a seller
CREATE OR REPLACE FUNCTION generate_webhook_token(p_seller_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Check if seller exists
  IF NOT EXISTS (
    SELECT 1 FROM sellers
    WHERE id = p_seller_id
  ) THEN
    RAISE EXCEPTION 'Seller not found';
  END IF;

  -- Generate random token (URL-safe base64)
  v_token := replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');
  v_token := rtrim(v_token, '=');

  -- Deactivate existing tokens for this seller
  UPDATE webhook_tokens
  SET is_active = false
  WHERE seller_id = p_seller_id;

  -- Insert new token
  INSERT INTO webhook_tokens (seller_id, token)
  VALUES (p_seller_id, v_token);

  RETURN v_token;
END;
$$;

-- Function to validate webhook token and return seller_id
CREATE OR REPLACE FUNCTION validate_webhook_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_id uuid;
BEGIN
  -- Find active token and update last_used_at
  UPDATE webhook_tokens
  SET last_used_at = now()
  WHERE token = p_token
  AND is_active = true
  RETURNING seller_id INTO v_seller_id;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive webhook token';
  END IF;

  RETURN v_seller_id;
END;
$$;
