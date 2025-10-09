-- SHIPROCKET INTEGRATION SETUP SQL
-- Run this SQL in your Supabase SQL Editor to set up Shiprocket integration

-- ==============================================
-- TABLE: shiprocket_credentials
-- Stores Shiprocket API credentials for sellers
-- ==============================================
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

-- ==============================================
-- TABLE: shiprocket_shipments
-- Stores shipment information and tracking
-- ==============================================
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

-- ==============================================
-- TABLE: shiprocket_courier_cache
-- Caches courier serviceability results
-- ==============================================
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

-- ==============================================
-- MODIFY: orders table
-- Add Shiprocket reference columns
-- ==============================================
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

-- ==============================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================
ALTER TABLE shiprocket_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE shiprocket_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shiprocket_courier_cache ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- RLS POLICIES: shiprocket_credentials
-- ==============================================

-- Sellers can view own credentials
CREATE POLICY "Sellers can view own credentials"
  ON shiprocket_credentials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = shiprocket_credentials.seller_id
      AND sellers.id = auth.uid()
    )
  );

-- Sellers can insert own credentials
CREATE POLICY "Sellers can insert own credentials"
  ON shiprocket_credentials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = shiprocket_credentials.seller_id
      AND sellers.id = auth.uid()
    )
  );

-- Sellers can update own credentials
CREATE POLICY "Sellers can update own credentials"
  ON shiprocket_credentials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = shiprocket_credentials.seller_id
      AND sellers.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = shiprocket_credentials.seller_id
      AND sellers.id = auth.uid()
    )
  );

-- Admins can view all credentials
CREATE POLICY "Admins can view all credentials"
  ON shiprocket_credentials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND is_admin()
    )
  );

-- ==============================================
-- RLS POLICIES: shiprocket_shipments
-- ==============================================

-- Sellers can view own shipments
CREATE POLICY "Sellers can view own shipments"
  ON shiprocket_shipments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN sellers ON sellers.id = orders.seller_id
      WHERE orders.id = shiprocket_shipments.order_id
      AND sellers.id = auth.uid()
    )
  );

-- Sellers can create shipments for own orders
CREATE POLICY "Sellers can create shipments for own orders"
  ON shiprocket_shipments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN sellers ON sellers.id = orders.seller_id
      WHERE orders.id = shiprocket_shipments.order_id
      AND sellers.id = auth.uid()
    )
  );

-- Sellers can update own shipments
CREATE POLICY "Sellers can update own shipments"
  ON shiprocket_shipments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN sellers ON sellers.id = orders.seller_id
      WHERE orders.id = shiprocket_shipments.order_id
      AND sellers.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN sellers ON sellers.id = orders.seller_id
      WHERE orders.id = shiprocket_shipments.order_id
      AND sellers.id = auth.uid()
    )
  );

-- Admins can view all shipments
CREATE POLICY "Admins can view all shipments"
  ON shiprocket_shipments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND is_admin()
    )
  );

-- Admins can create all shipments
CREATE POLICY "Admins can create all shipments"
  ON shiprocket_shipments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND is_admin()
    )
  );

-- Admins can update all shipments
CREATE POLICY "Admins can update all shipments"
  ON shiprocket_shipments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND is_admin()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND is_admin()
    )
  );

-- ==============================================
-- RLS POLICIES: shiprocket_courier_cache
-- ==============================================

-- Anyone can read courier cache
CREATE POLICY "Anyone can read courier cache"
  ON shiprocket_courier_cache FOR SELECT
  TO authenticated
  USING (true);

-- Anyone can insert courier cache
CREATE POLICY "Anyone can insert courier cache"
  ON shiprocket_courier_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==============================================
-- CREATE INDEXES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_shiprocket_credentials_seller_id
  ON shiprocket_credentials(seller_id);

CREATE INDEX IF NOT EXISTS idx_shiprocket_shipments_order_id
  ON shiprocket_shipments(order_id);

CREATE INDEX IF NOT EXISTS idx_shiprocket_shipments_shipment_id
  ON shiprocket_shipments(shipment_id);

CREATE INDEX IF NOT EXISTS idx_shiprocket_shipments_awb_code
  ON shiprocket_shipments(awb_code);

CREATE INDEX IF NOT EXISTS idx_courier_cache_postcodes
  ON shiprocket_courier_cache(pickup_postcode, delivery_postcode);

CREATE INDEX IF NOT EXISTS idx_courier_cache_expires
  ON shiprocket_courier_cache(expires_at);

-- ==============================================
-- UTILITY FUNCTION: Cleanup expired cache
-- ==============================================
CREATE OR REPLACE FUNCTION cleanup_expired_courier_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM shiprocket_courier_cache
  WHERE expires_at < now();
END;
$$;

-- ==============================================
-- VERIFICATION QUERIES
-- Run these to verify the setup
-- ==============================================

-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('shiprocket_credentials', 'shiprocket_shipments', 'shiprocket_courier_cache')
ORDER BY table_name;

-- Check if columns were added to orders
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('shiprocket_order_id', 'shiprocket_shipment_id')
ORDER BY column_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('shiprocket_credentials', 'shiprocket_shipments', 'shiprocket_courier_cache')
ORDER BY tablename, policyname;
