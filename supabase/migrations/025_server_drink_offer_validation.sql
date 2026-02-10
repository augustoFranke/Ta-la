-- Server-side RPC that validates active check-in before inserting a drink offer.
-- Replaces direct client INSERT into drinks table with server-authoritative gating.

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

    -- 3. Active check-in validation at specified venue
    IF NOT EXISTS (
        SELECT 1 FROM check_ins
        WHERE user_id = v_sender_id
          AND venue_id = p_venue_id
          AND is_active = TRUE
          AND checked_out_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'no_active_check_in');
    END IF;

    -- 4. Insert drink offer
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
