/*
  # Seed Data for VaniSarees

  ## Contents
  1. Categories (Sarees, Jewellery with subcategories)
  2. Sample Products (Sarees and Jewellery)
  3. Sample Coupons
  
  ## Note
  This provides initial data for testing and development
*/

-- Insert Categories
INSERT INTO categories (id, name, slug, parent_id, description, image_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sarees', 'sarees', NULL, 'Traditional and modern sarees in various fabrics and designs', 'https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'),
  ('11111111-1111-1111-1111-111111111112', 'Silk Sarees', 'silk-sarees', '11111111-1111-1111-1111-111111111111', 'Premium silk sarees for special occasions', 'https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'),
  ('11111111-1111-1111-1111-111111111113', 'Cotton Sarees', 'cotton-sarees', '11111111-1111-1111-1111-111111111111', 'Comfortable everyday wear cotton sarees', 'https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'),
  ('11111111-1111-1111-1111-111111111114', 'Designer Sarees', 'designer-sarees', '11111111-1111-1111-1111-111111111111', 'Contemporary designer sarees', 'https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'),
  ('22222222-2222-2222-2222-222222222221', 'Jewellery', 'jewellery', NULL, 'Beautiful traditional and modern jewellery', 'https://images.pexels.com/photos/1120597/pexels-photo-1120597.jpeg'),
  ('22222222-2222-2222-2222-222222222222', 'Rings', 'rings', '22222222-2222-2222-2222-222222222221', 'Elegant rings for all occasions', 'https://images.pexels.com/photos/1120597/pexels-photo-1120597.jpeg'),
  ('22222222-2222-2222-2222-222222222223', 'Chains', 'chains', '22222222-2222-2222-2222-222222222221', 'Gold and silver chains', 'https://images.pexels.com/photos/1120597/pexels-photo-1120597.jpeg'),
  ('22222222-2222-2222-2222-222222222224', 'Earrings', 'earrings', '22222222-2222-2222-2222-222222222221', 'Traditional and modern earrings', 'https://images.pexels.com/photos/1120597/pexels-photo-1120597.jpeg')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Products - Sarees
INSERT INTO products (id, title, slug, codes, sku, category_id, price, mrp, tax_slab, hsn_code, stock, images, description, featured, trending) VALUES
  ('33333333-3333-3333-3333-333333333331', 'Banarasi Silk Saree - Red', 'banarasi-silk-saree-red', ARRAY['BSR001', 'RED-SILK-01'], 'SKU-BSR001', '11111111-1111-1111-1111-111111111112', 8999, 12999, 5, '5407', 15, ARRAY['https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'], 'Luxurious Banarasi silk saree in rich red color with traditional golden zari work. Perfect for weddings and special occasions.', true, true),
  ('33333333-3333-3333-3333-333333333332', 'Kanjivaram Silk Saree - Blue', 'kanjivaram-silk-saree-blue', ARRAY['KSB002', 'BLUE-SILK-02'], 'SKU-KSB002', '11111111-1111-1111-1111-111111111112', 9999, 14999, 5, '5407', 12, ARRAY['https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'], 'Authentic Kanjivaram silk saree with intricate temple border design in royal blue.', true, true),
  ('33333333-3333-3333-3333-333333333333', 'Cotton Saree - Yellow', 'cotton-saree-yellow', ARRAY['CTY003', 'YELLOW-COT-03'], 'SKU-CTY003', '11111111-1111-1111-1111-111111111113', 1499, 2499, 5, '5208', 25, ARRAY['https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'], 'Comfortable pure cotton saree in vibrant yellow perfect for daily wear.', false, false),
  ('33333333-3333-3333-3333-333333333334', 'Designer Georgette Saree - Pink', 'designer-georgette-saree-pink', ARRAY['DGP004', 'PINK-GEO-04'], 'SKU-DGP004', '11111111-1111-1111-1111-111111111114', 4999, 7999, 5, '5407', 18, ARRAY['https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'], 'Contemporary designer saree in georgette with embroidery and sequin work.', true, false),
  ('33333333-3333-3333-3333-333333333335', 'Chanderi Silk Saree - Green', 'chanderi-silk-saree-green', ARRAY['CSG005', 'GREEN-CHA-05'], 'SKU-CSG005', '11111111-1111-1111-1111-111111111112', 6499, 9999, 5, '5407', 10, ARRAY['https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'], 'Elegant Chanderi silk saree in fresh green with traditional motifs.', false, true),
  ('33333333-3333-3333-3333-333333333336', 'Cotton Handloom Saree - White', 'cotton-handloom-saree-white', ARRAY['CHW006', 'WHITE-COT-06'], 'SKU-CHW006', '11111111-1111-1111-1111-111111111113', 2999, 4999, 5, '5208', 20, ARRAY['https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'], 'Pure handloom cotton saree in pristine white with contrast border.', false, false),
  ('33333333-3333-3333-3333-333333333337', 'Tussar Silk Saree - Orange', 'tussar-silk-saree-orange', ARRAY['TSO007', 'ORANGE-TUS-07'], 'SKU-TSO007', '11111111-1111-1111-1111-111111111112', 7499, 10999, 5, '5407', 8, ARRAY['https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'], 'Natural tussar silk saree in warm orange with hand-painted designs.', true, true),
  ('33333333-3333-3333-3333-333333333338', 'Bandhani Saree - Purple', 'bandhani-saree-purple', ARRAY['BDP008', 'PURPLE-BAN-08'], 'SKU-BDP008', '11111111-1111-1111-1111-111111111114', 3999, 5999, 5, '5407', 15, ARRAY['https://images.pexels.com/photos/1134282/pexels-photo-1134282.jpeg'], 'Traditional Rajasthani bandhani saree in royal purple.', false, false)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Products - Jewellery
INSERT INTO products (id, title, slug, codes, sku, category_id, price, mrp, tax_slab, hsn_code, stock, images, description, featured, trending) VALUES
  ('44444444-4444-4444-4444-444444444441', 'Gold Plated Ring - Floral Design', 'gold-plated-ring-floral', ARRAY['GPR001', 'RING-FLO-01'], 'SKU-GPR001', '22222222-2222-2222-2222-222222222222', 1299, 1999, 3, '7113', 30, ARRAY['https://images.pexels.com/photos/1120597/pexels-photo-1120597.jpeg'], 'Beautiful gold plated ring with intricate floral design.', true, true),
  ('44444444-4444-4444-4444-444444444442', 'Silver Chain - Classic', 'silver-chain-classic', ARRAY['SCC002', 'CHAIN-CLA-02'], 'SKU-SCC002', '22222222-2222-2222-2222-222222222223', 2499, 3499, 3, '7113', 25, ARRAY['https://images.pexels.com/photos/1120597/pexels-photo-1120597.jpeg'], 'Pure silver chain with classic design, adjustable length.', true, false),
  ('44444444-4444-4444-4444-444444444443', 'Diamond Earrings - Stud', 'diamond-earrings-stud', ARRAY['DES003', 'EAR-STU-03'], 'SKU-DES003', '22222222-2222-2222-2222-222222222224', 5999, 8999, 3, '7113', 12, ARRAY['https://images.pexels.com/photos/1120597/pexels-photo-1120597.jpeg'], 'Elegant diamond stud earrings perfect for daily wear.', true, true),
  ('44444444-4444-4444-4444-444444444444', 'Gold Chain - Delicate', 'gold-chain-delicate', ARRAY['GCD004', 'CHAIN-DEL-04'], 'SKU-GCD004', '22222222-2222-2222-2222-222222222223', 4999, 6999, 3, '7113', 18, ARRAY['https://images.pexels.com/photos/1120597/pexels-photo-1120597.jpeg'], 'Delicate gold chain suitable for pendants and everyday elegance.', false, false),
  ('44444444-4444-4444-4444-444444444445', 'Temple Jewellery Ring', 'temple-jewellery-ring', ARRAY['TJR005', 'RING-TEM-05'], 'SKU-TJR005', '22222222-2222-2222-2222-222222222222', 1899, 2999, 3, '7113', 22, ARRAY['https://images.pexels.com/photos/1120597/pexels-photo-1120597.jpeg'], 'Traditional South Indian temple jewellery style ring.', false, false)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Coupons
INSERT INTO coupons (code, type, value, min_order, max_discount, active, valid_to) VALUES
  ('WELCOME10', 'percentage', 10, 0, 1000, true, '2099-12-31 23:59:59+00'),
  ('FIRST500', 'fixed', 500, 2000, NULL, true, '2099-12-31 23:59:59+00'),
  ('SAREE15', 'percentage', 15, 5000, 2000, true, '2099-12-31 23:59:59+00'),
  ('FESTIVE20', 'percentage', 20, 10000, 3000, true, '2099-12-31 23:59:59+00')
ON CONFLICT (code) DO NOTHING;