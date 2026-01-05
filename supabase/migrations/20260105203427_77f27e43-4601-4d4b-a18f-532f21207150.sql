-- Fix RLS policies: Change from RESTRICTIVE to PERMISSIVE
-- Drop existing restrictive policies and recreate as permissive

-- ============= PROPERTIES =============
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;

CREATE POLICY "Users can view own properties" ON public.properties
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON public.properties
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON public.properties
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties" ON public.properties
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= TENANTS =============
DROP POLICY IF EXISTS "Users can view tenants of own properties" ON public.tenants;
DROP POLICY IF EXISTS "Users can insert tenants for own properties" ON public.tenants;
DROP POLICY IF EXISTS "Users can update tenants of own properties" ON public.tenants;
DROP POLICY IF EXISTS "Users can delete tenants of own properties" ON public.tenants;

CREATE POLICY "Users can view tenants of own properties" ON public.tenants
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = tenants.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can insert tenants for own properties" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = tenants.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can update tenants of own properties" ON public.tenants
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = tenants.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can delete tenants of own properties" ON public.tenants
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = tenants.property_id AND properties.user_id = auth.uid()));

-- ============= LOANS =============
DROP POLICY IF EXISTS "Users can view loans of own properties" ON public.loans;
DROP POLICY IF EXISTS "Users can insert loans for own properties" ON public.loans;
DROP POLICY IF EXISTS "Users can update loans of own properties" ON public.loans;
DROP POLICY IF EXISTS "Users can delete loans of own properties" ON public.loans;

CREATE POLICY "Users can view loans of own properties" ON public.loans
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = loans.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can insert loans for own properties" ON public.loans
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = loans.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can update loans of own properties" ON public.loans
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = loans.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can delete loans of own properties" ON public.loans
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = loans.property_id AND properties.user_id = auth.uid()));

-- ============= CONTRACTS =============
DROP POLICY IF EXISTS "Users can view contracts of own properties" ON public.contracts;
DROP POLICY IF EXISTS "Users can insert contracts for own properties" ON public.contracts;
DROP POLICY IF EXISTS "Users can update contracts of own properties" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete contracts of own properties" ON public.contracts;

CREATE POLICY "Users can view contracts of own properties" ON public.contracts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = contracts.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can insert contracts for own properties" ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = contracts.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can update contracts of own properties" ON public.contracts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = contracts.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can delete contracts of own properties" ON public.contracts
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = contracts.property_id AND properties.user_id = auth.uid()));

-- ============= EXPENSES =============
DROP POLICY IF EXISTS "Users can view expenses of own properties" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert expenses for own properties" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses of own properties" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses of own properties" ON public.expenses;

CREATE POLICY "Users can view expenses of own properties" ON public.expenses
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = expenses.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can insert expenses for own properties" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = expenses.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can update expenses of own properties" ON public.expenses
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = expenses.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can delete expenses of own properties" ON public.expenses
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = expenses.property_id AND properties.user_id = auth.uid()));

-- ============= PAYMENTS =============
DROP POLICY IF EXISTS "Users can view payments of own properties" ON public.payments;
DROP POLICY IF EXISTS "Users can insert payments for own properties" ON public.payments;
DROP POLICY IF EXISTS "Users can delete payments of own properties" ON public.payments;

CREATE POLICY "Users can view payments of own properties" ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = payments.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can insert payments for own properties" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = payments.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Users can delete payments of own properties" ON public.payments
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = payments.property_id AND properties.user_id = auth.uid()));

-- ============= PROFILES =============
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============= BENEFICIARIES =============
DROP POLICY IF EXISTS "Users can view own beneficiaries" ON public.beneficiaries;
DROP POLICY IF EXISTS "Users can insert own beneficiaries" ON public.beneficiaries;
DROP POLICY IF EXISTS "Users can update own beneficiaries" ON public.beneficiaries;
DROP POLICY IF EXISTS "Users can delete own beneficiaries" ON public.beneficiaries;

CREATE POLICY "Users can view own beneficiaries" ON public.beneficiaries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own beneficiaries" ON public.beneficiaries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own beneficiaries" ON public.beneficiaries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own beneficiaries" ON public.beneficiaries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= CONTRACTORS =============
DROP POLICY IF EXISTS "Users can view own contractors" ON public.contractors;
DROP POLICY IF EXISTS "Users can insert own contractors" ON public.contractors;
DROP POLICY IF EXISTS "Users can update own contractors" ON public.contractors;
DROP POLICY IF EXISTS "Users can delete own contractors" ON public.contractors;

CREATE POLICY "Users can view own contractors" ON public.contractors
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contractors" ON public.contractors
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contractors" ON public.contractors
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contractors" ON public.contractors
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= ASSETS =============
DROP POLICY IF EXISTS "Users can view own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can insert own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can update own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON public.assets;

CREATE POLICY "Users can view own assets" ON public.assets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets" ON public.assets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets" ON public.assets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets" ON public.assets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);