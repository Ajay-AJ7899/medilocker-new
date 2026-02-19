
-- Insurance tracking table
CREATE TABLE public.insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  provider_name text NOT NULL,
  policy_number text NOT NULL,
  plan_type text, -- e.g. 'health', 'dental', 'vision'
  coverage_start date NOT NULL,
  coverage_end date,
  premium_amount numeric(10,2),
  status text NOT NULL DEFAULT 'active', -- active, expired, pending, cancelled
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own insurance" ON public.insurance_policies FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can insert own insurance" ON public.insurance_policies FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update own insurance" ON public.insurance_policies FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Patients can delete own insurance" ON public.insurance_policies FOR DELETE USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view patient insurance" ON public.insurance_policies FOR SELECT USING (has_role(auth.uid(), 'doctor'::app_role));
CREATE POLICY "Admins can view all insurance" ON public.insurance_policies FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_insurance_updated_at BEFORE UPDATE ON public.insurance_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add a short unique patient code to profiles for doctor lookup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS patient_code text UNIQUE;

-- Generate patient codes for existing profiles
UPDATE public.profiles SET patient_code = UPPER(SUBSTRING(id::text, 1, 8)) WHERE patient_code IS NULL;

-- Default patient_code for new profiles
CREATE OR REPLACE FUNCTION public.generate_patient_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.patient_code IS NULL THEN
    NEW.patient_code := UPPER(SUBSTRING(NEW.id::text, 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_patient_code BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.generate_patient_code();
