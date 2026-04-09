-- Add last_fetched_at column to track when game data was last updated from Roblox API
-- Created: 2026-04-09

ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_fetched_at TIMESTAMPTZ DEFAULT NOW();

-- Index for finding posts that need updating (older than 1 minute)
CREATE INDEX IF NOT EXISTS idx_posts_last_fetched_at ON posts(last_fetched_at);

COMMENT ON COLUMN posts.last_fetched_at IS 'Last time game data was fetched from Roblox API';
