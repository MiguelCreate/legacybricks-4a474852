-- Add utility provider and meter information columns to properties table
ALTER TABLE public.properties 
ADD COLUMN gas_leverancier text,
ADD COLUMN gas_contractnummer text,
ADD COLUMN gas_meternummer text,
ADD COLUMN water_leverancier text,
ADD COLUMN water_contractnummer text,
ADD COLUMN water_meternummer text,
ADD COLUMN elektriciteit_leverancier text,
ADD COLUMN elektriciteit_contractnummer text,
ADD COLUMN elektriciteit_meternummer text,
ADD COLUMN verzekering_maatschappij text,
ADD COLUMN verzekering_polisnummer text,
ADD COLUMN verzekering_dekking text;