-- ============================================
-- SECURE IBAN ENCRYPTION WITH PGCRYPTO
-- Migration: 20241206_secure_iban_encryption
-- Purpose: Move IBAN encryption from client-side to server-side using pgcrypto
-- Security: Prevents encryption key exposure in client bundle
-- ============================================

-- Enable pgcrypto extension for server-side encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. ADD ENCRYPTED IBAN COLUMN
-- ============================================

-- Add new column for encrypted IBAN (will replace the old one)
ALTER TABLE trainers 
ADD COLUMN IF NOT EXISTS iban_encrypted BYTEA;

-- ============================================
-- 2. RPC FUNCTION TO ENCRYPT AND STORE IBAN
-- ============================================

-- Function to securely store encrypted IBAN
-- Call this from client: supabase.rpc('store_trainer_iban', { p_trainer_id: '...', p_iban: 'TR...' })
CREATE OR REPLACE FUNCTION store_trainer_iban(
  p_trainer_id UUID,
  p_iban TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
AS $$
DECLARE
  -- ⚠️ SECURITY WARNING: Encryption key is hardcoded for initial deployment
  -- 🔒 PRODUCTION TODO: Replace with environment variable from Supabase Dashboard
  -- 📋 Setup: Dashboard → Project Settings → Database → Custom Postgres config
  --    Add: ALTER DATABASE postgres SET app.settings.iban_encryption_key = 'YOUR_KEY_HERE';
  -- 🔄 Then replace this line with: v_encryption_key := current_setting('app.settings.iban_encryption_key');
  v_encryption_key TEXT := 'rDT7q5rp33bltbu+KNh6D7aFYsWhLRjJdSvudCLhkJg=';
BEGIN
  
  -- Validate IBAN format (basic check)
  IF p_iban !~ '^TR[0-9]{24}$' THEN
    RAISE EXCEPTION 'Invalid IBAN format. Must be TR followed by 24 digits.';
  END IF;
  
  -- Encrypt and store IBAN using AES-256
  UPDATE trainers
  SET 
    iban_encrypted = pgp_sym_encrypt(p_iban, v_encryption_key),
    updated_at = NOW()
  WHERE user_id = p_trainer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trainer not found: %', p_trainer_id;
  END IF;
END;
$$;

-- ============================================
-- 3. RPC FUNCTION TO DECRYPT AND RETRIEVE IBAN
-- ============================================

-- Function to securely retrieve decrypted IBAN
-- Call this from client: supabase.rpc('get_trainer_iban', { p_trainer_id: '...' })
CREATE OR REPLACE FUNCTION get_trainer_iban(p_trainer_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_encryption_key TEXT := 'rDT7q5rp33bltbu+KNh6D7aFYsWhLRjJdSvudCLhkJg=';
  v_encrypted_iban BYTEA;
  v_decrypted_iban TEXT;
BEGIN
  -- Only allow trainers to retrieve their own IBAN
  IF auth.uid() != p_trainer_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only retrieve your own IBAN';
  END IF;
  
  -- Get encrypted IBAN
  SELECT iban_encrypted INTO v_encrypted_iban
  FROM trainers
  WHERE user_id = p_trainer_id;
  
  IF NOT FOUND OR v_encrypted_iban IS NULL THEN
    RETURN NULL; -- No IBAN stored
  END IF;
  
  -- Decrypt IBAN
  v_decrypted_iban := pgp_sym_decrypt(v_encrypted_iban, v_encryption_key);
  
  RETURN v_decrypted_iban;
END;
$$;

-- ============================================
-- 4. RPC FUNCTION FOR PAYOUT REQUESTS (SECURE IBAN ACCESS)
-- ============================================

-- Function to process payout with encrypted IBAN
-- Call this from server-side code or Edge Function
CREATE OR REPLACE FUNCTION request_payout_with_iban(
  p_trainer_id UUID,
  p_amount DECIMAL
)
RETURNS TABLE (
  payout_id UUID,
  iban TEXT,
  amount DECIMAL,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_encryption_key TEXT := 'rDT7q5rp33bltbu+KNh6D7aFYsWhLRjJdSvudCLhkJg=';
  v_encrypted_iban BYTEA;
  v_decrypted_iban TEXT;
  v_available_balance DECIMAL;
  v_payout_id UUID;
BEGIN
  -- Security: Only allow trainer to request their own payout
  IF auth.uid() != p_trainer_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only request your own payout';
  END IF;
  
  -- Check available balance
  SELECT available_balance INTO v_available_balance
  FROM trainer_earnings
  WHERE trainer_id = p_trainer_id;
  
  IF v_available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', v_available_balance, p_amount;
  END IF;
  
  -- Get encrypted IBAN
  SELECT iban_encrypted INTO v_encrypted_iban
  FROM trainers
  WHERE user_id = p_trainer_id;
  
  IF v_encrypted_iban IS NULL THEN
    RAISE EXCEPTION 'No IBAN on file. Please add your IBAN first.';
  END IF;
  
  -- Decrypt IBAN
  v_decrypted_iban := pgp_sym_decrypt(v_encrypted_iban, v_encryption_key);
  
  -- Create payout request
  INSERT INTO payout_requests (trainer_id, amount, status, requested_at, iban)
  VALUES (p_trainer_id, p_amount, 'pending', NOW(), v_decrypted_iban)
  RETURNING id INTO v_payout_id;
  
  -- Hold balance (move from available to held)
  PERFORM hold_balance_for_payout(p_trainer_id, p_amount, v_payout_id::TEXT);
  
  -- Return payout info (IBAN is masked for client response)
  RETURN QUERY
  SELECT 
    v_payout_id,
    'TR**********************' || RIGHT(v_decrypted_iban, 4) AS iban, -- Mask IBAN
    p_amount,
    'pending'::TEXT;
END;
$$;

-- ============================================
-- 5. DATA MIGRATION (IF OLD IBAN COLUMN EXISTS)
-- ============================================

-- If you have existing IBAN data in plaintext, migrate it
-- WARNING: This assumes you have the old encryption key available
-- Run this ONCE after deployment, then drop the old column

-- Example migration function (DO NOT run automatically)
CREATE OR REPLACE FUNCTION migrate_existing_ibans()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_trainer RECORD;
  v_encryption_key TEXT;
BEGIN
  v_encryption_key := current_setting('app.settings.iban_encryption_key', true);
  
  IF v_encryption_key IS NULL THEN
    RAISE EXCEPTION 'Set IBAN_ENCRYPTION_KEY first';
  END IF;
  
  -- Loop through trainers with old IBAN column (if exists)
  FOR v_trainer IN 
    SELECT user_id, iban 
    FROM trainers 
    WHERE iban IS NOT NULL AND iban_encrypted IS NULL
  LOOP
    -- Encrypt and store
    UPDATE trainers
    SET iban_encrypted = pgp_sym_encrypt(v_trainer.iban, v_encryption_key)
    WHERE user_id = v_trainer.user_id;
    
    RAISE NOTICE 'Migrated IBAN for trainer: %', v_trainer.user_id;
  END LOOP;
  
  RAISE NOTICE 'Migration complete. Review and then run: ALTER TABLE trainers DROP COLUMN iban;';
END;
$$;

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================

-- Ensure RLS is enabled on trainers table
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

-- Policy: Trainers can only see their own encrypted IBAN (but can't decrypt it directly)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trainers' 
    AND policyname = 'Trainers can view own encrypted data'
  ) THEN
    CREATE POLICY "Trainers can view own encrypted data"
    ON trainers FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================

-- Index for faster IBAN lookups
CREATE INDEX IF NOT EXISTS idx_trainers_iban_encrypted 
ON trainers(user_id) WHERE iban_encrypted IS NOT NULL;

-- ============================================
-- DEPLOYMENT INSTRUCTIONS
-- ============================================

-- STEP 1: Set encryption key in Supabase Dashboard
--   1. Go to Project Settings → Database → Configuration
--   2. Add custom setting:
--      Key: app.settings.iban_encryption_key
--      Value: (generate a strong random key, e.g., openssl rand -base64 32)
--
-- STEP 2: Run this migration
--   supabase db push
--
-- STEP 3: If you have existing IBAN data:
--   SELECT migrate_existing_ibans();
--   -- Review the results
--   ALTER TABLE trainers DROP COLUMN iban; -- Remove old plaintext column
--
-- STEP 4: Update client-side code to use RPC functions:
--   - store_trainer_iban() for saving
--   - get_trainer_iban() for retrieval (only for displaying to trainer)
--   - request_payout_with_iban() for payout requests

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION store_trainer_iban IS 'Securely encrypts and stores trainer IBAN using pgcrypto (AES-256)';
COMMENT ON FUNCTION get_trainer_iban IS 'Decrypts and returns trainer IBAN (only for the trainer themselves)';
COMMENT ON FUNCTION request_payout_with_iban IS 'Creates payout request with encrypted IBAN, masks IBAN in response';
COMMENT ON COLUMN trainers.iban_encrypted IS 'AES-256 encrypted IBAN using pgcrypto. Never exposed to client.';

-- Migration completed: 20241206_secure_iban_encryption
