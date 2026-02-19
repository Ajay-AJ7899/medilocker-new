
-- Role enum
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'admin');

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'patient',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    wallet_address TEXT NOT NULL UNIQUE,
    full_name TEXT,
    date_of_birth DATE,
    blood_type TEXT,
    phone_number TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    allergies TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    onboarding_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Medical records table
CREATE TYPE public.record_category AS ENUM (
  'consultation', 'diagnosis', 'medication', 'surgery',
  'chronic_condition', 'treatment_plan', 'lab_result', 'allergy', 'vaccination'
);

CREATE TABLE public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category record_category NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own records" ON public.medical_records
  FOR SELECT TO authenticated USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert own records" ON public.medical_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update own records" ON public.medical_records
  FOR UPDATE TO authenticated USING (auth.uid() = patient_id AND auth.uid() = added_by);

CREATE POLICY "Patients can delete own added records" ON public.medical_records
  FOR DELETE TO authenticated USING (auth.uid() = patient_id AND auth.uid() = added_by);

CREATE POLICY "Doctors can view patient records" ON public.medical_records
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can add records to patients" ON public.medical_records
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Admins can view all records" ON public.medical_records
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Medical documents (file references)
CREATE TABLE public.medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own documents" ON public.medical_documents
  FOR SELECT TO authenticated USING (auth.uid() = patient_id);

CREATE POLICY "Patients can upload own documents" ON public.medical_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can view patient documents" ON public.medical_documents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can upload documents for patients" ON public.medical_documents
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'doctor'));

-- Health score snapshots
CREATE TABLE public.health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    factors JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own scores" ON public.health_scores
  FOR SELECT TO authenticated USING (auth.uid() = patient_id);

CREATE POLICY "System can insert scores" ON public.health_scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);

-- Chat messages for AI chatbot
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own messages" ON public.chat_messages
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-documents', 'medical-documents', false);

CREATE POLICY "Patients can upload own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Patients can view own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Doctors can view patient files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'medical-documents' AND public.has_role(auth.uid(), 'doctor'));
