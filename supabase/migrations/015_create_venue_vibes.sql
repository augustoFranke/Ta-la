-- Create venue_vibes table for user-submitted venue tags
-- Allows users to tag venues with dating-friendly vibes

CREATE TABLE venue_vibes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vibe TEXT NOT NULL CHECK (vibe IN (
        'good_for_dating',
        'singles_friendly',
        'great_atmosphere',
        'easy_conversation',
        'intimate_setting',
        'upscale_crowd',
        'casual_vibes'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (venue_id, user_id, vibe)
);

-- Index for aggregating vibes by venue
CREATE INDEX idx_venue_vibes_venue ON venue_vibes(venue_id);

-- Index for user's submitted vibes
CREATE INDEX idx_venue_vibes_user ON venue_vibes(user_id);

-- Enable RLS
ALTER TABLE venue_vibes ENABLE ROW LEVEL SECURITY;

-- Anyone can view vibes for venues
CREATE POLICY "Anyone can view venue vibes" ON venue_vibes
    FOR SELECT USING (TRUE);

-- Users can manage their own vibes
CREATE POLICY "Users can manage own vibes" ON venue_vibes
    FOR ALL USING (auth.uid() = user_id);
