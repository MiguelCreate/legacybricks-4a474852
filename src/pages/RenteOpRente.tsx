import { useState, useEffect, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CompoundInterestSimulator } from "@/components/pensioen/CompoundInterestSimulator";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Tenant = Tables<"tenants">;
type Property = Tables<"properties">;
type Loan = Tables<"loans">;
type RecurringExpense = Tables<"recurring_expenses">;

const RenteOpRente = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [profileRes, tenantsRes, propertiesRes, loansRes, recurringRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("tenants").select("*").eq("actief", true),
        supabase.from("properties").select("*").eq("gearchiveerd", false),
        supabase.from("loans").select("*"),
        supabase.from("recurring_expenses").select("*"),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (tenantsRes.error) throw tenantsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (loansRes.error) throw loansRes.error;
      if (recurringRes.error) throw recurringRes.error;

      if (profileRes.data) {
        setProfile(profileRes.data);
      }
      
      // Store properties first to filter other data
      const userProperties = propertiesRes.data || [];
      setProperties(userProperties);
      
      // Filter tenants, loans, and recurring expenses to only include those from user's properties
      const userPropertyIds = userProperties.map(p => p.id);
      const userTenants = (tenantsRes.data || []).filter(t => userPropertyIds.includes(t.property_id));
      const userLoans = (loansRes.data || []).filter(l => userPropertyIds.includes(l.property_id));
      const userRecurring = (recurringRes.data || []).filter(r => userPropertyIds.includes(r.property_id));
      
      setTenants(userTenants);
      setLoans(userLoans);
      setRecurringExpenses(userRecurring);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate net rental income
  const netRentalIncome = useMemo(() => {
    const grossRentalIncome = tenants.reduce((sum, t) => sum + Number(t.huurbedrag), 0);
    const totalMonthlyLoanPayments = loans.reduce((sum, loan) => sum + Number(loan.maandlast || 0), 0);
    
    const totalMonthlyExpenses = recurringExpenses.reduce((sum, expense) => {
      const amount = Number(expense.bedrag || 0);
      const frequency = expense.frequentie || 'maandelijks';
      
      switch (frequency) {
        case 'jaarlijks': return sum + (amount / 12);
        case 'kwartaal': return sum + (amount / 3);
        case 'maandelijks': return sum + amount;
        default: return sum + amount;
      }
    }, 0);
    
    const totalPropertyCosts = properties.reduce((sum, property) => {
      const vve = Number(property.vve_maandbijdrage || 0);
      const insurance = Number(property.verzekering_jaarlijks || 0) / 12;
      const maintenance = Number(property.onderhoud_jaarlijks || 0) / 12;
      const condominium = Number(property.condominium_maandelijks || 0);
      const electricity = Number(property.elektriciteit_maandelijks || 0);
      const gas = Number(property.gas_maandelijks || 0);
      const water = Number(property.water_maandelijks || 0);
      
      return sum + vve + insurance + maintenance + condominium + electricity + gas + water;
    }, 0);
    
    return Math.max(0, grossRentalIncome - totalMonthlyLoanPayments - totalMonthlyExpenses - totalPropertyCosts);
  }, [tenants, loans, recurringExpenses, properties]);

  const currentAge = Number(profile.huidige_leeftijd || 40);
  const desiredRetirementAge = Number(profile.gewenste_pensioenleeftijd || 55);
  const desiredIncome = Number(profile.gewenst_maandinkomen || 3000);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Laden...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Rente-op-Rente Simulator
            </h1>
            <InfoTooltip
              title="Rente-op-Rente Effect"
              content="Ontdek hoeveel extra vermogen je kunt opbouwen door een deel van je netto huuroverschot te herbeleggen in een spaar- of beleggingsrekening."
            />
          </div>
          <p className="text-muted-foreground mt-1">
            Bereken je vermogensgroei door slim te sparen en beleggen
          </p>
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8 space-y-6">
          {/* Info banner */}
          <div className="p-4 bg-gradient-to-r from-primary/5 via-accent/5 to-success/5 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>💡 Tip:</strong> Het rente-op-rente effect werkt exponentieel. Hoe eerder je begint met sparen of beleggen, 
              hoe groter het effect op lange termijn. Gebruik deze simulator om te ontdekken wat een deel van je 
              huuroverschot kan groeien tot over de jaren.
            </p>
          </div>

          {/* Simulator - not collapsible on dedicated page */}
          <CompoundInterestSimulator
            netRentalIncome={netRentalIncome}
            desiredRetirementAge={desiredRetirementAge}
            currentAge={currentAge}
            desiredMonthlyIncome={desiredIncome}
            defaultOpen={true}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default RenteOpRente;
