import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  Save, 
  FileDown, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Wallet,
  PiggyBank,
  Building2,
  Percent,
  Shield
} from "lucide-react";
import { MultiUnitInputs, MultiUnitAnalysis, getMetricStatus } from "@/lib/multiUnitCalculations";

interface MultiUnitWizardResultStepProps {
  analysis: MultiUnitAnalysis;
  inputs: MultiUnitInputs;
  onPrev: () => void;
  onSave?: () => void;
  onExportPDF?: () => void;
  onSwitchToAdvanced: () => void;
  propertyName: string;
  setPropertyName: (name: string) => void;
}

export function MultiUnitWizardResultStep({
  analysis,
  inputs,
  onPrev,
  onSave,
  onExportPDF,
  onSwitchToAdvanced,
  propertyName,
  setPropertyName,
}: MultiUnitWizardResultStepProps) {
  const euro = (val: number) => `€${val.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`;

  const getRiskAssessment = () => {
    let score = 0;
    if (analysis.gemiddeldDSCR >= 1.5) score += 2;
    else if (analysis.gemiddeldDSCR >= 1.2) score += 1;
    
    if (analysis.gemiddeldCashOnCash >= 12) score += 2;
    else if (analysis.gemiddeldCashOnCash >= 8) score += 1;
    
    if (analysis.totaalPureCashflow > 0) score += 2;
    else if (analysis.totaalPureCashflow >= -1000) score += 1;
    
    if (analysis.breakEvenBezetting <= 50) score += 2;
    else if (analysis.breakEvenBezetting <= 70) score += 1;
    
    if (score >= 6) return "good";
    if (score >= 3) return "moderate";
    return "risky";
  };

  const risk = getRiskAssessment();
  
  const riskConfig = {
    good: { 
      icon: CheckCircle2, 
      bg: "bg-green-500/10", 
      text: "text-green-600",
      border: "border-green-500/30",
      label: "Sterke investering" 
    },
    moderate: { 
      icon: AlertTriangle, 
      bg: "bg-yellow-500/10", 
      text: "text-yellow-600",
      border: "border-yellow-500/30",
      label: "Let op enkele punten" 
    },
    risky: { 
      icon: XCircle, 
      bg: "bg-red-500/10", 
      text: "text-red-600",
      border: "border-red-500/30",
      label: "Hoog risico" 
    },
  }[risk];

  const RiskIcon = riskConfig.icon;

  const kpis = [
    {
      label: "Cashflow / jaar",
      value: euro(analysis.totaalPureCashflow),
      icon: Wallet,
      status: analysis.totaalPureCashflow > 0 ? "good" : analysis.totaalPureCashflow >= -1000 ? "warning" : "danger",
    },
    {
      label: "Cash-on-Cash",
      value: `${analysis.gemiddeldCashOnCash.toFixed(1)}%`,
      icon: Percent,
      status: getMetricStatus("cashOnCash", analysis.gemiddeldCashOnCash),
    },
    {
      label: "DSCR",
      value: analysis.gemiddeldDSCR.toFixed(2),
      icon: Shield,
      status: getMetricStatus("dscr", analysis.gemiddeldDSCR),
    },
    {
      label: "Cap Rate",
      value: `${analysis.capRate.toFixed(1)}%`,
      icon: TrendingUp,
      status: getMetricStatus("capRate", analysis.capRate),
    },
    {
      label: "IRR (10 jaar)",
      value: `${analysis.irr10Jaar.toFixed(1)}%`,
      icon: TrendingUp,
      status: analysis.irr10Jaar >= 10 ? "good" : analysis.irr10Jaar >= 6 ? "warning" : "danger",
    },
    {
      label: "Break-even bezetting",
      value: `${analysis.breakEvenBezetting.toFixed(0)}%`,
      icon: Building2,
      status: getMetricStatus("breakEvenBezetting", analysis.breakEvenBezetting),
    },
  ];

  const statusColors = {
    good: "bg-green-500/10 text-green-600 border-green-500/30",
    warning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    danger: "bg-red-500/10 text-red-600 border-red-500/30",
  };

  const profitableUnits = analysis.units.filter(u => u.pureCashflow > 0).length;

  return (
    <div className="space-y-6">
      {/* Main Verdict */}
      <Card className={`${riskConfig.bg} ${riskConfig.border} border-2`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full ${riskConfig.bg} flex items-center justify-center`}>
              <RiskIcon className={`w-8 h-8 ${riskConfig.text}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${riskConfig.text}`}>{riskConfig.label}</h2>
              <p className="text-muted-foreground">
                {profitableUnits} van {analysis.units.length} units zijn winstgevend • 
                {euro(analysis.totaalPureCashflow)}/jaar cashflow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="p-4 rounded-lg bg-secondary/30 border">
          <p className="text-xs text-muted-foreground">Totale Investering</p>
          <p className="text-xl font-bold">{euro(analysis.totaleInvestering)}</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border">
          <p className="text-xs text-muted-foreground">Eigen Inleg</p>
          <p className="text-xl font-bold">{euro(analysis.eigenInleg)}</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border">
          <p className="text-xs text-muted-foreground">Bruto Huur / jaar</p>
          <p className="text-xl font-bold">{euro(analysis.totaalBrutoHuur)}</p>
        </div>
      </div>

      {/* KPIs Grid */}
      <Card>
        <CardContent className="pt-6">
          <CardTitle className="text-base mb-4">📊 Kernmetrics</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg border ${statusColors[kpi.status]}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{kpi.label}</span>
                </div>
                <p className="text-lg font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Units Overview */}
      <Card>
        <CardContent className="pt-6">
          <CardTitle className="text-base mb-4">🏠 Units overzicht</CardTitle>
          <div className="space-y-2">
            {analysis.units.map((unit, i) => (
              <div 
                key={unit.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{unit.naam}</p>
                    <p className="text-xs text-muted-foreground">
                      {unit.huurdertype} • {unit.energielabel}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${unit.pureCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {euro(unit.pureCashflow)}/j
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CoC: {unit.cashOnCash.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Diversity */}
      <Card>
        <CardContent className="pt-6">
          <CardTitle className="text-base mb-4">🎯 Huurdermix</CardTitle>
          <div className="flex flex-wrap gap-2">
            {analysis.portfolioDiversiteit.map((item, i) => (
              <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                {item.type === 'langdurig' ? '👨‍👩‍👧‍👦' : item.type === 'toerisme' ? '✈️' : '🎓'}{' '}
                {item.type} ({item.count}x - {item.percentage.toFixed(0)}%)
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Section */}
      {onSave && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <CardTitle className="text-base mb-4">💾 Analyse opslaan</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Pandnaam</Label>
                <Input
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Naam voor deze analyse..."
                  className="mt-1"
                />
              </div>
              <Button onClick={onSave} className="gap-2 sm:self-end">
                <Save className="w-4 h-4" />
                Opslaan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Terug naar invoer
        </Button>
        
        <div className="flex gap-2">
          {onExportPDF && (
            <Button variant="outline" onClick={onExportPDF} className="gap-2">
              <FileDown className="w-4 h-4" />
              PDF
            </Button>
          )}
          <Button variant="secondary" onClick={onSwitchToAdvanced} className="gap-2">
            Gevorderde weergave
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
