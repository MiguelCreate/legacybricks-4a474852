import { useState, useEffect } from "react";
import { 
  Wallet, TrendingUp, TrendingDown, PiggyBank, 
  Building2, CreditCard, BarChart3, Target
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/StatCard";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  calculateLiquidityRatio, 
  calculateDebtToAssetRatio,
  adjustForInflation 
} from "@/lib/financialCalculations";
import { AssetsManager } from "@/components/vermogen/AssetsManager";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Loan = Tables<"loans">;
type Profile = Tables<"profiles">;

const NettoVermogen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [propertiesRes, loansRes, profileRes] = await Promise.all([
        supabase.from("properties").select("*").eq("gearchiveerd", false),
        supabase.from("loans").select("*"),
        supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle(),
      ]);

      if (propertiesRes.error) throw propertiesRes.error;
      if (loansRes.error) throw loansRes.error;
      if (profileRes.error) throw profileRes.error;

      setProperties(propertiesRes.data || []);
      setLoans(loansRes.data || []);
      setProfile(profileRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Fout",
        description: "Kon gegevens niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalPropertyValue = properties.reduce(
    (sum, p) => sum + Number(p.waardering || p.aankoopprijs),
    0
  );
  const totalDebt = loans.reduce(
    (sum, l) => sum + Number(l.restschuld || l.hoofdsom || 0),
    0
  );
  const savings = Number(profile?.spaargeld || 0);
  const investments = Number(profile?.beleggingen || 0);

  // Assets
  const totalAssets = totalPropertyValue + savings + investments;
  
  // Net Worth
  const netWorth = totalAssets - totalDebt;
  
  // Equity in properties
  const propertyEquity = totalPropertyValue - totalDebt;

  // Ratios
  const liquidityRatio = calculateLiquidityRatio(savings, investments, 5000); // Assume €5000 monthly expenses
  const debtToAssetRatio = calculateDebtToAssetRatio(totalDebt, totalAssets);

  // Goals
  const currentAge = profile?.huidige_leeftijd || 40;
  const targetAge = profile?.gewenste_pensioenleeftijd || 60;
  const yearsToRetirement = Math.max(0, targetAge - currentAge);
  const desiredIncome = Number(profile?.gewenst_maandinkomen || 5000);
  const targetNetWorth = desiredIncome * 12 * 25; // 4% withdrawal rate
  const inflationAdjustedTarget = adjustForInflation(targetNetWorth, yearsToRetirement);
  const progressToGoal = Math.min(100, (netWorth / inflationAdjustedTarget) * 100);

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
              Netto Vermogen
            </h1>
            <InfoTooltip
              title="Netto Vermogen"
              content="Je netto vermogen is wat je bezit (activa) minus wat je schuldig bent (passiva). Dit is de belangrijkste maatstaf voor je financiële gezondheid."
            />
          </div>
          <p className="text-muted-foreground mt-1">
            Overzicht van je totale financiële positie
          </p>
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8 space-y-6">
          {/* Net Worth Hero */}
          <div className="p-8 gradient-primary rounded-2xl text-primary-foreground text-center">
            <p className="text-primary-foreground/80 mb-2">Totaal Netto Vermogen</p>
            <p className="text-5xl font-bold mb-4">
              €{netWorth.toLocaleString()}
            </p>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <p className="text-primary-foreground/70">Activa</p>
                <p className="font-semibold">€{totalAssets.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70">Schulden</p>
                <p className="font-semibold">€{totalDebt.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Progress to Goal */}
          <div className="p-6 bg-card rounded-xl border shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Voortgang naar Vrijheid</h2>
                <InfoTooltip
                  title="Financiële Vrijheid"
                  content="Gebaseerd op je gewenste maandinkomen en de 4%-regel (25x jaarinkomen als vermogen). Gecorrigeerd voor 2,5% jaarlijkse inflatie."
                />
              </div>
              <span className="text-2xl font-bold text-primary">{Math.round(progressToGoal)}%</span>
            </div>
            <Progress value={progressToGoal} className="h-4 mb-4" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Huidig: €{netWorth.toLocaleString()}</span>
              <span>Doel: €{inflationAdjustedTarget.toLocaleString()} (over {yearsToRetirement} jaar)</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Vastgoedwaarde"
              value={`€${totalPropertyValue.toLocaleString()}`}
              subtitle={`${properties.length} panden`}
              icon={<Building2 className="w-5 h-5 text-primary" />}
              tooltip={{
                title: "Vastgoedwaarde",
                content: "De totale geschatte marktwaarde van al je panden, of de aankoopprijs als je geen waardering hebt ingevoerd.",
              }}
            />
            <StatCard
              title="Eigen Vermogen Vastgoed"
              value={`€${propertyEquity.toLocaleString()}`}
              subtitle="Waarde - Schulden"
              icon={<TrendingUp className="w-5 h-5 text-success" />}
              variant={propertyEquity >= 0 ? "success" : "default"}
              tooltip={{
                title: "Eigen Vermogen",
                content: "De waarde van je panden minus de openstaande hypotheken. Dit is wat je zou overhouden als je alles zou verkopen.",
              }}
            />
            <StatCard
              title="Liquide Middelen"
              value={`€${(savings + investments).toLocaleString()}`}
              subtitle="Spaargeld + beleggingen"
              icon={<PiggyBank className="w-5 h-5 text-primary" />}
              tooltip={{
                title: "Liquide Middelen",
                content: "Geld dat je snel beschikbaar hebt: spaargeld en beleggingen. Belangrijk voor noodgevallen en kansen.",
              }}
            />
            <StatCard
              title="Totale Schuld"
              value={`€${totalDebt.toLocaleString()}`}
              subtitle={`${loans.length} leningen`}
              icon={<CreditCard className="w-5 h-5 text-destructive" />}
              tooltip={{
                title: "Totale Schuld",
                content: "De som van alle openstaande hypotheken en leningen.",
              }}
            />
          </div>

          {/* Ratios */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 bg-card rounded-xl border shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Liquiditeitsratio</h3>
                <InfoTooltip
                  title="Liquiditeitsratio"
                  content="Hoeveel maanden kun je je kosten dekken met je liquide middelen? Een ratio van 6+ wordt aanbevolen als noodbuffer."
                />
              </div>
              <p className="text-3xl font-bold text-foreground mb-2">
                {liquidityRatio.toFixed(1)}x
              </p>
              <p className="text-sm text-muted-foreground">
                {liquidityRatio >= 6 
                  ? "Goede buffer voor noodgevallen" 
                  : liquidityRatio >= 3 
                    ? "Minimale buffer, overweeg meer te sparen"
                    : "Lage buffer, prioriteit geven aan sparen"}
              </p>
              <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    liquidityRatio >= 6 ? "bg-success" : liquidityRatio >= 3 ? "bg-warning" : "bg-destructive"
                  }`}
                  style={{ width: `${Math.min(100, (liquidityRatio / 12) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-6 bg-card rounded-xl border shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-foreground">Schuld/Activa Ratio</h3>
                <InfoTooltip
                  title="Schuld/Activa Ratio"
                  content="Welk percentage van je bezittingen is gefinancierd met schulden? Lager is beter. Onder 50% wordt als gezond beschouwd."
                />
              </div>
              <p className="text-3xl font-bold text-foreground mb-2">
                {debtToAssetRatio.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {debtToAssetRatio <= 30 
                  ? "Laag risico, sterke positie" 
                  : debtToAssetRatio <= 50 
                    ? "Gezond niveau"
                    : debtToAssetRatio <= 70
                      ? "Matig risico, werk aan aflossing"
                      : "Hoog risico, prioriteit aflossen"}
              </p>
              <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    debtToAssetRatio <= 30 ? "bg-success" : debtToAssetRatio <= 50 ? "bg-warning" : "bg-destructive"
                  }`}
                  style={{ width: `${Math.min(100, debtToAssetRatio)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Property Breakdown */}
          <div className="p-6 bg-card rounded-xl border shadow-card">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Vermogen per Pand
            </h2>
            <div className="space-y-4">
              {properties.map((property) => {
                const loan = loans.find((l) => l.property_id === property.id);
                const value = Number(property.waardering || property.aankoopprijs);
                const debt = Number(loan?.restschuld || loan?.hoofdsom || 0);
                const equity = value - debt;
                const equityPercent = value > 0 ? (equity / value) * 100 : 100;

                return (
                  <div key={property.id} className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-foreground">{property.naam}</h3>
                        <p className="text-sm text-muted-foreground">{property.locatie}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          €{equity.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {equityPercent.toFixed(0)}% eigen vermogen
                        </p>
                      </div>
                    </div>
                    <div className="h-3 bg-destructive/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success rounded-full transition-all"
                        style={{ width: `${equityPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Schuld: €{debt.toLocaleString()}</span>
                      <span>Waarde: €{value.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assets Manager */}
          <AssetsManager />
        </div>
      </div>
    </AppLayout>
  );
};

export default NettoVermogen;
        </div>
      </div>
    </AppLayout>
  );
};

export default NettoVermogen;
