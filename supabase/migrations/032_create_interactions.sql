-- Creates the interactions table for all interaction types (drink, wave, like),
-- a match trigger v2 that detects ANY mutual interaction regardless of type,
-- and adds unmatch support via unmatched_at column on matches.

-- =============================================================================
-- 1. interactions table
-- =============================================================================

CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('drink', 'wave', 'like')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id, venue_id, interaction_type)
);

CREATE INDEX idx_interactions_receiver ON interactions (receiver_id, venue_id);
CREATE INDEX idx_interactions_sender ON interactions (sender_id, venue_id);

-- =============================================================================
-- 2. RLS policies
-- =============================================================================

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see interactions they sent or received" ON interactions
    FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

-- =============================================================================
-- 3. Match trigger v2: any mutual interaction creates a match
-- =============================================================================

CREATE OR REPLACE FUNCTION check_and_create_match_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reverse_exists BOOLEAN;
BEGIN
    -- Check if receiver has sent ANY interaction to this sender at the same venue
    -- No filter on interaction_type — any combination creates a match
    SELECT EXISTS(
        SELECT 1 FROM interactions
        WHERE sender_id = NEW.receiver_id
          AND receiver_id = NEW.sender_id
          AND venue_id = NEW.venue_id
    ) INTO v_reverse_exists;

    IF v_reverse_exists THEN
        -- Create match with ordered IDs (matches CHECK constraint: user1_id < user2_id)
        -- ON CONFLICT handles race conditions and re-matching after unmatch
        INSERT INTO matches (user1_id, user2_id, venue_id, confirmed, confirmed_at)
        VALUES (
            LEAST(NEW.sender_id, NEW.receiver_id),
            GREATEST(NEW.sender_id, NEW.receiver_id),
            NEW.venue_id,
            TRUE,
            NOW()
        )
        ON CONFLICT (user1_id, user2_id) DO UPDATE SET
            confirmed = TRUE,
            confirmed_at = NOW(),
            unmatched_at = NULL;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_match_v2
    AFTER INSERT ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION check_and_create_match_v2();

-- =============================================================================
-- 4. Unmatch support: add unmatched_at column to matches
-- =============================================================================

ALTER TABLE matches ADD COLUMN IF NOT EXISTS unmatched_at TIMESTAMPTZ DEFAULT NULL;
