CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    confirmed BOOLEAN DEFAULT FALSE,
    matched_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    CHECK (user1_id < user2_id) -- Garante ordem consistente
);

CREATE UNIQUE INDEX idx_matches_users ON matches (user1_id, user2_id);
CREATE INDEX idx_matches_user ON matches (user1_id);
CREATE INDEX idx_matches_user2 ON matches (user2_id);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their matches" ON matches
    FOR SELECT USING (auth.uid() IN (user1_id, user2_id));
