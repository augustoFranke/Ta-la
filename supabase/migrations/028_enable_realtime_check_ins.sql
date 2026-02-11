-- Enables Supabase Realtime Postgres Changes on the check_ins table.
-- This allows clients to subscribe to INSERT/UPDATE/DELETE events on check_ins
-- filtered by venue_id, enabling real-time venue roster updates on the discovery screen.
--
-- Existing RLS policies on check_ins already restrict SELECT to users checked in
-- at the same venue, so Realtime events are naturally scoped per-venue.

-- Ensure the supabase_realtime publication exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add check_ins table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE check_ins;
