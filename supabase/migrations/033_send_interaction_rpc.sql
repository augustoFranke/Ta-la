-- Server-side RPC for sending interactions (wave, like, drink).
-- Validates auth, self-interaction, type, receiver availability, and active check-ins.
-- Returns is_match boolean by checking matches table after the trigger fires.

CREATE OR REPLACE FUNCTION send_interaction(
    p_receiver_id UUID,
    p_venue_id UUID,
    p_interaction_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_id UUID;
    v_interaction_id UUID;
    v_is_match BOOLEAN;
BEGIN
    -- 1. Auth check
    v_sender_id := auth.uid();
    IF v_sender_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'not_authenticated');
    END IF;

    -- 2. Self-interaction check
    IF v_sender_id = p_receiver_id THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'self_interaction');
    END IF;

    -- 3. Validate interaction_type
    IF p_interaction_type NOT IN ('drink', 'wave', 'like') THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'invalid_type');
    END IF;

    -- 4. Receiver availability check
    IF NOT COALESCE((SELECT is_available FROM users WHERE id = p_receiver_id), TRUE) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'receiver_unavailable');
    END IF;

    -- 5. Sender must have active check-in at venue
    IF NOT EXISTS (
        SELECT 1 FROM check_ins
        WHERE user_id = v_sender_id
          AND venue_id = p_venue_id
          AND is_active = TRUE
          AND checked_out_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'no_active_check_in');
    END IF;

    -- 6. Receiver must have active check-in at same venue
    IF NOT EXISTS (
        SELECT 1 FROM check_ins
        WHERE user_id = p_receiver_id
          AND venue_id = p_venue_id
          AND is_active = TRUE
          AND checked_out_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'receiver_not_at_venue');
    END IF;

    -- 7. Insert interaction (UNIQUE constraint prevents duplicates per type)
    BEGIN
        INSERT INTO interactions (sender_id, receiver_id, venue_id, interaction_type)
        VALUES (v_sender_id, p_receiver_id, p_venue_id, p_interaction_type)
        RETURNING id INTO v_interaction_id;
    EXCEPTION
        WHEN unique_violation THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'already_sent');
    END;

    -- 8. Check if match was created by the trigger (fires in same transaction)
    SELECT EXISTS(
        SELECT 1 FROM matches
        WHERE user1_id = LEAST(v_sender_id, p_receiver_id)
          AND user2_id = GREATEST(v_sender_id, p_receiver_id)
          AND confirmed = TRUE
          AND unmatched_at IS NULL
    ) INTO v_is_match;

    -- 9. Return success with match status
    RETURN jsonb_build_object(
        'success', TRUE,
        'interaction_id', v_interaction_id,
        'is_match', v_is_match
    );
END;
$$;

GRANT EXECUTE ON FUNCTION send_interaction(UUID, UUID, TEXT) TO authenticated;
