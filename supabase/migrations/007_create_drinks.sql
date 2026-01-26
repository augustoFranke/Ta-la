-- Sistema "Pagar um drink" para demonstrar interesse
CREATE TABLE drinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    note TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id, venue_id)
);

CREATE INDEX idx_drinks_receiver ON drinks (receiver_id, status);

ALTER TABLE drinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see drinks they sent or received" ON drinks
    FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can send drinks" ON drinks
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update drink status" ON drinks
    FOR UPDATE USING (auth.uid() = receiver_id);
