-- ============================================
-- SPORTPULSE PRODUCTION-READY DATABASE CONSTRAINTS
-- Migration: 20241206_production_ready_constraints
-- Purpose: Add critical constraints, indexes, and RPC functions for production safety
-- ============================================

-- ============================================
-- CLEANUP: Remove existing constraints if they exist
-- ============================================

-- Drop existing constraints
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS unique_trainer_datetime;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS valid_booking_status;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS valid_payment_status;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS valid_match_status;
ALTER TABLE swipes DROP CONSTRAINT IF EXISTS unique_swipe_pair;
ALTER TABLE swipes DROP CONSTRAINT IF EXISTS valid_swipe_action;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS valid_message_type;
ALTER TABLE payout_requests DROP CONSTRAINT IF EXISTS valid_payout_status;
ALTER TABLE trainer_earnings DROP CONSTRAINT IF EXISTS positive_balances;
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_user_status;

-- Drop existing indexes
DROP INDEX IF EXISTS unique_match_pair;
DROP INDEX IF EXISTS idx_bookings_user_date;
DROP INDEX IF EXISTS idx_bookings_trainer_date;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_matches_user1;
DROP INDEX IF EXISTS idx_matches_user2;
DROP INDEX IF EXISTS idx_swipes_swiped;
DROP INDEX IF EXISTS idx_payout_requests_trainer_status;
DROP INDEX IF EXISTS idx_messages_conversation;
DROP INDEX IF EXISTS idx_messages_unread;
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_location;
DROP INDEX IF EXISTS idx_users_premium;
DROP INDEX IF EXISTS idx_trainers_rating;
DROP INDEX IF EXISTS idx_messages_recipient_created;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
DROP POLICY IF EXISTS "Users can view own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can create own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Trainers can view own payouts" ON payout_requests;
DROP POLICY IF EXISTS "Trainers can create own payouts" ON payout_requests;

-- ============================================
-- 1. BOOKING CONSTRAINTS (Prevent Double Booking)
-- ============================================

-- Add status and payment_status columns if not exist
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add unique constraint to prevent double bookings
ALTER TABLE bookings 
ADD CONSTRAINT unique_trainer_datetime 
UNIQUE (trainer_id, scheduled_date, scheduled_time);

-- Add check constraint for valid booking status
ALTER TABLE bookings 
ADD CONSTRAINT valid_booking_status 
CHECK (status IN ('pending', 'upcoming', 'confirmed', 'completed', 'cancelled'));

-- Add check constraint for valid payment status
ALTER TABLE bookings 
ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));

-- Index for faster booking lookups
CREATE INDEX IF NOT EXISTS idx_bookings_user_date 
ON bookings(user_id, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_trainer_date 
ON bookings(trainer_id, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_status 
ON bookings(status) WHERE status IN ('pending', 'upcoming', 'confirmed');

-- ============================================
-- 2. MATCH CONSTRAINTS (Prevent Duplicate Matches)
-- ============================================

-- Add status column if not exists (needed for constraint)
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add check constraint for valid match status
ALTER TABLE matches 
ADD CONSTRAINT valid_match_status 
CHECK (status IN ('active', 'blocked', 'unmatched'));

-- Ensure unique matches (order-independent)
CREATE UNIQUE INDEX IF NOT EXISTS unique_match_pair 
ON matches (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
WHERE status = 'active';

-- Index for faster match lookups
CREATE INDEX IF NOT EXISTS idx_matches_user1 
ON matches(user1_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_matches_user2 
ON matches(user2_id) WHERE status = 'active';

-- ============================================
-- 3. SWIPE CONSTRAINTS (Prevent Duplicate Swipes)
-- ============================================

-- Add action column if not exists
ALTER TABLE swipes 
ADD COLUMN IF NOT EXISTS action TEXT DEFAULT 'like';

-- Ensure each user can only swipe another user once
ALTER TABLE swipes 
ADD CONSTRAINT unique_swipe_pair 
UNIQUE (swiper_id, swiped_id);

-- Add check constraint for valid swipe action
ALTER TABLE swipes 
ADD CONSTRAINT valid_swipe_action 
CHECK (action IN ('like', 'pass', 'superlike'));

-- Index for faster swipe lookups
CREATE INDEX IF NOT EXISTS idx_swipes_swiped 
ON swipes(swiped_id, swiper_id, action);

-- ============================================
-- 3B. SWIPE RATE LIMITING (Server-Side Protection)
-- ============================================

-- Function to check swipe rate limit (prevent client-side bypass)
CREATE OR REPLACE FUNCTION check_swipe_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_swipes INT;
  user_is_premium BOOLEAN;
BEGIN
  -- Check if user is premium (unlimited swipes)
  SELECT is_premium INTO user_is_premium
  FROM users
  WHERE id = NEW.swiper_id;
  
  IF user_is_premium THEN
    RETURN NEW; -- Allow unlimited for premium
  END IF;
  
  -- Count swipes in last minute for free users
  SELECT COUNT(*) INTO recent_swipes
  FROM swipes
  WHERE swiper_id = NEW.swiper_id
    AND created_at > NOW() - INTERVAL '1 minute';
  
  IF recent_swipes >= 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded: 100 swipes per minute. Please slow down or upgrade to Premium.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for swipe rate limiting
DROP TRIGGER IF EXISTS swipe_rate_limit_trigger ON swipes;
CREATE TRIGGER swipe_rate_limit_trigger
  BEFORE INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION check_swipe_rate_limit();

-- ============================================
-- 4. PAYOUT CONSTRAINTS (Escrow Safety)
-- ============================================

-- Add columns for escrow pattern
ALTER TABLE trainer_earnings 
ADD COLUMN IF NOT EXISTS held_balance DECIMAL(10, 2) DEFAULT 0 CHECK (held_balance >= 0);

-- Add positive balances constraint (check if available_balance column exists first)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'trainer_earnings' AND column_name = 'available_balance') THEN
    ALTER TABLE trainer_earnings 
    ADD CONSTRAINT positive_balances CHECK (available_balance >= 0 AND held_balance >= 0);
  END IF;
END $$;

-- Add status column to payout_requests if not exists
ALTER TABLE payout_requests 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add check constraint for valid payout status
ALTER TABLE payout_requests 
ADD CONSTRAINT valid_payout_status 
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Index for faster payout lookups
CREATE INDEX IF NOT EXISTS idx_payout_requests_trainer_status 
ON payout_requests(trainer_id, status, requested_at DESC);

-- ============================================
-- 5. MESSAGE CONSTRAINTS (Prevent Spam)
-- ============================================

-- Add message_type column if not exists
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

-- Add check constraint for valid message type
ALTER TABLE messages 
ADD CONSTRAINT valid_message_type 
CHECK (message_type IN ('text', 'image', 'invite', 'ai_plan'));

-- Index for faster message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
ON messages(sender_id, recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(recipient_id, is_read) WHERE is_read = false;

-- ============================================
-- 6. USER CONSTRAINTS
-- ============================================

-- Add check constraint for valid user status
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD CONSTRAINT valid_user_status 
CHECK (status IN ('active', 'suspended', 'banned', 'deleted'));

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_users_status 
ON users(status) WHERE status = 'active';

-- ============================================
-- 7. RPC FUNCTIONS FOR ATOMIC OPERATIONS
-- ============================================

-- Function to decrement daily swipes (server-side)
CREATE OR REPLACE FUNCTION decrement_daily_swipes(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET daily_swipes = GREATEST(daily_swipes - 1, 0)
  WHERE id = user_id AND is_premium = false;
END;
$$;

-- Function to create match if not exists (handles race conditions)
CREATE OR REPLACE FUNCTION create_match_if_not_exists(
  p_user1_id UUID,
  p_user2_id UUID
)
RETURNS TABLE (
  id UUID,
  user1_id UUID,
  user2_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match_id UUID;
  v_min_user_id UUID;
  v_max_user_id UUID;
BEGIN
  -- Order user IDs consistently
  v_min_user_id := LEAST(p_user1_id, p_user2_id);
  v_max_user_id := GREATEST(p_user1_id, p_user2_id);
  
  -- Try to insert, ignore if exists due to unique constraint
  INSERT INTO matches (user1_id, user2_id, status, created_at)
  VALUES (v_min_user_id, v_max_user_id, 'active', NOW())
  ON CONFLICT (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
  WHERE status = 'active'
  DO NOTHING
  RETURNING matches.id INTO v_match_id;
  
  -- Return the match (either newly created or existing)
  RETURN QUERY
  SELECT m.id, m.user1_id, m.user2_id, m.created_at, m.status
  FROM matches m
  WHERE (m.user1_id = v_min_user_id AND m.user2_id = v_max_user_id)
     OR (m.user1_id = v_max_user_id AND m.user2_id = v_min_user_id)
  AND m.status = 'active'
  LIMIT 1;
END;
$$;

-- Function to hold balance for payout (escrow)
CREATE OR REPLACE FUNCTION hold_balance_for_payout(
  p_trainer_id UUID,
  p_amount DECIMAL,
  p_payout_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomic operation: move from available to held
  UPDATE trainer_earnings
  SET 
    available_balance = available_balance - p_amount,
    held_balance = held_balance + p_amount
  WHERE trainer_id = p_trainer_id
    AND available_balance >= p_amount;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or trainer not found';
  END IF;
END;
$$;

-- Function to release held balance (on payout success)
CREATE OR REPLACE FUNCTION release_held_balance(p_payout_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trainer_id UUID;
  v_amount DECIMAL;
BEGIN
  -- Get payout details
  SELECT trainer_id, amount INTO v_trainer_id, v_amount
  FROM payout_requests
  WHERE id = p_payout_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout request not found';
  END IF;
  
  -- Deduct from held balance (money is paid out)
  UPDATE trainer_earnings
  SET held_balance = held_balance - v_amount
  WHERE trainer_id = v_trainer_id;
END;
$$;

-- Function to return held balance (on payout failure)
CREATE OR REPLACE FUNCTION return_held_balance(p_payout_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trainer_id UUID;
  v_amount DECIMAL;
BEGIN
  -- Get payout details
  SELECT trainer_id, amount INTO v_trainer_id, v_amount
  FROM payout_requests
  WHERE id = p_payout_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout request not found';
  END IF;
  
  -- Return from held to available
  UPDATE trainer_earnings
  SET 
    held_balance = held_balance - v_amount,
    available_balance = available_balance + v_amount
  WHERE trainer_id = v_trainer_id;
END;
$$;

-- ============================================
-- 8. TRIGGERS FOR AUTOMATIC SWIPE RESET
-- ============================================

-- Function to reset daily swipes at midnight
CREATE OR REPLACE FUNCTION reset_daily_swipes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET 
    daily_swipes = 10,
    last_swipe_reset = CURRENT_DATE
  WHERE 
    is_premium = false
    AND (last_swipe_reset IS NULL OR last_swipe_reset < CURRENT_DATE);
END;
$$;

-- ============================================
-- IMPORTANT: CRON JOB SETUP INSTRUCTIONS
-- ============================================
-- Supabase doesn't support pg_cron by default. You have two options:
--
-- OPTION 1: Enable pg_cron extension (if your Supabase plan supports it)
--   1. Go to Database → Extensions in Supabase Dashboard
--   2. Enable 'pg_cron' extension
--   3. Run: SELECT cron.schedule('reset-daily-swipes', '0 0 * * *', $$SELECT reset_daily_swipes()$$);
--
-- OPTION 2: Use Supabase Edge Functions (recommended)
--   1. Create an Edge Function that calls reset_daily_swipes()
--   2. Set up a cron trigger via Supabase Dashboard or external service (e.g., GitHub Actions, Vercel Cron)
--   3. Example Edge Function code in /supabase/functions/reset-swipes/index.ts:
--      ```typescript
--      import { createClient } from '@supabase/supabase-js'
--      Deno.serve(async (req) => {
--        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
--        const { error } = await supabase.rpc('reset_daily_swipes')
--        return new Response(JSON.stringify({ success: !error, error }), { headers: { 'Content-Type': 'application/json' } })
--      })
--      ```
-- ============================================

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on critical tables if not already enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Bookings: Users can only see their own bookings or bookings for their trainer profile
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = trainer_id);

CREATE POLICY "Users can create own bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Matches: Users can only see matches they're part of
CREATE POLICY "Users can view own matches"
ON matches FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Swipes: Users can only see their own swipes
CREATE POLICY "Users can view own swipes"
ON swipes FOR SELECT
USING (auth.uid() = swiper_id);

CREATE POLICY "Users can create own swipes"
ON swipes FOR INSERT
WITH CHECK (auth.uid() = swiper_id);

-- Messages: Users can see messages they sent or received
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Payout requests: Trainers can only see their own payouts
CREATE POLICY "Trainers can view own payouts"
ON payout_requests FOR SELECT
USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can create own payouts"
ON payout_requests FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

-- ============================================
-- 10. PERFORMANCE INDEXES
-- ============================================

-- Composite indexes for common queries
-- Location index (for text-based location search)
CREATE INDEX IF NOT EXISTS idx_users_location 
ON users(location) WHERE status = 'active' AND location IS NOT NULL;

-- If location is geography/geometry type, uncomment this instead:
-- CREATE INDEX IF NOT EXISTS idx_users_location 
-- ON users USING gist(location) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_users_premium 
ON users(is_premium, status);

CREATE INDEX IF NOT EXISTS idx_trainers_rating 
ON trainers(rating DESC) WHERE rating >= 4.0;

CREATE INDEX IF NOT EXISTS idx_messages_recipient_created 
ON messages(recipient_id, created_at DESC) WHERE is_read = false;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Add comments for documentation
COMMENT ON TABLE bookings IS 'Booking table with double-booking prevention via unique constraint';
COMMENT ON TABLE matches IS 'Match table with duplicate prevention via unique index';
COMMENT ON TABLE swipes IS 'Swipe table with duplicate prevention via unique constraint';
COMMENT ON TABLE payout_requests IS 'Payout requests with escrow pattern support';

-- ============================================
-- 11. KVKK/GDPR COMPLIANCE - USER DATA DELETION
-- ============================================

-- Function to completely delete user and all related data
CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete in correct order to respect foreign key constraints
  -- 1. Messages (sent and received)
  DELETE FROM messages WHERE sender_id = p_user_id OR recipient_id = p_user_id;
  
  -- 2. Matches (both directions)
  DELETE FROM matches WHERE user1_id = p_user_id OR user2_id = p_user_id;
  
  -- 3. Swipes (given and received)
  DELETE FROM swipes WHERE swiper_id = p_user_id OR swiped_id = p_user_id;
  
  -- 4. Workout requests (sent and received)
  DELETE FROM workout_requests WHERE from_user_id = p_user_id OR to_user_id = p_user_id;
  
  -- 5. Bookings (as user or trainer)
  DELETE FROM bookings WHERE user_id = p_user_id OR trainer_id = p_user_id;
  
  -- 6. Trainer-specific data
  DELETE FROM trainer_earnings WHERE trainer_id = p_user_id;
  DELETE FROM payout_requests WHERE trainer_id = p_user_id;
  DELETE FROM trainers WHERE user_id = p_user_id;
  
  -- 7. Club memberships
  DELETE FROM club_members WHERE user_id = p_user_id;
  
  -- 8. Event participation
  DELETE FROM event_participants WHERE user_id = p_user_id;
  
  -- 9. User profile (soft delete by marking as deleted)
  UPDATE users 
  SET 
    status = 'deleted',
    email = CONCAT('deleted_', id, '@deleted.local'),
    name = 'Deleted User',
    bio = NULL,
    avatar_url = NULL,
    location = NULL,
    latitude = NULL,
    longitude = NULL,
    interests = ARRAY[]::TEXT[],
    phone = NULL,
    deleted_at = NOW()
  WHERE id = p_user_id;
  
  -- 10. Delete from auth.users (Supabase Auth)
  -- NOTE: This requires admin privileges, run separately if needed
  -- DELETE FROM auth.users WHERE id = p_user_id;
  
  RAISE NOTICE 'User data deleted for user_id: %', p_user_id;
END;
$$;

-- Add deleted_at column to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Index for deleted users
CREATE INDEX IF NOT EXISTS idx_users_deleted 
ON users(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON FUNCTION delete_user_data IS 'KVKK/GDPR compliance: Completely removes user data while maintaining referential integrity';

-- Migration completed successfully: 20241206_production_ready_constraints
