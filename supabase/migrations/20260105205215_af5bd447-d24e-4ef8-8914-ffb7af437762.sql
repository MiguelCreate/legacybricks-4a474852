-- Function to sync maandelijkse_huur with sum of active tenants' huurbedrag
CREATE OR REPLACE FUNCTION public.sync_property_rent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_property_id uuid;
  total_rent numeric;
BEGIN
  -- Determine which property_id to update
  IF TG_OP = 'DELETE' THEN
    affected_property_id := OLD.property_id;
  ELSE
    affected_property_id := NEW.property_id;
  END IF;
  
  -- Also handle property_id change on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.property_id IS DISTINCT FROM NEW.property_id THEN
    -- Update old property first
    SELECT COALESCE(SUM(huurbedrag), 0) INTO total_rent
    FROM tenants
    WHERE property_id = OLD.property_id AND actief = true;
    
    UPDATE properties
    SET maandelijkse_huur = total_rent
    WHERE id = OLD.property_id;
  END IF;
  
  -- Calculate sum of active tenants' rent for the affected property
  SELECT COALESCE(SUM(huurbedrag), 0) INTO total_rent
  FROM tenants
  WHERE property_id = affected_property_id AND actief = true;
  
  -- Update the property's maandelijkse_huur
  UPDATE properties
  SET maandelijkse_huur = total_rent
  WHERE id = affected_property_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger for INSERT, UPDATE, DELETE on tenants
DROP TRIGGER IF EXISTS sync_property_rent_trigger ON tenants;
CREATE TRIGGER sync_property_rent_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_property_rent();

-- Initial sync: update all properties with current active tenant sums
UPDATE properties p
SET maandelijkse_huur = COALESCE(
  (SELECT SUM(t.huurbedrag) FROM tenants t WHERE t.property_id = p.id AND t.actief = true),
  0
);