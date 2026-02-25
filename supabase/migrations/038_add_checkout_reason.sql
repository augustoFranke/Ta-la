-- Add checkout_reason column to check_ins table.
-- The checkout code (useCheckIn.ts) writes this field on every checkout but
-- the column was never created, causing PGRST204 errors on checkout.
--
-- Valid reasons per Spec 005 §6:
--   manual | out_of_range | stale_location | app_killed | signout

ALTER TABLE check_ins
  ADD COLUMN checkout_reason TEXT;

ALTER TABLE check_ins
  ADD CONSTRAINT check_ins_checkout_reason_check
    CHECK (checkout_reason IN ('manual', 'out_of_range', 'stale_location', 'app_killed', 'signout'));
