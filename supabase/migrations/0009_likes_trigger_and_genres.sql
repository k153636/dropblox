-- Trigger to maintain posts.likes counter in sync with likes table
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes = likes + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS likes_count_trigger ON likes;
CREATE TRIGGER likes_count_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Backfill: sync posts.likes with actual counts
UPDATE posts
SET likes = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id);

-- Efficient genre aggregation via GROUP BY (replaces JS full-table scan)
CREATE OR REPLACE FUNCTION get_distinct_genres(limit_n int DEFAULT 10)
RETURNS TABLE(genre text, post_count bigint) AS $$
  SELECT preview_genre::text AS genre, COUNT(*) AS post_count
  FROM posts
  WHERE preview_genre IS NOT NULL AND preview_genre <> ''
  GROUP BY preview_genre
  ORDER BY post_count DESC
  LIMIT limit_n;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
