import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  DoorOpen, 
  TrendingUp, 
  Clock, 
  Euro, 
  Calculator,
  Target,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface Goal {
  id: string;
  naam: string;
  doelbedrag: number;
  huidig_bedrag: number;
}

interface ExitStrategyAdvisorProps {
  propertyId: string;
  propertyName: string;
  purchasePrice: number;
  currentMarketValue: number;
  monthlyRent: number;
  monthlyMortgage: number;
  remainingDebt: number;
  yearlyOpex: number;
  valueGrowth: number;
  costGrowth: number;
  rentGrowth: number;
}

interface ExitScenario {
  name: string;
  years: number;
  netProceeds: number;
  cumulativeCashflow: number;
  totalReturn: number;
  annualizedReturn: number;
}

export function ExitStrategyAdvisor({
  propertyId,
  propertyName,
  purchasePrice,
  currentMarketValue,
  monthlyRent,
  monthlyMortgage,
  remainingDebt,
  yearlyOpex,
  valueGrowth = 3,
  costGrowth = 2,
  rentGrowth = 2,
}: ExitStrategyAdvisorProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [sellingCosts, setSellingCosts] = useState({
    agentPercent: 5,
    notaryFees: 2000,
    plusvaliaPercent: 28, // Capital gains tax
  });

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("goals")
        .select("id, naam, doelbedrag, huidig_bedrag")
        .eq("user_id", user.id)
        .eq("bereikt", false);
      
      if (data) setGoals(data);
    };
    fetchGoals();
  }, [user]);

  // Calculate scenarios
  const scenarios = useMemo((): ExitScenario[] => {
    const calculateScenario = (years: number): ExitScenario => {
      // Future market value
      const futureValue = currentMarketValue * Math.pow(1 + valueGrowth / 100, years);
      
      // Selling costs
      const agentFee = futureValue * (sellingCosts.agentPercent / 100);
      const capitalGain = Math.max(0, futureValue - purchasePrice);
      const plusvalia = capitalGain * (sellingCosts.plusvaliaPercent / 100);
      const totalSellingCosts = agentFee + sellingCosts.notaryFees + plusvalia;
      
      // Calculate remaining debt after years
      // Simplified: assume linear paydown
      const debtPaydownPerYear = monthlyMortgage * 12 * 0.3; // Rough estimate: 30% goes to principal
      const futureDebt = Math.max(0, remainingDebt - (debtPaydownPerYear * years));
      
      // Net proceeds from sale
      const netProceeds = futureValue - totalSellingCosts - futureDebt;
      
      // Cumulative cashflow over the years
      let cumulativeCashflow = 0;
      let currentRent = monthlyRent * 12;
      let currentOpex = yearlyOpex;
      
      for (let y = 1; y <= years; y++) {
        const yearlyIncome = currentRent;
        const yearlyExpenses = currentOpex + (monthlyMortgage * 12);
        cumulativeCashflow += yearlyIncome - yearlyExpenses;
        
        currentRent *= (1 + rentGrowth / 100);
        currentOpex *= (1 + costGrowth / 100);
      }
      
      // Total return
      const totalReturn = netProceeds + cumulativeCashflow;
      
      // Annualized return (simplified)
      const ownCapital = purchasePrice - remainingDebt;
      const annualizedReturn = years > 0 && ownCapital > 0
        ? ((Math.pow((totalReturn + ownCapital) / ownCapital, 1 / years) - 1) * 100)
        : 0;
      
      return {
        name: years === 0 ? "Vandaag verkopen" : `Behouden ${years} jaar`,
        years,
        netProceeds: Math.round(netProceeds),
        cumulativeCashflow: Math.round(cumulativeCashflow),
        totalReturn: Math.round(totalReturn),
        annualizedReturn: Math.round(annualizedReturn * 10) / 10,
      };
    };

    return [
      calculateScenario(0),
      calculateScenario(5),
      calculateScenario(10),
      calculateScenario(15),
    ];
  }, [currentMarketValue, purchasePrice, remainingDebt, monthlyRent, monthlyMortgage, yearlyOpex, valueGrowth, rentGrowth, costGrowth, sellingCosts]);

  // Find best scenario
  const bestScenario = useMemo(() => {
    return scenarios.reduce((best, current) => 
      current.totalReturn > best.totalReturn ? current : best
    );
  }, [scenarios]);

  // Goal coverage calculation
  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const goalCoverage = selectedGoal && scenarios[0].netProceeds > 0
    ? Math.min(100, (scenarios[0].netProceeds / (selectedGoal.doelbedrag - selectedGoal.huidig_bedrag)) * 100)
    : 0;

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString("nl-NL", { minimumFractionDigits: 0 });
    return value < 0 ? `-€${formatted}` : `€${formatted}`;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DoorOpen className="h-4 w-4 text-primary" />
          Exit Strategie Adviseur
          <InfoTooltip 
            title="Exit Strategie" 
            content="Vergelijk scenario's: verkopen vandaag vs. behouden voor X jaar. Objectief advies op basis van rendementen."
          />
        </CardTitle>
        <CardDescription>
          Objectief beslissen: verkopen of behouden?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Comparison */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scenarios.map((scenario, index) => (
            <Card 
              key={index}
              className={`relative ${
                scenario === bestScenario 
                  ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20' 
                  : ''
              }`}
            >
              {scenario === bestScenario && (
                <Badge className="absolute -top-2 -right-2 bg-green-500">
                  Beste optie
                </Badge>
              )}
              <CardContent className="pt-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {scenario.years === 0 ? (
                    <Euro className="h-4 w-4 text-primary" />
                  ) : (
                    <Clock className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {scenario.name}
                  </span>
                </div>
                
                <p className={`text-xl font-bold ${scenario.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(scenario.totalReturn)}
                </p>
                <p className="text-xs text-muted-foreground mb-2">Totaal rendement</p>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Netto exit:</span>
                    <span className="font-medium">{formatCurrency(scenario.netProceeds)}</span>
                  </div>
                  {scenario.years > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cashflow:</span>
                        <span className={scenario.cumulativeCashflow >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(scenario.cumulativeCashflow)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IRR:</span>
                        <span className="font-medium">{scenario.annualizedReturn}%</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommendation */}
        <Card className={`border-l-4 ${
          bestScenario.years === 0 
            ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20' 
            : 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {bestScenario.years === 0 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {bestScenario.years === 0 
                    ? "Overweeg te verkopen" 
                    : `Aanbeveling: Behouden voor ${bestScenario.years} jaar`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {bestScenario.years === 0 
                    ? `Verkopen levert nu ${formatCurrency(bestScenario.netProceeds)} op. Behouden biedt geen significant hoger rendement.`
                    : `IRR van ${bestScenario.annualizedReturn}% per jaar. Totaal rendement: ${formatCurrency(bestScenario.totalReturn)} na ${bestScenario.years} jaar.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goal Linking */}
        {goals.length > 0 && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Koppel aan een doel
            </Label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
            >
              <option value="">Selecteer een doel...</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.naam} ({formatCurrency(goal.doelbedrag)})
                </option>
              ))}
            </select>

            {selectedGoal && (
              <Card className="bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-medium">"{selectedGoal.naam}"</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Verkoop nu levert {formatCurrency(scenarios[0].netProceeds)} op.
                    Dit dekt <strong className="text-foreground">{Math.round(goalCoverage)}%</strong> van je resterende doel.
                  </p>
                  {goalCoverage >= 100 && (
                    <Badge className="mt-2 bg-green-500">Doel volledig gedekt!</Badge>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Selling Costs Assumptions */}
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            ⚙️ Verkoop aannames aanpassen
          </summary>
          <div className="grid gap-4 sm:grid-cols-3 mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-xs">Makelaar (%)</Label>
              <Input
                type="number"
                value={sellingCosts.agentPercent}
                onChange={(e) => setSellingCosts({ 
                  ...sellingCosts, 
                  agentPercent: parseFloat(e.target.value) || 0 
                })}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Notariskosten (€)</Label>
              <Input
                type="number"
                value={sellingCosts.notaryFees}
                onChange={(e) => setSellingCosts({ 
                  ...sellingCosts, 
                  notaryFees: parseFloat(e.target.value) || 0 
                })}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                Plusvalia (%)
                <InfoTooltip 
                  title="Plusvalia (Capital Gains)" 
                  content="Belasting op de meerwaarde bij verkoop. In Portugal meestal 28% voor niet-residenten."
                />
              </Label>
              <Input
                type="number"
                value={sellingCosts.plusvaliaPercent}
                onChange={(e) => setSellingCosts({ 
                  ...sellingCosts, 
                  plusvaliaPercent: parseFloat(e.target.value) || 0 
                })}
                className="h-8"
              />
            </div>
          </div>
        </details>

        {/* Current Property Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{propertyName}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Aankoopprijs:</span>
              <p className="font-medium">{formatCurrency(purchasePrice)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Huidige waarde:</span>
              <p className="font-medium text-green-600">{formatCurrency(currentMarketValue)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Restschuld:</span>
              <p className="font-medium text-red-600">{formatCurrency(remainingDebt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Equity:</span>
              <p className="font-medium text-primary">{formatCurrency(currentMarketValue - remainingDebt)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
