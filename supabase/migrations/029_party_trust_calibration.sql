-- Party trust calibration — adjusts thresholds for controlled party events at partnered venues.
--
-- Changes:
--   1. auto_checkout_expired(): 4 hours → 8 hours auto-expiry window
--      With presence confirmation every 30 min (Phase 6), inactive users are still caught
--      within 8h, while active party-goers are not auto-expired mid-event.
--
--   2. check_in_to_place_v2(): 15 minutes → 5 minutes cooldown after checkout
--      5 minutes is sufficient to prevent check-in/out gaming for drink offers,
--      while allowing quick re-entry for users who briefly step outside a party venue.
--
-- Unchanged: distance (100m), location freshness (60s), denial codes, pg_cron schedule (021).

-- 1. Replace auto_checkout_expired with 8-hour window
CREATE OR REPLACE FUNCTION auto_checkout_expired()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE check_ins
    SET is_active = FALSE, checked_out_at = NOW()
    WHERE is_active = TRUE
    AND checked_in_at < NOW() - INTERVAL '8 hours';
END;
$$;

-- 2. Replace check_in_to_place_v2 with 5-minute cooldown (was 15 minutes in 022)
-- Full function body copied from 022_add_check_in_visibility.sql — only cooldown changed.
-- All 14 parameters preserved including p_visibility from 022.

CREATE OR REPLACE FUNCTION check_in_to_place_v2(
    p_place_id TEXT,
    p_name TEXT,
    p_address TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_types TEXT[],
    p_photo_url TEXT DEFAULT NULL,
    p_rating DOUBLE PRECISION DEFAULT NULL,
    p_open_to_meeting BOOLEAN DEFAULT FALSE,
    p_visibility TEXT DEFAULT 'public',
    p_user_lat DOUBLE PRECISION DEFAULT NULL,
    p_user_lng DOUBLE PRECISION DEFAULT NULL,
    p_user_accuracy DOUBLE PRECISION DEFAULT NULL,
    p_user_location_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_venue_id UUID;
    v_venue_location GEOGRAPHY;
    v_check_in_id UUID;
    v_cooldown_exists BOOLEAN;
BEGIN
    -- 1. Auth check
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'check_in_id', NULL,
            'denial_reason', 'not_authenticated'
        );
    END IF;

    -- 2. Location freshness check (reject readings older than 60 seconds)
    IF p_user_location_timestamp IS NOT NULL
       AND p_user_location_timestamp < NOW() - INTERVAL '60 seconds' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'check_in_id', NULL,
            'denial_reason', 'stale_location'
        );
    END IF;

    -- 3. Venue upsert: insert or update venue by google_place_id
    INSERT INTO venues (google_place_id, name, address, location, types, photo_url, rating)
    VALUES (
        p_place_id,
        p_name,
        p_address,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_types,
        p_photo_url,
        p_rating
    )
    ON CONFLICT (google_place_id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        types = EXCLUDED.types,
        photo_url = COALESCE(EXCLUDED.photo_url, venues.photo_url),
        rating = COALESCE(EXCLUDED.rating, venues.rating)
    RETURNING id, location INTO v_venue_id, v_venue_location;

    -- 4. Distance check: user must be within 100 meters of venue
    IF NOT ST_DWithin(
        v_venue_location,
        ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
        100
    ) THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'check_in_id', NULL,
            'denial_reason', 'too_far'
        );
    END IF;

    -- 5. Cooldown check: reject re-check-in to same venue within 5 minutes of checkout
    SELECT EXISTS(
        SELECT 1 FROM check_ins
        WHERE user_id = v_user_id
          AND venue_id = v_venue_id
          AND checked_out_at IS NOT NULL
          AND checked_out_at > NOW() - INTERVAL '5 minutes'
    ) INTO v_cooldown_exists;

    IF v_cooldown_exists THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'check_in_id', NULL,
            'denial_reason', 'cooldown'
        );
    END IF;

    -- 6. Deactivate existing active check-in (one-active-check-in enforcement)
    UPDATE check_ins
    SET is_active = FALSE, checked_out_at = NOW()
    WHERE user_id = v_user_id AND is_active = TRUE;

    -- 7. Create new check-in with visibility
    INSERT INTO check_ins (user_id, venue_id, is_active, open_to_meeting, visibility)
    VALUES (v_user_id, v_venue_id, TRUE, p_open_to_meeting, p_visibility)
    RETURNING id INTO v_check_in_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'check_in_id', v_check_in_id,
        'denial_reason', NULL
    );
END;
$$;

-- Grant execute to authenticated users with the 14-param signature (matching 022)
GRANT EXECUTE ON FUNCTION check_in_to_place_v2(
    TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT[],
    TEXT, DOUBLE PRECISION, BOOLEAN, TEXT,
    DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TIMESTAMPTZ
) TO authenticated;
