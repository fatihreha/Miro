-- =====================================================
-- KVKK Privacy & Compliance Database Schema
-- =====================================================
-- Tables for consent management, audit logging, and deletion requests

-- =====================================================
-- 1. USER CONSENTS TABLE
-- =====================================================
-- Tracks user consent preferences for various data processing activities

CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Consent Types
    marketing_consent BOOLEAN DEFAULT FALSE,
    analytics_consent BOOLEAN DEFAULT FALSE,
    location_consent BOOLEAN DEFAULT FALSE,
    third_party_consent BOOLEAN DEFAULT FALSE,
    
    -- Consent Metadata
    consent_given_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consent_withdrawn_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_created_at ON user_consents(created_at DESC);

-- RLS Policies
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Users can only view their own consents
CREATE POLICY "Users can view own consents"
    ON user_consents FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own consents
CREATE POLICY "Users can insert own consents"
    ON user_consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own consents
CREATE POLICY "Users can update own consents"
    ON user_consents FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 2. DATA ACCESS LOGS TABLE
-- =====================================================
-- Audit trail for all data access (KVKK requirement)

CREATE TABLE IF NOT EXISTS data_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accessed_by UUID NOT NULL REFERENCES users(id),
    
    -- Access Details
    access_type TEXT NOT NULL CHECK (access_type IN ('export', 'view', 'update', 'delete')),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Request Metadata
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    
    -- Index
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_data_access_logs_user_id ON data_access_logs(user_id);
CREATE INDEX idx_data_access_logs_accessed_at ON data_access_logs(accessed_at DESC);
CREATE INDEX idx_data_access_logs_access_type ON data_access_logs(access_type);

-- RLS Policies
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own access logs
CREATE POLICY "Users can view own access logs"
    ON data_access_logs FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert logs (no user restriction)
CREATE POLICY "System can insert access logs"
    ON data_access_logs FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- 3. DELETION REQUESTS TABLE
-- =====================================================
-- Tracks account deletion requests with 30-day retention

CREATE TABLE IF NOT EXISTS deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Request Details
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    
    -- Deletion Schedule
    scheduled_deletion_date TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_deletion_date TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deletion_requests_user_id ON deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_status ON deletion_requests(status);
CREATE INDEX idx_deletion_requests_scheduled_date ON deletion_requests(scheduled_deletion_date);

-- RLS Policies
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own deletion requests
CREATE POLICY "Users can view own deletion requests"
    ON deletion_requests FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own deletion requests
CREATE POLICY "Users can insert own deletion requests"
    ON deletion_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending deletion requests (to cancel)
CREATE POLICY "Users can cancel own deletion requests"
    ON deletion_requests FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

-- =====================================================
-- 4. ADD PRIVACY COLUMNS TO USERS TABLE
-- =====================================================
-- Add necessary columns for privacy compliance

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;

-- Index for deleted users
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function to get pending deletions (for scheduled job)
CREATE OR REPLACE FUNCTION get_pending_deletions()
RETURNS TABLE (
    user_id UUID,
    scheduled_deletion_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dr.user_id,
        dr.scheduled_deletion_date
    FROM deletion_requests dr
    WHERE dr.status = 'pending'
      AND dr.scheduled_deletion_date <= NOW()
    ORDER BY dr.scheduled_deletion_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update consent timestamp
CREATE OR REPLACE FUNCTION update_consent_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Track consent withdrawal
    IF (OLD.marketing_consent = TRUE AND NEW.marketing_consent = FALSE) OR
       (OLD.analytics_consent = TRUE AND NEW.analytics_consent = FALSE) OR
       (OLD.location_consent = TRUE AND NEW.location_consent = FALSE) OR
       (OLD.third_party_consent = TRUE AND NEW.third_party_consent = FALSE) THEN
        NEW.consent_withdrawn_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for consent timestamp
DROP TRIGGER IF EXISTS trigger_update_consent_timestamp ON user_consents;
CREATE TRIGGER trigger_update_consent_timestamp
    BEFORE UPDATE ON user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_consent_timestamp();

-- Function to update deletion request timestamp
CREATE OR REPLACE FUNCTION update_deletion_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for deletion request timestamp
DROP TRIGGER IF EXISTS trigger_update_deletion_request_timestamp ON deletion_requests;
CREATE TRIGGER trigger_update_deletion_request_timestamp
    BEFORE UPDATE ON deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_deletion_request_timestamp();

-- =====================================================
-- 6. INITIAL DATA
-- =====================================================

-- Create default consent records for existing users (opt-in to all by default for migration)
-- Note: In production, you should ask users to re-consent
/*
INSERT INTO user_consents (user_id, marketing_consent, analytics_consent, location_consent, third_party_consent)
SELECT 
    id,
    FALSE, -- marketing (explicit opt-in required)
    FALSE, -- analytics (explicit opt-in required)
    TRUE,  -- location (required for core features)
    FALSE  -- third party (explicit opt-in required)
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM user_consents WHERE user_consents.user_id = users.id
);
*/

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE user_consents IS 'User consent preferences for KVKK compliance';
COMMENT ON TABLE data_access_logs IS 'Audit trail of all data access (KVKK requirement)';
COMMENT ON TABLE deletion_requests IS 'Account deletion requests with 30-day retention period';

COMMENT ON COLUMN user_consents.marketing_consent IS 'Consent for marketing communications';
COMMENT ON COLUMN user_consents.analytics_consent IS 'Consent for analytics data collection';
COMMENT ON COLUMN user_consents.location_consent IS 'Consent for location tracking';
COMMENT ON COLUMN user_consents.third_party_consent IS 'Consent for third-party data sharing';

COMMENT ON COLUMN deletion_requests.scheduled_deletion_date IS 'Date when account will be permanently deleted (30 days after request)';
COMMENT ON COLUMN deletion_requests.status IS 'pending, processing, completed, or cancelled';
