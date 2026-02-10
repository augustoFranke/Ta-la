-- Update get_users_at_venue to support discovery visibility and recency indicators.
-- Changes from 011_create_functions.sql version:
--   1. Returns checked_in_at TIMESTAMPTZ for client-side recency display
--   2. Filters by c.visibility = 'public' (private/friends_only excluded from roster)
-- All existing logic preserved: gender preference, block exclusion, similarity scoring.

CREATE OR REPLACE FUNCTION get_users_at_venue(
    p_venue_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    bio TEXT,
    occupation TEXT,
    age INT,
    photos JSON,
    interests TEXT[],
    similarity_score FLOAT,
    checked_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_interests TEXT[];
    v_user_gender_pref TEXT;
    v_user_gender TEXT;
BEGIN
    -- Busca preferências do usuário atual
    SELECT 
        u.gender_preference, 
        u.gender,
        ARRAY(SELECT tag FROM interests i WHERE i.user_id = p_user_id)
    INTO v_user_gender_pref, v_user_gender, v_user_interests
    FROM users u WHERE u.id = p_user_id;

    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.bio,
        u.occupation,
        EXTRACT(YEAR FROM AGE(u.birth_date))::INT as age,
        (
            SELECT json_agg(json_build_object('url', p.url, 'order', p."order") ORDER BY p."order")
            FROM photos p WHERE p.user_id = u.id
        ) as photos,
        ARRAY(SELECT tag FROM interests i WHERE i.user_id = u.id) as interests,
        -- Score de similaridade baseado em interesses em comum
        (
            SELECT COUNT(*)::FLOAT / GREATEST(array_length(v_user_interests, 1), 1)
            FROM interests i
            WHERE i.user_id = u.id AND i.tag = ANY(v_user_interests)
        ) as similarity_score,
        c.checked_in_at
    FROM users u
    INNER JOIN check_ins c ON c.user_id = u.id
    WHERE c.venue_id = p_venue_id
        AND c.is_active = TRUE
        AND c.visibility = 'public'
        AND u.id != p_user_id
        AND u.is_verified = TRUE
        -- Filtro de preferência de gênero (bidirecional)
        AND (v_user_gender_pref = 'todos' OR u.gender = v_user_gender_pref)
        AND (u.gender_preference = 'todos' OR v_user_gender = u.gender_preference)
        -- Exclui usuários bloqueados
        AND NOT EXISTS (
            SELECT 1 FROM blocks b 
            WHERE (b.blocker_id = p_user_id AND b.blocked_id = u.id)
               OR (b.blocker_id = u.id AND b.blocked_id = p_user_id)
        )
    ORDER BY similarity_score DESC, u.last_active DESC;
END;
$$;
