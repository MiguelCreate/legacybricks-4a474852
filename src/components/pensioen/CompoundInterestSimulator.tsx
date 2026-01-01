import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  GraduationCap,
  Sparkles,
  Info,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

interface CompoundInterestSimulatorProps {
  netRentalIncome: number;
  desiredRetirementAge: number;
  currentAge: number;
  desiredMonthlyIncome: number;
  defaultOpen?: boolean;
}

type ViewMode = "beginner" | "advanced";

export function CompoundInterestSimulator({
  netRentalIncome,
  desiredRetirementAge,
  currentAge,
  desiredMonthlyIncome,
  defaultOpen = false,
}: CompoundInterestSimulatorProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [viewMode, setViewMode] = useState<ViewMode>("beginner");
  
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
            {/* Mode Toggle */}
            <div className="flex items-center justify-between">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="beginner" className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />
                    Beginners
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Gevorderden
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Badge variant="outline" className="text-xs">
                {viewMode === "beginner" ? "Met uitleg" : "Compact"}
              </Badge>
            </div>

            {/* Beginner mode intro */}
            {viewMode === "beginner" && (
              <div className="p-4 bg-gradient-to-r from-primary/5 via-accent/5 to-success/5 rounded-lg border">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Wat is rente-op-rente?</h4>
                    <p className="text-sm text-muted-foreground">
                      Rente-op-rente (ook wel samengestelde interest) betekent dat je niet alleen rente verdient 
                      op je oorspronkelijke inleg, maar ook op de rente die je al hebt verdiend. Dit zorgt voor 
                      <strong> exponentiële groei</strong> — hoe langer je spaart, hoe sneller je vermogen groeit.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Voorbeeld:</strong> €500/maand met 7% rendement wordt na 20 jaar ongeveer €260.000 — 
                      terwijl je zelf 'maar' €120.000 hebt ingelegd. De rest (€140.000) is puur rente-op-rente!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestion banner */}
            {netRentalIncome > 0 && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-2">
                  <PiggyBank className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Je huidige netto huuroverschot is{" "}
                      <strong className="text-primary">{formatCurrency(netRentalIncome)}/maand</strong>.
                      Je kunt een deel hiervan herbeleggen.
                    </p>
                    {viewMode === "beginner" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Tip: Begin met een bedrag dat je kunt missen zonder je dagelijks leven te beïnvloeden.
                      </p>
                    )}
                  </div>
                </div>
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
                  {viewMode === "beginner" && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      <HelpCircle className="h-3 w-3 inline mr-1" />
                      Dit is het bedrag dat je maandelijks opzij zet. Kies een bedrag dat past bij je financiële situatie.
                    </p>
                  )}
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
                  {viewMode === "beginner" && (
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded space-y-1">
                      <p><HelpCircle className="h-3 w-3 inline mr-1" />Kies hoeveel rendement je verwacht te behalen:</p>
                      <ul className="pl-4 space-y-0.5">
                        <li>• <strong>2% (Spaargeld):</strong> Veilig, maar groeit langzaam</li>
                        <li>• <strong>5% (Obligaties):</strong> Gemiddeld risico en rendement</li>
                        <li>• <strong>7% (Aandelen):</strong> Historisch gemiddelde, maar met schommelingen</li>
                      </ul>
                      <p className="text-warning">⚠️ Hoger rendement = hoger risico!</p>
                    </div>
                  )}
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
                  {viewMode === "beginner" && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      <HelpCircle className="h-3 w-3 inline mr-1" />
                      Tijd is je beste vriend bij beleggen. Hoe langer je wacht, hoe meer het rente-op-rente 
                      effect kan werken. 20 jaar beleggen levert vaak meer op dan 10 jaar met het dubbele bedrag!
                    </p>
                  )}
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
                  {viewMode === "beginner" && (
                    <p className="text-xs text-muted-foreground">
                      <Info className="h-3 w-3 inline mr-1" />
                      Inflatie betekent dat €100 vandaag meer waard is dan €100 over 20 jaar. 
                      Met deze correctie zie je wat je vermogen écht waard is in termen van koopkracht.
                    </p>
                  )}
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
                      {viewMode === "beginner" && (
                        <p className="text-xs text-muted-foreground">
                          💡 2,5% is het langjarig gemiddelde in Nederland/Europa.
                        </p>
                      )}
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
                        {viewMode === "beginner" && (
                          <span className="block mt-1">
                            Dit betekent dat je vermogen groeit, maar je er in de toekomst minder mee kunt kopen.
                            Overweeg een hoger renderend alternatief of langere looptijd.
                          </span>
                        )}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Right column - Results */}
              <div className="space-y-4">
                {/* Beginner results intro */}
                {viewMode === "beginner" && (
                  <div className="p-3 bg-accent/20 rounded-lg border border-accent/30">
                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                      <Info className="h-4 w-4 text-accent-foreground mt-0.5 shrink-0" />
                      <span>
                        Hieronder zie je wat er gebeurt met je geld. <strong>Nominaal</strong> is het ruwe bedrag, 
                        <strong> Reëel</strong> is wat je er écht mee kunt kopen (gecorrigeerd voor inflatie).
                      </span>
                    </p>
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Totaal ingelegd</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(calculations.totalDeposited)}
                    </p>
                    {viewMode === "beginner" && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Dit leg je zelf in
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Nominale eindwaarde</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(calculations.nominalEndValue)}
                    </p>
                    {viewMode === "beginner" && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Bedrag op je rekening
                      </p>
                    )}
                  </div>
                  {inflationCorrectionOn && (
                    <>
                      <div className="p-3 bg-success/10 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground mb-1">Reële eindwaarde</p>
                        <p className="text-lg font-bold text-success">
                          {formatCurrency(calculations.inflationAdjustedEndValue)}
                        </p>
                        {viewMode === "beginner" && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Échte koopkracht
                          </p>
                        )}
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

                {/* Beginner explanation of growth */}
                {viewMode === "beginner" && (
                  <div className="p-3 bg-gradient-to-r from-success/5 to-primary/5 rounded-lg border">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        <p>
                          <strong className="text-success">+{formatCurrency(calculations.nominalGrowth)}</strong> is puur rendement! 
                          Dit is geld dat je niet zelf hebt ingelegd, maar dat je hebt verdiend door rente-op-rente.
                        </p>
                        {calculations.nominalGrowth > calculations.totalDeposited && (
                          <p className="mt-1 text-xs">
                            🎉 Je verdient meer aan rendement dan je zelf inlegt!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Growth summary - Advanced mode only or simplified for beginner */}
                {viewMode === "advanced" && (
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
                )}

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
                    <div className="text-sm text-muted-foreground">
                      {realReturn > 3 ? (
                        <>
                          <p>
                            <strong className="text-success">Uitstekend!</strong> Je reële rendement is {realReturn.toFixed(1)}% — 
                            je koopkracht groeit stevig mee met je vermogen.
                          </p>
                          {viewMode === "beginner" && (
                            <p className="mt-1 text-xs">
                              Dit betekent dat je vermogen sneller groeit dan de prijzen stijgen. Top!
                            </p>
                          )}
                        </>
                      ) : realReturn > 0 ? (
                        <>
                          <p>
                            <strong className="text-primary">Goed!</strong> Je reële rendement is {realReturn.toFixed(1)}% — 
                            je koopkracht groeit, zij het beperkt.
                          </p>
                          {viewMode === "beginner" && (
                            <p className="mt-1 text-xs">
                              Je vermogen groeit iets sneller dan de inflatie. Overweeg een hoger rendement voor meer groei.
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p>
                            <strong className="text-warning">Let op:</strong> Bij {annualReturn}% rendement verlies je koopkracht door inflatie.
                          </p>
                          {viewMode === "beginner" && (
                            <p className="mt-1 text-xs">
                              De prijzen stijgen sneller dan je vermogen groeit. Overweeg een hoger renderend alternatief of langere looptijd.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="pt-4">
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Vermogensgroei over tijd
              </h3>
              {viewMode === "beginner" && (
                <p className="text-xs text-muted-foreground mb-4">
                  De grafiek toont hoe je vermogen groeit. De blauwe lijn is wat er op je rekening staat, 
                  de groene lijn is wat je er écht mee kunt kopen (gecorrigeerd voor inflatie).
                </p>
              )}
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
                {viewMode === "beginner" ? (
                  <>
                    Door een deel van je huuroverschot te herbeleggen, bouw je niet alleen vermogen op voor jezelf, 
                    maar creëer je ook een buffer die je kunt nalaten aan je erfgenamen. 
                    <strong> Tijd is je grootste bondgenoot</strong> — hoe eerder je begint, hoe groter het effect.
                    {calculations.lifestyleMonths > 60 && (
                      <> Met dit scenario kun je straks <strong>{Math.round(calculations.lifestyleMonths / 12)} jaar</strong> leven 
                      van dit vermogen, of het nalaten aan je kinderen.</>
                    )}
                  </>
                ) : (
                  <>
                    Herbeleggen van huuroverschot creëert vermogensbuffer voor jezelf én erfgenamen. 
                    Exponentieel rente-op-rente effect maximaal bij vroeg starten.
                    {calculations.lifestyleMonths > 60 && (
                      <> Dekking: <strong>{Math.round(calculations.lifestyleMonths / 12)} jaar</strong> levensstijl.</>
                    )}
                  </>
                )}
              </p>
            </div>

            {/* Beginner tips section */}
            {viewMode === "beginner" && (
              <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Tips voor beginners
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">1.</span>
                    <span><strong>Begin klein:</strong> Liever €200/maand consistent dan €500/maand die je niet volhoudt.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">2.</span>
                    <span><strong>Automatiseer:</strong> Stel een automatische overboeking in, zodat je er niet over na hoeft te denken.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">3.</span>
                    <span><strong>Denk lange termijn:</strong> Schommelingen op korte termijn zijn normaal. Focus op de trend over jaren.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">4.</span>
                    <span><strong>Spreiding:</strong> Leg niet al je eieren in één mandje. Combineer sparen en beleggen.</span>
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
