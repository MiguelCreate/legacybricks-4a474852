-- Add unit number to tenants table for multi-unit properties
ALTER TABLE public.tenants 
ADD COLUMN unit_nummer integer NOT NULL DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN public.tenants.unit_nummer IS 'Unit nummer binnen het pand (1 = standaard/enige unit)';