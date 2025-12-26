-- =====================================================
-- PRODUCTION DEPLOYMENT SCRIPT - %100 GÜVENLİK & DATABASE
-- Supabase SQL Editor'da sırayla çalıştırın
-- =====================================================

-- 1. pg_cron Extension (Günlük Swipe Sıfırlama)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Günlük swipe sıfırlama (Her gece 00:00 UTC)
SELECT cron.schedule(
  'reset-daily-swipes',
  '0 0 * * *',
  $$ UPDATE users SET daily_swipes = 10 WHERE daily_swipes < 10 $$
);

-- Eski mesajları temizle (30 günden eski, ayda bir)
SELECT cron.schedule(
  'cleanup-old-messages',
  '0 3 1 * *',
  $$ DELETE FROM messages WHERE created_at < NOW() - INTERVAL '90 days' AND NOT is_pinned $$
);

-- Expired sessions temizle (Her 6 saatte)
SELECT cron.schedule(
  'cleanup-expired-sessions',
  '0 */6 * * *',
  $$ DELETE FROM user_sessions WHERE expires_at < NOW() $$
);

-- 2. Session Management Table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    is_current BOOLEAN DEFAULT false,
    UNIQUE(user_id, device_id)
);

-- Session RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
ON user_sessions FOR SELECT
USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage own sessions"
ON user_sessions FOR ALL
USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- 3. 2FA (Two-Factor Authentication) Altyapısı
-- =====================================================
CREATE TABLE IF NOT EXISTS user_2fa (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT false,
    secret_key TEXT, -- TOTP secret (encrypted)
    backup_codes TEXT[], -- Encrypted backup codes
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own 2FA"
ON user_2fa FOR SELECT
USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage own 2FA"
ON user_2fa FOR ALL
USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- 4. Rate Limiting Table (API Rate Limit)
-- =====================================================
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- user_id, ip_address, etc.
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(identifier, endpoint)
);

-- Rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_limit INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    SELECT request_count, window_start INTO v_count, v_window_start
    FROM api_rate_limits
    WHERE identifier = p_identifier AND endpoint = p_endpoint;
    
    IF NOT FOUND THEN
        INSERT INTO api_rate_limits (identifier, endpoint, request_count, window_start)
        VALUES (p_identifier, p_endpoint, 1, NOW());
        RETURN TRUE;
    END IF;
    
    -- Reset if window expired
    IF v_window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN
        UPDATE api_rate_limits
        SET request_count = 1, window_start = NOW()
        WHERE identifier = p_identifier AND endpoint = p_endpoint;
        RETURN TRUE;
    END IF;
    
    -- Check limit
    IF v_count >= p_limit THEN
        RETURN FALSE; -- Rate limit exceeded
    END IF;
    
    -- Increment
    UPDATE api_rate_limits
    SET request_count = request_count + 1
    WHERE identifier = p_identifier AND endpoint = p_endpoint;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Security Audit Log
-- =====================================================
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_time ON security_audit_log(created_at);

-- Audit log function
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS void AS $$
BEGIN
    INSERT INTO security_audit_log (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. IBAN Encryption Key Setting
-- =====================================================
-- app.settings tablosu yoksa oluştur
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encryption key placeholder (deploy sırasında gerçek key ile değiştir)
-- openssl rand -base64 32 komutuyla oluşturulabilir
INSERT INTO app_settings (key, value)
VALUES ('iban_encryption_key', 'REPLACE_WITH_REAL_KEY_BEFORE_PRODUCTION')
ON CONFLICT (key) DO NOTHING;

-- 7. RLS Doğrulama Sorgusu
-- =====================================================
-- Bu sorguyu çalıştırarak tüm tabloların RLS'e sahip olduğunu doğrulayın
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 8. Missing RLS Policies Check (System tables excluded)
-- =====================================================
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE '_prisma%'
        AND tablename NOT IN (
            'spatial_ref_sys',      -- PostGIS system table
            'geography_columns',    -- PostGIS system table
            'geometry_columns',     -- PostGIS system table
            'raster_columns',       -- PostGIS system table
            'raster_overviews'      -- PostGIS system table
        )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
            RAISE NOTICE 'RLS enabled for: %', tbl.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipped (already enabled or no permission): %', tbl.tablename;
        END;
    END LOOP;
END;
$$;

-- 9. Production Constraints Verification
-- =====================================================
-- Unique constraints kontrolü
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY', 'CHECK')
ORDER BY tc.table_name;

-- 10. Index Verification
-- =====================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- DEPLOYMENT CHECKLIST
-- =====================================================
-- [ ] pg_cron extension enabled
-- [ ] user_sessions table created
-- [ ] user_2fa table created
-- [ ] api_rate_limits table created
-- [ ] security_audit_log table created
-- [ ] IBAN encryption key set (app_settings)
-- [ ] All tables have RLS enabled
-- [ ] Cron jobs scheduled
-- [ ] Indexes created
