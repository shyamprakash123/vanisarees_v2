/*
  # Add Wishlist Functionality

  ## New Tables
  - `wishlists` - User wishlist items with timestamps

  ## Columns
  - `id` - Unique identifier
  - `user_id` - Reference to user
  - `product_id` - Reference to product
  - `created_at` - When item was added to wishlist

  ## Security
  - Enable RLS on wishlists table
  - Users can only access their own wishlist items
  - Users can add/remove items from their own wishlist

  ## Indexes
  - Index on user_id for fast wishlist queries
  - Composite unique index on (user_id, product_id) to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON wishlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist"
  ON wishlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own wishlist"
  ON wishlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);