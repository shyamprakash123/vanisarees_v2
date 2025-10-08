/*
  # Shiprocket Integration Schema

  1. New Tables
    - `shiprocket_credentials`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, references sellers)
      - `email` (text, encrypted credential)
      - `password` (text, encrypted credential)
      - `pickup_location` (text, default pickup location name)
      - `active` (boolean, whether credentials are active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `shiprocket_shipments`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `shiprocket_order_id` (text, order ID from Shiprocket)
      - `shipment_id` (bigint, shipment ID from Shiprocket)
      - `awb_code` (text, AWB tracking number)
      - `courier_id` (int, selected courier ID)
      - `courier_name` (text, courier company name)
      - `freight_charge` (numeric, shipping cost)
      - `cod_charges` (numeric, COD charges if applicable)
      - `estimated_delivery_days` (text, delivery estimate)
      - `pickup_scheduled` (boolean, whether pickup is scheduled)
      - `status` (text, shipment status)
      - `tracking_data` (jsonb, tracking information)
      - `metadata` (jsonb, additional shipment data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `shiprocket_courier_cache`
      - `id` (uuid, primary key)
      - `pickup_postcode` (text)
      - `delivery_postcode` (text)
      - `weight` (numeric)
      - `cod_enabled` (boolean)
      - `couriers` (jsonb, available courier services)
      - `cached_at` (timestamp)
      - `expires_at` (timestamp)

  2. Changes
    - Add `shiprocket_order_id` to orders table
    - Add `shiprocket_shipment_id` to orders table

  3. Security
    - Enable RLS on all new tables
    - Add policies for admin and seller access
*/

CREATE TABLE IF NOT EXISTS shiprocket_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  email text NOT NULL,
  password text NOT NULL,
  pickup_location text NOT NULL DEFAULT 'Primary',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(seller_id)
);

CREATE TABLE IF NOT EXISTS shiprocket_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  shiprocket_order_id text,
  shipment_id bigint,
  awb_code text,
  courier_id int,
  courier_name text,
  freight_charge numeric DEFAULT 0 CHECK (freight_charge >= 0),
  cod_charges numeric DEFAULT 0 CHECK (cod_charges >= 0),
  estimated_delivery_days text,
  pickup_scheduled boolean DEFAULT false,
  status text DEFAULT 'created' CHECK (status IN ('created', 'pickup_scheduled', 'in_transit', 'delivered', 'cancelled', 'returned')),
  tracking_data jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shiprocket_courier_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_postcode text NOT NULL,
  delivery_postcode text NOT NULL,
  weight numeric NOT NULL DEFAULT 0.5,
  cod_enabled boolean DEFAULT false,
  couriers jsonb NOT NULL DEFAULT '[]',
  cached_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '1 hour'
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shiprocket_order_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN shiprocket_order_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shiprocket_shipment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN shiprocket_shipment_id bigint;
  END IF;
END $$;

ALTER TABLE shiprocket_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE shiprocket_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shiprocket_courier_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own credentials"
  ON shiprocket_credentials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = shiprocket_credentials.seller_id
      AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can insert own credentials"
  ON shiprocket_credentials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = shiprocket_credentials.seller_id
      AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update own credentials"
  ON shiprocket_credentials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = shiprocket_credentials.seller_id
      AND sellers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = shiprocket_credentials.seller_id
      AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all credentials"
  ON shiprocket_credentials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Sellers can view own shipments"
  ON shiprocket_shipments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN sellers ON sellers.id = orders.seller_id
      WHERE orders.id = shiprocket_shipments.order_id
      AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can create shipments for own orders"
  ON shiprocket_shipments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN sellers ON sellers.id = orders.seller_id
      WHERE orders.id = shiprocket_shipments.order_id
      AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update own shipments"
  ON shiprocket_shipments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN sellers ON sellers.id = orders.seller_id
      WHERE orders.id = shiprocket_shipments.order_id
      AND sellers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN sellers ON sellers.id = orders.seller_id
      WHERE orders.id = shiprocket_shipments.order_id
      AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all shipments"
  ON shiprocket_shipments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create all shipments"
  ON shiprocket_shipments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all shipments"
  ON shiprocket_shipments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Anyone can read courier cache"
  ON shiprocket_courier_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert courier cache"
  ON shiprocket_courier_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_shiprocket_credentials_seller_id ON shiprocket_credentials(seller_id);
CREATE INDEX IF NOT EXISTS idx_shiprocket_shipments_order_id ON shiprocket_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shiprocket_shipments_shipment_id ON shiprocket_shipments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shiprocket_shipments_awb_code ON shiprocket_shipments(awb_code);
CREATE INDEX IF NOT EXISTS idx_courier_cache_postcodes ON shiprocket_courier_cache(pickup_postcode, delivery_postcode);
CREATE INDEX IF NOT EXISTS idx_courier_cache_expires ON shiprocket_courier_cache(expires_at);

CREATE OR REPLACE FUNCTION cleanup_expired_courier_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM shiprocket_courier_cache
  WHERE expires_at < now();
END;
$$;
