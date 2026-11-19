-- Fix infinite recursion in Row-Level Security policies.
--
-- The original admin policies on public.profiles queried public.profiles
-- directly. Because RLS applies to that subquery, evaluating the policy
-- re-evaluated itself and PostgreSQL raised:
--   "infinite recursion detected in policy for relation profiles"
--
-- A SECURITY DEFINER helper runs as the function owner (postgres), which
-- bypasses RLS, so the admin check can safely read the profiles table.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- Profiles
DROP POLICY IF EXISTS "Allow admin full access to profiles" ON public.profiles;
CREATE POLICY "Allow admin full access to profiles" ON public.profiles
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Activation Keys
DROP POLICY IF EXISTS "Allow admin full access to keys" ON public.activation_keys;
CREATE POLICY "Allow admin full access to keys" ON public.activation_keys
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Drug Tests
DROP POLICY IF EXISTS "Allow admin full access to drug tests" ON public.drug_tests;
CREATE POLICY "Allow admin full access to drug tests" ON public.drug_tests
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Settings
DROP POLICY IF EXISTS "Allow admin full access to settings" ON public.settings;
CREATE POLICY "Allow admin full access to settings" ON public.settings
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Verification Logs
DROP POLICY IF EXISTS "Allow admin full access to logs" ON public.verification_logs;
CREATE POLICY "Allow admin full access to logs" ON public.verification_logs
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Storage: admin delete policies also referenced public.profiles directly
DROP POLICY IF EXISTS "Admin Delete Passports" ON storage.objects;
CREATE POLICY "Admin Delete Passports"
ON storage.objects FOR DELETE
USING ( bucket_id = 'passports' AND public.is_admin() );

DROP POLICY IF EXISTS "Admin Delete Reports" ON storage.objects;
CREATE POLICY "Admin Delete Reports"
ON storage.objects FOR DELETE
USING ( bucket_id = 'reports' AND public.is_admin() );
