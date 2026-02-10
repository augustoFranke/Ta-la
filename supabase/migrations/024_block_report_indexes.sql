-- Add missing index for bidirectional block lookups and prevent duplicate reports.
-- Supports Phase 3: Safety and Moderation Enforcement.

CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks (blocked_id);

ALTER TABLE reports ADD CONSTRAINT reports_reporter_reported_unique UNIQUE (reporter_id, reported_id);
