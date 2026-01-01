import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calculator,
  Percent,
  Calendar,
  Wallet,
} from "lucide-react";

interface CompoundInterestSimulatorProps {
  netRentalIncome: number;
  desiredRetirementAge: number;
  currentAge: number;
  desiredMonthlyIncome: number;
}

export function CompoundInterestSimulator({
  netRentalIncome,
  desiredRetirementAge,
  currentAge,
  desiredMonthlyIncome,
}: CompoundInterestSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Input state
  const [monthlyDeposit, setMonthlyDeposit] = useState(Math.round(netRentalIncome * 0.5));
  const [returnType, setReturnType] = useState<string>("7");
  const [customReturn, setCustomReturn] = useState(7);
  const [durationYears, setDurationYears] = useState(
    Math.max(10, desiredRetirementAge - currentAge)
  );
  const [inflationCorrectionOn, setInflationCorrectionOn] = useState(true);
  const [inflationRate, setInflationRate] = useState(2.5);

  // Derived values
  const annualReturn = returnType === "custom" ? customReturn : parseFloat(returnType);
  const realReturn = annualReturn - inflationRate;
  const isNegativeRealReturn = realReturn <= 0;

  // Calculate compound interest
  const calculations = useMemo(() => {
    const monthlyReturn = annualReturn / 100 / 12;
    const monthlyInflation = inflationRate / 100 / 12;
    const totalMonths = durationYears * 12;
    const totalDeposited = monthlyDeposit * totalMonths;

    // Future Value of Annuity formula: FV = P * (((1 + r)^n - 1) / r)
    let nominalEndValue = 0;
    if (monthlyReturn > 0) {
      nominalEndValue = monthlyDeposit * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
    } else {
      nominalEndValue = totalDeposited;
    }

    // Inflation-adjusted calculation
    // Real return = nominal return - inflation
    const monthlyRealReturn = (annualReturn - inflationRate) / 100 / 12;
    let inflationAdjustedEndValue = 0;
    if (monthlyRealReturn > 0) {
      inflationAdjustedEndValue = monthlyDeposit * ((Math.pow(1 + monthlyRealReturn, totalMonths) - 1) / monthlyRealReturn);
    } else if (monthlyRealReturn === 0) {
      inflationAdjustedEndValue = totalDeposited;
    } else {
      // Negative real return - still calculate but will be less than deposited
      inflationAdjustedEndValue = monthlyDeposit * ((Math.pow(1 + monthlyRealReturn, totalMonths) - 1) / monthlyRealReturn);
    }

    // How many months of lifestyle this covers
    const lifestyleMonths = desiredMonthlyIncome > 0 
      ? Math.round(inflationAdjustedEndValue / desiredMonthlyIncome) 
      : 0;
    const lifestyleYears = Math.floor(lifestyleMonths / 12);
    const lifestyleRemainingMonths = lifestyleMonths % 12;

    // Generate chart data
    const chartData = [];
    for (let year = 0; year <= durationYears; year++) {
      const months = year * 12;
      
      let nominalValue = 0;
      let realValue = 0;
      
      if (months === 0) {
        nominalValue = 0;
        realValue = 0;
      } else {
        if (monthlyReturn > 0) {
          nominalValue = monthlyDeposit * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
        } else {
          nominalValue = monthlyDeposit * months;
        }
        
        if (monthlyRealReturn > 0) {
          realValue = monthlyDeposit * ((Math.pow(1 + monthlyRealReturn, months) - 1) / monthlyRealReturn);
        } else if (monthlyRealReturn === 0) {
          realValue = monthlyDeposit * months;
        } else {
          realValue = monthlyDeposit * ((Math.pow(1 + monthlyRealReturn, months) - 1) / monthlyRealReturn);
        }
      }
      
      chartData.push({
        jaar: year,
        nominaal: Math.round(nominalValue),
        reëel: Math.round(realValue),
        ingelegd: monthlyDeposit * months,
      });
    }

    return {
      totalDeposited,
      nominalEndValue: Math.round(nominalEndValue),
      inflationAdjustedEndValue: Math.round(inflationAdjustedEndValue),
      lifestyleMonths,
      lifestyleYears,
      lifestyleRemainingMonths,
      chartData,
      nominalGrowth: nominalEndValue - totalDeposited,
      realGrowth: inflationAdjustedEndValue - totalDeposited,
    };
  }, [monthlyDeposit, annualReturn, durationYears, inflationRate, desiredMonthlyIncome]);

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const durationOptions = [
    { value: "10", label: "10 jaar" },
    { value: "15", label: "15 jaar" },
    { value: "20", label: "20 jaar" },
    { value: String(Math.max(1, desiredRetirementAge - currentAge)), label: `Tot pensioen (${desiredRetirementAge})` },
    { value: "custom", label: "Handmatig" },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="shadow-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Rente-op-Rente Simulator
                <InfoTooltip 
                  title="Rente-op-Rente Effect"
                  content="Ontdek hoeveel extra vermogen je kunt opbouwen door een deel van je netto huuroverschot te herbeleggen. De simulator toont zowel nominale groei als koopkrachtbewarend vermogen."
                />
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Suggestion banner */}
            {netRentalIncome > 0 && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-primary" />
                  <span>
                    Je huidige netto huuroverschot is{" "}
                    <strong className="text-primary">{formatCurrency(netRentalIncome)}/maand</strong>.
                    Je kunt een deel hiervan herbeleggen.
                  </span>
                </p>
              </div>
            )}

            {/* Input Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left column - Inputs */}
              <div className="space-y-5">
                {/* Monthly Deposit */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    Maandelijkse inleg (€)
                    <InfoTooltip 
                      title="Maandelijkse Inleg"
                      content="Het bedrag dat je elke maand wilt sparen of beleggen. Dit kan een deel van je huuroverschot zijn."
                    />
                  </Label>
                  <div className="space-y-3">
                    <Input
                      type="number"
                      min={0}
                      value={monthlyDeposit}
                      onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                    />
                    <Slider
                      value={[monthlyDeposit]}
                      onValueChange={([value]) => setMonthlyDeposit(value)}
                      min={0}
                      max={Math.max(5000, netRentalIncome * 2)}
                      step={50}
                    />
                  </div>
                </div>

                {/* Return Rate */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    Rendement per jaar (%)
                    <InfoTooltip 
                      title="Verwacht Rendement"
                      content="Het jaarlijks verwachte rendement. Spaargeld: ~2%, Obligaties: ~5%, Aandelen historisch: ~7%. Hogere rendementen betekenen ook hoger risico."
                    />
                  </Label>
                  <Select value={returnType} onValueChange={setReturnType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2% - Spaargeld (veilig)</SelectItem>
                      <SelectItem value="5">5% - Obligaties (gemiddeld)</SelectItem>
                      <SelectItem value="7">7% - Aandelen (historisch gemiddeld)</SelectItem>
                      <SelectItem value="custom">Aangepast</SelectItem>
                    </SelectContent>
                  </Select>
                  {returnType === "custom" && (
                    <div className="pt-2">
                      <Slider
                        value={[customReturn]}
                        onValueChange={([value]) => setCustomReturn(value)}
                        min={0}
                        max={15}
                        step={0.5}
                      />
                      <p className="text-sm text-muted-foreground mt-1 text-center">{customReturn}%</p>
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Looptijd (jaren)
                    <InfoTooltip 
                      title="Beleggingshorizon"
                      content="Hoe lang je het geld laat staan. Hoe langer, hoe sterker het rente-op-rente effect."
                    />
                  </Label>
                  <div className="flex gap-2">
                    <Select 
                      value={durationOptions.find(o => o.value === String(durationYears))?.value || "custom"}
                      onValueChange={(val) => {
                        if (val !== "custom") {
                          setDurationYears(parseInt(val));
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      className="w-20"
                      value={durationYears}
                      onChange={(e) => setDurationYears(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Inflation Correction */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      Inflatiecorrectie
                      <InfoTooltip 
                        title="Inflatiecorrectie"
                        content="Inflatie vermindert de koopkracht. Zonder correctie lijkt je vermogen te groeien, maar kun je er in de toekomst minder mee kopen."
                      />
                    </Label>
                    <Switch
                      checked={inflationCorrectionOn}
                      onCheckedChange={setInflationCorrectionOn}
                    />
                  </div>
                  {inflationCorrectionOn && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Inflatiepercentage</Label>
                        <span className="text-sm font-medium">{inflationRate}%</span>
                      </div>
                      <Slider
                        value={[inflationRate]}
                        onValueChange={([value]) => setInflationRate(value)}
                        min={0}
                        max={10}
                        step={0.5}
                      />
                    </div>
                  )}
                </div>

                {/* Warning if negative real return */}
                {inflationCorrectionOn && isNegativeRealReturn && (
                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-sm text-warning flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        <strong>Let op:</strong> Bij {annualReturn}% rendement en {inflationRate}% inflatie 
                        verlies je koopkracht. Je reële rendement is {realReturn.toFixed(1)}%.
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Right column - Results */}
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Totaal ingelegd</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(calculations.totalDeposited)}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Nominale eindwaarde</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(calculations.nominalEndValue)}
                    </p>
                  </div>
                  {inflationCorrectionOn && (
                    <>
                      <div className="p-3 bg-success/10 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground mb-1">Reële eindwaarde</p>
                        <p className="text-lg font-bold text-success">
                          {formatCurrency(calculations.inflationAdjustedEndValue)}
                        </p>
                      </div>
                      <div className="p-3 bg-accent/30 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground mb-1">Koopkrachtdekking</p>
                        <p className="text-lg font-bold text-foreground">
                          {calculations.lifestyleYears > 0 
                            ? `${calculations.lifestyleYears}j ${calculations.lifestyleRemainingMonths}mnd`
                            : `${calculations.lifestyleMonths} mnd`
                          }
                        </p>
                        <p className="text-[10px] text-muted-foreground">levensstijl</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Growth summary */}
                <div className="p-4 bg-gradient-to-r from-primary/5 to-success/5 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Rendement samenvatting</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Nominale groei: <span className="font-medium text-primary">+{formatCurrency(calculations.nominalGrowth)}</span>
                    </p>
                    {inflationCorrectionOn && (
                      <p className="text-muted-foreground">
                        Reële groei: <span className={`font-medium ${calculations.realGrowth >= 0 ? "text-success" : "text-destructive"}`}>
                          {calculations.realGrowth >= 0 ? "+" : ""}{formatCurrency(calculations.realGrowth)}
                        </span>
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      Reëel rendement: <span className={`font-medium ${realReturn > 0 ? "text-success" : "text-warning"}`}>
                        {realReturn.toFixed(1)}% per jaar
                      </span>
                    </p>
                  </div>
                </div>

                {/* Interpretation */}
                <div className={`p-3 rounded-lg border ${
                  realReturn > 3 
                    ? "bg-success/5 border-success/30" 
                    : realReturn > 0 
                      ? "bg-primary/5 border-primary/30"
                      : "bg-warning/5 border-warning/30"
                }`}>
                  <div className="flex items-start gap-2">
                    {realReturn > 3 ? (
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    ) : realReturn > 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {realReturn > 3 ? (
                        <>
                          <strong className="text-success">Uitstekend!</strong> Je reële rendement is {realReturn.toFixed(1)}% — 
                          je koopkracht groeit stevig mee met je vermogen.
                        </>
                      ) : realReturn > 0 ? (
                        <>
                          <strong className="text-primary">Goed!</strong> Je reële rendement is {realReturn.toFixed(1)}% — 
                          je koopkracht groeit, zij het beperkt.
                        </>
                      ) : (
                        <>
                          <strong className="text-warning">Let op:</strong> Bij {annualReturn}% rendement verlies je koopkracht door inflatie. 
                          Overweeg een hoger renderend alternatief.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="pt-4">
              <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Vermogensgroei over tijd
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calculations.chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="jaar" 
                      className="text-xs"
                      tickFormatter={(value) => `${value}j`}
                    />
                    <YAxis 
                      className="text-xs"
                      tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "nominaal" ? "Nominaal" : name === "reëel" ? "Reëel (inflatie-gecorrigeerd)" : "Ingelegd"
                      ]}
                      labelFormatter={(label) => `Jaar ${label}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ingelegd" 
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                      name="Ingelegd"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nominaal" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      name="Nominaal"
                    />
                    {inflationCorrectionOn && (
                      <Line 
                        type="monotone" 
                        dataKey="reëel" 
                        stroke="hsl(var(--success))"
                        strokeWidth={2}
                        dot={false}
                        name="Reëel"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legacy advice */}
            <div className="p-4 bg-gradient-to-r from-primary/5 via-accent/5 to-success/5 rounded-lg border">
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                🏛️ Waarom dit slim is voor jouw erfgoed
              </h3>
              <p className="text-sm text-muted-foreground">
                Door een deel van je huuroverschot te herbeleggen, bouw je niet alleen vermogen op voor jezelf, 
                maar creëer je ook een buffer die je kunt nalaten aan je erfgenamen. Het rente-op-rente effect 
                werkt exponentieel — hoe eerder je begint, hoe groter het effect. 
                {calculations.lifestyleMonths > 60 && (
                  <> Dit eindbedrag kan <strong>{Math.round(calculations.lifestyleMonths / 12)} jaar</strong> aan levensstijl dekken.</>
                )}
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
