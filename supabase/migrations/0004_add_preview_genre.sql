-- Add genre column to posts table
-- Created: 2026-04-09

ALTER TABLE posts ADD COLUMN IF NOT EXISTS preview_genre TEXT DEFAULT '';

-- Index for genre-based queries
CREATE INDEX IF NOT EXISTS idx_posts_genre ON posts(preview_genre);

-- Update search vector to include genre
CREATE OR REPLACE FUNCTION update_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.preview_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.body, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.preview_description, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.preview_genre, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN posts.preview_genre IS 'Game genre from Roblox API';
