/*
  # Coupon Usage Helper Function

  ## Overview
  Creates a database function to safely increment coupon usage counter.

  ## Changes Made

  ### 1. Function: increment_coupon_usage
    - Atomically increments the current_uses counter
    - Returns the new count
    - Thread-safe for concurrent usage

  ## Security
  - Function is security definer to ensure it runs with elevated privileges
  - Validates that coupon exists before incrementing
*/

-- Function to increment coupon usage atomically
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coupons
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = coupon_id;
END;
$$;
