import { useState, useEffect, useMemo } from "react";
import { 
  Sunset, Calculator, Euro, Calendar, TrendingUp, 
  AlertCircle, CheckCircle2, Target, Clock, Building2, Wallet
} from "lucide-react";
import { EarlyRetirementStrategies } from "@/components/pensioen/EarlyRetirementStrategies";
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

  // Official retirement age in the Netherlands (67 years + 3 months)
  const OFFICIAL_RETIREMENT_AGE = 67.25; // 67 years and 3 months

  // Calculations
  const currentAge = Number(profile.huidige_leeftijd || 40);
  const desiredRetirementAge = Number(profile.gewenste_pensioenleeftijd || 55); // When user wants to stop working
  const desiredIncome = Number(profile.gewenst_maandinkomen || 3000);
  const aow = Number(profile.aow_maandelijks || 1400);
  const pension = Number(profile.pensioen_maandelijks || 0);
  const otherIncome = Number(profile.overige_inkomsten || 0);
  const rentalIncome = netRentalIncome;

  // Years calculations
  const yearsToDesiredRetirement = Math.max(0, desiredRetirementAge - currentAge);
  const yearsToOfficialRetirement = Math.max(0, OFFICIAL_RETIREMENT_AGE - currentAge);
  
  // Pre-retirement phase: from desired retirement age until official retirement age (67+3m)
  // During this phase: NO AOW, NO pension - only rental income + other income
  const yearsInPreRetirementPhase = Math.max(0, OFFICIAL_RETIREMENT_AGE - Math.max(currentAge, desiredRetirementAge));
  
  // Income during pre-retirement phase (before 67+3m)
  const incomePreRetirement = rentalIncome + otherIncome;
  const gapPreRetirement = Math.max(0, desiredIncome - incomePreRetirement);
  
  // Total savings needed to bridge the pre-retirement phase
  const monthsInPreRetirementPhase = Math.round(yearsInPreRetirementPhase * 12);
  const totalSavingsNeeded = gapPreRetirement * monthsInPreRetirementPhase;
  const inflationAdjustedSavingsNeeded = adjustForInflation(totalSavingsNeeded, yearsToDesiredRetirement);
  
  // Post-retirement phase: after official retirement age (67+3m)
  // During this phase: AOW + pension + rental income + other income
  const incomePostRetirement = aow + pension + rentalIncome + otherIncome;
  const gapPostRetirement = Math.max(0, desiredIncome - incomePostRetirement);
  const inflationAdjustedGapPost = adjustForInflation(gapPostRetirement, yearsToOfficialRetirement);
  
  // Coverage percentages
  const coveragePreRetirement = desiredIncome > 0 ? (incomePreRetirement / desiredIncome) * 100 : 0;
  const coveragePostRetirement = desiredIncome > 0 ? (incomePostRetirement / desiredIncome) * 100 : 0;

  // Years to financial freedom - calculate how long until passief inkomen reaches gewenst inkomen
  // Pass desiredIncome as the target (not the gap) so it calculates correctly
  const yearsToFreedom = calculateYearsToFreedom(desiredIncome, incomePreRetirement);
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
          {/* Phase explanation */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Let op:</strong> AOW en pensioen gaan pas in vanaf de pensioengerechtigde leeftijd van <strong>67 jaar en 3 maanden</strong>. 
              Hieronder zie je wat je nodig hebt om eerder te stoppen met werken én hoe je situatie eruitziet na je pensioenleeftijd.
            </p>
          </div>

          {/* Hero Stats - Two phase comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Pre-retirement phase card */}
            <div className={`p-6 rounded-xl border shadow-card ${
              gapPreRetirement <= 0 ? "bg-success/10 border-success/20" : "bg-warning/10 border-warning/20"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {gapPreRetirement <= 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
                <span className="text-sm font-medium text-muted-foreground">Vóór Pensioenleeftijd</span>
                <InfoTooltip
                  title="Vóór 67 jaar en 3 maanden"
                  content="In deze fase ontvang je nog GEEN AOW of pensioen. Je moet leven van huurinkomsten en eventuele overige inkomsten, of je spaargeld aanspreken."
                />
              </div>
              <p className={`text-2xl font-bold ${gapPreRetirement <= 0 ? "text-success" : "text-warning"}`}>
                {gapPreRetirement <= 0 ? "Gedekt!" : `€${Math.round(gapPreRetirement).toLocaleString()}/mnd tekort`}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Inkomen: €{Math.round(incomePreRetirement).toLocaleString()}/mnd (geen AOW/pensioen)
              </p>
              <Progress value={Math.min(100, coveragePreRetirement)} className="h-2 mt-3" />
              <p className="text-xs text-muted-foreground mt-1">{Math.round(coveragePreRetirement)}% van gewenst inkomen</p>
            </div>

            {/* Post-retirement phase card */}
            <div className={`p-6 rounded-xl border shadow-card ${
              gapPostRetirement <= 0 ? "bg-success/10 border-success/20" : "bg-primary/10 border-primary/20"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {gapPostRetirement <= 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <Target className="w-5 h-5 text-primary" />
                )}
                <span className="text-sm font-medium text-muted-foreground">Na Pensioenleeftijd</span>
                <InfoTooltip
                  title="Na 67 jaar en 3 maanden"
                  content="Vanaf deze leeftijd ontvang je AOW en eventueel opgebouwd pensioen, bovenop je andere inkomsten."
                />
              </div>
              <p className={`text-2xl font-bold ${gapPostRetirement <= 0 ? "text-success" : "text-primary"}`}>
                {gapPostRetirement <= 0 ? "Gedekt!" : `€${Math.round(gapPostRetirement).toLocaleString()}/mnd tekort`}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Inkomen: €{Math.round(incomePostRetirement).toLocaleString()}/mnd (incl. AOW/pensioen)
              </p>
              <Progress value={Math.min(100, coveragePostRetirement)} className="h-2 mt-3" />
              <p className="text-xs text-muted-foreground mt-1">{Math.round(coveragePostRetirement)}% van gewenst inkomen</p>
            </div>
          </div>

          {/* Savings needed to bridge the gap */}
          {yearsInPreRetirementPhase > 0 && gapPreRetirement > 0 && (
            <div className="p-6 bg-card rounded-xl border shadow-card border-warning/30">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-warning" />
                <h2 className="font-semibold text-foreground">Benodigde Spaarpot om Eerder te Stoppen</h2>
                <InfoTooltip
                  title="Overbruggingskapitaal"
                  content={`Dit is het bedrag dat je nu zou moeten sparen om de periode van ${Math.round(yearsInPreRetirementPhase * 10) / 10} jaar tussen je gewenste pensioenleeftijd (${desiredRetirementAge}) en de officiële pensioenleeftijd (67j3m) te overbruggen.`}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Maandelijks tekort</p>
                  <p className="text-xl font-bold text-warning">€{Math.round(gapPreRetirement).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Overbruggingsperiode</p>
                  <p className="text-xl font-bold text-foreground">{Math.round(yearsInPreRetirementPhase * 10) / 10} jaar</p>
                  <p className="text-xs text-muted-foreground">({monthsInPreRetirementPhase} maanden)</p>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <p className="text-sm text-muted-foreground mb-1">Totaal nodig</p>
                  <p className="text-xl font-bold text-warning">€{Math.round(totalSavingsNeeded).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    Inflatie-gecorrigeerd: €{Math.round(inflationAdjustedSavingsNeeded).toLocaleString()}
                  </p>
                </div>
              </div>
              {yearsToDesiredRetirement > 0 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Je hebt nog <strong>{Math.round(yearsToDesiredRetirement)} jaar</strong> om dit bedrag te sparen. 
                  Dat is <strong>€{Math.round(totalSavingsNeeded / (yearsToDesiredRetirement * 12)).toLocaleString()}/maand</strong>.
                </p>
              )}
            </div>
          )}

          {/* Early Retirement Strategies */}
          {gapPreRetirement > 0 && (
            <EarlyRetirementStrategies
              totalSavingsNeeded={totalSavingsNeeded}
              yearsToDesiredRetirement={yearsToDesiredRetirement}
              monthlyGapPreRetirement={gapPreRetirement}
              netRentalIncome={netRentalIncome}
              properties={properties}
              loans={loans}
              desiredIncome={desiredIncome}
              incomePreRetirement={incomePreRetirement}
            />
          )}

          {/* Financial Freedom */}
          <div className="p-6 bg-card rounded-xl border shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Sunset className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Financiële Vrijheid</span>
              <InfoTooltip
                title="Financiële Vrijheid"
                content="Het moment waarop je passieve inkomsten (huurinkomsten + overige inkomsten, zonder AOW/pensioen) je gewenste maandinkomen volledig dekken. Je kunt dan stoppen met werken zonder afhankelijk te zijn van AOW of pensioen."
              />
            </div>
            {desiredIncome === 0 ? (
              <p className="text-lg font-medium text-muted-foreground">
                Vul een gewenst maandinkomen in om dit te berekenen
              </p>
            ) : incomePreRetirement === 0 ? (
              <p className="text-lg font-medium text-muted-foreground">
                Nog geen passief inkomen - voeg huurders of overige inkomsten toe
              </p>
            ) : yearsToFreedom === Infinity || yearsToFreedom > 50 ? (
              <p className="text-lg font-medium text-muted-foreground">
                Nog niet bereikbaar met huidige passieve inkomsten
              </p>
            ) : yearsToFreedom === 0 ? (
              <>
                <p className="text-3xl font-bold text-success">Nu al vrij!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Je passief inkomen (€{Math.round(incomePreRetirement).toLocaleString()}/mnd) dekt je gewenste inkomen (€{desiredIncome.toLocaleString()}/mnd)
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">
                  {freedomYear} (leeftijd {freedomAge})
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Nog {yearsToFreedom} jaar bij 0,5% maandelijkse groei van passief inkomen
                </p>
              </>
            )}
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
                    Wanneer wil je stoppen met werken?
                    <InfoTooltip
                      title="Gewenste Stopwerk-leeftijd"
                      content="De leeftijd waarop je wilt stoppen met werken. Dit kan vóór de officiële pensioenleeftijd (67j3m) zijn, maar dan moet je zelf overbruggen tot AOW/pensioen ingaat."
                    />
                  </Label>
                  <Input
                    type="number"
                    min="30"
                    max="80"
                    value={profile.gewenste_pensioenleeftijd || ""}
                    onChange={(e) => setProfile({ ...profile, gewenste_pensioenleeftijd: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Officiële pensioenleeftijd: 67 jaar en 3 maanden</p>
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

