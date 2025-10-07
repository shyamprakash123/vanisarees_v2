/*
  # Advanced Product Search Function

  ## Overview
  Creates a PostgreSQL function for full-text search with trigram matching

  ## Features
  1. Full-text search on product title, description
  2. Exact and fuzzy matching on product codes using trigram
  3. Relevance-based scoring and ordering
  4. Pagination support

  ## Function Details
  - Name: search_products
  - Parameters: search_query (text), page_num (int), page_size (int)
  - Returns: JSON with results and pagination info
*/

CREATE OR REPLACE FUNCTION search_products(
  search_query text,
  page_num int DEFAULT 1,
  page_size int DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
  total_count int;
  offset_val int;
BEGIN
  offset_val := (page_num - 1) * page_size;

  WITH search_results AS (
    SELECT
      id,
      title,
      slug,
      price,
      mrp,
      images,
      stock,
      CASE
        WHEN lower(title) = lower(search_query) THEN 100
        WHEN title ILIKE search_query || '%' THEN 90
        WHEN title ILIKE '%' || search_query || '%' THEN 70
        WHEN search_query = ANY(codes) THEN 95
        WHEN EXISTS (
          SELECT 1 FROM unnest(codes) AS code
          WHERE similarity(code, search_query) > 0.3
        ) THEN 60
        WHEN description ILIKE '%' || search_query || '%' THEN 50
        ELSE 40
      END AS relevance_score
    FROM products
    WHERE
      active = true
      AND (
        title ILIKE '%' || search_query || '%'
        OR description ILIKE '%' || search_query || '%'
        OR search_query = ANY(codes)
        OR sku ILIKE '%' || search_query || '%'
        OR EXISTS (
          SELECT 1 FROM unnest(codes) AS code
          WHERE similarity(code, search_query) > 0.3
        )
      )
  ),
  counted AS (
    SELECT COUNT(*) as total FROM search_results
  )
  SELECT jsonb_build_object(
    'results', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'slug', slug,
          'price', price,
          'mrp', mrp,
          'images', images,
          'stock', stock
        )
      )
      FROM (
        SELECT * FROM search_results
        ORDER BY relevance_score DESC, created_at DESC
        LIMIT page_size
        OFFSET offset_val
      ) limited_results
    ),
    'total_count', (SELECT total FROM counted),
    'total_pages', CEIL((SELECT total FROM counted)::decimal / page_size),
    'current_page', page_num
  ) INTO result;

  RETURN result;
END;
$$;