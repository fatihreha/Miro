-- Migration: Add multi-photo support to users table
-- Created: 2024-12-19
-- Description: Adds photos array column for multi-photo profile support

BEGIN;

-- Add photos column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Create GIN index for array search performance
CREATE INDEX IF NOT EXISTS idx_users_photos 
ON public.users USING GIN (photos);

-- Migrate existing avatar_url values to photos array
-- Only update if photos is empty/null and avatar_url exists
UPDATE public.users 
SET photos = ARRAY[avatar_url]
WHERE avatar_url IS NOT NULL 
  AND avatar_url != ''
  AND (photos IS NULL OR array_length(photos, 1) IS NULL OR array_length(photos, 1) = 0);

-- Add comment for documentation
COMMENT ON COLUMN public.users.photos IS 'Array of profile photo URLs. First photo is the main profile picture (avatar_url).';

COMMIT;
