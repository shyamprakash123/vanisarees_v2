/*
  # Row Level Security Policies

  ## Overview
  RLS policies for all tables with role-based access control.
  
  ## Security Model
  - Users: access own data
  - Sellers: manage products and orders  
  - Admins: full access (role stored in auth.jwt()->>'app_metadata'->>'role')
  - Public: read products/categories

  ## Tables
  All 13 tables covered with restrictive default policies
*/

ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_seller()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'seller',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins have full access to users"
  ON users FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can view approved sellers"
  ON sellers FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create seller application"
  ON sellers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can update own profile"
  ON sellers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can delete sellers"
  ON sellers FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Sellers can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    is_seller() AND seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()) OR is_admin()
  )
  WITH CHECK (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()) OR is_admin()
  );

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Anyone can view combos"
  ON combos FOR SELECT
  USING (active = true OR is_admin());

CREATE POLICY "Admins can manage combos"
  ON combos FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (active = true OR is_admin());

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can view own coupon usage"
  ON coupon_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "System can insert coupon usage"
  ON coupon_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin() OR 
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and sellers can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    is_admin() OR 
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    is_admin() OR 
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    is_admin() OR 
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can view own transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "System can insert transactions"
  ON wallet_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create reviews for delivered orders"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid() AND status = 'delivered')
  );

CREATE POLICY "Users can update own pending reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());