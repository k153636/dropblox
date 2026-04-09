-- Add bio column to profiles table
-- Created: 2026-04-09

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- RLS policy already covers: "Users can update own profile"
-- No additional policy needed since UPDATE is already allowed for own profile.

COMMENT ON COLUMN profiles.bio IS 'User self-introduction / bio text';
