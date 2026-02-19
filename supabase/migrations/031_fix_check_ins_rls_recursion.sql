-- Fix infinite recursion in check_ins RLS policy.
-- The original "Users can see check-ins at their venue" policy used a subquery
-- on check_ins itself, triggering infinite recursion (error code 42P17).
-- Fix: replace with a venue_id IN subquery on a non-recursive source — the
-- user's own row is found via user_id = auth.uid() using the separate
-- "Users can manage own check-ins" policy path, but we bypass that by
-- looking up venue membership directly without re-entering the SELECT policy.

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can see check-ins at their venue" ON check_ins;

-- Replace with a non-recursive equivalent using a security-definer function
-- to look up which venue the current user is checked into.
CREATE OR REPLACE FUNCTION get_my_active_venue_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT venue_id FROM check_ins
  WHERE user_id = auth.uid() AND is_active = TRUE
  LIMIT 1;
$$;

-- Grant to authenticated users
GRANT EXECUTE ON FUNCTION get_my_active_venue_id() TO authenticated;

-- New policy: uses the function to avoid recursive policy evaluation
CREATE POLICY "Users can see check-ins at their venue" ON check_ins
    FOR SELECT USING (
        is_active = TRUE AND
        venue_id = get_my_active_venue_id()
    );
