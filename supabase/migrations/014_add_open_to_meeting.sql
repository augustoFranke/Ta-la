-- Add open_to_meeting column to check_ins table
-- Allows users to indicate they are open to meeting new people when checked in

ALTER TABLE check_ins ADD COLUMN open_to_meeting BOOLEAN DEFAULT FALSE;

-- Index for quickly finding active check-ins where users are open to meeting
CREATE INDEX idx_check_ins_open_meeting ON check_ins(venue_id, open_to_meeting)
WHERE is_active = TRUE AND open_to_meeting = TRUE;
