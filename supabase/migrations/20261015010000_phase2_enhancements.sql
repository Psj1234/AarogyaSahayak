-- ==============================================================================
-- Aarogya Sahayak: Phase 2 Enhancements
-- Version: 20261015010000_phase2_enhancements.sql
-- Description: 
--   1. Add title column to public.reminders table for user reminder labels.
--   2. Add RLS policy on public.profiles allowing authenticated citizens to view
--      ASHA worker profiles (name, phone) when browsing the healthcare directory.
-- ==============================================================================

-- 1. Add title column to reminders if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'reminders' 
      AND column_name = 'title'
  ) THEN
    ALTER TABLE public.reminders ADD COLUMN title TEXT;
  END IF;
END $$;

-- 2. Add RLS policy allowing authenticated users to view ASHA worker basic profiles
DROP POLICY IF EXISTS "Anyone authenticated can view ASHA worker profiles" ON public.profiles;

CREATE POLICY "Anyone authenticated can view ASHA worker profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (role = 'asha_worker');
