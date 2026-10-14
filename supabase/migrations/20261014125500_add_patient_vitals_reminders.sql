-- Phase 1 Migration: Add patient_requests, vitals, and reminders tables with RLS
-- Extension for uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Table: patient_requests
-- Links citizens (patients) to ASHA workers
-- ==========================================
CREATE TABLE IF NOT EXISTS public.patient_requests (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asha_worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ensure check constraint for status allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_requests_status_check'
  ) THEN
    ALTER TABLE public.patient_requests
      ADD CONSTRAINT patient_requests_status_check
      CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'));
  END IF;
END $$;

-- Enable RLS on patient_requests
ALTER TABLE public.patient_requests ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Patients can view their own requests" ON public.patient_requests;
DROP POLICY IF EXISTS "Patients can create requests" ON public.patient_requests;
DROP POLICY IF EXISTS "Patients can insert their own requests" ON public.patient_requests;
DROP POLICY IF EXISTS "ASHA workers can view requests sent to them" ON public.patient_requests;
DROP POLICY IF EXISTS "ASHA workers can view requests assigned to them" ON public.patient_requests;
DROP POLICY IF EXISTS "ASHA workers can update requests sent to them" ON public.patient_requests;
DROP POLICY IF EXISTS "ASHA workers can update requests assigned to them" ON public.patient_requests;

-- RLS Policies for patient_requests
CREATE POLICY "Patients can view their own requests"
ON public.patient_requests
FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert their own requests"
ON public.patient_requests
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "ASHA workers can view requests assigned to them"
ON public.patient_requests
FOR SELECT
USING (auth.uid() = asha_worker_id);

CREATE POLICY "ASHA workers can update requests assigned to them"
ON public.patient_requests
FOR UPDATE
USING (auth.uid() = asha_worker_id)
WITH CHECK (auth.uid() = asha_worker_id);

-- Trigger for patient_requests updated_at
DROP TRIGGER IF EXISTS update_patient_requests_updated_at ON public.patient_requests;
CREATE TRIGGER update_patient_requests_updated_at
  BEFORE UPDATE ON public.patient_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- 2. Table: vitals
-- Stores daily health logs (glucose, blood pressure, weight, BMI, risk assessment)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vitals (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  glucose NUMERIC,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  weight NUMERIC,
  bmi NUMERIC,
  risk_level VARCHAR(20) CHECK (risk_level IS NULL OR risk_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vitals
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Patients can view their own vitals" ON public.vitals;
DROP POLICY IF EXISTS "Patients can insert their own vitals" ON public.vitals;
DROP POLICY IF EXISTS "Patients can update their own vitals" ON public.vitals;
DROP POLICY IF EXISTS "Patients can delete their own vitals" ON public.vitals;

-- RLS Policies for vitals
CREATE POLICY "Patients can view their own vitals"
ON public.vitals
FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert their own vitals"
ON public.vitals
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own vitals"
ON public.vitals
FOR UPDATE
USING (auth.uid() = patient_id)
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their own vitals"
ON public.vitals
FOR DELETE
USING (auth.uid() = patient_id);


-- ==========================================
-- 3. Table: reminders
-- Stores patient schedules (medications, checkups, exercises)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('medication', 'checkup', 'exercise')),
  time TIME NOT NULL,
  frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Patients can view their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Patients can insert their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Patients can update their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Patients can delete their own reminders" ON public.reminders;

-- RLS Policies for reminders
CREATE POLICY "Patients can view their own reminders"
ON public.reminders
FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert their own reminders"
ON public.reminders
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own reminders"
ON public.reminders
FOR UPDATE
USING (auth.uid() = patient_id)
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their own reminders"
ON public.reminders
FOR DELETE
USING (auth.uid() = patient_id);


-- ==========================================
-- Performance Indexes for Foreign Keys & RLS
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON public.vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_patient_id ON public.reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_requests_patient_id ON public.patient_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_requests_asha_worker_id ON public.patient_requests(asha_worker_id);
