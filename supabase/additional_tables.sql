-- Additional Tables for SportPulse
-- Run this after schema.sql

-- ============================================
-- LOCATIONS (Map Venues/Places)
-- ============================================
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('gym', 'court', 'park', 'pool', 'route', 'stadium')),
  coordinates JSONB NOT NULL DEFAULT '{"x": 50, "y": 50}',
  rating DECIMAL(2,1) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  description TEXT,
  image TEXT,
  verified BOOLEAN DEFAULT FALSE,
  is_sponsored BOOLEAN DEFAULT FALSE,
  address TEXT,
  contact TEXT,
  website TEXT,
  hours TEXT,
  tags TEXT[],
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Policies for locations
CREATE POLICY "Locations are publicly viewable" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create locations" ON public.locations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update their locations" ON public.locations FOR UPDATE USING (
  auth.uid() = (SELECT auth_id FROM public.users WHERE id = created_by)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_rating ON public.locations(rating DESC);

-- ============================================
-- CONTACT MESSAGES (Support/Feedback)
-- ============================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policies for contact messages
CREATE POLICY "Users can create contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own messages" ON public.contact_messages FOR SELECT USING (
  auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id)
);

-- ============================================
-- EVENT ATTENDEES (RSVP System)
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Policies for event attendees
CREATE POLICY "Event attendees are viewable by everyone" ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "Authenticated users can RSVP" ON public.event_attendees FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own RSVP" ON public.event_attendees FOR UPDATE USING (
  auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id)
);
CREATE POLICY "Users can delete their own RSVP" ON public.event_attendees FOR DELETE USING (
  auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON public.event_attendees(user_id);

-- ============================================
-- LOCATION RATINGS (User reviews for locations)
-- ============================================
CREATE TABLE IF NOT EXISTS public.location_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, user_id)
);

-- Enable RLS
ALTER TABLE public.location_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for location ratings
CREATE POLICY "Ratings are publicly viewable" ON public.location_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate" ON public.location_ratings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own rating" ON public.location_ratings FOR UPDATE USING (
  auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id)
);

-- Function to update location average rating
CREATE OR REPLACE FUNCTION update_location_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.locations SET
    rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM public.location_ratings 
      WHERE location_id = COALESCE(NEW.location_id, OLD.location_id)
    ),
    reviews = (
      SELECT COUNT(*) 
      FROM public.location_ratings 
      WHERE location_id = COALESCE(NEW.location_id, OLD.location_id)
    )
  WHERE id = COALESCE(NEW.location_id, OLD.location_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update location rating
DROP TRIGGER IF EXISTS update_location_rating_trigger ON public.location_ratings;
CREATE TRIGGER update_location_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.location_ratings
FOR EACH ROW EXECUTE FUNCTION update_location_rating();

-- ============================================
-- FAQ ITEMS (Optional - for dynamic FAQ)
-- ============================================
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- FAQ is publicly viewable
CREATE POLICY "FAQ items are publicly viewable" ON public.faq_items FOR SELECT USING (is_active = TRUE);

-- Seed some FAQ items
INSERT INTO public.faq_items (question, answer, category, order_index) VALUES
  ('How does the matching algorithm work?', 'Our AI analyzes your sports preferences, skill level, schedule, and location to find compatible workout partners. The more you use the app, the smarter our recommendations become.', 'matching', 1),
  ('Is my location data private?', 'Yes! Your exact location is never shared. We only show approximate distances to potential matches. You control visibility in Privacy Settings.', 'privacy', 2),
  ('What are XP points?', 'XP (Experience Points) are earned by completing workouts, matching with partners, and achieving milestones. Level up to unlock badges and climb the leaderboard!', 'gamification', 3),
  ('How do I become a Pro Trainer?', 'Go to Settings → Become a Pro. Complete verification, set your rates, and start accepting bookings. We take a small platform fee per session.', 'trainers', 4),
  ('What''s included in Premium?', 'Premium unlocks unlimited swipes, advanced filters, see who likes you, monthly profile boosts, and the AI Personal Trainer feature.', 'premium', 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- Add pro_finance column to users if not exists
-- ============================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS pro_finance JSONB DEFAULT '{}';

-- Add pro_finance column description
COMMENT ON COLUMN public.users.pro_finance IS 'Trainer finance settings: { bankName, accountNumber, accountHolder, taxId }';

-- ============================================
-- COUPONS (Discount Codes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  max_uses INTEGER, -- NULL means unlimited
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'premium', 'trainer', 'booking')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Coupons are validated by authenticated users
CREATE POLICY "Authenticated users can validate coupons" ON public.coupons 
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active) WHERE is_active = TRUE;

-- Seed some coupon codes (for influencer partnerships, testing, etc.)
INSERT INTO public.coupons (code, discount_percent, description, applies_to) VALUES
  ('FITPRO100', 100, 'Influencer partnership - 100% off trainer signup', 'trainer'),
  ('PULSE2025', 100, 'Launch promotion - 100% off trainer signup', 'trainer'),
  ('WELCOME20', 20, 'Welcome discount - 20% off first month premium', 'premium'),
  ('TRAINER50', 50, 'Trainer referral - 50% off first booking', 'booking')
ON CONFLICT (code) DO NOTHING;
