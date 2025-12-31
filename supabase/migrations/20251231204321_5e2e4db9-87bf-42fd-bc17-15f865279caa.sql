-- Create comparable_properties table for market value comparisons
CREATE TABLE public.comparable_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  adres TEXT NOT NULL,
  vraagprijs NUMERIC NOT NULL,
  oppervlakte_m2 NUMERIC NOT NULL,
  afstand_meter INTEGER,
  status TEXT DEFAULT 'te koop',
  prijs_per_m2 NUMERIC GENERATED ALWAYS AS (vraagprijs / NULLIF(oppervlakte_m2, 0)) STORED,
  notities TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comparable_properties ENABLE ROW LEVEL SECURITY;

-- RLS policies for comparable_properties
CREATE POLICY "Users can view comparable_properties of own properties"
ON public.comparable_properties
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = comparable_properties.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can insert comparable_properties for own properties"
ON public.comparable_properties
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = comparable_properties.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can update comparable_properties of own properties"
ON public.comparable_properties
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = comparable_properties.property_id
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can delete comparable_properties of own properties"
ON public.comparable_properties
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = comparable_properties.property_id
  AND properties.user_id = auth.uid()
));

-- Add updated_at trigger
CREATE TRIGGER update_comparable_properties_updated_at
BEFORE UPDATE ON public.comparable_properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();