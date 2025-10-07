/*
  # Add Notification Preferences

  1. Changes
    - Add notification_preferences column to users table
    - Default preferences for order updates, promotions, newsletter, and new arrivals

  2. Notes
    - Column is JSONB type for flexibility
    - Includes default values for new users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE users ADD COLUMN notification_preferences jsonb DEFAULT '{"orderUpdates": true, "promotions": true, "newsletter": false, "newArrivals": true}';
  END IF;
END $$;
