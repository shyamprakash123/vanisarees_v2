/*
  # Order Shipment and Product Review Enhancements

  1. Changes to Orders Table
    - Add unique constraint on shiprocket_shipment_id to ensure one-to-one relationship
    - Add proper indexing for shipment lookups

  2. Changes to Products Table
    - Add `admin_approved` column (boolean) for admin review system
    - Add `approval_notes` column for admin feedback
    - Add `submitted_for_approval_at` timestamp
    - Products must be approved by admin before going live

  3. Enhanced RLS Policies
    - Users can only SELECT orders (no insert/update/delete)
    - Users can view shipments for their own orders
    - Sellers can view products pending approval
    - Admins can approve/reject products
    - Order RLS policies updated for proper access control

  4. New Functions
    - Function to automatically set product approval status
    - Function to handle product submission workflow

  5. Security
    - Strict RLS on all tables
    - Users cannot modify orders directly (must use edge functions)
    - Shipment data visible to order owner, seller, and admin
*/

-- Add shipment unique constraint to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_shiprocket_shipment_id_unique'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_shiprocket_shipment_id_unique UNIQUE (shiprocket_shipment_id);
  END IF;
END $$;

-- Add product approval columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'admin_approved'
  ) THEN
    ALTER TABLE products ADD COLUMN admin_approved boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'approval_notes'
  ) THEN
    ALTER TABLE products ADD COLUMN approval_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'submitted_for_approval_at'
  ) THEN
    ALTER TABLE products ADD COLUMN submitted_for_approval_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE products ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE products ADD COLUMN approved_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_shipment_id ON orders(shiprocket_shipment_id) WHERE shiprocket_shipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_admin_approved ON products(admin_approved);
CREATE INDEX IF NOT EXISTS idx_products_submitted_for_approval ON products(submitted_for_approval_at) WHERE submitted_for_approval_at IS NOT NULL;

-- Drop existing order policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Sellers can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Sellers can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- Create comprehensive order RLS policies
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Sellers can view orders for their products"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = orders.seller_id
      AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Orders can ONLY be created/modified via edge functions (service role)
-- No direct insert/update/delete for users
CREATE POLICY "Only service role can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Only service role can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only service role can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (false);

-- Add shipment view policies for users
DROP POLICY IF EXISTS "Users can view shipments for own orders" ON shiprocket_shipments;

CREATE POLICY "Users can view shipments for own orders"
  ON shiprocket_shipments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = shiprocket_shipments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Update product policies for approval workflow
DROP POLICY IF EXISTS "Sellers can view own products" ON products;
DROP POLICY IF EXISTS "Sellers can insert products" ON products;
DROP POLICY IF EXISTS "Sellers can update own products" ON products;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Anyone can view approved products" ON products;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Sellers can update own unapproved products" ON products;
DROP POLICY IF EXISTS "Admins can update all products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

CREATE POLICY "Anyone can view approved products"
  ON products FOR SELECT
  TO authenticated
  USING (active = true AND admin_approved = true);

CREATE POLICY "Sellers can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = products.seller_id
      AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Sellers can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = products.seller_id
      AND sellers.user_id = auth.uid()
      AND sellers.approved = true
    )
  );

CREATE POLICY "Sellers can update own unapproved products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = products.seller_id
      AND sellers.user_id = auth.uid()
    )
    AND (admin_approved = false OR admin_approved IS NULL)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = products.seller_id
      AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all products"
  ON products FOR UPDATE
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

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to submit product for approval
CREATE OR REPLACE FUNCTION submit_product_for_approval(product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  seller_user_id uuid;
BEGIN
  -- Get seller user_id
  SELECT s.user_id INTO seller_user_id
  FROM products p
  JOIN sellers s ON s.id = p.seller_id
  WHERE p.id = product_id;

  -- Check if caller owns this product
  IF seller_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Update product
  UPDATE products
  SET
    submitted_for_approval_at = now(),
    admin_approved = false,
    active = false
  WHERE id = product_id;

  RETURN jsonb_build_object('success', true, 'message', 'Product submitted for approval');
END;
$$;

-- Function for admin to approve/reject product
CREATE OR REPLACE FUNCTION admin_review_product(
  product_id uuid,
  approved boolean,
  notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_role text;
BEGIN
  -- Check if caller is admin
  SELECT role INTO admin_user_role
  FROM users
  WHERE id = auth.uid();

  IF admin_user_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  -- Update product
  UPDATE products
  SET
    admin_approved = approved,
    approval_notes = notes,
    approved_at = CASE WHEN approved THEN now() ELSE NULL END,
    approved_by = CASE WHEN approved THEN auth.uid() ELSE NULL END,
    active = approved
  WHERE id = product_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN approved THEN 'Product approved' ELSE 'Product rejected' END
  );
END;
$$;

-- Create view for order details with shipment info
CREATE OR REPLACE VIEW order_details_with_shipment AS
SELECT
  o.*,
  s.id as shipment_id,
  s.shiprocket_order_id,
  s.shipment_id as shiprocket_shipment_id_value,
  s.awb_code,
  s.courier_id,
  s.courier_name,
  s.freight_charge,
  s.cod_charges,
  s.estimated_delivery_days,
  s.pickup_scheduled,
  s.status as shipment_status,
  s.tracking_data,
  s.created_at as shipment_created_at,
  s.updated_at as shipment_updated_at
FROM orders o
LEFT JOIN shiprocket_shipments s ON s.order_id = o.id;

-- Grant access to the view
GRANT SELECT ON order_details_with_shipment TO authenticated;
