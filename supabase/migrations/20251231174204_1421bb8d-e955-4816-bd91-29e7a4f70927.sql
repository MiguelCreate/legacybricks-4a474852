-- Add GPS coordinates to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS volledig_adres text;

-- Create property_features table for property-level maintenance/features
CREATE TABLE public.property_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  aanwezig BOOLEAN NOT NULL DEFAULT true,
  merk_type TEXT,
  onderhoudsbehoefte TEXT CHECK (onderhoudsbehoefte IN ('geen', 'licht', 'groot')) DEFAULT 'geen',
  onderhoudsstatus TEXT,
  gepland_onderhoudsjaar INTEGER,
  notities TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_features table for room-level maintenance/features
CREATE TABLE public.room_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  merk_type TEXT,
  onderhoudsbehoefte TEXT CHECK (onderhoudsbehoefte IN ('geen', 'licht', 'groot')) DEFAULT 'geen',
  onderhoudsstatus TEXT,
  gepland_onderhoudsjaar INTEGER,
  notities TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.property_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_features ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_features (via property ownership)
CREATE POLICY "Users can view property_features of own properties" 
ON public.property_features FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = property_features.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can insert property_features for own properties" 
ON public.property_features FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = property_features.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can update property_features of own properties" 
ON public.property_features FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = property_features.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can delete property_features of own properties" 
ON public.property_features FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = property_features.property_id 
  AND properties.user_id = auth.uid()
));

-- RLS policies for room_features (via room -> property ownership)
CREATE POLICY "Users can view room_features of own properties" 
ON public.room_features FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM rooms 
  JOIN properties ON properties.id = rooms.property_id 
  WHERE rooms.id = room_features.room_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can insert room_features for own properties" 
ON public.room_features FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM rooms 
  JOIN properties ON properties.id = rooms.property_id 
  WHERE rooms.id = room_features.room_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can update room_features of own properties" 
ON public.room_features FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM rooms 
  JOIN properties ON properties.id = rooms.property_id 
  WHERE rooms.id = room_features.room_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can delete room_features of own properties" 
ON public.room_features FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM rooms 
  JOIN properties ON properties.id = rooms.property_id 
  WHERE rooms.id = room_features.room_id 
  AND properties.user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_property_features_updated_at
BEFORE UPDATE ON public.property_features
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_features_updated_at
BEFORE UPDATE ON public.room_features
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();