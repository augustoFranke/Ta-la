-- get_chat_matches: returns enriched match list for chat screen (Spec 007)
-- Returns each confirmed match with partner info, last message preview, and unread count.

CREATE OR REPLACE FUNCTION get_chat_matches(p_user_id UUID)
RETURNS TABLE (
  match_id         UUID,
  partner_id       UUID,
  partner_name     TEXT,
  partner_photo_url TEXT,
  matched_at       TIMESTAMPTZ,
  last_message     TEXT,
  last_message_at  TIMESTAMPTZ,
  unread_count     INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id                                                                  AS match_id,
    CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END AS partner_id,
    u.name                                                                AS partner_name,
    (
      SELECT p.url
      FROM photos p
      WHERE p.user_id = CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END
      ORDER BY p."order" ASC
      LIMIT 1
    )                                                                     AS partner_photo_url,
    m.matched_at,
    last_msg.content                                                      AS last_message,
    last_msg.created_at                                                   AS last_message_at,
    COALESCE(unread.cnt, 0)::INT                                         AS unread_count
  FROM matches m
  JOIN users u
    ON u.id = CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END
  LEFT JOIN LATERAL (
    SELECT msg.content, msg.created_at
    FROM messages msg
    WHERE msg.match_id = m.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) last_msg ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INT AS cnt
    FROM messages msg
    WHERE msg.match_id = m.id
      AND msg.sender_id != p_user_id
      AND msg.is_read = FALSE
  ) unread ON TRUE
  WHERE (m.user1_id = p_user_id OR m.user2_id = p_user_id)
    AND m.confirmed = TRUE
  ORDER BY last_msg.created_at DESC NULLS LAST, m.matched_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_chat_matches(UUID) TO authenticated;
