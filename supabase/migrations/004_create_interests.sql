CREATE TABLE interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    UNIQUE(user_id, tag)
);

CREATE INDEX idx_interests_tag ON interests (tag);

ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view interests" ON interests FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage own interests" ON interests FOR ALL USING (auth.uid() = user_id);
