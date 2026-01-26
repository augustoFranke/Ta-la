-- Função para buscar usuários no mesmo venue, ordenados por similaridade
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
    similarity_score FLOAT
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
        ) as similarity_score
    FROM users u
    INNER JOIN check_ins c ON c.user_id = u.id
    WHERE c.venue_id = p_venue_id
        AND c.is_active = TRUE
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

-- Função para criar match quando ambos enviam drinks
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reverse_drink_exists BOOLEAN;
    v_match_id UUID;
BEGIN
    -- Só executa quando drink é aceito
    IF NEW.status != 'accepted' THEN
        RETURN NEW;
    END IF;

    -- Verifica se existe drink no sentido contrário
    SELECT EXISTS(
        SELECT 1 FROM drinks
        WHERE sender_id = NEW.receiver_id
        AND receiver_id = NEW.sender_id
        AND status = 'accepted'
    ) INTO v_reverse_drink_exists;

    IF v_reverse_drink_exists THEN
        -- Cria match com IDs ordenados
        INSERT INTO matches (user1_id, user2_id, venue_id)
        VALUES (
            LEAST(NEW.sender_id, NEW.receiver_id),
            GREATEST(NEW.sender_id, NEW.receiver_id),
            NEW.venue_id
        )
        ON CONFLICT (user1_id, user2_id) DO NOTHING
        RETURNING id INTO v_match_id;
        
        -- Aqui podemos notificar via Edge Function
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_match
    AFTER UPDATE ON drinks
    FOR EACH ROW
    WHEN (OLD.status != NEW.status)
    EXECUTE FUNCTION check_and_create_match();

-- Função para checkout automático após 4 horas
CREATE OR REPLACE FUNCTION auto_checkout_expired()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE check_ins
    SET is_active = FALSE, checked_out_at = NOW()
    WHERE is_active = TRUE
    AND checked_in_at < NOW() - INTERVAL '4 hours';
END;
$$;
