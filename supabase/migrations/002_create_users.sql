CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    bio TEXT,
    occupation TEXT,
    gender TEXT NOT NULL CHECK (gender IN ('masculino', 'feminino', 'outro')),
    gender_preference TEXT NOT NULL CHECK (gender_preference IN ('masculino', 'feminino', 'todos')),
    is_verified BOOLEAN DEFAULT FALSE,
    location GEOGRAPHY(POINT, 4326),
    push_token TEXT,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice espacial para queries de proximidade
CREATE INDEX idx_users_location ON users USING GIST (location);

-- Índice para busca por verificação
CREATE INDEX idx_users_verified ON users (is_verified) WHERE is_verified = TRUE;

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view verified users" ON users
    FOR SELECT USING (is_verified = TRUE OR auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);
