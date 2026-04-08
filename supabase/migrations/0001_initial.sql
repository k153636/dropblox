-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (synced with Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_id TEXT UNIQUE,
  roblox_id TEXT UNIQUE,
  provider TEXT NOT NULL DEFAULT 'github',
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_one_provider CHECK (
    (github_id IS NOT NULL AND roblox_id IS NULL) OR
    (github_id IS NULL AND roblox_id IS NOT NULL) OR
    (github_id IS NULL AND roblox_id IS NULL)
  )
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  preview_name TEXT,
  preview_description TEXT,
  preview_thumbnail TEXT,
  preview_playing BIGINT DEFAULT 0,
  preview_visits BIGINT DEFAULT 0,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table (nested comments via parent_id)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table (tracking who liked what)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_likes_user ON likes(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone" 
  ON posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" 
  ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own posts" 
  ON posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts" 
  ON posts FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" 
  ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" 
  ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments" 
  ON comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments" 
  ON comments FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for likes
CREATE POLICY "Likes are viewable by everyone" 
  ON likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create likes" 
  ON likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own likes" 
  ON likes FOR DELETE USING (auth.uid() = user_id);
