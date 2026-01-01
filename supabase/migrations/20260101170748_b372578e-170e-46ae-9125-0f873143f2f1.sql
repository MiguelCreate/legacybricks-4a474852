-- =====================================================
-- FASE 2-6: Uitgebreide Database Migratie
-- =====================================================

-- FASE 2: Aannemers contract velden
ALTER TABLE public.contractors 
ADD COLUMN IF NOT EXISTS heeft_contract boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_type text CHECK (contract_type IN ('onderhoud', 'all_in', 'ad_hoc', 'project')),
ADD COLUMN IF NOT EXISTS contract_document_link text;

-- FASE 3: Contracten uitbreiden met meer details
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS huurprijs numeric,
ADD COLUMN IF NOT EXISTS indexatie_percentage numeric DEFAULT 2,
ADD COLUMN IF NOT EXISTS waarborgsom numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS herinnering_dagen integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL;

-- FASE 4: Properties uitbreiden met downpayment en closing costs (als niet al aanwezig)
-- eigen_inleg is al downpayment, notaris_kosten + imt_betaald zijn closing costs
-- Voeg recurring_expenses tabel toe voor terugkerende kosten
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  naam text NOT NULL,
  bedrag numeric NOT NULL,
  frequentie text CHECK (frequentie IN ('maandelijks', 'kwartaal', 'jaarlijks')) DEFAULT 'maandelijks',
  categorie text CHECK (categorie IN ('verzekering', 'vve', 'onderhoud', 'belasting', 'beheer', 'overig')) DEFAULT 'overig',
  start_datum date,
  eind_datum date,
  bankrekening text,
  notities text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS voor recurring_expenses
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recurring_expenses of own properties" 
ON public.recurring_expenses FOR SELECT 
USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = recurring_expenses.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can insert recurring_expenses for own properties" 
ON public.recurring_expenses FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = recurring_expenses.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can update recurring_expenses of own properties" 
ON public.recurring_expenses FOR UPDATE 
USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = recurring_expenses.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can delete recurring_expenses of own properties" 
ON public.recurring_expenses FOR DELETE 
USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = recurring_expenses.property_id AND properties.user_id = auth.uid()));

-- FASE 5: Vermogensopbouw - andere vermogensvormen
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type text CHECK (type IN ('spaargeld', 'aandelen', 'crypto', 'obligaties', 'onderneming', 'pensioen', 'overig')) NOT NULL,
  naam text NOT NULL,
  huidige_waarde numeric NOT NULL DEFAULT 0,
  aankoop_waarde numeric,
  aankoop_datum date,
  rendement_percentage numeric,
  land text DEFAULT 'NL',
  notities text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- Estate planning - nabestaanden
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  naam text NOT NULL,
  relatie text CHECK (relatie IN ('partner', 'kind', 'ouder', 'broer_zus', 'overig')) NOT NULL,
  geboorte_datum date,
  percentage_erfenis numeric DEFAULT 0,
  notities text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own beneficiaries" ON public.beneficiaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own beneficiaries" ON public.beneficiaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own beneficiaries" ON public.beneficiaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own beneficiaries" ON public.beneficiaries FOR DELETE USING (auth.uid() = user_id);

-- FASE 6: Dashboard meldingen
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type text CHECK (type IN ('contract_expiring', 'rent_due', 'maintenance_due', 'document_expiring', 'general')) NOT NULL,
  title text NOT NULL,
  message text,
  related_id uuid,
  read boolean DEFAULT false,
  action_url text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Triggers voor updated_at
CREATE TRIGGER update_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at
  BEFORE UPDATE ON public.beneficiaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();