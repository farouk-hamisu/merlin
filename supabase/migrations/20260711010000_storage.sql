-- 1. Insert Storage Buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('passports', 'passports', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png']),
  ('reports', 'reports', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 2. Enable policies (drop if exist first to ensure idempotency)
DROP POLICY IF EXISTS "Public Access to Passports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload to Passports" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Passports" ON storage.objects;

DROP POLICY IF EXISTS "Public Access to Reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload to Reports" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Reports" ON storage.objects;

-- 3. Create Storage Policies for 'passports' bucket
CREATE POLICY "Public Access to Passports"
ON storage.objects FOR SELECT
USING ( bucket_id = 'passports' );

CREATE POLICY "Authenticated Upload to Passports"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'passports' AND auth.role() = 'authenticated' );

CREATE POLICY "Admin Delete Passports"
ON storage.objects FOR DELETE
USING ( bucket_id = 'passports' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
));

-- 4. Create Storage Policies for 'reports' bucket
CREATE POLICY "Public Access to Reports"
ON storage.objects FOR SELECT
USING ( bucket_id = 'reports' );

CREATE POLICY "Authenticated Upload to Reports"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'reports' AND auth.role() = 'authenticated' );

CREATE POLICY "Admin Delete Reports"
ON storage.objects FOR DELETE
USING ( bucket_id = 'reports' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
));
