/*
  # Seller Account and Coupon Management Enhancements

  ## Overview
  Comprehensive seller account management with bank accounts and coupon system.

  ## Changes Made

  ### 1. Sellers Table Updates
    - Add `rejected` status to seller status enum
    - Add `rejection_reason` field for admin feedback
    - Add `approved_at` and `approved_by` tracking
    - Add `bank_details` for withdrawal processing (legacy)
    - Add `seller_wallet_balance` for earnings tracking

  ### 2. New Table: seller_withdrawal_requests
    - Withdrawal request tracking with approval workflow

  ### 3. New Table: seller_bank_accounts
    - Multiple bank account support for sellers
    - Default account management
    - Verification workflow

  ### 4. Coupons Enhancement
    - Add `seller_id` to coupons for seller-specific coupons
    - Add `current_uses` to track usage count

  ### 5. Wallet Transactions Enhancements
    - Add `seller_id` field to track seller transactions
    - Add `commission_rate` and `commission_amount` for platform fees
    - Add `gst_amount` for tax tracking

  ## Security
  - Enable RLS on all new tables
  - Add policies for admin and seller access
*/

-- Extend sellers table
DO $$
BEGIN
  ALTER TABLE sellers DROP CONSTRAINT IF EXISTS status;
  ALTER TABLE sellers ADD CONSTRAINT status
    CHECK (status IN ('pending', 'approved', 'suspended', 'rejected'));

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'rejection_reason') THEN
    ALTER TABLE sellers ADD COLUMN rejection_reason text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'approved_at') THEN
    ALTER TABLE sellers ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'approved_by') THEN
    ALTER TABLE sellers ADD COLUMN approved_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'bank_details') THEN
    ALTER TABLE sellers ADD COLUMN bank_details jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'seller_wallet_balance') THEN
    ALTER TABLE sellers ADD COLUMN seller_wallet_balance numeric DEFAULT 0 CHECK (seller_wallet_balance >= 0);
  END IF;
END $$;

-- Create seller bank accounts table
CREATE TABLE IF NOT EXISTS seller_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE NOT NULL,
  account_holder text NOT NULL,
  account_number text NOT NULL,
  ifsc_code text NOT NULL,
  bank_name text NOT NULL,
  branch_name text,
  account_type text DEFAULT 'savings' CHECK (account_type IN ('savings', 'current')),
  is_default boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create seller withdrawal requests table
CREATE TABLE IF NOT EXISTS seller_withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  bank_details jsonb NOT NULL,
  bank_account_id uuid REFERENCES seller_bank_accounts(id) ON DELETE SET NULL,
  processed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  transaction_id text,
  notes text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhance coupons table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'seller_id') THEN
    ALTER TABLE coupons ADD COLUMN seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'current_uses') THEN
    ALTER TABLE coupons ADD COLUMN current_uses int DEFAULT 0 CHECK (current_uses >= 0);
  END IF;
END $$;

-- Extend wallet_transactions table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'seller_id') THEN
    ALTER TABLE wallet_transactions ADD COLUMN seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'commission_rate') THEN
    ALTER TABLE wallet_transactions ADD COLUMN commission_rate numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'commission_amount') THEN
    ALTER TABLE wallet_transactions ADD COLUMN commission_amount numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'gst_amount') THEN
    ALTER TABLE wallet_transactions ADD COLUMN gst_amount numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'admin_id') THEN
    ALTER TABLE wallet_transactions ADD COLUMN admin_id uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_seller_id ON seller_bank_accounts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_default ON seller_bank_accounts(seller_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_seller_withdrawals_seller_id ON seller_withdrawal_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_withdrawals_status ON seller_withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_seller_id ON wallet_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_coupons_seller_id ON coupons(seller_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_coupon ON coupon_usage(user_id, coupon_id);

-- Function to ensure only one default bank account per seller
CREATE OR REPLACE FUNCTION ensure_single_default_bank_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE seller_bank_accounts
    SET is_default = false
    WHERE seller_id = NEW.seller_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_bank_account ON seller_bank_accounts;
CREATE TRIGGER trigger_ensure_single_default_bank_account
  BEFORE INSERT OR UPDATE ON seller_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_bank_account();

-- Enable RLS
ALTER TABLE seller_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Policies for seller_bank_accounts
CREATE POLICY "Sellers can view own bank accounts"
  ON seller_bank_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_bank_accounts.seller_id
      AND sellers.id = auth.uid()
    )
  );

CREATE POLICY "Sellers can create own bank accounts"
  ON seller_bank_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_bank_accounts.seller_id
      AND sellers.id = auth.uid()
      AND sellers.status = 'approved'
    )
  );

CREATE POLICY "Sellers can update own bank accounts"
  ON seller_bank_accounts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_bank_accounts.seller_id
      AND sellers.id = auth.uid()
    )
  );

CREATE POLICY "Sellers can delete own bank accounts"
  ON seller_bank_accounts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_bank_accounts.seller_id
      AND sellers.id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all bank accounts"
  ON seller_bank_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email LIKE '%@vanisarees.com'
    )
  );

CREATE POLICY "Admins can update bank account verification"
  ON seller_bank_accounts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email LIKE '%@vanisarees.com'
    )
  );

-- Policies for seller_withdrawal_requests
CREATE POLICY "Sellers can view own withdrawal requests"
  ON seller_withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_withdrawal_requests.seller_id
      AND sellers.id = auth.uid()
    )
  );

CREATE POLICY "Sellers can create withdrawal requests"
  ON seller_withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_withdrawal_requests.seller_id
      AND sellers.id = auth.uid()
      AND sellers.status = 'approved'
    )
  );

CREATE POLICY "Admins can view all withdrawal requests"
  ON seller_withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email LIKE '%@vanisarees.com'
    )
  );

CREATE POLICY "Admins can update withdrawal requests"
  ON seller_withdrawal_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email LIKE '%@vanisarees.com'
    )
  );

-- Policies for coupons
CREATE POLICY "Everyone can view active coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Sellers can view own coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (
    seller_id IS NULL OR
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = coupons.seller_id
      AND sellers.id = auth.uid()
    )
  );

CREATE POLICY "Sellers can create own coupons"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id IS NULL OR
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = coupons.seller_id
      AND sellers.id = auth.uid()
      AND sellers.status = 'approved'
    )
  );

CREATE POLICY "Sellers can update own coupons"
  ON coupons FOR UPDATE
  TO authenticated
  USING (
    seller_id IS NULL OR
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = coupons.seller_id
      AND sellers.id = auth.uid()
    )
  );

CREATE POLICY "Sellers can delete own coupons"
  ON coupons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = coupons.seller_id
      AND sellers.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email LIKE '%@vanisarees.com'
    )
  );

-- Policies for coupon_usage
CREATE POLICY "Users can view own coupon usage"
  ON coupon_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create coupon usage"
  ON coupon_usage FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all coupon usage"
  ON coupon_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email LIKE '%@vanisarees.com'
    )
  );