-- Drop the old check constraint
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_type_verhuur_check;

-- Add the new check constraint with all allowed values
ALTER TABLE public.properties ADD CONSTRAINT properties_type_verhuur_check 
CHECK (type_verhuur IN ('langdurig', 'korte_termijn', 'kamerverhuur'));