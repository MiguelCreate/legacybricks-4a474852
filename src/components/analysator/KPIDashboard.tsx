import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { InvestmentAnalysis, metricExplanations } from "@/lib/rendementsCalculations";
import { TrendingUp, Percent, Shield, Target, BarChart3, Home } from "lucide-react";

interface KPIDashboardProps {
  analysis: InvestmentAnalysis;
}

export function KPIDashboard({ analysis }: KPIDashboardProps) {
  const kpis = [
    {
      key: "bar",
      label: "BAR",
      value: `${analysis.bar}%`,
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      key: "nar",
      label: "NAR",
      value: `${analysis.nar}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      key: "cashOnCash",
      label: "Cash-on-Cash",
      value: `${analysis.cashOnCash}%`,
      icon: Percent,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      key: "dscr",
      label: "DSCR",
      value: analysis.dscr === Infinity ? "∞" : analysis.dscr.toFixed(2),
      icon: Shield,
      color: analysis.dscr >= 1.2 ? "text-green-600" : analysis.dscr >= 1 ? "text-yellow-600" : "text-red-600",
      bgColor: analysis.dscr >= 1.2 ? "bg-green-50 dark:bg-green-950/30" : analysis.dscr >= 1 ? "bg-yellow-50 dark:bg-yellow-950/30" : "bg-red-50 dark:bg-red-950/30",
    },
    {
      key: "irr",
      label: "IRR",
      value: `${analysis.irr}%`,
      icon: Target,
      color: analysis.irr >= 12 ? "text-green-600" : analysis.irr >= 8 ? "text-yellow-600" : "text-red-600",
      bgColor: analysis.irr >= 12 ? "bg-green-50 dark:bg-green-950/30" : analysis.irr >= 8 ? "bg-yellow-50 dark:bg-yellow-950/30" : "bg-red-50 dark:bg-red-950/30",
    },
    {
      key: "breakEvenOccupancy",
      label: "Break-even",
      value: `${analysis.breakEvenOccupancy}%`,
      icon: BarChart3,
      color: analysis.breakEvenOccupancy <= 60 ? "text-green-600" : analysis.breakEvenOccupancy <= 80 ? "text-yellow-600" : "text-red-600",
      bgColor: analysis.breakEvenOccupancy <= 60 ? "bg-green-50 dark:bg-green-950/30" : analysis.breakEvenOccupancy <= 80 ? "bg-yellow-50 dark:bg-yellow-950/30" : "bg-red-50 dark:bg-red-950/30",
    },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Rendementsoverzicht
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((kpi) => {
            const explanation = metricExplanations[kpi.key];
            return (
              <div
                key={kpi.key}
                className={`${kpi.bgColor} rounded-lg p-3 space-y-1`}
              >
                <div className="flex items-center gap-1">
                  <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {kpi.label}
                  </span>
                  {explanation && (
                    <InfoTooltip 
                      content={
                        <div className="space-y-2 max-w-xs">
                          <p className="font-medium">{explanation.title}</p>
                          <p className="text-sm">{explanation.explanation}</p>
                          <p className="text-sm text-muted-foreground italic">
                            {explanation.importance}
                          </p>
                        </div>
                      }
                    />
                  )}
                </div>
                <p className={`text-lg font-bold ${kpi.color}`}>
                  {kpi.value}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Investment Summary */}
        <div className="mt-4 pt-4 border-t border-border grid gap-4 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Totale Investering</p>
            <p className="text-lg font-bold text-foreground">
              €{analysis.totalInvestment.toLocaleString("nl-NL")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Eigen Inleg</p>
            <p className="text-lg font-bold text-foreground">
              €{analysis.ownCapital.toLocaleString("nl-NL")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Hypotheek</p>
            <p className="text-lg font-bold text-foreground">
              €{analysis.loanAmount.toLocaleString("nl-NL")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
