CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    "order" INT NOT NULL CHECK ("order" >= 1 AND "order" <= 3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, "order")
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view photos of verified users" ON photos
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = user_id AND is_verified = TRUE)
    );

CREATE POLICY "Users can manage own photos" ON photos
    FOR ALL USING (auth.uid() = user_id);
