ALTER TABLE public.medical_records ADD COLUMN is_urgent boolean NOT NULL DEFAULT false;
ALTER TABLE public.medical_records ADD COLUMN ai_analysis text;