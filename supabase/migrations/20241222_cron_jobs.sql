-- Production Cron Jobs Setup
-- Enable pg_cron extension if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Daily Swipe Reset (Midnight UTC)
-- Reset daily swipes to 10 for all non-premium users
-- Also update last_swipe_reset timestamp
SELECT cron.schedule(
    'reset-daily-swipes',
    '0 0 * * *',
    $$
    UPDATE public.users 
    SET daily_swipes_remaining = 10, last_swipe_reset = now() 
    WHERE is_premium = false;
    $$
);

-- 2. Daily Photo Comment Reset (Midnight UTC)
SELECT cron.schedule(
    'reset-photo-comments',
    '0 0 * * *',
    $$
    UPDATE public.users
    SET daily_photo_comments = 5
    WHERE is_premium = false;
    $$
);

-- 3. Cleanup Inactive Push Tokens (Weekly)
-- Remove tokens that haven't been updated in 30 days
SELECT cron.schedule(
    'cleanup-push-tokens',
    '0 0 * * 0', -- Every Sunday at midnight
    $$
    DELETE FROM public.push_tokens
    WHERE updated_at < now() - INTERVAL '30 days';
    $$
);

-- 4. Update User Online Status (Every 5 minutes)
-- Mark users as offline if last_active > 10 minutes ago
SELECT cron.schedule(
    'update-user-status',
    '*/5 * * * *',
    $$
    UPDATE public.users
    SET is_online = false, status = 'offline'
    WHERE last_active < now() - INTERVAL '10 minutes' 
    AND is_online = true;
    $$
);

-- 5. Cleanup Expired Workflow Requests (Daily)
-- Mark pending requests older than 24 hours as expired
SELECT cron.schedule(
    'cleanup-requests',
    '0 1 * * *', -- 1 AM
    $$
    UPDATE public.workout_requests
    SET status = 'rejected'
    WHERE status = 'pending' AND created_at < now() - INTERVAL '24 hours';
    $$
);

-- 6. Auto-complete Bookings (Daily)
-- Mark bookings as completed if scheduled time has passed + 2 hours
SELECT cron.schedule(
    'autocomplete-bookings',
    '0 2 * * *', -- 2 AM
    $$
    UPDATE public.bookings
    SET status = 'completed'
    WHERE status = 'confirmed' 
    AND (scheduled_date || ' ' || scheduled_time)::timestamp < now() - INTERVAL '2 hours';
    $$
);
