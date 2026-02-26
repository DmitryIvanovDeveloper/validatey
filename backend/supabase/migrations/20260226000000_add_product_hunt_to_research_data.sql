-- Add product_hunt_data column to research_data for Product Hunt Algolia search results
ALTER TABLE research_data
  ADD COLUMN IF NOT EXISTS product_hunt_data jsonb DEFAULT NULL;

COMMENT ON COLUMN research_data.product_hunt_data IS 'Product Hunt launches from Algolia search: { posts: [{ name, tagline, url, votesCount?, description? }], searchQuery, fetchedAt }';
