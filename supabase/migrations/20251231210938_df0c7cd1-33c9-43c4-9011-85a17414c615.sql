-- Add column for tooltip visibility preference
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS toon_uitleg boolean DEFAULT true;