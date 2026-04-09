-- Add missing INSERT policy for profiles table
-- Users must be authenticated and can only create their own profile (id = auth.uid())
-- Created: 2026-04-09

-- Drop if exists to be idempotent
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
