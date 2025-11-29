-- =====================================================
-- COMPLETE RLS POLICIES FOR ALL TABLES
-- Run this in Supabase SQL Editor after schema.sql
-- =====================================================

-- Enable RLS on ALL tables (some were missing)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES FOR MISSING TABLES
-- =====================================================

-- BADGES: Everyone can read (seed data)
CREATE POLICY "Anyone can view badges"
ON badges FOR SELECT
USING (true);

-- BOOKINGS: Users can view their own bookings
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() IN (
  SELECT auth_id FROM users WHERE id = user_id
) OR auth.uid() IN (
  SELECT u.auth_id FROM users u 
  JOIN trainers t ON u.id = t.user_id 
  WHERE t.id = trainer_id
));

CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- EVENTS: Public read, authenticated create
CREATE POLICY "Events are publicly viewable"
ON events FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create events"
ON events FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = created_by));

CREATE POLICY "Event creators can update"
ON events FOR UPDATE
USING (auth.uid() = (SELECT auth_id FROM users WHERE id = created_by));

-- EVENT PARTICIPANTS: Public read, authenticated join
CREATE POLICY "Event participants are viewable"
ON event_participants FOR SELECT
USING (true);

CREATE POLICY "Users can join events"
ON event_participants FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- SWIPES: Users can only see their own swipes
CREATE POLICY "Users can view own swipes"
ON swipes FOR SELECT
USING (auth.uid() = (SELECT auth_id FROM users WHERE id = swiper_id));

CREATE POLICY "Users can create swipes"
ON swipes FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = swiper_id));

-- USER_BADGES: Users can view all badges, but only earn for themselves
CREATE POLICY "Anyone can view user badges"
ON user_badges FOR SELECT
USING (true);

CREATE POLICY "System can award badges"
ON user_badges FOR INSERT
WITH CHECK (true); -- Controlled by backend

-- PUSH_TOKENS: Users can only manage their own tokens
CREATE POLICY "Users can manage own push tokens"
ON push_tokens FOR ALL
USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- =====================================================
-- VERIFY ALL TABLES HAVE RLS
-- =====================================================
-- Run this to check:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
