CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    checked_out_at TIMESTAMPTZ
);

CREATE INDEX idx_check_ins_active ON check_ins (venue_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_check_ins_user ON check_ins (user_id, is_active);

-- Garante apenas 1 check-in ativo por usuário
CREATE UNIQUE INDEX idx_check_ins_user_active ON check_ins (user_id) WHERE is_active = TRUE;

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see check-ins at their venue" ON check_ins
    FOR SELECT USING (
        is_active = TRUE AND
        EXISTS (
            SELECT 1 FROM check_ins c 
            WHERE c.user_id = auth.uid() 
            AND c.venue_id = check_ins.venue_id 
            AND c.is_active = TRUE
        )
    );

CREATE POLICY "Users can manage own check-ins" ON check_ins
    FOR ALL USING (auth.uid() = user_id);
