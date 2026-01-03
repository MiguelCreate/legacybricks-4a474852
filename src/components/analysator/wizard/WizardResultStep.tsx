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
import { InvestmentAnalysis, getRiskAssessment } from "@/lib/rendementsCalculations";

interface WizardResultStepProps {
  analysis: InvestmentAnalysis;
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
  onPrev, 
  propertyName, 
  setPropertyName, 
  propertyLocation, 
  setPropertyLocation,
  onSave,
  onSwitchToAdvanced
}: WizardResultStepProps) {
  const riskAssessment = getRiskAssessment(analysis);
  
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
              {monthlyCashflow >= 0 ? '+' : ''}€{monthlyCashflow.toLocaleString("nl-NL")}/mnd
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="bg-secondary/30">
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Totale Investering</p>
            <p className="text-xl font-bold">€{analysis.totalInvestment.toLocaleString("nl-NL")}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Eigen Inleg</p>
            <p className="text-xl font-bold">€{analysis.ownCapital.toLocaleString("nl-NL")}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30 col-span-2 sm:col-span-1">
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Hypotheek</p>
            <p className="text-xl font-bold">€{analysis.loanAmount.toLocaleString("nl-NL")}</p>
          </CardContent>
        </Card>
      </div>

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
          <Button onClick={onSave} className="w-full gap-2">
            <Save className="w-4 h-4" />
            Opslaan als Nieuw Pand
          </Button>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button variant="outline" onClick={onPrev} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Terug naar Invoer
        </Button>
        <Button variant="secondary" onClick={onSwitchToAdvanced} className="gap-2">
          <BarChart3 className="w-4 h-4" />
          Bekijk Gedetailleerde Analyse
        </Button>
      </div>
    </div>
  );
}
