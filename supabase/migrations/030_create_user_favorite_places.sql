-- Create user_favorite_places table for venue favorites feature.
-- Matches UserFavoritePlace interface in src/types/database.ts.

CREATE TABLE IF NOT EXISTS user_favorite_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_place UNIQUE (user_id, place_id)
);

-- Index for fast user-based lookups
CREATE INDEX idx_user_favorite_places_user_id ON user_favorite_places(user_id);

-- Enable RLS
ALTER TABLE user_favorite_places ENABLE ROW LEVEL SECURITY;

-- Users can only read their own favorites
CREATE POLICY "Users can read own favorites"
    ON user_favorite_places FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own favorites
CREATE POLICY "Users can insert own favorites"
    ON user_favorite_places FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own favorites
CREATE POLICY "Users can delete own favorites"
    ON user_favorite_places FOR DELETE
    USING (auth.uid() = user_id);
