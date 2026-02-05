-- Fix venue_metadata RLS policies - allow any authenticated user to manage
-- This is cache data, not user-owned data, so permissive policies are appropriate

-- Drop all existing write policies
DROP POLICY IF EXISTS "Authenticated users can insert venue metadata" ON venue_metadata;
DROP POLICY IF EXISTS "Authenticated users can update venue metadata" ON venue_metadata;
DROP POLICY IF EXISTS "Service role can manage venue metadata" ON venue_metadata;

-- Create a single permissive policy for authenticated users
-- Upsert requires both INSERT and UPDATE with matching USING/WITH CHECK
CREATE POLICY "Authenticated users can manage venue metadata" ON venue_metadata
    FOR ALL 
    USING (true)
    WITH CHECK (auth.uid() IS NOT NULL);
