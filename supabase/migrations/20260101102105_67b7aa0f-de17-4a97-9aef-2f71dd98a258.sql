-- Add VvE fields to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS vve_reserve_streef numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS vve_reserve_huidig numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS vve_maandbijdrage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS lift_aanwezig boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lift_beheerder_contact text,
ADD COLUMN IF NOT EXISTS gebouw_verzekering_polisnummer text,
ADD COLUMN IF NOT EXISTS gebouw_verzekering_vervaldatum date,
ADD COLUMN IF NOT EXISTS gebouw_verzekering_link text,
ADD COLUMN IF NOT EXISTS bouwkundig_rapport_link text,
ADD COLUMN IF NOT EXISTS energie_certificaat_gebouw_vervaldatum date;

-- Create enum for notulen status
CREATE TYPE public.notulen_status AS ENUM ('afgerond', 'open', 'uitgesteld');

-- Create gemeenschappelijke_notulen table
CREATE TABLE public.gemeenschappelijke_notulen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  datum date NOT NULL,
  beslissing text NOT NULL,
  kostenverdeling_percentage numeric DEFAULT 0,
  jouw_aandeel_euro numeric DEFAULT 0,
  status notulen_status NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for notulen
ALTER TABLE public.gemeenschappelijke_notulen ENABLE ROW LEVEL SECURITY;

-- RLS policies for notulen
CREATE POLICY "Users can view notulen of own properties"
ON public.gemeenschappelijke_notulen FOR SELECT
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = gemeenschappelijke_notulen.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can insert notulen for own properties"
ON public.gemeenschappelijke_notulen FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = gemeenschappelijke_notulen.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can update notulen of own properties"
ON public.gemeenschappelijke_notulen FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = gemeenschappelijke_notulen.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can delete notulen of own properties"
ON public.gemeenschappelijke_notulen FOR DELETE
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = gemeenschappelijke_notulen.property_id
  AND properties.user_id = auth.uid()
));

-- Create gemeenschappelijk_onderhoud table
CREATE TABLE public.gemeenschappelijk_onderhoud (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  element_naam text NOT NULL,
  laatste_onderhoud date,
  volgend_onderhoud date,
  frequentie_jaren integer DEFAULT 1,
  geschatte_kosten numeric DEFAULT 0,
  notities text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for onderhoud
ALTER TABLE public.gemeenschappelijk_onderhoud ENABLE ROW LEVEL SECURITY;

-- RLS policies for onderhoud
CREATE POLICY "Users can view onderhoud of own properties"
ON public.gemeenschappelijk_onderhoud FOR SELECT
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = gemeenschappelijk_onderhoud.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can insert onderhoud for own properties"
ON public.gemeenschappelijk_onderhoud FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = gemeenschappelijk_onderhoud.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can update onderhoud of own properties"
ON public.gemeenschappelijk_onderhoud FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = gemeenschappelijk_onderhoud.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can delete onderhoud of own properties"
ON public.gemeenschappelijk_onderhoud FOR DELETE
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = gemeenschappelijk_onderhoud.property_id
  AND properties.user_id = auth.uid()
));

-- Create noodgevallen_contacten table
CREATE TABLE public.noodgevallen_contacten (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  situatie text NOT NULL,
  actie text NOT NULL,
  contact_naam text,
  contact_telefoon text,
  contact_email text,
  extra_info text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for noodgevallen
ALTER TABLE public.noodgevallen_contacten ENABLE ROW LEVEL SECURITY;

-- RLS policies for noodgevallen
CREATE POLICY "Users can view noodgevallen of own properties"
ON public.noodgevallen_contacten FOR SELECT
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = noodgevallen_contacten.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can insert noodgevallen for own properties"
ON public.noodgevallen_contacten FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = noodgevallen_contacten.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can update noodgevallen of own properties"
ON public.noodgevallen_contacten FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = noodgevallen_contacten.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can delete noodgevallen of own properties"
ON public.noodgevallen_contacten FOR DELETE
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = noodgevallen_contacten.property_id
  AND properties.user_id = auth.uid()
));

-- Create triggers for updated_at
CREATE TRIGGER update_gemeenschappelijke_notulen_updated_at
BEFORE UPDATE ON public.gemeenschappelijke_notulen
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gemeenschappelijk_onderhoud_updated_at
BEFORE UPDATE ON public.gemeenschappelijk_onderhoud
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_noodgevallen_contacten_updated_at
BEFORE UPDATE ON public.noodgevallen_contacten
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();