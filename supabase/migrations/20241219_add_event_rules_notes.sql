-- Add rules and notes columns to events table
-- Migration: 20241219_add_event_rules_notes
-- Purpose: Support EventDetail page with editable rules and notes

-- Add new columns
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS rules TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add GIN index for rules array (faster searches)
CREATE INDEX IF NOT EXISTS idx_events_rules 
ON public.events USING GIN (rules);

-- Add comments for documentation
COMMENT ON COLUMN public.events.rules IS 'Array of event rules for attendees';
COMMENT ON COLUMN public.events.notes IS 'Private notes for attendees (visible after joining)';
COMMENT ON COLUMN public.events.updated_at IS 'Timestamp of last update';

-- Update existing events to have empty rules array
UPDATE public.events 
SET rules = '{}' 
WHERE rules IS NULL;

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
