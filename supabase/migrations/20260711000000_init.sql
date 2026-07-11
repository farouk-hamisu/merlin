-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table (Linked to Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    generation_balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Activation Keys Table
CREATE TABLE IF NOT EXISTS public.activation_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    is_used BOOLEAN NOT NULL DEFAULT false,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Drug Tests Table
CREATE TABLE IF NOT EXISTS public.drug_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    passport_url TEXT NOT NULL,
    applicant_id TEXT NOT NULL UNIQUE,
    certificate_number TEXT NOT NULL UNIQUE,
    qr_code_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    download_count INTEGER NOT NULL DEFAULT 0
);

-- 4. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Verification Logs Table
CREATE TABLE IF NOT EXISTS public.verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.drug_tests(id) ON DELETE CASCADE NOT NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies

-- Profiles Policies
CREATE POLICY "Allow users to read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow admin full access to profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Activation Keys Policies
CREATE POLICY "Allow users to read keys" ON public.activation_keys
    FOR SELECT USING (auth.role() = 'authenticated');

-- We allow the service-role or backend to update keys, and admin to do anything
CREATE POLICY "Allow admin full access to keys" ON public.activation_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Drug Tests Policies
CREATE POLICY "Allow users to read own drug tests" ON public.drug_tests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own drug tests" ON public.drug_tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Read-only policy for public verification
CREATE POLICY "Allow public read of drug tests for verification" ON public.drug_tests
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to drug tests" ON public.drug_tests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Settings Policies
CREATE POLICY "Allow public read of settings" ON public.settings
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to settings" ON public.settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Verification Logs Policies
-- Allow anyone (e.g. backend log scanner) to insert logs
CREATE POLICY "Allow public insert of logs" ON public.verification_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to view logs of their own tests" ON public.verification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.drug_tests
            WHERE drug_tests.id = verification_logs.document_id AND drug_tests.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow admin full access to logs" ON public.verification_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Auto-update timestamps trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_settings_modtime
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Create Trigger for Auth.users synchronization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (new.id, new.email, 'user', 'active');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Seed Default Settings
INSERT INTO public.settings (key, value)
VALUES ('telegram_username', '@merlin_admin')
ON CONFLICT (key) DO NOTHING;
