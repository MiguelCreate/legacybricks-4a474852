import { useState, useEffect, useCallback } from "react";
import { 
  TrendingDown, Zap, ArrowRight, Building2, Euro, 
  Calendar, Play, BarChart3, Clock, CheckCircle2 
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  simulateSnowball, 
  calculatePMT, 
  calculateRemainingBalance,
  type SnowballProperty,
  type SnowballResult 
} from "@/lib/financialCalculations";
import { SnowballImpactVisualization } from "@/components/sneeuwbal/SnowballImpactVisualization";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Loan = Tables<"loans">;
type Tenant = Tables<"tenants">;

const Sneeuwbal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  const [strategy, setStrategy] = useState<'smallest' | 'highest_interest'>('smallest');
  const [extraPayment, setExtraPayment] = useState(0);
  const [results, setResults] = useState<SnowballResult[]>([]);
  const [hasSimulated, setHasSimulated] = useState(false);

  const handleExtraPaymentChange = useCallback((amount: number) => {
    setExtraPayment(amount);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [propertiesRes, loansRes, tenantsRes] = await Promise.all([
        supabase.from("properties").select("*").eq("gearchiveerd", false),
        supabase.from("loans").select("*"),
        supabase.from("tenants").select("*").eq("actief", true),
      ]);

      if (propertiesRes.error) throw propertiesRes.error;
      if (loansRes.error) throw loansRes.error;
      if (tenantsRes.error) throw tenantsRes.error;

      // Store properties first to filter other data
      const userProperties = propertiesRes.data || [];
      setProperties(userProperties);
      
      // Filter loans and tenants to only include those from user's properties
      const userPropertyIds = userProperties.map(p => p.id);
      const userLoans = (loansRes.data || []).filter(l => userPropertyIds.includes(l.property_id));
      const userTenants = (tenantsRes.data || []).filter(t => userPropertyIds.includes(t.property_id));
      
      setLoans(userLoans);
      setTenants(userTenants);
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

  const runSimulation = () => {
    const snowballProperties: SnowballProperty[] = properties
      .map((property) => {
        const loan = loans.find((l) => l.property_id === property.id);
        const tenant = tenants.find((t) => t.property_id === property.id);
        
        if (!loan) return null;

        const monthlyPayment = Number(loan.maandlast);
        const rentIncome = tenant ? Number(tenant.huurbedrag) : Number(property.maandelijkse_huur || 0);
        
        // Calculate remaining balance
        const startDate = loan.startdatum ? new Date(loan.startdatum) : new Date();
        const monthsElapsed = Math.max(0, 
          (new Date().getFullYear() - startDate.getFullYear()) * 12 + 
          (new Date().getMonth() - startDate.getMonth())
        );
        
        const remainingBalance = loan.restschuld 
          ? Number(loan.restschuld)
          : calculateRemainingBalance(
              Number(loan.hoofdsom || 0),
              Number(loan.rente_percentage || 0),
              Number(loan.looptijd_jaren || 25),
              monthsElapsed
            );

        return {
          id: property.id,
          name: property.naam,
          debt: remainingBalance,
          monthlyPayment,
          netCashflow: rentIncome - monthlyPayment,
          interestRate: Number(loan.rente_percentage || 0),
        };
      })
      .filter((p): p is SnowballProperty => p !== null && p.debt > 0);

    if (snowballProperties.length === 0) {
      toast({
        title: "Geen schulden gevonden",
        description: "Voeg eerst leningen toe aan je panden om de sneeuwbal te simuleren.",
        variant: "destructive",
      });
      return;
    }

    const simulationResults = simulateSnowball(snowballProperties, extraPayment, strategy);
    setResults(simulationResults);
    setHasSimulated(true);

    toast({
      title: "Simulatie voltooid",
      description: `${simulationResults.length} panden geanalyseerd.`,
    });
  };

  const totalDebt = loans.reduce((sum, l) => sum + Number(l.restschuld || l.hoofdsom || 0), 0);
  const totalSurplus = properties.reduce((sum, p) => {
    const tenant = tenants.find((t) => t.property_id === p.id);
    const loan = loans.find((l) => l.property_id === p.id);
    const rent = tenant ? Number(tenant.huurbedrag) : Number(p.maandelijkse_huur || 0);
    const mortgage = loan ? Number(loan.maandlast) : 0;
    return sum + Math.max(0, rent - mortgage);
  }, 0);

  const lastPayoffDate = results.length > 0 
    ? results[results.length - 1]?.payoffDate 
    : null;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Sneeuwbaleffect Planner
            </h1>
            <InfoTooltip
              title="Sneeuwbaleffect"
              content="Het sneeuwbaleffect betekent dat wanneer je één schuld aflost, je de vrijgekomen cashflow gebruikt om de volgende schuld sneller af te lossen. Dit versnelt exponentieel."
            />
          </div>
          <p className="text-muted-foreground mt-1">
            Simuleer hoe snel je schuldenvrij kunt worden
          </p>
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8 space-y-6">
          {/* Current Status */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 bg-card rounded-xl border shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">Totale Schuld</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                €{totalDebt.toLocaleString()}
              </p>
            </div>

            <div className="p-5 bg-card rounded-xl border shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Euro className="w-4 h-4" />
                <span className="text-sm">Maandelijks Overschot</span>
              </div>
              <p className="text-2xl font-bold text-success">
                €{totalSurplus.toLocaleString()}
              </p>
            </div>

            <div className="p-5 bg-card rounded-xl border shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">Panden met Schuld</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {loans.length}
              </p>
            </div>
          </div>

          {/* Simulation Settings */}
          <div className="p-6 bg-card rounded-xl border shadow-card">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Simulatie Instellingen
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  Aflossingsstrategie
                  <InfoTooltip
                    title="Aflossingsstrategie"
                    content="'Kleinste schuld eerst' geeft snelle motivatiewinsten. 'Hoogste rente eerst' bespaart het meeste geld op de lange termijn."
                  />
                </Label>
                <Select
                  value={strategy}
                  onValueChange={(value: 'smallest' | 'highest_interest') => setStrategy(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smallest">Kleinste schuld eerst</SelectItem>
                    <SelectItem value="highest_interest">Hoogste rente eerst</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Extra maandelijkse aflossing (€)
                  <InfoTooltip
                    title="Extra Aflossing"
                    content="Voeg hier toe wat je maandelijks extra kunt aflossen bovenop je reguliere betalingen. Dit versnelt het sneeuwbaleffect enorm."
                  />
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={extraPayment || ""}
                  onChange={(e) => setExtraPayment(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={runSimulation}
                  className="w-full gradient-primary text-primary-foreground gap-2"
                  disabled={loading || properties.length === 0}
                >
                  <Play className="w-4 h-4" />
                  Simuleer
                </Button>
              </div>
            </div>
          </div>

          {/* Extra Inleg Component */}
          <SnowballImpactVisualization
            baseResults={results}
            totalDebt={totalDebt}
            totalSurplus={totalSurplus}
            onExtraPaymentChange={handleExtraPaymentChange}
          />

          {/* Results */}
          {hasSimulated && (
            <div className="space-y-6 animate-slide-up">
              {/* Summary */}
              {lastPayoffDate && (
                <div className="p-6 gradient-primary rounded-xl text-primary-foreground">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Volledig Schuldenvrij</h2>
                  </div>
                  <p className="text-primary-foreground/80">
                    Op basis van deze simulatie ben je volledig schuldenvrij in{" "}
                    <span className="font-bold">
                      {lastPayoffDate.toLocaleDateString("nl-NL", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div className="p-6 bg-card rounded-xl border shadow-card">
                <h2 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Aflossingstijdlijn
                </h2>

                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div
                      key={result.propertyId}
                      className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {result.propertyName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Schuldenvrij na {result.monthsToPayoff} maanden</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-success">
                          {result.payoffDate.toLocaleDateString("nl-NL", {
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {index < results.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Bar Chart */}
              <div className="p-6 bg-card rounded-xl border shadow-card">
                <h2 className="font-semibold text-foreground mb-4">
                  Schuld per Pand
                </h2>
                <div className="space-y-3">
                  {results.map((result) => {
                    const property = properties.find((p) => p.id === result.propertyId);
                    const loan = loans.find((l) => l.property_id === result.propertyId);
                    const debt = Number(loan?.restschuld || loan?.hoofdsom || 0);
                    const maxDebt = Math.max(...loans.map((l) => Number(l.restschuld || l.hoofdsom || 0)));
                    const percentage = maxDebt > 0 ? (debt / maxDebt) * 100 : 0;

                    return (
                      <div key={result.propertyId} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-foreground">{result.propertyName}</span>
                          <span className="text-muted-foreground">€{debt.toLocaleString()}</span>
                        </div>
                        <div className="h-6 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-primary rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!hasSimulated && !loading && properties.length === 0 && (
            <div className="text-center py-16 bg-card rounded-xl border">
              <TrendingDown className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Geen panden gevonden</h3>
              <p className="text-muted-foreground">
                Voeg eerst panden met leningen toe om de sneeuwbal te simuleren
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Sneeuwbal;
