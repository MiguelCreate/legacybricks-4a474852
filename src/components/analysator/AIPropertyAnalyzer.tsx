import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Sparkles, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Building2,
  Target,
  TrendingUp,
  Calculator,
  Info,
  Loader2,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnalysisInputs } from "@/lib/rendementsCalculations";

interface AIPropertyData {
  locatie: string | null;
  aankoopprijs: number | null;
  oppervlakte_m2: number | null;
  kamers: number | null;
  energielabel: string | null;
  bouwjaar: number | null;
  renovatie_nodig: boolean | null;
  geschatte_renovatiekosten: number | null;
  huurpotentie_lt: number | null;
  huurpotentie_st_adr: number | null;
  bezetting_st_pct: number | null;
  imi_jaarlijks: number | null;
  vve_maandelijks: number | null;
  notariskosten: number | null;
  imt_pct: number | null;
  makelaarskosten: number | null;
}

interface AIAnalysisResult {
  totalInvestment: number;
  yearlyIncome: number;
  yearlyExpenses: number;
  noi: number;
  bar: number;
  nar: number;
  cashOnCash: number;
  pricePerM2: number;
  verdict: "rendabel" | "matig" | "risicovol";
  reasons: string[];
}

interface AIPropertyAnalyzerProps {
  onApplyToAnalyzer: (inputs: Partial<AnalysisInputs>, name: string, location: string) => void;
}

const QWEN_PROMPT = `Analyseer deze vastgoedadvertentie uit Portugal. Geef het resultaat in dit exacte JSON-formaat, met alleen getallen of korte tekst. Als een veld ontbreekt, vul dan null in.

{
  "locatie": "stad/regio",
  "aankoopprijs": 0,
  "oppervlakte_m2": 0,
  "kamers": 0,
  "energielabel": "A/B/C/D/E/F",
  "bouwjaar": 0,
  "renovatie_nodig": true/false,
  "geschatte_renovatiekosten": 0,
  "huurpotentie_lt": 0,
  "huurpotentie_st_adr": 0,
  "bezetting_st_pct": 0,
  "imi_jaarlijks": 0,
  "vve_maandelijks": 0,
  "notariskosten": 0,
  "imt_pct": 0,
  "makelaarskosten": 0
}

Gebruik alleen de bovenstaande veldnamen. Geef geen extra tekst.`;

export function AIPropertyAnalyzer({ onApplyToAnalyzer }: AIPropertyAnalyzerProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<AIPropertyData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(QWEN_PROMPT);
      setPromptCopied(true);
      toast({
        title: "Prompt gekopieerd!",
        description: "Plak deze in Qwen samen met je screenshot.",
      });
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      toast({
        title: "Kopiëren mislukt",
        description: "Selecteer de tekst handmatig om te kopiëren.",
        variant: "destructive",
      });
    }
  };

  const parseJSON = (input: string): AIPropertyData | null => {
    try {
      // Try to extract JSON from the input
      const jsonMatch = input.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed as AIPropertyData;
    } catch {
      return null;
    }
  };

  const calculateAnalysis = (data: AIPropertyData): AIAnalysisResult => {
    const aankoopprijs = data.aankoopprijs || 0;
    const renovatiekosten = data.geschatte_renovatiekosten || 0;
    const notariskosten = data.notariskosten || Math.round(aankoopprijs * 0.015);
    const imtPct = data.imt_pct || 6.5;
    const imtKosten = Math.round(aankoopprijs * (imtPct / 100));
    const makelaarskosten = data.makelaarskosten || 0;

    // Total Investment
    const totalInvestment = aankoopprijs + renovatiekosten + notariskosten + imtKosten + makelaarskosten;

    // Yearly Income
    const huurLT = (data.huurpotentie_lt || 0) * 12;
    const bezettingPct = (data.bezetting_st_pct || 70) / 100;
    const huurST = (data.huurpotentie_st_adr || 0) * 30 * bezettingPct * 12;
    const yearlyIncome = Math.max(huurLT, huurST);

    // Yearly Expenses (OPEX)
    const imiJaarlijks = data.imi_jaarlijks || Math.round(aankoopprijs * 0.003);
    const verzekering = Math.round(aankoopprijs * 0.001);
    const onderhoud = Math.round(aankoopprijs * 0.005);
    const leegstandBuffer = Math.round(yearlyIncome * 0.08);
    const vveMaandelijks = data.vve_maandelijks || 0;
    const yearlyExpenses = imiJaarlijks + verzekering + onderhoud + leegstandBuffer + (vveMaandelijks * 12);

    // NOI
    const noi = yearlyIncome - yearlyExpenses;

    // Key Metrics
    const bar = aankoopprijs > 0 ? (yearlyIncome / aankoopprijs) * 100 : 0;
    const nar = totalInvestment > 0 ? (noi / totalInvestment) * 100 : 0;

    // Cash-on-Cash (assuming 75% financing at 3.8%)
    const financieringPct = 0.75;
    const eigenInbreng = totalInvestment * (1 - financieringPct);
    const loanAmount = totalInvestment * financieringPct;
    const interestRate = 3.8 / 100;
    const loanTermYears = 30;
    const monthlyRate = interestRate / 12;
    const numPayments = loanTermYears * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const annualDebtService = monthlyPayment * 12;
    const cashOnCash = eigenInbreng > 0 ? ((noi - annualDebtService) / eigenInbreng) * 100 : 0;

    // Price per m²
    const oppervlakte = data.oppervlakte_m2 || 1;
    const pricePerM2 = aankoopprijs / oppervlakte;

    // Verdict
    let verdict: "rendabel" | "matig" | "risicovol" = "rendabel";
    const reasons: string[] = [];

    if (bar > 8) {
      reasons.push(`BAR ${bar.toFixed(1)}% is goed (>8%)`);
    } else if (bar >= 5) {
      reasons.push(`BAR ${bar.toFixed(1)}% is matig (5-8%)`);
    } else {
      reasons.push(`BAR ${bar.toFixed(1)}% is laag (<5%)`);
    }

    if (nar > 5) {
      reasons.push(`NAR ${nar.toFixed(1)}% is goed (>5%)`);
    } else if (nar >= 3) {
      reasons.push(`NAR ${nar.toFixed(1)}% is matig (3-5%)`);
    } else {
      reasons.push(`NAR ${nar.toFixed(1)}% is laag (<3%)`);
    }

    if (cashOnCash > 10) {
      reasons.push(`Cash-on-Cash ${cashOnCash.toFixed(1)}% is excellent (>10%)`);
    } else if (cashOnCash >= 6) {
      reasons.push(`Cash-on-Cash ${cashOnCash.toFixed(1)}% is matig (6-10%)`);
    } else {
      reasons.push(`Cash-on-Cash ${cashOnCash.toFixed(1)}% is laag (<6%)`);
    }

    // Determine overall verdict
    const scores = [
      bar > 8 ? 2 : bar >= 5 ? 1 : 0,
      nar > 5 ? 2 : nar >= 3 ? 1 : 0,
      cashOnCash > 10 ? 2 : cashOnCash >= 6 ? 1 : 0,
    ];
    const totalScore = scores.reduce((a, b) => a + b, 0);

    if (totalScore >= 5) {
      verdict = "rendabel";
    } else if (totalScore >= 3) {
      verdict = "matig";
    } else {
      verdict = "risicovol";
    }

    return {
      totalInvestment,
      yearlyIncome,
      yearlyExpenses,
      noi,
      bar,
      nar,
      cashOnCash,
      pricePerM2,
      verdict,
      reasons,
    };
  };

  const handleAnalyze = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const data = parseJSON(jsonInput);
      
      if (!data) {
        toast({
          title: "Ongeldige JSON",
          description: "Controleer of je de volledige JSON hebt geplakt, inclusief de accolades {}.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (!data.aankoopprijs || data.aankoopprijs <= 0) {
        toast({
          title: "Ontbrekende data",
          description: "De aankoopprijs is verplicht voor de analyse.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      setParsedData(data);
      const result = calculateAnalysis(data);
      setAnalysisResult(result);
      setShowInstructions(false);
      setIsProcessing(false);

      toast({
        title: "Analyse compleet!",
        description: `Oordeel: ${result.verdict === "rendabel" ? "✅ Rendabel" : result.verdict === "matig" ? "🟡 Matig" : "❌ Risicovol"}`,
      });
    }, 500);
  };

  const handleApplyToAnalyzer = () => {
    if (!parsedData || !analysisResult) return;

    const inputs: Partial<AnalysisInputs> = {
      purchasePrice: parsedData.aankoopprijs || 0,
      imt: Math.round((parsedData.aankoopprijs || 0) * ((parsedData.imt_pct || 6.5) / 100)),
      notaryFees: parsedData.notariskosten || Math.round((parsedData.aankoopprijs || 0) * 0.015),
      renovationCosts: parsedData.geschatte_renovatiekosten || 0,
      monthlyRentLT: parsedData.huurpotentie_lt || 0,
      stADR: parsedData.huurpotentie_st_adr || 0,
      stOccupancy: parsedData.bezetting_st_pct || 70,
      imiYearly: parsedData.imi_jaarlijks || Math.round((parsedData.aankoopprijs || 0) * 0.003),
      condoMonthly: parsedData.vve_maandelijks || 0,
    };

    onApplyToAnalyzer(inputs, `AI-analyse ${parsedData.locatie || "onbekend"}`, parsedData.locatie || "Portugal");
    
    toast({
      title: "Data overgenomen!",
      description: "De velden zijn ingevuld. Pas ze aan en voer een volledige analyse uit.",
    });
  };

  const handleReset = () => {
    setJsonInput("");
    setParsedData(null);
    setAnalysisResult(null);
    setShowInstructions(true);
  };

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
  };

  return (
    <Card className="shadow-card border-primary/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    AI Advertentie Analyzer
                    <Badge variant="secondary" className="text-xs">Nieuw</Badge>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Analyseer een vastgoedadvertentie met externe AI (Qwen)
                  </CardDescription>
                </div>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Instructions */}
            {showInstructions && (
              <div className="space-y-4">
                <Alert className="border-primary/20 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <strong>Hoe werkt dit?</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                      <li>Neem een screenshot of download de PDF van een vastgoedadvertentie (bijv. Idealista, Imovirtual)</li>
                      <li>Upload naar <a href="https://tongyi.aliyun.com/qianwen/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Qwen Chat (Tongyi)</a> of ChatGPT</li>
                      <li>Plak de onderstaande prompt samen met je screenshot</li>
                      <li>Kopieer de JSON-output en plak hier</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                {/* Prompt to copy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Prompt voor AI:</span>
                    <Button variant="outline" size="sm" onClick={copyPrompt} className="gap-2">
                      {promptCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {promptCopied ? "Gekopieerd!" : "Kopieer prompt"}
                    </Button>
                  </div>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono border">
                    {QWEN_PROMPT}
                  </pre>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Qwen is gratis via de <a href="https://tongyi.aliyun.com/qianwen/" target="_blank" rel="noopener noreferrer" className="underline">Tongyi app/web</a>. ChatGPT werkt ook.
                  </p>
                </div>
              </div>
            )}

            {/* JSON Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Plak de JSON-output hier:</label>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"locatie": "Lissabon", "aankoopprijs": 250000, ...}'
                className="font-mono text-sm min-h-[120px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyze} 
                disabled={!jsonInput.trim() || isProcessing}
                className="flex-1 gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyseren...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4" />
                    Analyseer
                  </>
                )}
              </Button>
              {analysisResult && (
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              )}
            </div>

            {/* Results */}
            {analysisResult && parsedData && (
              <div className="space-y-4 pt-4 border-t">
                {/* Property Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Locatie</p>
                    <p className="font-medium text-sm">{parsedData.locatie || "Onbekend"}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Aankoopprijs</p>
                    <p className="font-medium text-sm">{formatCurrency(parsedData.aankoopprijs || 0)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Oppervlakte</p>
                    <p className="font-medium text-sm">{parsedData.oppervlakte_m2 || "-"} m²</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Prijs/m²</p>
                    <p className="font-medium text-sm">{formatCurrency(analysisResult.pricePerM2)}</p>
                  </div>
                </div>

                {/* Verdict Banner */}
                <div className={`rounded-lg p-4 flex items-start gap-3 ${
                  analysisResult.verdict === "rendabel" 
                    ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800" 
                    : analysisResult.verdict === "matig"
                    ? "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800"
                    : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                }`}>
                  {analysisResult.verdict === "rendabel" ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                  ) : analysisResult.verdict === "matig" ? (
                    <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-lg">
                      {analysisResult.verdict === "rendabel" && "✅ Dit pand is rendabel"}
                      {analysisResult.verdict === "matig" && "🟡 Dit pand is matig rendabel"}
                      {analysisResult.verdict === "risicovol" && "❌ Dit pand is risicovol"}
                    </p>
                    <div className="mt-2 space-y-1">
                      {analysisResult.reasons.map((reason, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">{reason}</p>
                      ))}
                    </div>
                    {analysisResult.verdict === "rendabel" && (
                      <p className="text-sm font-medium text-green-700 dark:text-green-400 mt-2">
                        Aanbevolen voor langetermijnbelegging.
                      </p>
                    )}
                    {analysisResult.verdict === "matig" && (
                      <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mt-2">
                        Overweeg alleen als je gelooft in waardegroei.
                      </p>
                    )}
                    {analysisResult.verdict === "risicovol" && (
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 mt-2">
                        Niet aanbevolen zonder verdere analyse.
                      </p>
                    )}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Totale Investering</span>
                    </div>
                    <p className="font-bold text-lg">{formatCurrency(analysisResult.totalInvestment)}</p>
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">BAR</span>
                    </div>
                    <p className={`font-bold text-lg ${analysisResult.bar > 8 ? "text-green-600" : analysisResult.bar >= 5 ? "text-yellow-600" : "text-red-600"}`}>
                      {analysisResult.bar.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">NAR</span>
                    </div>
                    <p className={`font-bold text-lg ${analysisResult.nar > 5 ? "text-green-600" : analysisResult.nar >= 3 ? "text-yellow-600" : "text-red-600"}`}>
                      {analysisResult.nar.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Cash-on-Cash</span>
                    </div>
                    <p className={`font-bold text-lg ${analysisResult.cashOnCash > 10 ? "text-green-600" : analysisResult.cashOnCash >= 6 ? "text-yellow-600" : "text-red-600"}`}>
                      {analysisResult.cashOnCash.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-xs text-muted-foreground">Jaarinkomsten</p>
                    <p className="font-medium text-green-600">{formatCurrency(analysisResult.yearlyIncome)}</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <p className="text-xs text-muted-foreground">Jaarkosten</p>
                    <p className="font-medium text-red-600">{formatCurrency(analysisResult.yearlyExpenses)}</p>
                  </div>
                  <div className="text-center p-2 bg-primary/10 rounded-lg">
                    <p className="text-xs text-muted-foreground">NOI</p>
                    <p className="font-medium text-primary">{formatCurrency(analysisResult.noi)}</p>
                  </div>
                </div>

                {/* Warning */}
                <Alert variant="default" className="border-muted">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    AI kan fouten maken. Controleer altijd aankoopprijs, oppervlakte en huur. 
                    Deze analyse is een eerste inschatting. Gebruik de volledige rendementsanalyse voor aankoopbeslissingen.
                  </AlertDescription>
                </Alert>

                {/* Apply to Analyzer Button */}
                <Button onClick={handleApplyToAnalyzer} className="w-full gap-2" variant="default">
                  <Save className="h-4 w-4" />
                  Overnemen in Analysator
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
