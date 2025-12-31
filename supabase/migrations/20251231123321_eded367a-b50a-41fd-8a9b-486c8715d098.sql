-- Add multi-unit support to properties table
ALTER TABLE public.properties 
ADD COLUMN aantal_units integer NOT NULL DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN public.properties.aantal_units IS 'Aantal verhuurbare units/kamers in dit pand';