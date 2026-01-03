import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  Bot, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  Building2,
  TrendingUp,
  Calculator,
  Save
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ParsedProperty {
  aankoopprijs: number | null;
  oppervlakte_m2: number | null;
  locatie: string | null;
  huurpotentie_lt: number | null;
  huurpotentie_st_adr: number | null;
  bezetting_st_pct: number | null;
  renovatiekosten: number | null;
  notariskosten: number | null;
  makelaarskosten: number | null;
  imt_pct: number | null;
  imi_jaarlijks: number | null;
  energielabel: string | null;
  bouwjaar: number | null;
  aantal_slaapkamers: number | null;
  opmerking: string | null;
}

interface AnalysisResult {
  totalInvestment: number;
  yearlyIncomeLT: number;
  yearlyIncomeST: number;
  yearlyIncomeTotal: number;
  yearlyOpex: number;
  noi: number;
  bar: number;
  nar: number;
  cashOnCash: number;
  pricePerM2: number;
  verdict: "rendabel" | "matig" | "risicovol";
  verdictReasons: string[];
}

const AI_PROMPT = `Analyseer deze vastgoedadvertentie uit Portugal. Geef het resultaat in dit exacte JSON-formaat, met alleen getallen of korte tekst. Als een veld ontbreekt, vul dan null in.

{
  "aankoopprijs": 220000,
  "oppervlakte_m2": 85,
  "locatie": "Lissabon",
  "huurpotentie_lt": 1200,
  "huurpotentie_st_adr": 95,
  "bezetting_st_pct": 65,
  "renovatiekosten": 15000,
  "notariskosten": 2000,
  "makelaarskosten": 0,
  "imt_pct": 6.5,
  "imi_jaarlijks": 350,
  "energielabel": "C",
  "bouwjaar": 1985,
  "aantal_slaapkamers": 2,
  "opmerking": "Nabij metro"
}

Gebruik alleen de bovenstaande veldnamen. Geef geen extra tekst.`;

export default function AIAdvertentieAnalyzer() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [jsonInput, setJsonInput] = useState("");
  const [parsedData, setParsedData] = useState<ParsedProperty | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT);
    toast({
      title: "Prompt gekopieerd!",
      description: "Plak deze in Qwen of ChatGPT samen met je screenshot.",
    });
  };

  const parseJSON = (input: string): ParsedProperty | null => {
    try {
      // Try to extract JSON from the input (in case there's extra text)
      const jsonMatch = input.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Geen geldig JSON formaat gevonden");
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed as ParsedProperty;
    } catch (e) {
      return null;
    }
  };

  const calculateAnalysis = (data: ParsedProperty): AnalysisResult => {
    const aankoopprijs = data.aankoopprijs || 0;
    const renovatiekosten = data.renovatiekosten || 0;
    const notariskosten = data.notariskosten || 2000;
    const makelaarskosten = data.makelaarskosten || 0;
    const imt_pct = data.imt_pct || 6.5;
    const imt = aankoopprijs * (imt_pct / 100);
    
    const totalInvestment = aankoopprijs + renovatiekosten + notariskosten + imt + makelaarskosten;
    
    // Yearly income
    const yearlyIncomeLT = (data.huurpotentie_lt || 0) * 12;
    const bezetting = (data.bezetting_st_pct || 0) / 100;
    const yearlyIncomeST = (data.huurpotentie_st_adr || 0) * 30 * bezetting * 12;
    const yearlyIncomeTotal = Math.max(yearlyIncomeLT, yearlyIncomeST);
    
    // OPEX
    const imi = data.imi_jaarlijks || (aankoopprijs * 0.003);
    const verzekering = aankoopprijs * 0.001;
    const onderhoud = aankoopprijs * 0.005;
    const leegstandBuffer = yearlyIncomeTotal * 0.08;
    const yearlyOpex = imi + verzekering + onderhoud + leegstandBuffer;
    
    const noi = yearlyIncomeTotal - yearlyOpex;
    
    // Key metrics
    const bar = aankoopprijs > 0 ? (yearlyIncomeTotal / aankoopprijs) * 100 : 0;
    const nar = totalInvestment > 0 ? (noi / totalInvestment) * 100 : 0;
    
    // Cash-on-Cash (75% financing)
    const eigenInbreng = totalInvestment * 0.25;
    const loanAmount = totalInvestment * 0.75;
    const annualInterest = 0.038; // 3.8%
    const loanTerm = 30;
    const monthlyRate = annualInterest / 12;
    const numPayments = loanTerm * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const yearlyDebtService = monthlyPayment * 12;
    const cashOnCash = eigenInbreng > 0 ? ((noi - yearlyDebtService) / eigenInbreng) * 100 : 0;
    
    const pricePerM2 = data.oppervlakte_m2 && data.oppervlakte_m2 > 0 ? aankoopprijs / data.oppervlakte_m2 : 0;
    
    // Verdict
    let positivePoints = 0;
    let negativePoints = 0;
    const verdictReasons: string[] = [];
    
    if (bar > 8) { positivePoints += 2; verdictReasons.push(`BAR ${bar.toFixed(1)}% is uitstekend (>8%)`); }
    else if (bar >= 5) { positivePoints += 1; verdictReasons.push(`BAR ${bar.toFixed(1)}% is acceptabel (5-8%)`); }
    else { negativePoints += 2; verdictReasons.push(`BAR ${bar.toFixed(1)}% is laag (<5%)`); }
    
    if (nar > 5) { positivePoints += 2; verdictReasons.push(`NAR ${nar.toFixed(1)}% is uitstekend (>5%)`); }
    else if (nar >= 3) { positivePoints += 1; verdictReasons.push(`NAR ${nar.toFixed(1)}% is acceptabel (3-5%)`); }
    else { negativePoints += 2; verdictReasons.push(`NAR ${nar.toFixed(1)}% is laag (<3%)`); }
    
    if (cashOnCash > 10) { positivePoints += 2; verdictReasons.push(`Cash-on-Cash ${cashOnCash.toFixed(1)}% is uitstekend (>10%)`); }
    else if (cashOnCash >= 6) { positivePoints += 1; verdictReasons.push(`Cash-on-Cash ${cashOnCash.toFixed(1)}% is acceptabel (6-10%)`); }
    else { negativePoints += 2; verdictReasons.push(`Cash-on-Cash ${cashOnCash.toFixed(1)}% is laag (<6%)`); }
    
    if (pricePerM2 > 0) {
      if (pricePerM2 < 2000) { positivePoints += 1; verdictReasons.push(`Prijs/m² €${pricePerM2.toFixed(0)} is gunstig (<€2.000)`); }
      else if (pricePerM2 <= 2800) { verdictReasons.push(`Prijs/m² €${pricePerM2.toFixed(0)} is marktconform (€2.000-2.800)`); }
      else { negativePoints += 1; verdictReasons.push(`Prijs/m² €${pricePerM2.toFixed(0)} is hoog (>€2.800)`); }
    }
    
    let verdict: "rendabel" | "matig" | "risicovol";
    if (positivePoints >= 5 && negativePoints <= 1) {
      verdict = "rendabel";
    } else if (negativePoints >= 4) {
      verdict = "risicovol";
    } else {
      verdict = "matig";
    }
    
    return {
      totalInvestment,
      yearlyIncomeLT,
      yearlyIncomeST,
      yearlyIncomeTotal,
      yearlyOpex,
      noi,
      bar,
      nar,
      cashOnCash,
      pricePerM2,
      verdict,
      verdictReasons,
    };
  };

  const handleAnalyze = () => {
    setParseError(null);
    
    if (!jsonInput.trim()) {
      setParseError("Plak eerst de JSON output van de AI");
      return;
    }
    
    const parsed = parseJSON(jsonInput);
    if (!parsed) {
      setParseError("Kon de JSON niet lezen. Controleer of je de exacte output van de AI hebt geplakt.");
      return;
    }
    
    if (!parsed.aankoopprijs) {
      setParseError("Aankoopprijs ontbreekt in de data. Dit is een verplicht veld.");
      return;
    }
    
    setParsedData(parsed);
    const result = calculateAnalysis(parsed);
    setAnalysis(result);
    setIsInstructionsOpen(false);
    
    toast({
      title: "Analyse voltooid!",
      description: `Oordeel: ${result.verdict === "rendabel" ? "✅ Rendabel" : result.verdict === "matig" ? "🟠 Matig" : "❌ Risicovol"}`,
    });
  };

  const handleNavigateToAnalyzer = () => {
    if (!parsedData) return;
    
    // Build query params for the analyzer
    const params = new URLSearchParams();
    params.set("from", "ai-analyzer");
    if (parsedData.aankoopprijs) params.set("price", String(parsedData.aankoopprijs));
    if (parsedData.huurpotentie_lt) params.set("rent", String(parsedData.huurpotentie_lt));
    if (parsedData.locatie) params.set("location", parsedData.locatie);
    
    navigate(`/analysator?${params.toString()}`);
  };

  const handleSaveAsProperty = async () => {
    if (!user || !parsedData) {
      toast({
        title: "Niet ingelogd",
        description: "Je moet ingelogd zijn om een pand op te slaan.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase.from("properties").insert({
        user_id: user.id,
        naam: parsedData.locatie ? `AI Analyse - ${parsedData.locatie}` : "AI Analyse - Nieuw Pand",
        locatie: parsedData.locatie || "Onbekend",
        aankoopprijs: parsedData.aankoopprijs || 0,
        notaris_kosten: parsedData.notariskosten || 2000,
        imt_betaald: parsedData.aankoopprijs ? parsedData.aankoopprijs * ((parsedData.imt_pct || 6.5) / 100) : 0,
        renovatie_kosten: parsedData.renovatiekosten || 0,
        maandelijkse_huur: parsedData.huurpotentie_lt || 0,
        st_bezetting_percentage: parsedData.bezetting_st_pct || 0,
        st_gemiddelde_dagprijs: parsedData.huurpotentie_st_adr || 0,
        oppervlakte_m2: parsedData.oppervlakte_m2 || null,
        analyse_status: "potentieel",
        status: "aankoop",
      });
      
      if (error) throw error;
      
      toast({
        title: "Pand opgeslagen!",
        description: "Het pand is toegevoegd aan je portfolio als potentiële investering.",
      });
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Advertentie Analyzer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyseer vastgoedadvertenties met AI en krijg direct een rendementsanalyse
          </p>
        </div>

        {/* Instructions */}
        <Collapsible open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Hoe werkt dit?</CardTitle>
                  </div>
                  {isInstructionsOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div>
                      <p className="text-sm text-muted-foreground">
                        Neem een <strong>screenshot</strong> of download de <strong>PDF</strong> van de vastgoedadvertentie (bijv. van Idealista, Imovirtual)
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div>
                      <p className="text-sm text-muted-foreground">
                        Upload deze naar <strong>Qwen Chat</strong> (Tongyi app of web) of <strong>ChatGPT</strong>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Plak deze <strong>exacte prompt</strong> in de AI:
                        </p>
                        <div className="relative">
                          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-40 overflow-y-auto">
                            {AI_PROMPT}
                          </pre>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute top-2 right-2 gap-1"
                            onClick={copyPrompt}
                          >
                            <Copy className="h-3 w-3" />
                            Kopieer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">4</div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Kopieer de JSON-output</strong> (alleen het deel tussen de accolades {"{ }"})
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">5</div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Plak hieronder</strong> in het tekstveld en klik op "Analyseren"
                      </p>
                    </div>
                    
                    <Alert className="mt-4">
                      <AlertDescription className="text-xs">
                        💡 <strong>Tip:</strong> Qwen is gratis via de Tongyi-app. Zorg dat je de exacte prompt gebruikt — anders werkt de analyse niet.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* JSON Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Plak de JSON-output van de AI
            </CardTitle>
            <CardDescription>
              Kopieer de volledige JSON response en plak deze hieronder
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder='{"aankoopprijs": 220000, "oppervlakte_m2": 85, ...}'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="min-h-[150px] font-mono text-sm"
            />
            
            {parseError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}
            
            <Button onClick={handleAnalyze} className="w-full gap-2">
              <Calculator className="h-4 w-4" />
              Analyseren
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && parsedData && (
          <div className="space-y-6">
            {/* Verdict Card */}
            <Card className={`border-2 ${
              analysis.verdict === "rendabel" ? "border-green-500 bg-green-50 dark:bg-green-950/20" :
              analysis.verdict === "matig" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" :
              "border-red-500 bg-red-50 dark:bg-red-950/20"
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {analysis.verdict === "rendabel" ? (
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  ) : analysis.verdict === "matig" ? (
                    <AlertTriangle className="h-12 w-12 text-yellow-500" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-500" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">
                      {analysis.verdict === "rendabel" ? "✅ Dit pand is rendabel" :
                       analysis.verdict === "matig" ? "🟠 Dit pand is matig" :
                       "❌ Dit pand is risicovol"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {analysis.verdict === "rendabel" 
                        ? "Aanbevolen voor langetermijnbelegging" 
                        : analysis.verdict === "matig"
                        ? "Overweeg alleen als je gelooft in waardegroei"
                        : "Niet aanbevolen zonder significante onderhandeling"}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-1">
                  {analysis.verdictReasons.map((reason, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">• {reason}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Totale Investering</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(analysis.totalInvestment)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">BAR</p>
                  <p className="text-2xl font-bold mt-1">{analysis.bar.toFixed(1)}%</p>
                  <Badge variant={analysis.bar > 8 ? "default" : analysis.bar >= 5 ? "secondary" : "destructive"} className="mt-1">
                    {analysis.bar > 8 ? "Excellent" : analysis.bar >= 5 ? "Acceptabel" : "Laag"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">NAR</p>
                  <p className="text-2xl font-bold mt-1">{analysis.nar.toFixed(1)}%</p>
                  <Badge variant={analysis.nar > 5 ? "default" : analysis.nar >= 3 ? "secondary" : "destructive"} className="mt-1">
                    {analysis.nar > 5 ? "Excellent" : analysis.nar >= 3 ? "Acceptabel" : "Laag"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Cash-on-Cash</p>
                  <p className="text-2xl font-bold mt-1">{analysis.cashOnCash.toFixed(1)}%</p>
                  <Badge variant={analysis.cashOnCash > 10 ? "default" : analysis.cashOnCash >= 6 ? "secondary" : "destructive"} className="mt-1">
                    {analysis.cashOnCash > 10 ? "Excellent" : analysis.cashOnCash >= 6 ? "Acceptabel" : "Laag"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Pandgegevens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Locatie</span>
                    <span className="font-medium">{parsedData.locatie || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aankoopprijs</span>
                    <span className="font-medium">{formatCurrency(parsedData.aankoopprijs || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Oppervlakte</span>
                    <span className="font-medium">{parsedData.oppervlakte_m2 || "-"} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prijs per m²</span>
                    <span className="font-medium">{analysis.pricePerM2 > 0 ? formatCurrency(analysis.pricePerM2) : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slaapkamers</span>
                    <span className="font-medium">{parsedData.aantal_slaapkamers || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Energielabel</span>
                    <span className="font-medium">{parsedData.energielabel || "-"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Jaarlijkse Analyse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inkomsten (LT)</span>
                    <span className="font-medium text-green-600">{formatCurrency(analysis.yearlyIncomeLT)}</span>
                  </div>
                  {analysis.yearlyIncomeST > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inkomsten (ST)</span>
                      <span className="font-medium text-green-600">{formatCurrency(analysis.yearlyIncomeST)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Totaal Inkomsten</span>
                    <span className="font-medium text-green-600">{formatCurrency(analysis.yearlyIncomeTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kosten (OPEX)</span>
                    <span className="font-medium text-red-600">-{formatCurrency(analysis.yearlyOpex)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">NOI</span>
                    <span className="font-bold">{formatCurrency(analysis.noi)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleNavigateToAnalyzer} className="flex-1 gap-2">
                <Calculator className="h-4 w-4" />
                Uitgebreide Analyse in Rendementsanalysator
              </Button>
              <Button 
                onClick={handleSaveAsProperty} 
                variant="outline" 
                className="flex-1 gap-2"
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Opslaan..." : "Opslaan als Pand"}
              </Button>
            </div>

            {/* Disclaimer */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Let op</AlertTitle>
              <AlertDescription className="text-xs">
                AI kan fouten maken. Controleer altijd aankoopprijs, oppervlakte en huur. 
                Deze analyse is een eerste inschatting. Gebruik de 'Volledige Rendementsanalyse' voor aankoopbeslissingen.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
