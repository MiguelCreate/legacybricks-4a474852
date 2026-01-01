-- Add KPI mode preference to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS voorkeur_kpi_modus text DEFAULT 'beginner' CHECK (voorkeur_kpi_modus IN ('beginner', 'gevorderd'));