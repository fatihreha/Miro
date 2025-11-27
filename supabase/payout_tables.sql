-- Trainer payout info table
CREATE TABLE IF NOT EXISTS trainer_payout_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  iban_encrypted TEXT NOT NULL,
  account_name TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 100),
  currency VARCHAR(3) DEFAULT 'TRY',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  admin_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id),
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trainer earnings table
CREATE TABLE IF NOT EXISTS trainer_earnings (
  trainer_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_earned DECIMAL(10,2) DEFAULT 0 CHECK (total_earned >= 0),
  available_balance DECIMAL(10,2) DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance DECIMAL(10,2) DEFAULT 0 CHECK (pending_balance >= 0),
  total_withdrawn DECIMAL(10,2) DEFAULT 0 CHECK (total_withdrawn >= 0),
  last_payout_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Session bookings table (for tracking earnings)
CREATE TABLE IF NOT EXISTS session_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payout_requests_trainer ON payout_requests(trainer_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_bookings_trainer ON session_bookings(trainer_id, scheduled_date);

-- RLS Policies
ALTER TABLE trainer_payout_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_bookings ENABLE ROW LEVEL SECURITY;

-- Trainer can view/update own payout info
CREATE POLICY "Trainers can manage own payout info"
ON trainer_payout_info
FOR ALL
USING (auth.uid() = trainer_id);

-- Trainer can view own payout requests
CREATE POLICY "Trainers can view own payout requests"
ON payout_requests
FOR SELECT
USING (auth.uid() = trainer_id);

-- Trainer can create payout requests
CREATE POLICY "Trainers can create payout requests"
ON payout_requests
FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

-- Trainer can view own earnings
CREATE POLICY "Trainers can view own earnings"
ON trainer_earnings
FOR SELECT
USING (auth.uid() = trainer_id);

-- Users can view their bookings
CREATE POLICY "Users can view own bookings"
ON session_bookings
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = trainer_id);

-- Function to deduct from balance
CREATE OR REPLACE FUNCTION deduct_from_balance(
  trainer_id UUID,
  amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE trainer_earnings
  SET 
    available_balance = available_balance - amount,
    pending_balance = pending_balance + amount,
    updated_at = now()
  WHERE trainer_earnings.trainer_id = deduct_from_balance.trainer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete payout
CREATE OR REPLACE FUNCTION complete_payout(
  payout_id UUID,
  transaction_id TEXT
)
RETURNS VOID AS $$
DECLARE
  payout_amount DECIMAL;
  payout_trainer_id UUID;
BEGIN
  -- Get payout details
  SELECT amount, trainer_id INTO payout_amount, payout_trainer_id
  FROM payout_requests
  WHERE id = payout_id;

  -- Update payout request
  UPDATE payout_requests
  SET 
    status = 'completed',
    transaction_id = complete_payout.transaction_id,
    processed_at = now()
  WHERE id = payout_id;

  -- Update trainer earnings
  UPDATE trainer_earnings
  SET 
    pending_balance = pending_balance - payout_amount,
    total_withdrawn = total_withdrawn + payout_amount,
    last_payout_at = now(),
    updated_at = now()
  WHERE trainer_id = payout_trainer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION deduct_from_balance TO authenticated;
GRANT EXECUTE ON FUNCTION complete_payout TO authenticated;
