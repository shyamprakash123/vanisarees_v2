/*
  # Order Status Change Automation

  ## Overview
  Creates database triggers to automatically handle wallet transactions when order status changes.

  ## Changes Made

  ### 1. Trigger Function: handle_order_status_change
    - Automatically credits seller wallet when order is delivered
    - Deducts commission and GST before crediting
    - Creates wallet transaction records
    - Refunds customer wallet when order is cancelled/refunded

  ### 2. Trigger: on_order_status_change
    - Fires on UPDATE of orders table
    - Calls handle_order_status_change function
    - Only triggers when status actually changes

  ## Security
  - Uses service role for wallet operations
  - Maintains transaction history
  - Ensures atomic operations
*/

CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  seller_record RECORD;
  commission_rate_val NUMERIC;
  commission_amt NUMERIC;
  gst_amt NUMERIC;
  seller_amt NUMERIC;
  current_balance NUMERIC;
  new_balance NUMERIC;
  refund_amt NUMERIC;
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.seller_id IS NOT NULL THEN
    SELECT s.id, s.commission_rate, s.seller_wallet_balance
    INTO seller_record
    FROM sellers s
    WHERE s.id = NEW.seller_id;

    IF FOUND THEN
      commission_rate_val := COALESCE(seller_record.commission_rate, 10);
      commission_amt := (NEW.total * commission_rate_val) / 100;
      gst_amt := (commission_amt * 18) / 100;
      seller_amt := NEW.total - commission_amt - gst_amt;

      current_balance := COALESCE(seller_record.seller_wallet_balance, 0);
      new_balance := current_balance + seller_amt;

      UPDATE sellers
      SET seller_wallet_balance = new_balance,
          updated_at = now()
      WHERE id = NEW.seller_id;

      INSERT INTO wallet_transactions (
        seller_id,
        type,
        amount,
        balance_after,
        description,
        reference_type,
        reference_id,
        commission_rate,
        commission_amount,
        gst_amount,
        meta
      ) VALUES (
        NEW.seller_id,
        'credit',
        seller_amt,
        new_balance,
        'Payment for order #' || NEW.order_number,
        'order',
        NEW.id,
        commission_rate_val,
        commission_amt,
        gst_amt,
        jsonb_build_object(
          'order_id', NEW.id,
          'order_number', NEW.order_number,
          'order_total', NEW.total
        )
      );
    END IF;
  END IF;

  IF (NEW.status = 'cancelled' OR NEW.status = 'refunded')
     AND (OLD.status != 'cancelled' AND OLD.status != 'refunded')
     AND NEW.wallet_used > 0 THEN

    SELECT wallet_balance INTO current_balance
    FROM users
    WHERE id = NEW.user_id;

    IF FOUND THEN
      refund_amt := NEW.wallet_used;
      new_balance := COALESCE(current_balance, 0) + refund_amt;

      UPDATE users
      SET wallet_balance = new_balance,
          updated_at = now()
      WHERE id = NEW.user_id;

      INSERT INTO wallet_transactions (
        user_id,
        type,
        amount,
        balance_after,
        description,
        reference_type,
        reference_id,
        meta
      ) VALUES (
        NEW.user_id,
        'credit',
        refund_amt,
        new_balance,
        'Refund for ' || NEW.status || ' order #' || NEW.order_number,
        'order',
        NEW.id,
        jsonb_build_object(
          'order_id', NEW.id,
          'order_number', NEW.order_number,
          'refund_type', NEW.status
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_change ON orders;

CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_order_status_change();
