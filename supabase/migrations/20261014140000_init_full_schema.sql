-- ==============================================================================
-- Aarogya Sahayak: Consolidated Master Baseline Migration
-- Version: 20261014140000_init_full_schema.sql
-- Description: Complete schema bootstrap for fresh Supabase projects including
--              extensions, custom enums, profiles, ASHA profiles, patient requests,
--              vitals, reminders, auth signup triggers, RLS policies, and indexes.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES / ENUMS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('patient', 'asha_worker');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
    CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level_type') THEN
    CREATE TYPE public.risk_level_type AS ENUM ('low', 'medium', 'moderate', 'high');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_category') THEN
    CREATE TYPE public.reminder_category AS ENUM ('medication', 'checkup', 'exercise');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_frequency') THEN
    CREATE TYPE public.reminder_frequency AS ENUM ('daily', 'weekly', 'monthly');
  END IF;
END $$;

-- 3. CORE PROFILES TABLES

-- Public Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ASHA Worker Detailed Profiles
CREATE TABLE IF NOT EXISTS public.asha_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id TEXT UNIQUE NOT NULL,
  experience_years INTEGER DEFAULT 0,
  specialization TEXT,
  location TEXT,
  qualification TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. HEALTH & WORKFLOW TABLES

-- Patient Requests (Links patients to ASHA workers)
CREATE TABLE IF NOT EXISTS public.patient_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asha_worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vitals (Daily health metrics and AI risk level)
CREATE TABLE IF NOT EXISTS public.vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  glucose NUMERIC,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  weight NUMERIC,
  bmi NUMERIC,
  risk_level public.risk_level_type,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reminders (Patient schedules for medication, checkups, exercises)
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.reminder_category NOT NULL,
  time TIME NOT NULL,
  frequency public.reminder_frequency NOT NULL DEFAULT 'daily',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. AUTOMATED TIMESTAMP & AUTH TRIGGERS

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_asha_profiles_updated_at ON public.asha_profiles;
CREATE TRIGGER update_asha_profiles_updated_at
  BEFORE UPDATE ON public.asha_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_requests_updated_at ON public.patient_requests;
CREATE TRIGGER update_patient_requests_updated_at
  BEFORE UPDATE ON public.patient_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auth user creation hook: creates profiles and asha_profiles seamlessly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val public.user_role;
  raw_worker_id TEXT;
BEGIN
  -- Determine role from metadata, defaulting to patient
  user_role_val := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'patient'::public.user_role
  );

  -- Insert or update user profile
  INSERT INTO public.profiles (user_id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    user_role_val
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    role = EXCLUDED.role,
    updated_at = now();

  -- If ASHA worker, initialize asha_profiles entry
  IF user_role_val = 'asha_worker' THEN
    raw_worker_id := COALESCE(
      NEW.raw_user_meta_data->>'worker_id',
      NEW.raw_user_meta_data->>'workerId',
      'ASHA-' || UPPER(SUBSTRING(NEW.id::TEXT FROM 1 FOR 8))
    );

    INSERT INTO public.asha_profiles (
      user_id,
      worker_id,
      experience_years,
      specialization,
      location,
      qualification,
      is_verified
    )
    VALUES (
      NEW.id,
      raw_worker_id,
      COALESCE(
        (NEW.raw_user_meta_data->>'experience_years')::INTEGER,
        (NEW.raw_user_meta_data->>'experienceYears')::INTEGER,
        0
      ),
      NEW.raw_user_meta_data->>'specialization',
      NEW.raw_user_meta_data->>'location',
      COALESCE(NEW.raw_user_meta_data->>'qualification', NEW.raw_user_meta_data->>'qualifications'),
      false
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asha_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "ASHA workers can view assigned patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Anyone authenticated can view ASHA profiles" ON public.asha_profiles;
DROP POLICY IF EXISTS "ASHA workers can update their own profile" ON public.asha_profiles;
DROP POLICY IF EXISTS "ASHA workers can insert their own profile" ON public.asha_profiles;

DROP POLICY IF EXISTS "Patients can view their own requests" ON public.patient_requests;
DROP POLICY IF EXISTS "ASHA workers can view requests assigned to them" ON public.patient_requests;
DROP POLICY IF EXISTS "Patients can insert their own requests" ON public.patient_requests;
DROP POLICY IF EXISTS "ASHA workers can update requests assigned to them" ON public.patient_requests;

DROP POLICY IF EXISTS "Patients can view their own vitals" ON public.vitals;
DROP POLICY IF EXISTS "ASHA workers can view assigned patient vitals" ON public.vitals;
DROP POLICY IF EXISTS "Patients can insert their own vitals" ON public.vitals;
DROP POLICY IF EXISTS "Patients can update their own vitals" ON public.vitals;
DROP POLICY IF EXISTS "Patients can delete their own vitals" ON public.vitals;

DROP POLICY IF EXISTS "Patients can view their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Patients can insert their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Patients can update their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Patients can delete their own reminders" ON public.reminders;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ASHA workers can view assigned patient profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_requests pr
      WHERE pr.patient_id = public.profiles.user_id
        AND pr.asha_worker_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for asha_profiles
CREATE POLICY "Anyone authenticated can view ASHA profiles"
  ON public.asha_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ASHA workers can update their own profile"
  ON public.asha_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ASHA workers can insert their own profile"
  ON public.asha_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for patient_requests
CREATE POLICY "Patients can view their own requests"
  ON public.patient_requests FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "ASHA workers can view requests assigned to them"
  ON public.patient_requests FOR SELECT
  USING (auth.uid() = asha_worker_id);

CREATE POLICY "Patients can insert their own requests"
  ON public.patient_requests FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "ASHA workers can update requests assigned to them"
  ON public.patient_requests FOR UPDATE
  USING (auth.uid() = asha_worker_id)
  WITH CHECK (auth.uid() = asha_worker_id);

-- Policies for vitals
CREATE POLICY "Patients can view their own vitals"
  ON public.vitals FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "ASHA workers can view assigned patient vitals"
  ON public.vitals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_requests pr
      WHERE pr.patient_id = public.vitals.patient_id
        AND pr.asha_worker_id = auth.uid()
        AND pr.status = 'accepted'
    )
  );

CREATE POLICY "Patients can insert their own vitals"
  ON public.vitals FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own vitals"
  ON public.vitals FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their own vitals"
  ON public.vitals FOR DELETE
  USING (auth.uid() = patient_id);

-- Policies for reminders
CREATE POLICY "Patients can view their own reminders"
  ON public.reminders FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert their own reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own reminders"
  ON public.reminders FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their own reminders"
  ON public.reminders FOR DELETE
  USING (auth.uid() = patient_id);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_asha_profiles_user_id ON public.asha_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_requests_patient_id ON public.patient_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_requests_asha_worker_id ON public.patient_requests(asha_worker_id);
CREATE INDEX IF NOT EXISTS idx_patient_requests_status ON public.patient_requests(status);
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON public.vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_created_at ON public.vitals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_patient_id ON public.reminders(patient_id);
