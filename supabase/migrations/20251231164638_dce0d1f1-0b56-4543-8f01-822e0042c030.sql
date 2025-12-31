-- Create rooms table for individual rooms within properties
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  oppervlakte_m2 NUMERIC,
  huurprijs NUMERIC NOT NULL DEFAULT 0,
  actieve_huurder_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contractors table
CREATE TABLE public.contractors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bedrijfsnaam TEXT NOT NULL,
  type_werkzaamheden TEXT NOT NULL,
  contactpersoon TEXT,
  email TEXT,
  telefoon TEXT,
  notities TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property_contractors junction table for many-to-many relationship
CREATE TABLE public.property_contractors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, contractor_id)
);

-- Add room_id to tenants for direct room linkage
ALTER TABLE public.tenants ADD COLUMN room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_contractors ENABLE ROW LEVEL SECURITY;

-- RLS policies for rooms (through property ownership)
CREATE POLICY "Users can view rooms of own properties" 
ON public.rooms FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = rooms.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can insert rooms for own properties" 
ON public.rooms FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = rooms.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can update rooms of own properties" 
ON public.rooms FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = rooms.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can delete rooms of own properties" 
ON public.rooms FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = rooms.property_id 
  AND properties.user_id = auth.uid()
));

-- RLS policies for contractors (direct ownership)
CREATE POLICY "Users can view own contractors" 
ON public.contractors FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contractors" 
ON public.contractors FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contractors" 
ON public.contractors FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contractors" 
ON public.contractors FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for property_contractors (through property ownership)
CREATE POLICY "Users can view property_contractors of own properties" 
ON public.property_contractors FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = property_contractors.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can insert property_contractors for own properties" 
ON public.property_contractors FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = property_contractors.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can delete property_contractors of own properties" 
ON public.property_contractors FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = property_contractors.property_id 
  AND properties.user_id = auth.uid()
));

-- Add trigger for updated_at on new tables
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contractors_updated_at
BEFORE UPDATE ON public.contractors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();