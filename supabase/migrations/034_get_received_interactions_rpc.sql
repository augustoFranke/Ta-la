-- RPC to fetch received interactions for the "Quem te curtiu" section.
-- Returns sender info only for senders who are still actively checked in at the venue.
-- Also enables realtime for the interactions table.

CREATE OR REPLACE FUNCTION get_received_interactions(
    p_user_id UUID,
    p_venue_id UUID
)
RETURNS TABLE(
    id UUID,
    sender_id UUID,
    sender_name TEXT,
    sender_photo_url TEXT,
    interaction_type TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.sender_id,
        u.name AS sender_name,
        p.url AS sender_photo_url,
        i.interaction_type,
        i.created_at
    FROM interactions i
    JOIN check_ins ci
        ON ci.user_id = i.sender_id
        AND ci.venue_id = i.venue_id
        AND ci.is_active = TRUE
        AND ci.checked_out_at IS NULL
    JOIN users u
        ON u.id = i.sender_id
    LEFT JOIN photos p
        ON p.user_id = i.sender_id
        AND p."order" = 1
    WHERE i.receiver_id = p_user_id
      AND i.venue_id = p_venue_id
    ORDER BY i.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_received_interactions(UUID, UUID) TO authenticated;

-- Enable realtime for interactions table
ALTER PUBLICATION supabase_realtime ADD TABLE interactions;
