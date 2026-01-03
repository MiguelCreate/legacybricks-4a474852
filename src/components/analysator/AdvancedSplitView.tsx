import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, 
  PiggyBank, 
  Euro, 
  Settings, 
  Target,
  TrendingUp,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Save
} from "lucide-react";
import { AnalysisInputs, InvestmentAnalysis, getRiskAssessment } from "@/lib/rendementsCalculations";
import { KPIDashboard } from "./KPIDashboard";
import { CashflowTable } from "./CashflowTable";
import { ExitAnalysisCard } from "./ExitAnalysisCard";
import { VisualCharts } from "./VisualCharts";
import { TaxCalculator } from "./TaxCalculator";
import { SnowballImpact } from "./SnowballImpact";
import { SavedPropertiesPanel } from "./SavedPropertiesPanel";

interface AdvancedSplitViewProps {
  inputs: AnalysisInputs;
  updateInput: (key: keyof AnalysisInputs, value: number | string) => void;
  analysis: InvestmentAnalysis | null;
  activeTimeframe: "5j" | "10j" | "15j" | "30j";
  setActiveTimeframe: (tf: "5j" | "10j" | "15j" | "30j") => void;
  propertyName: string;
  setPropertyName: (name: string) => void;
  propertyLocation: string;
  setPropertyLocation: (location: string) => void;
  onSave: () => void;
  onLoadProperty: (loadedInputs: Partial<AnalysisInputs>, name: string, location: string) => void;
}

const CompactInput = ({ 
  label, 
  value, 
  onChange, 
  prefix,
  suffix,
  tooltip,
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  tooltip?: string;
}) => (
  <div className="space-y-0.5">
    <div className="flex items-center gap-1">
      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</Label>
      {tooltip && <InfoTooltip title={label} content={tooltip} />}
    </div>
    <div className="relative">
      {prefix && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          {prefix}
        </span>
      )}
      <Input
        type="text"
        inputMode="decimal"
        value={String(value)}
        onChange={(e) => {
          const rawValue = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
          const numValue = rawValue === '' ? 0 : parseFloat(rawValue);
          onChange(isNaN(numValue) ? 0 : numValue);
        }}
        className={`h-8 text-xs ${prefix ? 'pl-5' : ''} ${suffix ? 'pr-8' : ''}`}
      />
      {suffix && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

const timeframeYears: Record<string, number> = {
  "5j": 5,
  "10j": 10,
  "15j": 15,
  "30j": 30,
};

export function AdvancedSplitView({
  inputs,
  updateInput,
  analysis,
  activeTimeframe,
  setActiveTimeframe,
  propertyName,
  setPropertyName,
  propertyLocation,
  setPropertyLocation,
  onSave,
  onLoadProperty,
}: AdvancedSplitViewProps) {
  const riskAssessment = analysis ? getRiskAssessment(analysis) : null;

  return (
    <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[600px]">
      {/* Left Sidebar - Inputs */}
      <div className="w-80 flex-shrink-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {/* Timeframe */}
            <Card className="shadow-sm">
              <CardContent className="py-3 px-4">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 block">Analyseperiode</Label>
                <Tabs value={activeTimeframe} onValueChange={(v) => setActiveTimeframe(v as typeof activeTimeframe)}>
                  <TabsList className="grid grid-cols-4 h-8">
                    <TabsTrigger value="5j" className="text-xs">5j</TabsTrigger>
                    <TabsTrigger value="10j" className="text-xs">10j</TabsTrigger>
                    <TabsTrigger value="15j" className="text-xs">15j</TabsTrigger>
                    <TabsTrigger value="30j" className="text-xs">30j</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Aankoop */}
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  Aankoop
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0 grid gap-2">
                <CompactInput label="Aankoopprijs" value={inputs.purchasePrice} onChange={(v) => updateInput("purchasePrice", v)} prefix="€" />
                <CompactInput label="IMT" value={inputs.imt} onChange={(v) => updateInput("imt", v)} prefix="€" />
                <CompactInput label="Notaris" value={inputs.notaryFees} onChange={(v) => updateInput("notaryFees", v)} prefix="€" />
                <CompactInput label="Renovatie" value={inputs.renovationCosts} onChange={(v) => updateInput("renovationCosts", v)} prefix="€" />
                <CompactInput label="Inrichting" value={inputs.furnishingCosts} onChange={(v) => updateInput("furnishingCosts", v)} prefix="€" />
              </CardContent>
            </Card>

            {/* Financiering */}
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5 text-primary" />
                  Financiering
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0 grid gap-2">
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Type</Label>
                  <Select value={inputs.mortgageInputType || "ltv"} onValueChange={(v) => updateInput("mortgageInputType", v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ltv">LTV %</SelectItem>
                      <SelectItem value="downpayment">Eigen inleg €</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(inputs.mortgageInputType || "ltv") === "ltv" ? (
                  <CompactInput label="LTV" value={inputs.ltv} onChange={(v) => updateInput("ltv", v)} suffix="%" />
                ) : (
                  <CompactInput
                    label="Eigen inleg"
                    value={inputs.downpayment || 0}
                    onChange={(v) => {
                      updateInput("downpayment", v);
                      const ltv = inputs.purchasePrice > 0 ? ((inputs.purchasePrice - v) / inputs.purchasePrice) * 100 : 0;
                      updateInput("ltv", Math.max(0, Math.min(100, ltv)));
                    }}
                    prefix="€"
                  />
                )}

                <CompactInput label="Rente" value={inputs.interestRate} onChange={(v) => updateInput("interestRate", v)} suffix="%" />
                <CompactInput label="Looptijd" value={inputs.loanTermYears} onChange={(v) => updateInput("loanTermYears", v)} suffix="jr" />

                {(() => {
                  const mortgageType = inputs.mortgageInputType || "ltv";
                  const loanAmount =
                    mortgageType === "downpayment"
                      ? Math.max(0, inputs.purchasePrice - Number(inputs.downpayment ?? 0))
                      : inputs.purchasePrice * (inputs.ltv / 100);
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
                  const calculatedMonthlyMortgage = calcPMT(loanAmount, inputs.interestRate, inputs.loanTermYears);
                  const monthlyMortgage = inputs.monthlyMortgageOverride ?? calculatedMonthlyMortgage;

                  return (
                    <>
                      <CompactInput
                        label="Maandlast"
                        value={monthlyMortgage}
                        onChange={(v) => updateInput("monthlyMortgageOverride", v)}
                        prefix="€"
                        tooltip="Standaard berekend. Pas aan als je een afwijkende maandlast hebt."
                      />
                      <div className="rounded-md bg-secondary/30 p-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Hypotheek (berekend)</p>
                        <p className="text-sm font-semibold">€{Math.round(loanAmount).toLocaleString("nl-NL")}</p>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Verhuur */}
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Euro className="w-3.5 h-3.5 text-primary" />
                  Verhuur
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0 grid gap-2">
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Type</Label>
                  <Select value={inputs.rentalType} onValueChange={(v) => updateInput("rentalType", v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="longterm">Langdurig</SelectItem>
                      <SelectItem value="shortterm">Korte termijn</SelectItem>
                      <SelectItem value="mixed">Gemengd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(inputs.rentalType === "longterm" || inputs.rentalType === "mixed") && (
                  <CompactInput label="Huur LT" value={inputs.monthlyRentLT} onChange={(v) => updateInput("monthlyRentLT", v)} prefix="€" />
                )}
                {(inputs.rentalType === "shortterm" || inputs.rentalType === "mixed") && (
                  <>
                    <CompactInput label="Bezetting" value={inputs.stOccupancy} onChange={(v) => updateInput("stOccupancy", v)} suffix="%" />
                    <CompactInput label="ADR" value={inputs.stADR} onChange={(v) => updateInput("stADR", v)} prefix="€" />
                  </>
                )}
              </CardContent>
            </Card>

            {/* OPEX */}
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-primary" />
                  Exploitatie
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0 grid gap-2 grid-cols-2">
                <CompactInput label="Beheer" value={inputs.managementPercent} onChange={(v) => updateInput("managementPercent", v)} suffix="%" />
                <CompactInput label="Onderhoud" value={inputs.maintenanceYearly} onChange={(v) => updateInput("maintenanceYearly", v)} prefix="€" />
                <CompactInput label="IMI" value={inputs.imiYearly} onChange={(v) => updateInput("imiYearly", v)} prefix="€" />
                <CompactInput label="Verzekering" value={inputs.insuranceYearly} onChange={(v) => updateInput("insuranceYearly", v)} prefix="€" />
                <CompactInput label="VvE" value={inputs.condoMonthly} onChange={(v) => updateInput("condoMonthly", v)} prefix="€" />
                <CompactInput label="Utilities" value={inputs.utilitiesMonthly} onChange={(v) => updateInput("utilitiesMonthly", v)} prefix="€" />
              </CardContent>
            </Card>

            {/* Aannames */}
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  Aannames
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0 grid gap-2 grid-cols-3">
                <CompactInput label="Huur" value={inputs.rentGrowth} onChange={(v) => updateInput("rentGrowth", v)} suffix="%" />
                <CompactInput label="Kosten" value={inputs.costGrowth} onChange={(v) => updateInput("costGrowth", v)} suffix="%" />
                <CompactInput label="Waarde" value={inputs.valueGrowth} onChange={(v) => updateInput("valueGrowth", v)} suffix="%" />
              </CardContent>
            </Card>

            {/* Saved Properties */}
            <SavedPropertiesPanel onLoadProperty={onLoadProperty} />
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Results */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4 pr-4">
            {analysis && (
              <>
                {/* Risk Assessment Banner */}
                {riskAssessment && (
                  <Card className={`border-l-4 ${
                    riskAssessment.color === 'success' ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20' :
                    riskAssessment.color === 'warning' ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20' :
                    'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
                  }`}>
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        {riskAssessment.color === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className={`h-5 w-5 ${riskAssessment.color === 'warning' ? 'text-yellow-600' : 'text-red-600'}`} />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {riskAssessment.level === 'good' ? '🟢 Goed rendabel' :
                             riskAssessment.level === 'moderate' ? '🟡 Matig rendabel' : '🔴 Risicovol'}
                          </p>
                          <p className="text-sm text-muted-foreground">{riskAssessment.reasons[0]}</p>
                        </div>
                        <Badge variant="outline" className="text-sm">
                          €{Math.round((analysis.yearlyCashflows[0]?.netCashflow || 0) / 12).toLocaleString("nl-NL")}/mnd
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Results Tabs */}
                <Tabs defaultValue="kpis" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="kpis" className="gap-2">
                      <Target className="h-4 w-4" />
                      KPI's
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Grafieken
                    </TabsTrigger>
                    <TabsTrigger value="table" className="gap-2">
                      <Calculator className="h-4 w-4" />
                      Cashflow
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="kpis" className="space-y-4">
                    <KPIDashboard analysis={analysis} />
                    <ExitAnalysisCard 
                      exitAnalysis={analysis.exitAnalysis}
                      years={timeframeYears[activeTimeframe]}
                      ownCapital={analysis.ownCapital}
                    />
                  </TabsContent>
                  
                  <TabsContent value="charts">
                    <VisualCharts analysis={analysis} />
                  </TabsContent>
                  
                  <TabsContent value="table">
                    <CashflowTable 
                      cashflows={analysis.yearlyCashflows} 
                      timeframe={activeTimeframe}
                    />
                  </TabsContent>
                </Tabs>

                {/* Tax Calculator */}
                <TaxCalculator inputs={inputs} propertyName={propertyName || "Nieuw Pand"} />

                {/* Snowball */}
                <SnowballImpact
                  newPropertyDebt={analysis.loanAmount}
                  newPropertyMonthlyPayment={analysis.yearlyCashflows[0]?.debtService / 12 || 0}
                  newPropertyNetCashflow={analysis.yearlyCashflows[0]?.netCashflow / 12 || 0}
                  newPropertyInterestRate={inputs.interestRate}
                  newPropertyName={propertyName || "Nieuw Pand"}
                />

                {/* Save Section */}
                <Card className="shadow-sm">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Save className="w-4 h-4 text-primary" />
                      Opslaan als Potentiële Investering
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Pandnaam</Label>
                        <Input
                          value={propertyName}
                          onChange={(e) => setPropertyName(e.target.value)}
                          placeholder="Bijv. Appartement Lissabon"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Locatie</Label>
                        <Input
                          value={propertyLocation}
                          onChange={(e) => setPropertyLocation(e.target.value)}
                          placeholder="Bijv. Lissabon, Portugal"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <Button onClick={onSave} className="w-full gap-2" size="sm">
                      <Save className="w-4 h-4" />
                      Opslaan
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
