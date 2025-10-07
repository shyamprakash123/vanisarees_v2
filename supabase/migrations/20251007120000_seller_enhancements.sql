/*
  # Seller Account Management Enhancements

  ## Overview
  Enhances seller management with approval workflow and wallet system for sellers.

  ## Changes Made

  ### 1. Sellers Table Updates
    - Add `rejected` status to seller status enum
    - Add `rejection_reason` field for admin feedback
    - Add `approved_at` and `approved_by` tracking
    - Add `bank_details` for withdrawal processing
    - Add `seller_wallet_balance` for earnings tracking

  ### 2. New Table: seller_withdrawal_requests
    - `id` (uuid, primary key)
    - `seller_id` (uuid, references sellers)
    - `amount` (numeric, must be positive)
    - `status` (text, enum: pending/approved/rejected/completed)
    - `bank_details` (jsonb, account information)
    - `processed_by` (uuid, admin who processed)
    - `processed_at` (timestamptz)
    - `transaction_id` (text, bank transaction reference)
    - `notes` (text, additional information)
    - `created_at` (timestamptz)

  ### 3. Wallet Transactions Enhancements
    - Add `seller_id` field to track seller transactions
    - Add `commission_rate` and `commission_amount` for platform fees
    - Add `gst_amount` for tax tracking

  ## Security
  - Enable RLS on new tables
  - Add policies for admin access
  - Add policies for seller access to own data
*/

-- Extend sellers table
DO $$
BEGIN
  -- Drop old check constraint if exists
  ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_status_check;

  -- Add new check constraint with rejected status
  ALTER TABLE sellers ADD CONSTRAINT sellers_status_check
    CHECK (status IN ('pending', 'approved', 'suspended', 'rejected'));

  -- Add new columns if they don't exist
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

-- Create seller withdrawal requests table
CREATE TABLE IF NOT EXISTS seller_withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  bank_details jsonb NOT NULL,
  processed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  transaction_id text,
  notes text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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
CREATE INDEX IF NOT EXISTS idx_seller_withdrawals_seller_id ON seller_withdrawal_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_withdrawals_status ON seller_withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_seller_id ON wallet_transactions(seller_id);

-- Enable RLS
ALTER TABLE seller_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policies for seller_withdrawal_requests
CREATE POLICY "Sellers can view own withdrawal requests"
  ON seller_withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_withdrawal_requests.seller_id
      AND sellers.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can create withdrawal requests"
  ON seller_withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_withdrawal_requests.seller_id
      AND sellers.user_id = auth.uid()
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
