-- Production Ready Complete Migration
-- SportPulse v1.0 Production Release
-- Run in Supabase SQL Editor

-- ============================================
-- 1. PUSH TOKENS TABLE (for FCM/APNS)
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
    device_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_tokens(user_id);

-- RLS for push_tokens
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push tokens" ON public.push_tokens
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 2. USER STATUS & PRESENCE FIELDS
-- ============================================
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_online ON public.users(id) WHERE is_online = true;

-- ============================================
-- 3. DOUBLE BOOKING PREVENTION
-- ============================================
ALTER TABLE public.bookings 
    DROP CONSTRAINT IF EXISTS unique_trainer_datetime;

ALTER TABLE public.bookings 
    ADD CONSTRAINT unique_trainer_datetime 
    UNIQUE (trainer_id, scheduled_date, scheduled_time);

ALTER TABLE public.bookings 
    DROP CONSTRAINT IF EXISTS valid_booking_status;

ALTER TABLE public.bookings 
    ADD CONSTRAINT valid_booking_status 
    CHECK (status IN ('upcoming', 'completed', 'cancelled', 'no_show'));

-- ============================================
-- 4. DUPLICATE MATCH PREVENTION
-- ============================================
-- Create function to get ordered user pair
CREATE OR REPLACE FUNCTION get_ordered_user_pair(user1 UUID, user2 UUID) 
RETURNS TEXT AS $$
BEGIN
    IF user1 < user2 THEN
        RETURN user1::TEXT || '_' || user2::TEXT;
    ELSE
        RETURN user2::TEXT || '_' || user1::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed column for unique match pair
ALTER TABLE public.matches 
    ADD COLUMN IF NOT EXISTS match_pair TEXT GENERATED ALWAYS AS (get_ordered_user_pair(user1_id, user2_id)) STORED;

-- Create unique index on match_pair
CREATE UNIQUE INDEX IF NOT EXISTS unique_match_pair ON public.matches(match_pair);

-- ============================================
-- 5. SWIPE SYSTEM VALIDATION
-- ============================================
ALTER TABLE public.swipes 
    DROP CONSTRAINT IF EXISTS unique_swipe_pair;

ALTER TABLE public.swipes 
    ADD CONSTRAINT unique_swipe_pair 
    UNIQUE (swiper_id, swiped_id);

-- Add daily swipe tracking to users
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS daily_swipes_remaining INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS last_swipe_reset DATE DEFAULT CURRENT_DATE;

-- Function to decrement and validate swipes
-- DROP FIRST TO AVOID RETURN TYPE CONFLICT
DROP FUNCTION IF EXISTS decrement_daily_swipes(uuid);

CREATE OR REPLACE FUNCTION decrement_daily_swipes(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_premium BOOLEAN;
    v_swipes_remaining INTEGER;
    v_last_reset DATE;
BEGIN
    -- Get user info
    SELECT is_premium, daily_swipes_remaining, last_swipe_reset
    INTO v_is_premium, v_swipes_remaining, v_last_reset
    FROM users WHERE id = p_user_id;
    
    -- Premium users have unlimited swipes
    IF v_is_premium THEN
        RETURN TRUE;
    END IF;
    
    -- Reset if new day
    IF v_last_reset < CURRENT_DATE THEN
        UPDATE users 
        SET daily_swipes_remaining = 10, last_swipe_reset = CURRENT_DATE
        WHERE id = p_user_id;
        RETURN TRUE;
    END IF;
    
    -- Check remaining swipes
    IF v_swipes_remaining <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Decrement
    UPDATE users 
    SET daily_swipes_remaining = daily_swipes_remaining - 1
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. MATCH CREATION WITH RACE CONDITION HANDLING
-- ============================================
DROP FUNCTION IF EXISTS create_match_if_not_exists(uuid, uuid);

CREATE OR REPLACE FUNCTION create_match_if_not_exists(p_user1 UUID, p_user2 UUID)
RETURNS UUID AS $$
DECLARE
    v_match_id UUID;
    v_match_pair TEXT;
BEGIN
    -- Get ordered pair
    v_match_pair := get_ordered_user_pair(p_user1, p_user2);
    
    -- Try to find existing match
    SELECT id INTO v_match_id FROM matches WHERE match_pair = v_match_pair;
    
    IF v_match_id IS NOT NULL THEN
        RETURN v_match_id;
    END IF;
    
    -- Create new match with conflict handling
    INSERT INTO matches (user1_id, user2_id, matched_at, is_active)
    VALUES (
        CASE WHEN p_user1 < p_user2 THEN p_user1 ELSE p_user2 END,
        CASE WHEN p_user1 < p_user2 THEN p_user2 ELSE p_user1 END,
        NOW(),
        TRUE
    )
    ON CONFLICT (match_pair) DO NOTHING
    RETURNING id INTO v_match_id;
    
    -- If insert failed due to conflict, get existing
    IF v_match_id IS NULL THEN
        SELECT id INTO v_match_id FROM matches WHERE match_pair = v_match_pair;
    END IF;
    
    RETURN v_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. MESSAGE SAFETY & DELIVERY
-- ============================================
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sending', 'sent', 'delivered', 'read', 'failed'));

CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(recipient_id, is_read) WHERE is_read = false;

-- ============================================
-- 8. PAYOUT ESCROW PATTERN
-- ============================================
ALTER TABLE public.trainers
    ADD COLUMN IF NOT EXISTS available_balance DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS held_balance DECIMAL(10,2) DEFAULT 0.00;

-- Create payouts table if not exists
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES public.trainers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payout_method TEXT DEFAULT 'bank_transfer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    failure_reason TEXT
);

-- Hold balance for payout
DROP FUNCTION IF EXISTS hold_balance_for_payout(uuid, numeric, text);

CREATE OR REPLACE FUNCTION hold_balance_for_payout(
    p_trainer_id UUID,
    p_amount DECIMAL,
    p_payout_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_available DECIMAL;
BEGIN
    -- Get current balance
    SELECT available_balance INTO v_available FROM trainers WHERE id = p_trainer_id FOR UPDATE;
    
    IF v_available < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Move from available to held
    UPDATE trainers 
    SET available_balance = available_balance - p_amount,
        held_balance = held_balance + p_amount
    WHERE id = p_trainer_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release held balance (payout successful)
DROP FUNCTION IF EXISTS release_held_balance(text);

CREATE OR REPLACE FUNCTION release_held_balance(p_payout_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_trainer_id UUID;
    v_amount DECIMAL;
BEGIN
    SELECT trainer_id, amount INTO v_trainer_id, v_amount 
    FROM payouts WHERE id::TEXT = p_payout_id;
    
    IF v_trainer_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Remove from held balance
    UPDATE trainers 
    SET held_balance = held_balance - v_amount
    WHERE id = v_trainer_id;
    
    -- Update payout status
    UPDATE payouts SET status = 'completed', processed_at = NOW()
    WHERE id::TEXT = p_payout_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Return held balance (payout failed)
DROP FUNCTION IF EXISTS return_held_balance(text);

CREATE OR REPLACE FUNCTION return_held_balance(p_payout_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_trainer_id UUID;
    v_amount DECIMAL;
BEGIN
    SELECT trainer_id, amount INTO v_trainer_id, v_amount 
    FROM payouts WHERE id::TEXT = p_payout_id;
    
    IF v_trainer_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Return from held to available
    UPDATE trainers 
    SET held_balance = held_balance - v_amount,
        available_balance = available_balance + v_amount
    WHERE id = v_trainer_id;
    
    -- Update payout status
    UPDATE payouts SET status = 'failed'
    WHERE id::TEXT = p_payout_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. DAILY SWIPE RESET FUNCTION (for pg_cron)
-- ============================================
CREATE OR REPLACE FUNCTION reset_daily_swipes()
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET daily_swipes_remaining = 10, 
        last_swipe_reset = CURRENT_DATE
    WHERE is_premium = false 
      AND last_swipe_reset < CURRENT_DATE;
    
    RAISE NOTICE 'Daily swipes reset completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. PUSH NOTIFICATION TRIGGER
-- ============================================
-- Function to call edge function on new message
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_name TEXT;
BEGIN
    -- Get sender name
    SELECT name INTO v_sender_name FROM users WHERE id = NEW.sender_id;
    
    -- Call edge function via pg_net (if available)
    -- Note: This requires pg_net extension or can be done via webhook
    PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body := jsonb_build_object(
            'userId', NEW.recipient_id,
            'title', v_sender_name || ' messaged you',
            'body', LEFT(NEW.content, 100),
            'data', jsonb_build_object(
                'type', 'message',
                'senderId', NEW.sender_id,
                'messageId', NEW.id
            )
        )
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Push notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Trigger creation commented out - requires pg_net extension
-- CREATE TRIGGER trigger_notify_on_message
--     AFTER INSERT ON messages
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_on_new_message();

-- ============================================
-- 11. RLS POLICIES
-- ============================================

-- Bookings RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own bookings" ON public.bookings;
CREATE POLICY "Users see own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id OR trainer_id IN (
        SELECT id FROM trainers WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
CREATE POLICY "Users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matches RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own matches" ON public.matches;
CREATE POLICY "Users see own matches" ON public.matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own messages" ON public.messages;
CREATE POLICY "Users see own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Payouts RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers see own payouts" ON public.payouts;
CREATE POLICY "Trainers see own payouts" ON public.payouts
    FOR SELECT USING (trainer_id IN (
        SELECT id FROM trainers WHERE user_id = auth.uid()
    ));

-- ============================================
-- 12. COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Production migration completed successfully!';
    RAISE NOTICE 'Applied: Push tokens, User status, Double booking prevention, Match validation, Swipe limits, Payout escrow, RLS policies';
END
$$;
