import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  FlaskConical,
  Percent,
  Home,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { analyzeInvestment, type AnalysisInputs, type InvestmentAnalysis } from "@/lib/rendementsCalculations";

interface SensitivityAnalysisProps {
  baseInputs: AnalysisInputs;
  onAnalysisChange?: (analysis: InvestmentAnalysis) => void;
}

export const SensitivityAnalysis = ({
  baseInputs,
  onAnalysisChange,
}: SensitivityAnalysisProps) => {
  const [testInterestRate, setTestInterestRate] = useState(baseInputs.interestRate);
  const [testOccupancy, setTestOccupancy] = useState(baseInputs.stOccupancy);
  const [testRentChange, setTestRentChange] = useState(0);

  // Calculate analysis with modified inputs
  const modifiedAnalysis = useMemo(() => {
    const modifiedInputs: AnalysisInputs = {
      ...baseInputs,
      interestRate: testInterestRate,
      stOccupancy: testOccupancy,
      monthlyRentLT: baseInputs.monthlyRentLT * (1 + testRentChange / 100),
      stADR: baseInputs.stADR * (1 + testRentChange / 100),
    };
    return analyzeInvestment(modifiedInputs);
  }, [baseInputs, testInterestRate, testOccupancy, testRentChange]);

  const baseAnalysis = useMemo(() => analyzeInvestment(baseInputs), [baseInputs]);

  useEffect(() => {
    onAnalysisChange?.(modifiedAnalysis);
  }, [modifiedAnalysis, onAnalysisChange]);

  // Calculate differences
  const dscrDiff = modifiedAnalysis.dscr - baseAnalysis.dscr;
  const irrDiff = modifiedAnalysis.irr - baseAnalysis.irr;
  const cashflowDiff = (modifiedAnalysis.yearlyCashflows[0]?.netCashflow || 0) - (baseAnalysis.yearlyCashflows[0]?.netCashflow || 0);

  const getDscrStatus = (dscr: number) => {
    if (dscr >= 1.25) return { color: "text-success", icon: CheckCircle2, label: "Veilig" };
    if (dscr >= 1.0) return { color: "text-warning", icon: AlertTriangle, label: "Matig" };
    return { color: "text-destructive", icon: AlertTriangle, label: "Risico" };
  };

  const dscrStatus = getDscrStatus(modifiedAnalysis.dscr);
  const DscrIcon = dscrStatus.icon;

  const presetScenarios = [
    { label: "Basis scenario", interest: baseInputs.interestRate, occupancy: baseInputs.stOccupancy, rent: 0 },
    { label: "Rentestijging (+2%)", interest: baseInputs.interestRate + 2, occupancy: baseInputs.stOccupancy, rent: 0 },
    { label: "Hoge leegstand", interest: baseInputs.interestRate, occupancy: 50, rent: 0 },
    { label: "Huurverlaging (-15%)", interest: baseInputs.interestRate, occupancy: baseInputs.stOccupancy, rent: -15 },
    { label: "Worstcase", interest: baseInputs.interestRate + 2, occupancy: 50, rent: -10 },
  ];

  const applyScenario = (scenario: typeof presetScenarios[0]) => {
    setTestInterestRate(scenario.interest);
    setTestOccupancy(scenario.occupancy);
    setTestRentChange(scenario.rent);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Sensitivity Analyse
          <InfoTooltip
            title="Sensitivity Analyse"
            content="Test hoe gevoelig je rendement is voor veranderingen in rente, bezetting en huurprijzen. Dit helpt je risico's te begrijpen."
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Scenarios */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Snelle scenario's</Label>
          <Select onValueChange={(value) => applyScenario(presetScenarios[parseInt(value)])}>
            <SelectTrigger>
              <SelectValue placeholder="Kies een scenario..." />
            </SelectTrigger>
            <SelectContent>
              {presetScenarios.map((scenario, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {scenario.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          {/* Interest Rate */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-1">
                <Percent className="w-4 h-4" />
                Rente
              </Label>
              <span className="text-sm font-medium">
                {testInterestRate.toFixed(1)}%
                {testInterestRate !== baseInputs.interestRate && (
                  <span className={`ml-2 ${testInterestRate > baseInputs.interestRate ? 'text-destructive' : 'text-success'}`}>
                    ({testInterestRate > baseInputs.interestRate ? '+' : ''}{(testInterestRate - baseInputs.interestRate).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            <Slider
              value={[testInterestRate]}
              onValueChange={([value]) => setTestInterestRate(value)}
              min={1}
              max={10}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1%</span>
              <span>10%</span>
            </div>
          </div>

          {/* Occupancy */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-1">
                <Home className="w-4 h-4" />
                Bezettingsgraad (ST)
              </Label>
              <span className="text-sm font-medium">
                {testOccupancy}%
                {testOccupancy !== baseInputs.stOccupancy && (
                  <span className={`ml-2 ${testOccupancy < baseInputs.stOccupancy ? 'text-destructive' : 'text-success'}`}>
                    ({testOccupancy > baseInputs.stOccupancy ? '+' : ''}{testOccupancy - baseInputs.stOccupancy}%)
                  </span>
                )}
              </span>
            </div>
            <Slider
              value={[testOccupancy]}
              onValueChange={([value]) => setTestOccupancy(value)}
              min={20}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>20%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Rent Change */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-1">
                {testRentChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                Huurwijziging
              </Label>
              <span className="text-sm font-medium">
                {testRentChange > 0 ? '+' : ''}{testRentChange}%
              </span>
            </div>
            <Slider
              value={[testRentChange]}
              onValueChange={([value]) => setTestRentChange(value)}
              min={-30}
              max={30}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-30%</span>
              <span>+30%</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="pt-4 border-t space-y-4">
          <h4 className="font-semibold text-foreground">Resultaat bij dit scenario</h4>
          
          <div className="grid grid-cols-3 gap-3">
            {/* DSCR */}
            <div className={`p-3 rounded-lg ${
              modifiedAnalysis.dscr >= 1.25 ? 'bg-success/10' :
              modifiedAnalysis.dscr >= 1.0 ? 'bg-warning/10' : 'bg-destructive/10'
            }`}>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                DSCR
                <InfoTooltip title="DSCR" content="Debt Service Coverage Ratio - verhouding tussen inkomen en hypotheeklasten. Boven 1.25 is veilig." />
              </div>
              <div className="flex items-center gap-2">
                <DscrIcon className={`w-4 h-4 ${dscrStatus.color}`} />
                <span className={`font-bold ${dscrStatus.color}`}>
                  {modifiedAnalysis.dscr.toFixed(2)}
                </span>
              </div>
              {dscrDiff !== 0 && (
                <p className={`text-xs ${dscrDiff > 0 ? 'text-success' : 'text-destructive'}`}>
                  {dscrDiff > 0 ? '+' : ''}{dscrDiff.toFixed(2)}
                </p>
              )}
            </div>

            {/* IRR */}
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">IRR</p>
              <p className="font-bold text-foreground">
                {modifiedAnalysis.irr.toFixed(1)}%
              </p>
              {irrDiff !== 0 && (
                <p className={`text-xs ${irrDiff > 0 ? 'text-success' : 'text-destructive'}`}>
                  {irrDiff > 0 ? '+' : ''}{irrDiff.toFixed(1)}%
                </p>
              )}
            </div>

            {/* Year 1 Cashflow */}
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">Cashflow Jaar 1</p>
              <p className={`font-bold ${(modifiedAnalysis.yearlyCashflows[0]?.netCashflow || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                €{(modifiedAnalysis.yearlyCashflows[0]?.netCashflow || 0).toLocaleString()}
              </p>
              {cashflowDiff !== 0 && (
                <p className={`text-xs ${cashflowDiff > 0 ? 'text-success' : 'text-destructive'}`}>
                  {cashflowDiff > 0 ? '+' : ''}€{cashflowDiff.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Warning for DSCR below 1 */}
          {modifiedAnalysis.dscr < 1.0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Risico: Negatieve cashflow</p>
                <p className="text-sm text-muted-foreground">
                  Bij dit scenario dekt de huur niet de hypotheeklasten. Je zou maandelijks moeten bijleggen.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
