-- SportPulse Database Schema for Supabase PostgreSQL
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- for location-based features

-- ============================================
-- USERS TABLE (Core Profile)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  bio TEXT,
  location TEXT,
  location_coords GEOGRAPHY(POINT, 4326), -- for PostGIS queries
  avatar_url TEXT,
  cover_photo_url TEXT,
  interests TEXT[], -- array of sports
  skill_level TEXT CHECK (skill_level IN ('Beginner', 'Intermediate', 'Pro')),
  workout_time_preference TEXT CHECK (workout_time_preference IN ('Morning', 'Evening', 'Anytime')),
  is_pro_trainer BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  xp_points INTEGER DEFAULT 0,
  user_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRAINER PROFILES
-- ============================================
CREATE TABLE public.trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  hourly_rate DECIMAL(10,2),
  specialties TEXT[],
  certifications TEXT[],
  years_experience INTEGER,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.0,
  availability JSONB, -- { "monday": ["09:00", "17:00"], ... }
  bio_trainer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MATCHES (Swipe System)
-- ============================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  compatibility_score INTEGER,
  match_reason TEXT,
  key_factors TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user1_id, user2_id)
);

-- ============================================
-- SWIPES (Like/Pass tracking)
-- ============================================
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  swiped_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('like', 'pass', 'superlike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

-- ============================================
-- MESSAGES (Chat System)
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'invite', 'ai_plan')),
  metadata JSONB, -- for invite details, AI responses, etc.
  is_read BOOLEAN DEFAULT FALSE,
  is_safe BOOLEAN DEFAULT TRUE, -- AI safety check result
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast chat queries
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, recipient_id, created_at);

-- ============================================
-- WORKOUT REQUESTS (Activity Invites)
-- ============================================
CREATE TABLE public.workout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  location TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOOKINGS (Trainer Sessions)
-- ============================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLUBS (Communities)
-- ============================================
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  member_count INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT FALSE,
  rules TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLUB MEMBERS
-- ============================================
CREATE TABLE public.club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- ============================================
-- CLUB JOIN REQUESTS
-- ============================================
CREATE TABLE public.club_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL,
  location TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENT PARTICIPANTS
-- ============================================
CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'pending', 'declined')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- BADGES (Gamification)
-- ============================================
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  requirement TEXT,
  xp_reward INTEGER DEFAULT 0
);

-- ============================================
-- USER BADGES
-- ============================================
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- REPORTS (Safety)
-- ============================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PUSH NOTIFICATION TOKENS
-- ============================================
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('android', 'ios', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users: Can read all public profiles, update only own
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_id);

-- Messages: Only sender/recipient can read
CREATE POLICY "Users can view their own messages" ON public.messages 
  FOR SELECT USING (auth.uid() IN (
    SELECT auth_id FROM public.users WHERE id = sender_id OR id = recipient_id
  ));

CREATE POLICY "Users can send messages" ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = sender_id));

-- Matches: Both users can view
CREATE POLICY "Users can view their matches" ON public.matches 
  FOR SELECT USING (auth.uid() IN (
    SELECT auth_id FROM public.users WHERE id = user1_id OR id = user2_id
  ));

-- Clubs: Public read, members can write
CREATE POLICY "Clubs are publicly viewable" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Club owners can update" ON public.clubs FOR UPDATE USING (
  auth.uid() = (SELECT auth_id FROM public.users WHERE id = owner_id)
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment club member count
CREATE OR REPLACE FUNCTION increment_club_members()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER club_member_added AFTER INSERT ON public.club_members
  FOR EACH ROW EXECUTE FUNCTION increment_club_members();

-- Create match when mutual like
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if other user also liked back
  IF EXISTS (
    SELECT 1 FROM public.swipes 
    WHERE swiper_id = NEW.swiped_id 
    AND swiped_id = NEW.swiper_id 
    AND action = 'like'
  ) AND NEW.action = 'like' THEN
    -- Create match
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (NEW.swiper_id, NEW.swiped_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER match_on_mutual_swipe AFTER INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION create_match_on_mutual_like();

-- ============================================
-- SEED DATA (Optional Badges)
-- ============================================
INSERT INTO public.badges (name, description, icon, xp_reward) VALUES
  ('Early Bird', 'Work out before 7 AM for 7 days straight', '🌅', 100),
  ('Night Owl', 'Train after 10 PM for 7 days straight', '🦉', 100),
  ('Marathon Runner', 'Complete 42 km in total distance', '🏃', 200),
  ('Social Butterfly', 'Match with 10+ people', '🦋', 150),
  ('Trainer''s Pet', 'Book 5 trainer sessions', '⭐', 150),
  ('Club Founder', 'Create and grow a club to 20+ members', '👑', 250);
