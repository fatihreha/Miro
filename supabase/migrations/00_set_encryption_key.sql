-- Set IBAN encryption key as database configuration
-- This key will be used by pgcrypto functions for IBAN encryption
-- Run this in Supabase SQL Editor or via CLI

ALTER DATABASE postgres SET app.settings.iban_encryption_key = 'rDT7q5rp33bltbu+KNh6D7aFYsWhLRjJdSvudCLhkJg=';

-- Reload configuration
SELECT pg_reload_conf();

-- Verify the key is set
SHOW app.settings.iban_encryption_key;
