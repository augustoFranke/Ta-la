-- Multi-signal venue filtering system
-- Stores cached Google Places details + community curation data

-- ============================================================================
-- venue_metadata: Cached venue details and nightlife scoring
-- ============================================================================
CREATE TABLE venue_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id TEXT UNIQUE NOT NULL,
    
    -- Operating hours analysis (from Google Places Details API)
    opening_hours JSONB,                          -- Full opening_hours object
    closes_late_weekend BOOLEAN DEFAULT FALSE,    -- Closes >= 23h on Fri/Sat
    opens_evening BOOLEAN DEFAULT FALSE,          -- Opens after 18h
    
    -- Review keyword signals
    review_keywords_positive INTEGER DEFAULT 0,   -- Count of nightlife keywords found
    review_keywords_negative INTEGER DEFAULT 0,   -- Count of family/daytime keywords
    
    -- Community curation
    is_verified_nightlife BOOLEAN DEFAULT NULL,   -- Admin-verified as nightlife venue
    is_blocked BOOLEAN DEFAULT FALSE,             -- Blocked by admin/community
    user_flag_count INTEGER DEFAULT 0,            -- Times flagged by users
    
    -- Computed nightlife fitness score (0-100)
    nightlife_score INTEGER DEFAULT 0,
    
    -- Cache management
    last_details_fetch TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by place_id
CREATE INDEX idx_venue_metadata_place_id ON venue_metadata(place_id);

-- Index for filtering by score
CREATE INDEX idx_venue_metadata_score ON venue_metadata(nightlife_score) 
    WHERE is_blocked = FALSE;

-- Enable RLS
ALTER TABLE venue_metadata ENABLE ROW LEVEL SECURITY;

-- Anyone can read venue metadata
CREATE POLICY "Anyone can view venue metadata" ON venue_metadata
    FOR SELECT USING (true);

-- Only service role can insert/update (from API calls)
CREATE POLICY "Service role can manage venue metadata" ON venue_metadata
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to insert/update via RPC or direct if needed
CREATE POLICY "Authenticated users can upsert venue metadata" ON venue_metadata
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update venue metadata" ON venue_metadata
    FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================================
-- venue_flags: User reports for community curation
-- ============================================================================
CREATE TABLE venue_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flag_type TEXT NOT NULL CHECK (flag_type IN ('not_nightlife', 'closed', 'wrong_category')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One flag per type per user per venue
    UNIQUE(place_id, user_id, flag_type)
);

-- Index for counting flags per venue
CREATE INDEX idx_venue_flags_place_id ON venue_flags(place_id);

-- Index for user's flags
CREATE INDEX idx_venue_flags_user ON venue_flags(user_id);

-- Enable RLS
ALTER TABLE venue_flags ENABLE ROW LEVEL SECURITY;

-- Users can view their own flags
CREATE POLICY "Users can view own flags" ON venue_flags
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own flags
CREATE POLICY "Users can create flags" ON venue_flags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own flags
CREATE POLICY "Users can delete own flags" ON venue_flags
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Function: Increment flag count on venue_metadata when flag is inserted
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_venue_flag_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Upsert venue_metadata and increment flag count
    INSERT INTO venue_metadata (place_id, user_flag_count, created_at, updated_at)
    VALUES (NEW.place_id, 1, NOW(), NOW())
    ON CONFLICT (place_id) 
    DO UPDATE SET 
        user_flag_count = venue_metadata.user_flag_count + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Decrement flag count on venue_metadata when flag is deleted
-- ============================================================================
CREATE OR REPLACE FUNCTION decrement_venue_flag_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE venue_metadata 
    SET 
        user_flag_count = GREATEST(0, user_flag_count - 1),
        updated_at = NOW()
    WHERE place_id = OLD.place_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_venue_flag_insert
    AFTER INSERT ON venue_flags
    FOR EACH ROW
    EXECUTE FUNCTION increment_venue_flag_count();

CREATE TRIGGER on_venue_flag_delete
    AFTER DELETE ON venue_flags
    FOR EACH ROW
    EXECUTE FUNCTION decrement_venue_flag_count();

-- ============================================================================
-- Function: Update updated_at timestamp on venue_metadata changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_venue_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venue_metadata_updated_at
    BEFORE UPDATE ON venue_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_metadata_timestamp();
