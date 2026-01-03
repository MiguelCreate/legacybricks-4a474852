import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  PiggyBank, 
  Shield,
  Target,
  Home,
  Percent,
  ChevronLeft,
  Save,
  BarChart3
} from "lucide-react";
import { InvestmentAnalysis, AnalysisInputs, getRiskAssessment } from "@/lib/rendementsCalculations";

interface WizardResultStepProps {
  analysis: InvestmentAnalysis;
  inputs: AnalysisInputs;
  onPrev: () => void;
  propertyName: string;
  setPropertyName: (name: string) => void;
  propertyLocation: string;
  setPropertyLocation: (location: string) => void;
  onSave: () => void;
  onSwitchToAdvanced: () => void;
}

export function WizardResultStep({
  analysis,
  inputs,
  onPrev,
  propertyName,
  setPropertyName,
  propertyLocation,
  setPropertyLocation,
  onSave,
  onSwitchToAdvanced,
}: WizardResultStepProps) {
  const riskAssessment = getRiskAssessment(analysis);

  const euro = (n: number) => `€${Math.round(n).toLocaleString("nl-NL")}`;
  const calcPMT = (principal: number, annualRate: number, years: number) => {
    if (principal <= 0 || years <= 0) return 0;
    if (annualRate <= 0) return principal / (years * 12);
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    return (
      principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    );
  };

  const mortgageType = inputs.mortgageInputType || "ltv";
  const loanAmount =
    mortgageType === "downpayment"
      ? Math.max(0, inputs.purchasePrice - Number(inputs.downpayment ?? 0))
      : inputs.purchasePrice * (inputs.ltv / 100);
  const calculatedMonthlyMortgage = calcPMT(loanAmount, inputs.interestRate, inputs.loanTermYears);
  const monthlyMortgage = inputs.monthlyMortgageOverride ?? calculatedMonthlyMortgage;
  
  const getStatusConfig = (level: string) => {
    switch (level) {
      case "good":
        return {
          icon: <CheckCircle2 className="w-6 h-6" />,
          bg: "bg-success/10 border-success/30",
          iconBg: "bg-success/20 text-success",
          label: "Rendabel",
          emoji: "✅"
        };
      case "moderate":
        return {
          icon: <AlertTriangle className="w-6 h-6" />,
          bg: "bg-warning/10 border-warning/30", 
          iconBg: "bg-warning/20 text-warning",
          label: "Matig",
          emoji: "⚠️"
        };
      default:
        return {
          icon: <XCircle className="w-6 h-6" />,
          bg: "bg-destructive/10 border-destructive/30",
          iconBg: "bg-destructive/20 text-destructive",
          label: "Risicovol",
          emoji: "❌"
        };
    }
  };

  const config = getStatusConfig(riskAssessment.level);
  const monthlyCashflow = Math.round((analysis.yearlyCashflows[0]?.netCashflow || 0) / 12);

  const kpis = [
    { label: "BAR", value: `${analysis.bar.toFixed(1)}%`, icon: Home, good: analysis.bar >= 6 },
    { label: "NAR", value: `${analysis.nar.toFixed(1)}%`, icon: TrendingUp, good: analysis.nar >= 4 },
    { label: "Cash-on-Cash", value: `${analysis.cashOnCash.toFixed(1)}%`, icon: Percent, good: analysis.cashOnCash >= 6 },
    { label: "DSCR", value: analysis.dscr.toFixed(2), icon: Shield, good: analysis.dscr >= 1.2 },
    { label: "IRR", value: `${analysis.irr.toFixed(1)}%`, icon: Target, good: analysis.irr >= 10 },
    { label: "Break-even", value: `${analysis.breakEvenOccupancy.toFixed(0)}%`, icon: BarChart3, good: analysis.breakEvenOccupancy <= 60 },
  ];

  return (
    <div className="space-y-6">
      {/* Main Verdict Card */}
      <Card className={`${config.bg} border-2`}>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${config.iconBg}`}>
              {config.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-2xl">{config.emoji}</span>
                <h2 className="text-2xl font-bold text-foreground">
                  Dit pand is {config.label.toLowerCase()}
                </h2>
              </div>
              <p className="text-muted-foreground">
                {riskAssessment.reasons[0]}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {monthlyCashflow >= 0 ? "+" : ""}{euro(monthlyCashflow)}/mnd
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="bg-secondary/30">
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Totale Investering</p>
            <p className="text-xl font-bold">{euro(analysis.totalInvestment)}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Eigen Inleg</p>
            <p className="text-xl font-bold">{euro(analysis.ownCapital)}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30 col-span-2 sm:col-span-1">
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Hypotheek</p>
            <p className="text-xl font-bold">{euro(analysis.loanAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Input Summary */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invoercheck</CardTitle>
          <CardDescription>Controleer snel je aannames uit de vorige stappen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Aankoop</p>
              <p>Aankoopprijs: <span className="font-medium">{euro(inputs.purchasePrice)}</span></p>
              <p>IMT: <span className="font-medium">{euro(inputs.imt)}</span></p>
              <p>Notaris: <span className="font-medium">{euro(inputs.notaryFees)}</span></p>
              <p>Renovatie: <span className="font-medium">{euro(inputs.renovationCosts)}</span></p>
              <p>Inrichting: <span className="font-medium">{euro(inputs.furnishingCosts)}</span></p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Financiering</p>
              <p>
                Methode: <span className="font-medium">{mortgageType === "ltv" ? "LTV" : "Eigen inleg"}</span>
              </p>
              {mortgageType === "ltv" ? (
                <p>LTV: <span className="font-medium">{inputs.ltv.toFixed(0)}%</span></p>
              ) : (
                <p>Eigen inleg: <span className="font-medium">{euro(Number(inputs.downpayment ?? 0))}</span></p>
              )}
              <p>Hypotheek: <span className="font-medium">{euro(loanAmount)}</span></p>
              <p>Rente: <span className="font-medium">{inputs.interestRate.toFixed(2)}%</span></p>
              <p>Looptijd: <span className="font-medium">{inputs.loanTermYears} jaar</span></p>
              <p>Maandlast: <span className="font-medium">{euro(monthlyMortgage)}</span></p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Verhuur</p>
              <p>
                Type: <span className="font-medium">
                  {inputs.rentalType === "longterm" ? "Langdurig" : inputs.rentalType === "shortterm" ? "Korte termijn" : "Gemengd"}
                </span>
              </p>
              {(inputs.rentalType === "longterm" || inputs.rentalType === "mixed") && (
                <p>Huur (LT): <span className="font-medium">{euro(inputs.monthlyRentLT)}/mnd</span></p>
              )}
              {(inputs.rentalType === "shortterm" || inputs.rentalType === "mixed") && (
                <p>ST: <span className="font-medium">{inputs.stOccupancy.toFixed(0)}%</span> bezetting · <span className="font-medium">{euro(inputs.stADR)}</span> ADR</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Kosten</p>
              <p>Beheer: <span className="font-medium">{inputs.managementPercent.toFixed(0)}%</span></p>
              <p>Onderhoud: <span className="font-medium">{euro(inputs.maintenanceYearly)}/jr</span></p>
              <p>IMI: <span className="font-medium">{euro(inputs.imiYearly)}/jr</span></p>
              <p>Verzekering: <span className="font-medium">{euro(inputs.insuranceYearly)}/jr</span></p>
              <p>VvE: <span className="font-medium">{euro(inputs.condoMonthly)}/mnd</span></p>
              <p>Utilities: <span className="font-medium">{euro(inputs.utilitiesMonthly)}/mnd</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rendementskengetallen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map((kpi) => (
              <div 
                key={kpi.label}
                className={`rounded-lg p-3 text-center ${
                  kpi.good ? 'bg-success/10' : 'bg-warning/10'
                }`}
              >
                <kpi.icon className={`w-4 h-4 mx-auto mb-1 ${
                  kpi.good ? 'text-success' : 'text-warning'
                }`} />
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-lg font-bold ${
                  kpi.good ? 'text-success' : 'text-warning'
                }`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Section */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Save className="w-4 h-4 text-primary" />
            Opslaan als Potentiële Investering
          </CardTitle>
          <CardDescription>
            Bewaar deze analyse om later te vergelijken
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Pandnaam</Label>
              <Input
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="Bijv. Appartement Lissabon"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Locatie</Label>
              <Input
                value={propertyLocation}
                onChange={(e) => setPropertyLocation(e.target.value)}
                placeholder="Bijv. Lissabon, Portugal"
                className="h-9"
              />
            </div>
          </div>
          <Button type="button" onClick={onSave} className="w-full gap-2">
            <Save className="w-4 h-4" />
            Opslaan als Nieuw Pand
          </Button>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button type="button" variant="outline" onClick={onPrev} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Terug naar Invoer
        </Button>
        <Button type="button" variant="secondary" onClick={onSwitchToAdvanced} className="gap-2">
          <BarChart3 className="w-4 h-4" />
          Bekijk Gedetailleerde Analyse
        </Button>
      </div>
    </div>
  );
}
