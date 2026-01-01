-- Add document_link column to contracts table for external file links (Google Drive, OneDrive, etc.)
ALTER TABLE public.contracts ADD COLUMN document_link text;