-- ============================================
-- AI USAGE TRACKING TABLE
-- Purpose: Rate limiting for Edge Function AI requests
-- ============================================

CREATE TABLE IF NOT EXISTS ai_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  request_count INTEGER DEFAULT 0,
  last_reset TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_usage' 
    AND policyname = 'Users can view own AI usage'
  ) THEN
    CREATE POLICY "Users can view own AI usage"
    ON ai_usage FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Edge Function can update (SECURITY DEFINER)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_usage' 
    AND policyname = 'Service role can manage AI usage'
  ) THEN
    CREATE POLICY "Service role can manage AI usage"
    ON ai_usage FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');
  END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_last_reset ON ai_usage(last_reset);

COMMENT ON TABLE ai_usage IS 'Tracks AI API usage per user for rate limiting (100 requests/day)';
