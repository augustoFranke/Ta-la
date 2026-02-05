-- Fix venue_metadata RLS policies
-- auth.role() returns 'anon' or 'service_role', not 'authenticated'
-- Use auth.uid() IS NOT NULL to check for authenticated users

-- Drop incorrect policies
DROP POLICY IF EXISTS "Authenticated users can upsert venue metadata" ON venue_metadata;
DROP POLICY IF EXISTS "Authenticated users can update venue metadata" ON venue_metadata;

-- Create corrected policies using auth.uid() check
CREATE POLICY "Authenticated users can insert venue metadata" ON venue_metadata
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update venue metadata" ON venue_metadata
    FOR UPDATE USING (auth.uid() IS NOT NULL);
