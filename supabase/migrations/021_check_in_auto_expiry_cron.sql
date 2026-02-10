-- Enable pg_cron extension for scheduled jobs.
-- pg_cron is available on Supabase hosted projects and allows
-- running SQL functions on a cron schedule.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule auto_checkout_expired() to run every 5 minutes.
-- The function (defined in 011_create_functions.sql) marks check-ins
-- as inactive and sets checked_out_at for any check-in older than 4 hours.
-- This ensures users who forget to check out are automatically expired,
-- keeping the active check-in list accurate for venue discovery.
SELECT cron.schedule(
    'auto-checkout-expired',
    '*/5 * * * *',
    $$SELECT auto_checkout_expired()$$
);
