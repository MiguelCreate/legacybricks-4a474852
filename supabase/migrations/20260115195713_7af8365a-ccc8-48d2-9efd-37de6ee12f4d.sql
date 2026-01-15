-- Create table for cloud provider connections (tokens stored encrypted)
CREATE TABLE public.cloud_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'onedrive')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Create table for property-specific cloud folder links
CREATE TABLE public.property_cloud_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.cloud_connections(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'onedrive')),
  root_folder_id TEXT NOT NULL,
  folder_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, provider)
);

-- Enable RLS
ALTER TABLE public.cloud_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_cloud_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for cloud_connections
CREATE POLICY "Users can view their own cloud connections"
ON public.cloud_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cloud connections"
ON public.cloud_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cloud connections"
ON public.cloud_connections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cloud connections"
ON public.cloud_connections
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for property_cloud_folders (user must own the property)
CREATE POLICY "Users can view their property cloud folders"
ON public.property_cloud_folders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_cloud_folders.property_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create property cloud folders"
ON public.property_cloud_folders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_cloud_folders.property_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their property cloud folders"
ON public.property_cloud_folders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_cloud_folders.property_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their property cloud folders"
ON public.property_cloud_folders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_cloud_folders.property_id 
    AND user_id = auth.uid()
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_cloud_connections_updated_at
BEFORE UPDATE ON public.cloud_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_cloud_folders_updated_at
BEFORE UPDATE ON public.property_cloud_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();