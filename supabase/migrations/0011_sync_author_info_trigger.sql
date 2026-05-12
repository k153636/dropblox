CREATE OR REPLACE FUNCTION sync_author_info_to_posts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET author_name = NEW.username,
      author_avatar_url = NEW.avatar_url
  WHERE author_id = NEW.id
    AND (author_name IS DISTINCT FROM NEW.username
      OR author_avatar_url IS DISTINCT FROM NEW.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_author_info_trigger ON profiles;
CREATE TRIGGER sync_author_info_trigger
AFTER UPDATE OF username, avatar_url ON profiles
FOR EACH ROW EXECUTE FUNCTION sync_author_info_to_posts();
