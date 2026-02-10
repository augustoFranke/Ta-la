-- notification_preferences: per-category notification toggles (opt-out model)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  social_drinks BOOLEAN NOT NULL DEFAULT TRUE,
  social_matches BOOLEAN NOT NULL DEFAULT TRUE,
  venue_offers BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id)
);

-- Explicit index on user_id for clarity (UNIQUE already creates one)
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Server-side function to check if a user should receive a notification for a given category
-- Opt-out model: returns TRUE when no row exists (user never configured preferences)
CREATE OR REPLACE FUNCTION should_notify_user(p_user_id UUID, p_category TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefs notification_preferences%ROWTYPE;
BEGIN
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- No preferences row = all enabled (opt-out model)
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  -- Check the specific category column
  CASE p_category
    WHEN 'social_drinks' THEN RETURN v_prefs.social_drinks;
    WHEN 'social_matches' THEN RETURN v_prefs.social_matches;
    WHEN 'venue_offers' THEN RETURN v_prefs.venue_offers;
    ELSE RETURN TRUE; -- Unknown categories default to enabled
  END CASE;
END;
$$;

GRANT EXECUTE ON FUNCTION should_notify_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION should_notify_user(UUID, TEXT) TO service_role;
