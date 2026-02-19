
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  predicted_disease TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low',
  explainability JSONB NOT NULL DEFAULT '[]'::jsonb,
  prevention JSONB NOT NULL DEFAULT '[]'::jsonb,
  reference_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own predictions"
ON public.predictions FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view all predictions"
ON public.predictions FOR SELECT USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can insert predictions"
ON public.predictions FOR INSERT WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can update predictions"
ON public.predictions FOR UPDATE USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Patients can insert own predictions"
ON public.predictions FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Admins can view all predictions"
ON public.predictions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_predictions_updated_at
BEFORE UPDATE ON public.predictions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.prediction_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('accepted', 'rejected')),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prediction_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can insert feedback"
ON public.prediction_feedback FOR INSERT
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role) AND auth.uid() = doctor_id);

CREATE POLICY "Doctors can view feedback"
ON public.prediction_feedback FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Patients can view own prediction feedback"
ON public.prediction_feedback FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.predictions
  WHERE predictions.id = prediction_feedback.prediction_id
  AND predictions.patient_id = auth.uid()
));

CREATE POLICY "Admins can view all feedback"
ON public.prediction_feedback FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
