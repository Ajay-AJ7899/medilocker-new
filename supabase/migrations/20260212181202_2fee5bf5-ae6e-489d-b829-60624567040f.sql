
-- Allow patients to download their own medical documents from storage
-- Files are stored as: {patient_id}/{record_id}/{filename}
CREATE POLICY "Patients can download own medical documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow doctors to upload to any patient folder
CREATE POLICY "Doctors can upload medical documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-documents'
  AND has_role(auth.uid(), 'doctor'::app_role)
);
