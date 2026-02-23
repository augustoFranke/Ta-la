-- In-app notification items (Spec 008 §4)

CREATE TABLE notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL CHECK (event_type IN ('mutual_like', 'offer_accepted', 'offer_rejected', 'like_received')),
  body        TEXT        NOT NULL,
  deep_link   TEXT,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role (Edge Functions) can insert notifications on behalf of users
GRANT INSERT ON notifications TO service_role;
GRANT SELECT, UPDATE ON notifications TO authenticated;
