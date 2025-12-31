-- Create storage bucket for checklist photos and signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-files', 'checklist-files', true);

-- RLS policies for checklist files storage
CREATE POLICY "Users can upload checklist files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'checklist-files' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view checklist files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'checklist-files');

CREATE POLICY "Users can update own checklist files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'checklist-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own checklist files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'checklist-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);