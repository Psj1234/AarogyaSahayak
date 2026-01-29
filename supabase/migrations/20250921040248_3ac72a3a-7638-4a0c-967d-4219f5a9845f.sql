-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('patient', 'asha_worker');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ASHA worker profiles table
CREATE TABLE public.asha_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id TEXT UNIQUE NOT NULL,
  experience_years INTEGER DEFAULT 0,
  specialization TEXT,
  location TEXT,
  qualification TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient requests table
CREATE TABLE public.patient_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asha_worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asha_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS policies for ASHA profiles
CREATE POLICY "ASHA workers can view their own profile" 
ON public.asha_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "ASHA workers can update their own profile" 
ON public.asha_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "ASHA workers can insert their own profile" 
ON public.asha_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS policies for patient requests
CREATE POLICY "Patients can view their own requests" 
ON public.patient_requests 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "ASHA workers can view requests sent to them" 
ON public.patient_requests 
FOR SELECT 
USING (auth.uid() = asha_worker_id);

CREATE POLICY "Patients can create requests" 
ON public.patient_requests 
FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "ASHA workers can update requests sent to them" 
ON public.patient_requests 
FOR UPDATE 
USING (auth.uid() = asha_worker_id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asha_profiles_updated_at
  BEFORE UPDATE ON public.asha_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_requests_updated_at
  BEFORE UPDATE ON public.patient_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();