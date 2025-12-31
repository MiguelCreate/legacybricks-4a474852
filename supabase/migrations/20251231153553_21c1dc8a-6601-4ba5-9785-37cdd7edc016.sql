-- Create enum for analyse status
CREATE TYPE public.analyse_status AS ENUM ('concept', 'potentieel', 'actief');

-- Create enum for tijdsframe
CREATE TYPE public.tijdsframe_analyse AS ENUM ('5j', '10j', '15j', '30j');

-- Add new columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS analyse_status public.analyse_status DEFAULT 'actief',
ADD COLUMN IF NOT EXISTS gerelateerd_doel_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tijdsframe_analyse public.tijdsframe_analyse DEFAULT '10j',
ADD COLUMN IF NOT EXISTS st_bezetting_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS st_gemiddelde_dagprijs NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS huurgroei_percentage NUMERIC DEFAULT 2,
ADD COLUMN IF NOT EXISTS kostenstijging_percentage NUMERIC DEFAULT 2,
ADD COLUMN IF NOT EXISTS waardegroei_percentage NUMERIC DEFAULT 3,
ADD COLUMN IF NOT EXISTS renovatie_kosten NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS inrichting_kosten NUMERIC DEFAULT 0;