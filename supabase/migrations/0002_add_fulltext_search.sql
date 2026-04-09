-- キーワード検索用全文検索インデックス追加
-- Created: 2026-04-09

-- 1. 検索ベクトルカラム追加
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. 既存データの検索ベクトルを更新
UPDATE posts 
SET search_vector = 
  setweight(to_tsvector('simple', COALESCE(preview_name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(body, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(preview_description, '')), 'C')
WHERE search_vector IS NULL;

-- 3. GINインデックス作成（高速検索用）
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_vector);

-- 4. 検索ベクトル自動更新関数
CREATE OR REPLACE FUNCTION update_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple', COALESCE(NEW.preview_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.body, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.preview_description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. トリガー設定（INSERT/UPDATE時に自動更新）
DROP TRIGGER IF EXISTS posts_search_vector_trigger ON posts;
CREATE TRIGGER posts_search_vector_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_search_vector();

-- 6. RPC用検索関数（Supabaseから呼び出し可能）
CREATE OR REPLACE FUNCTION search_posts(query_text TEXT)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM posts
  WHERE search_vector @@ plainto_tsquery('simple', query_text)
  ORDER BY ts_rank(search_vector, plainto_tsquery('simple', query_text)) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. RLSポリシー（検索結果は公開）
-- 既存のpostsポリシーが適用されるため、追加設定不要

COMMENT ON COLUMN posts.search_vector IS '全文検索用のtsvectorデータ';
COMMENT ON FUNCTION search_posts IS 'キーワード検索用RPC関数';
