import { useMemo } from "react";
import { 
  TrendingUp, TrendingDown, Wallet, PiggyBank, Shield, 
  AlertTriangle, Target, Building2, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Tables } from "@/integrations/supabase/types";
import { calculatePropertySurplus } from "./useGoalCalculations";

type Goal = Tables<"goals">;
type Property = Tables<"properties">;
type Loan = Tables<"loans">;
type Tenant = Tables<"tenants">;

interface ImpactDashboardProps {
  goals: Goal[];
  properties: Property[];
  loans: Loan[];
  tenants: Tenant[];
}

export const ImpactDashboard = ({ goals, properties, loans, tenants }: ImpactDashboardProps) => {
  const calculations = useMemo(() => {
    const activeGoals = goals.filter(g => !g.bereikt && !g.gepauzeerd);
    const completedGoals = goals.filter(g => g.bereikt);
    
    // Total monthly commitments to goals
    const totalMonthlyCommitments = activeGoals.reduce((sum, goal) => {
      return sum + Number(goal.maandelijkse_inleg || 0);
    }, 0);
    
    // Total property surplus (using consistent calculation with tenants)
    const totalPropertySurplus = properties.reduce((sum, property) => {
      return sum + calculatePropertySurplus(property, loans, tenants);
    }, 0);
    
    // Amount allocated from property surplus (10% per linked goal)
    const linkedGoals = activeGoals.filter(g => g.bron_property_id);
    const allocatedFromSurplus = linkedGoals.reduce((sum, goal) => {
      const property = properties.find(p => p.id === goal.bron_property_id);
      if (property) {
        const surplus = calculatePropertySurplus(property, loans, tenants);
        return sum + (surplus > 0 ? surplus * 0.1 : 0);
      }
      return sum;
    }, 0);
    
    const totalEffectiveContribution = totalMonthlyCommitments + allocatedFromSurplus;
    
    // Total target amounts
    const totalTargetAmount = activeGoals.reduce((sum, g) => sum + Number(g.doelbedrag), 0);
    const totalCurrentAmount = activeGoals.reduce((sum, g) => sum + Number(g.huidig_bedrag), 0);
    const totalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
    
    // Wealth impact (sum of all completed goals)
    const wealthBuilt = completedGoals.reduce((sum, g) => sum + Number(g.doelbedrag), 0);
    
    // Risk assessment
    const commitmentRatio = totalPropertySurplus > 0 
      ? (totalEffectiveContribution / totalPropertySurplus) * 100 
      : 0;
    
    let riskLevel: "low" | "medium" | "high" = "low";
    if (commitmentRatio > 80) riskLevel = "high";
    else if (commitmentRatio > 50) riskLevel = "medium";
    
    // Category breakdown
    const categoryBreakdown = {
      vastgoed: activeGoals.filter(g => g.categorie === "vastgoed").reduce((sum, g) => sum + Number(g.doelbedrag), 0),
      vermogen: activeGoals.filter(g => g.categorie === "vermogen").reduce((sum, g) => sum + Number(g.doelbedrag), 0),
      persoonlijk: activeGoals.filter(g => g.categorie === "persoonlijk").reduce((sum, g) => sum + Number(g.doelbedrag), 0),
    };
    
    // Calculate months to financial freedom
    // (Simplified: total target / monthly contribution)
    const monthsToFreedom = totalEffectiveContribution > 0 
      ? Math.ceil((totalTargetAmount - totalCurrentAmount) / totalEffectiveContribution)
      : null;
    
    return {
      activeCount: activeGoals.length,
      completedCount: completedGoals.length,
      totalMonthlyCommitments,
      totalPropertySurplus,
      allocatedFromSurplus,
      totalEffectiveContribution,
      totalTargetAmount,
      totalCurrentAmount,
      totalProgress,
      wealthBuilt,
      commitmentRatio,
      riskLevel,
      categoryBreakdown,
      monthsToFreedom,
      remainingCashflow: totalPropertySurplus - totalEffectiveContribution,
    };
  }, [goals, properties, loans, tenants]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Total Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4" />
            Totale Voortgang
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {calculations.totalProgress.toFixed(0)}%
          </div>
          <Progress value={calculations.totalProgress} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            €{calculations.totalCurrentAmount.toLocaleString("nl-NL")} / €{calculations.totalTargetAmount.toLocaleString("nl-NL")}
          </p>
        </CardContent>
      </Card>

      {/* Monthly Contribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <PiggyBank className="w-4 h-4" />
            Maandelijkse Inleg
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            €{calculations.totalEffectiveContribution.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            €{calculations.totalMonthlyCommitments.toLocaleString("nl-NL")} handmatig + €{calculations.allocatedFromSurplus.toLocaleString("nl-NL", { maximumFractionDigits: 0 })} uit panden
          </p>
        </CardContent>
      </Card>

      {/* Remaining Cashflow */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Resterende Cashflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            calculations.remainingCashflow >= 0 ? "text-success" : "text-destructive"
          }`}>
            €{calculations.remainingCashflow.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Na inleg voor doelen
          </p>
        </CardContent>
      </Card>

      {/* Risk Level */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Liquiditeitsrisico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            calculations.riskLevel === "low" ? "text-success" :
            calculations.riskLevel === "medium" ? "text-warning" : "text-destructive"
          }`}>
            {calculations.riskLevel === "low" ? "Laag" :
             calculations.riskLevel === "medium" ? "Gemiddeld" : "Hoog"}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {calculations.commitmentRatio.toFixed(0)}% van surplus gecommitteerd
          </p>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Verdeling per Categorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Building2 className="w-3 h-3 text-primary" />
                Vastgoed
              </span>
              <span className="font-medium">€{calculations.categoryBreakdown.vastgoed.toLocaleString("nl-NL")}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Wallet className="w-3 h-3 text-success" />
                Vermogen
              </span>
              <span className="font-medium">€{calculations.categoryBreakdown.vermogen.toLocaleString("nl-NL")}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent" />
                Persoonlijk
              </span>
              <span className="font-medium">€{calculations.categoryBreakdown.persoonlijk.toLocaleString("nl-NL")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time to Goals */}
      <Card className="col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Vermogensopbouw
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">
                €{calculations.wealthBuilt.toLocaleString("nl-NL")}
              </p>
              <p className="text-xs text-muted-foreground">
                Bereikt via {calculations.completedCount} voltooide doelen
              </p>
            </div>
            {calculations.monthsToFreedom && (
              <div className="text-right">
                <p className="text-lg font-bold text-primary">
                  ~{(calculations.monthsToFreedom / 12).toFixed(1)} jaar
                </p>
                <p className="text-xs text-muted-foreground">
                  tot alle actieve doelen
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
