/*
  # VaniSarees Initial Database Schema

  ## Overview
  Complete database schema for VaniSarees eCommerce platform with multi-role support.

  ## New Tables
  1. users - User profiles with wallet balance
  2. sellers - Seller applications and management
  3. categories - Product categories with hierarchy
  4. products - Product catalog with variants
  5. combos - Product bundle offers
  6. coupons - Discount codes
  7. addresses - User addresses
  8. cart_items - Shopping cart
  9. orders - Order management
  10. invoices - GST invoices
  11. wallet_transactions - Wallet ledger
  12. reviews - Product reviews

  ## Security
  RLS enabled in next migration
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  phone text,
  wallet_balance numeric DEFAULT 0 CHECK (wallet_balance >= 0),
  gstin text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  shop_name text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  kyc jsonb DEFAULT '{}',
  commission_rate numeric DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  description text,
  image_url text,
  sort_order int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  product_ids uuid[] NOT NULL,
  combo_price numeric NOT NULL CHECK (combo_price >= 0),
  original_price numeric CHECK (original_price >= combo_price),
  active boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_to timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  codes text[] DEFAULT '{}',
  sku text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  price numeric NOT NULL CHECK (price >= 0),
  mrp numeric CHECK (mrp >= price),
  tax_slab numeric DEFAULT 5 CHECK (tax_slab >= 0),
  hsn_code text,
  stock int DEFAULT 0 CHECK (stock >= 0),
  variants jsonb DEFAULT '[]',
  images text[] DEFAULT '{}',
  youtube_ids text[] DEFAULT '{}',
  description text,
  features text[] DEFAULT '{}',
  featured boolean DEFAULT false,
  trending boolean DEFAULT false,
  active boolean DEFAULT true,
  combo_id uuid REFERENCES combos(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value numeric NOT NULL CHECK (value > 0),
  min_order numeric DEFAULT 0 CHECK (min_order >= 0),
  max_discount numeric,
  max_uses int,
  uses_per_user int DEFAULT 1,
  valid_from timestamptz DEFAULT now(),
  valid_to timestamptz,
  active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid,
  used_at timestamptz DEFAULT now(),
  discount_amount numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text DEFAULT 'India',
  is_default boolean DEFAULT false,
  address_type text DEFAULT 'shipping' CHECK (address_type IN ('shipping', 'billing', 'both')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant jsonb DEFAULT '{}',
  quantity int DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  gst_breakdown jsonb NOT NULL DEFAULT '{}',
  pdf_storage_key text,
  amount_in_words text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  tax_breakdown jsonb DEFAULT '{}',
  taxes numeric DEFAULT 0 CHECK (taxes >= 0),
  shipping numeric DEFAULT 0 CHECK (shipping >= 0),
  wallet_used numeric DEFAULT 0 CHECK (wallet_used >= 0),
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  coupon_discount numeric DEFAULT 0 CHECK (coupon_discount >= 0),
  total numeric NOT NULL CHECK (total >= 0),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method text,
  payment_meta jsonb DEFAULT '{}',
  invoiced boolean DEFAULT false,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  shipping_address jsonb NOT NULL,
  billing_address jsonb,
  gift_wrap boolean DEFAULT false,
  gift_message text,
  notes text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_order_id_fkey' AND table_name = 'invoices'
  ) THEN
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount numeric NOT NULL CHECK (amount > 0),
  balance_after numeric NOT NULL CHECK (balance_after >= 0),
  description text,
  reference_type text,
  reference_id uuid,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  images text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  helpful_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin(lower(title) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_codes ON products USING gin(codes);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);