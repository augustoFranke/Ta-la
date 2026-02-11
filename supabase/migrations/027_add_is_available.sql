-- Adds is_available toggle for users to control drink offer reception.
-- Default TRUE = users are available by default.
-- Also updates send_drink_offer_v2 to enforce receiver availability server-side.

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;

-- Update send_drink_offer_v2 to check receiver availability
-- Adds receiver_unavailable check AFTER self_drink and BEFORE active check-in validation
CREATE OR REPLACE FUNCTION send_drink_offer_v2(
    p_receiver_id UUID,
    p_venue_id UUID,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_id UUID;
    v_drink_id UUID;
    v_receiver_available BOOLEAN;
BEGIN
    -- 1. Auth check
    v_sender_id := auth.uid();
    IF v_sender_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'not_authenticated');
    END IF;

    -- 2. Self-drink check
    IF v_sender_id = p_receiver_id THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'self_drink');
    END IF;

    -- 3. Receiver availability check
    SELECT is_available INTO v_receiver_available FROM users WHERE id = p_receiver_id;
    IF NOT COALESCE(v_receiver_available, TRUE) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'receiver_unavailable');
    END IF;

    -- 4. Active check-in validation at specified venue
    IF NOT EXISTS (
        SELECT 1 FROM check_ins
        WHERE user_id = v_sender_id
          AND venue_id = p_venue_id
          AND is_active = TRUE
          AND checked_out_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'no_active_check_in');
    END IF;

    -- 5. Insert drink offer
    BEGIN
        INSERT INTO drinks (sender_id, receiver_id, venue_id, note)
        VALUES (v_sender_id, p_receiver_id, p_venue_id, p_note)
        RETURNING id INTO v_drink_id;
    EXCEPTION
        WHEN unique_violation THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'already_sent');
    END;

    RETURN jsonb_build_object('success', TRUE, 'drink_id', v_drink_id);
END;
$$;

GRANT EXECUTE ON FUNCTION send_drink_offer_v2(UUID, UUID, TEXT) TO authenticated;
