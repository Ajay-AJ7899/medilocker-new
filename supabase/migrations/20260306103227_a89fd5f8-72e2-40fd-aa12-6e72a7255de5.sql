
-- Fix profiles SELECT policies: drop RESTRICTIVE, recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Doctors can view patient profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Fix user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fix medical_records policies
DROP POLICY IF EXISTS "Patients can view own records" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can view patient records" ON public.medical_records;
DROP POLICY IF EXISTS "Admins can view all records" ON public.medical_records;
DROP POLICY IF EXISTS "Patients can insert own records" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can add records to patients" ON public.medical_records;
DROP POLICY IF EXISTS "Patients can update own records" ON public.medical_records;
DROP POLICY IF EXISTS "Patients can delete own added records" ON public.medical_records;

CREATE POLICY "Patients can view own records" ON public.medical_records FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view patient records" ON public.medical_records FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admins can view all records" ON public.medical_records FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients can insert own records" ON public.medical_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can add records to patients" ON public.medical_records FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Patients can update own records" ON public.medical_records FOR UPDATE TO authenticated USING (auth.uid() = patient_id AND auth.uid() = added_by);
CREATE POLICY "Patients can delete own added records" ON public.medical_records FOR DELETE TO authenticated USING (auth.uid() = patient_id AND auth.uid() = added_by);

-- Fix health_scores policies
DROP POLICY IF EXISTS "Patients can view own scores" ON public.health_scores;
DROP POLICY IF EXISTS "System can insert scores" ON public.health_scores;

CREATE POLICY "Patients can view own scores" ON public.health_scores FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "System can insert scores" ON public.health_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);

-- Fix medical_documents policies
DROP POLICY IF EXISTS "Patients can view own documents" ON public.medical_documents;
DROP POLICY IF EXISTS "Doctors can view patient documents" ON public.medical_documents;
DROP POLICY IF EXISTS "Patients can upload own documents" ON public.medical_documents;
DROP POLICY IF EXISTS "Doctors can upload documents for patients" ON public.medical_documents;

CREATE POLICY "Patients can view own documents" ON public.medical_documents FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view patient documents" ON public.medical_documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Patients can upload own documents" ON public.medical_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can upload documents for patients" ON public.medical_documents FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'doctor'));

-- Fix chat_messages policy
DROP POLICY IF EXISTS "Users can manage own messages" ON public.chat_messages;
CREATE POLICY "Users can manage own messages" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Fix insurance_policies
DROP POLICY IF EXISTS "Patients can view own insurance" ON public.insurance_policies;
DROP POLICY IF EXISTS "Doctors can view patient insurance" ON public.insurance_policies;
DROP POLICY IF EXISTS "Admins can view all insurance" ON public.insurance_policies;
DROP POLICY IF EXISTS "Patients can insert own insurance" ON public.insurance_policies;
DROP POLICY IF EXISTS "Patients can update own insurance" ON public.insurance_policies;
DROP POLICY IF EXISTS "Patients can delete own insurance" ON public.insurance_policies;

CREATE POLICY "Patients can view own insurance" ON public.insurance_policies FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view patient insurance" ON public.insurance_policies FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admins can view all insurance" ON public.insurance_policies FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients can insert own insurance" ON public.insurance_policies FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update own insurance" ON public.insurance_policies FOR UPDATE TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Patients can delete own insurance" ON public.insurance_policies FOR DELETE TO authenticated USING (auth.uid() = patient_id);

-- Fix predictions policies
DROP POLICY IF EXISTS "Patients can view own predictions" ON public.predictions;
DROP POLICY IF EXISTS "Doctors can view all predictions" ON public.predictions;
DROP POLICY IF EXISTS "Admins can view all predictions" ON public.predictions;
DROP POLICY IF EXISTS "Patients can insert own predictions" ON public.predictions;
DROP POLICY IF EXISTS "Doctors can insert predictions" ON public.predictions;
DROP POLICY IF EXISTS "Doctors can update predictions" ON public.predictions;

CREATE POLICY "Patients can view own predictions" ON public.predictions FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view all predictions" ON public.predictions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admins can view all predictions" ON public.predictions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients can insert own predictions" ON public.predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can insert predictions" ON public.predictions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors can update predictions" ON public.predictions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'doctor'));

-- Fix prediction_feedback policies
DROP POLICY IF EXISTS "Patients can view own prediction feedback" ON public.prediction_feedback;
DROP POLICY IF EXISTS "Doctors can view feedback" ON public.prediction_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.prediction_feedback;
DROP POLICY IF EXISTS "Doctors can insert feedback" ON public.prediction_feedback;

CREATE POLICY "Patients can view own prediction feedback" ON public.prediction_feedback FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM predictions WHERE predictions.id = prediction_feedback.prediction_id AND predictions.patient_id = auth.uid()));
CREATE POLICY "Doctors can view feedback" ON public.prediction_feedback FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admins can view all feedback" ON public.prediction_feedback FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Doctors can insert feedback" ON public.prediction_feedback FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id);
