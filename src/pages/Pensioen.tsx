import { useState, useEffect, useMemo } from "react";
import { 
  Sunset, Calculator, Euro, Calendar, TrendingUp, 
  AlertCircle, CheckCircle2, Target, Clock, Building2, Wallet
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  calculatePensionGap, 
  adjustForInflation,
  calculateYearsToFreedom 
} from "@/lib/financialCalculations";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Tenant = Tables<"tenants">;
type Property = Tables<"properties">;
type Loan = Tables<"loans">;
type RecurringExpense = Tables<"recurring_expenses">;

const Pensioen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      setTenants(tenantsRes.data || []);
      setProperties(propertiesRes.data || []);
      setLoans(loansRes.data || []);
      setRecurringExpenses(recurringRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          huidige_leeftijd: profile.huidige_leeftijd,
          gewenste_pensioenleeftijd: profile.gewenste_pensioenleeftijd,
          gewenst_maandinkomen: profile.gewenst_maandinkomen,
          aow_maandelijks: profile.aow_maandelijks,
          pensioen_maandelijks: profile.pensioen_maandelijks,
          overige_inkomsten: profile.overige_inkomsten,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Opgeslagen",
        description: "Je pensioenplanning is bijgewerkt.",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate net rental income (bruto - kosten - leningen)
  const netRentalIncome = useMemo(() => {
    const grossRentalIncome = tenants.reduce((sum, t) => sum + Number(t.huurbedrag), 0);
    
    // Calculate total monthly loan payments
    const totalMonthlyLoanPayments = loans.reduce((sum, loan) => sum + Number(loan.maandlast || 0), 0);
    
    // Calculate monthly recurring expenses (convert based on frequency)
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
    
    // Calculate property-level costs (VvE, verzekering, onderhoud, condominium, utilities)
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

  // Calculations
  const currentAge = Number(profile.huidige_leeftijd || 40);
  const retirementAge = Number(profile.gewenste_pensioenleeftijd || 67);
  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const desiredIncome = Number(profile.gewenst_maandinkomen || 3000);
  const aow = Number(profile.aow_maandelijks || 1400);
  const pension = Number(profile.pensioen_maandelijks || 0);
  const otherIncome = Number(profile.overige_inkomsten || 0);
  const rentalIncome = netRentalIncome; // Now uses net instead of gross

  const pensionGap = calculatePensionGap(desiredIncome, aow, pension, otherIncome, rentalIncome);
  const inflationAdjustedGap = adjustForInflation(pensionGap, yearsToRetirement);
  const inflationAdjustedDesired = adjustForInflation(desiredIncome, yearsToRetirement);
  
  const expectedIncome = aow + pension + otherIncome + rentalIncome;
  const coveragePercent = desiredIncome > 0 ? (expectedIncome / desiredIncome) * 100 : 0;

  const yearsToFreedom = calculateYearsToFreedom(pensionGap, rentalIncome);
  const freedomYear = new Date().getFullYear() + yearsToFreedom;
  const freedomAge = currentAge + yearsToFreedom;

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
              Pensioen & Vrijheidsplanner
            </h1>
            <InfoTooltip
              title="Pensioenplanning"
              content="Plan je financiële toekomst. De app berekent je pensioengat en wanneer je financiële vrijheid bereikt op basis van je huurinkomsten."
            />
          </div>
          <p className="text-muted-foreground mt-1">
            Bereken je pensioengat en plan je financiële vrijheid
          </p>
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8 space-y-6">
          {/* Hero Stats */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-6 rounded-xl border shadow-card ${
              pensionGap <= 0 ? "bg-success/10 border-success/20" : "bg-warning/10 border-warning/20"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {pensionGap <= 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
                <span className="text-sm font-medium text-muted-foreground">Pensioengat</span>
                <InfoTooltip
                  title="Pensioengat"
                  content="Het verschil tussen je gewenste inkomen en je verwachte inkomen bij pensioen. Negatief betekent dat je genoeg hebt!"
                />
              </div>
              <p className={`text-3xl font-bold ${pensionGap <= 0 ? "text-success" : "text-warning"}`}>
                {pensionGap <= 0 ? "Geen gat!" : `€${pensionGap.toLocaleString()}/mnd`}
              </p>
              {yearsToRetirement > 0 && pensionGap > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Inflatie-aangepast (2,5%/jaar): €{Math.round(inflationAdjustedGap).toLocaleString()}/mnd
                </p>
              )}
            </div>

            <div className="p-6 bg-card rounded-xl border shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <Sunset className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Financiële Vrijheid</span>
                <InfoTooltip
                  title="Financiële Vrijheid"
                  content="Het moment waarop je passieve inkomsten je gewenste levensstijl dekken, ongeacht je leeftijd."
                />
              </div>
              {yearsToFreedom === Infinity || yearsToFreedom > 50 ? (
                <p className="text-lg font-medium text-muted-foreground">
                  Nog niet bereikbaar met huidige inkomsten
                </p>
              ) : yearsToFreedom === 0 ? (
                <p className="text-3xl font-bold text-success">Nu al vrij!</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-foreground">
                    {freedomYear} (leeftijd {freedomAge})
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Nog {yearsToFreedom} jaar bij huidige groei
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Income Coverage */}
          <div className="p-6 bg-card rounded-xl border shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Inkomensdekking
              </h2>
              <span className="text-2xl font-bold text-primary">{Math.round(coveragePercent)}%</span>
            </div>
            <Progress value={Math.min(100, coveragePercent)} className="h-4 mb-4" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Verwacht: €{expectedIncome.toLocaleString()}/mnd</span>
              <span>Gewenst: €{desiredIncome.toLocaleString()}/mnd</span>
            </div>
          </div>

          {/* Income Breakdown */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              title="AOW (geschat)"
              value={`€${aow.toLocaleString()}`}
              subtitle="Per maand"
              icon={<Euro className="w-5 h-5 text-primary" />}
              tooltip={{
                title: "AOW",
                content: "De basispensioenuitkering van de overheid. Afhankelijk van je opbouwjaren. Maximaal ~€1.400 voor alleenstaanden (2024).",
              }}
            />
            <StatCard
              title="Pensioen"
              value={`€${pension.toLocaleString()}`}
              subtitle="Per maand"
              icon={<TrendingUp className="w-5 h-5 text-success" />}
              tooltip={{
                title: "Aanvullend Pensioen",
                content: "Je opgebouwde pensioen via werkgevers. Check je pensioenoverzicht op mijnpensioenoverzicht.nl.",
              }}
            />
            <StatCard
              title="Netto Huurinkomsten"
              value={`€${Math.round(rentalIncome).toLocaleString()}`}
              subtitle={`${tenants.length} huurders`}
              icon={<Building2 className="w-5 h-5 text-primary" />}
              variant="success"
              tooltip={{
                title: "Netto Huurinkomsten",
                content: "Je netto maandelijkse huurinkomsten uit vastgoed na aftrek van hypotheeklasten, terugkerende kosten, VvE-bijdragen, verzekeringen en onderhoud.",
              }}
            />
            <StatCard
              title="Overige Inkomsten"
              value={`€${otherIncome.toLocaleString()}`}
              subtitle="Per maand"
              icon={<Wallet className="w-5 h-5 text-muted-foreground" />}
              tooltip={{
                title: "Overige Inkomsten",
                content: "Andere passieve inkomsten zoals dividenden, royalties, of bijverdiensten.",
              }}
            />
          </div>

          {/* Input Form */}
          <div className="p-6 bg-card rounded-xl border shadow-card">
            <h2 className="font-semibold text-foreground mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Je Gegevens Aanpassen
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Leeftijd & Doel</h3>
                
                <div className="space-y-2">
                  <Label>Huidige leeftijd</Label>
                  <Input
                    type="number"
                    min="18"
                    max="100"
                    value={profile.huidige_leeftijd || ""}
                    onChange={(e) => setProfile({ ...profile, huidige_leeftijd: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Gewenste pensioenleeftijd
                    <InfoTooltip
                      title="Pensioenleeftijd"
                      content="De leeftijd waarop je wilt stoppen met werken. Hoe eerder, hoe meer je moet sparen."
                    />
                  </Label>
                  <Input
                    type="number"
                    min="40"
                    max="80"
                    value={profile.gewenste_pensioenleeftijd || ""}
                    onChange={(e) => setProfile({ ...profile, gewenste_pensioenleeftijd: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gewenst maandinkomen (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={profile.gewenst_maandinkomen || ""}
                    onChange={(e) => setProfile({ ...profile, gewenst_maandinkomen: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Verwachte Uitkeringen</h3>
                
                <div className="space-y-2">
                  <Label>AOW per maand (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={profile.aow_maandelijks || ""}
                    onChange={(e) => setProfile({ ...profile, aow_maandelijks: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pensioen per maand (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={profile.pensioen_maandelijks || ""}
                    onChange={(e) => setProfile({ ...profile, pensioen_maandelijks: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Overige inkomsten per maand (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={profile.overige_inkomsten || ""}
                    onChange={(e) => setProfile({ ...profile, overige_inkomsten: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full gradient-primary text-primary-foreground"
                >
                  {saving ? "Opslaan..." : "Berekening Opslaan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Pensioen;

