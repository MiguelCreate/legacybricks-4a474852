import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { 
  Bot, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles,
  Building2,
  TrendingUp,
  Calculator,
  Save,
  Loader2,
  ExternalLink,
  Edit3,
  Wallet,
  Percent,
  PiggyBank,
  CreditCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  listingAnalyzerApi, 
  calculateAnalysis, 
  type ParsedProperty, 
  type AnalysisResult,
  type FinancingSettings 
} from "@/lib/api/listing-analyzer";

const DEFAULT_FINANCING: FinancingSettings = {
  mode: 'ltv',
  ltvPercentage: 75,
  eigenGeldBedrag: 50000,
  rentePercentage: 3.8,
  looptijdJaren: 30,
};

export default function AIAdvertentieAnalyzer() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Input state
  const [url, setUrl] = useState("");
  const [manualText, setManualText] = useState("");
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  
  // Result state
  const [originalJson, setOriginalJson] = useState<ParsedProperty | null>(null);
  const [overrides, setOverrides] = useState<Partial<ParsedProperty>>({});
  const [financing, setFinancing] = useState<FinancingSettings>(DEFAULT_FINANCING);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  // Calculate analysis with overrides - memoized for performance
  const analysis = useMemo<AnalysisResult | null>(() => {
    if (!originalJson) return null;
    return calculateAnalysis(originalJson, overrides, financing);
  }, [originalJson, overrides, financing]);

  // Merged data for display
  const mergedData = useMemo<ParsedProperty | null>(() => {
    if (!originalJson) return null;
    return { ...originalJson, ...overrides };
  }, [originalJson, overrides]);

  // Check for financing warnings
  const financingWarning = useMemo(() => {
    if (!analysis) return null;
    if (analysis.eigenGeld < 0) return "Eigen geld zou negatief zijn - pas je instellingen aan.";
    if (analysis.lening < 0) return "Lening zou negatief zijn - pas je instellingen aan.";
    return null;
  }, [analysis]);

  const handleAnalyze = async () => {
    if (inputMode === 'url' && !url.trim()) {
      setError("Voer een URL in");
      return;
    }
    if (inputMode === 'text' && !manualText.trim()) {
      setError("Voer de advertentietekst in");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setOriginalJson(null);
    setOverrides({});
    setUsedFallback(false);
    setShowManualFallback(false);

    try {
      let result;
      
      if (inputMode === 'text') {
        // Direct text analysis without scraping
        result = await listingAnalyzerApi.analyzeContent(manualText.trim(), url || 'Handmatige invoer', 'text');
        setUsedFallback(true);
      } else {
        // URL-based analysis with automatic fallback
        result = await listingAnalyzerApi.analyzeUrl(url.trim());
        
        // Check if we need to show manual fallback
        if (!result.success && result.error?.includes('blokkeert')) {
          setShowManualFallback(true);
          setError(result.error + " Gebruik de 'Plak Tekst' tab om de advertentietekst handmatig in te voeren.");
          return;
        }
        
        if (result.usedScreenshotFallback) {
          setUsedFallback(true);
        }
      }
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Analyse mislukt");
      }

      setOriginalJson(result.data);
      
      toast({
        title: "Analyse voltooid!",
        description: usedFallback 
          ? "De advertentie is geanalyseerd via een alternatieve methode."
          : "De advertentie is succesvol geanalyseerd.",
      });
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Er is een fout opgetreden bij het analyseren");
      toast({
        title: "Fout",
        description: err.message || "Kon de advertentie niet analyseren",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyJson = () => {
    if (!originalJson) return;
    navigator.clipboard.writeText(JSON.stringify(originalJson, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
    toast({ title: "JSON gekopieerd!" });
  };

  const handleOverrideChange = (field: keyof ParsedProperty, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    if (field === 'locatie' || field === 'energielabel' || field === 'opmerking') {
      setOverrides(prev => ({ ...prev, [field]: value || null }));
    } else {
      setOverrides(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const handleFinancingChange = (field: keyof FinancingSettings, value: string | number) => {
    setFinancing(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAsProperty = async () => {
    if (!user || !mergedData) {
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
        naam: mergedData.locatie ? `AI Analyse - ${mergedData.locatie}` : "AI Analyse - Nieuw Pand",
        locatie: mergedData.locatie || "Onbekend",
        aankoopprijs: mergedData.aankoopprijs || 0,
        notaris_kosten: mergedData.notariskosten || 2000,
        imt_betaald: mergedData.aankoopprijs ? mergedData.aankoopprijs * ((mergedData.imt_pct || 6.5) / 100) : 0,
        renovatie_kosten: mergedData.renovatiekosten || 0,
        maandelijkse_huur: mergedData.huurpotentie_lt || 0,
        st_bezetting_percentage: mergedData.bezetting_st_pct || 0,
        st_gemiddelde_dagprijs: mergedData.huurpotentie_st_adr || 0,
        oppervlakte_m2: mergedData.oppervlakte_m2 || null,
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

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

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
            Plak een URL van een vastgoedadvertentie en ontvang direct een analyse
          </p>
        </div>

        {/* URL/Text Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              Advertentie Invoer
            </CardTitle>
            <CardDescription>
              Plak een URL of kopieer de advertentietekst direct
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'url' | 'text')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL Analyse</TabsTrigger>
                <TabsTrigger value="text" className={showManualFallback ? "ring-2 ring-primary animate-pulse" : ""}>
                  Plak Tekst
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://www.idealista.pt/imovel/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                    disabled={isAnalyzing}
                  />
                  <Button onClick={handleAnalyze} disabled={isAnalyzing} className="gap-2">
                    {isAnalyzing ? (
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
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Advertentie URL (optioneel)</Label>
                  <Input
                    type="url"
                    placeholder="https://www.idealista.pt/imovel/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Advertentietekst *</Label>
                  <textarea
                    className="w-full min-h-[200px] p-3 border rounded-md bg-background text-foreground resize-y"
                    placeholder="Kopieer hier de volledige tekst van de vastgoedadvertentie. Inclusief prijs, oppervlakte, locatie, aantal kamers, etc."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    disabled={isAnalyzing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Kopieer zoveel mogelijk details uit de advertentie voor een nauwkeurige analyse.
                  </p>
                </div>
                <Button onClick={handleAnalyze} disabled={isAnalyzing || !manualText.trim()} className="gap-2 w-full">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyseren...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4" />
                      Analyseer Tekst
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {usedFallback && originalJson && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Deze analyse is uitgevoerd via een alternatieve methode (screenshot of handmatige tekst). 
                  Controleer de waarden extra zorgvuldig.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {originalJson && analysis && mergedData && (
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
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  ) : analysis.verdict === "matig" ? (
                    <AlertTriangle className="h-12 w-12 text-yellow-600" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-600" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">
                      {analysis.verdict === "rendabel" ? "Rendabel" :
                       analysis.verdict === "matig" ? "Matig" : "Risicovol"}
                    </h2>
                    <p className="text-muted-foreground">
                      {mergedData.locatie && `${mergedData.locatie} • `}
                      {mergedData.aankoopprijs && formatCurrency(mergedData.aankoopprijs)}
                      {mergedData.oppervlakte_m2 && ` • ${mergedData.oppervlakte_m2} m²`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.verdictReasons.map((reason, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs defaultValue="metrics" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="metrics">KPI's</TabsTrigger>
                <TabsTrigger value="financing">Financiering</TabsTrigger>
                <TabsTrigger value="overrides">Aanpassen</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>

              {/* Metrics Tab */}
              <TabsContent value="metrics" className="space-y-4">
                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Totale Investering</div>
                      <div className="text-2xl font-bold">{formatCurrency(analysis.totalInvestment)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">BAR</div>
                      <div className="text-2xl font-bold">{formatPercent(analysis.bar)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">NAR</div>
                      <div className="text-2xl font-bold">{formatPercent(analysis.nar)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Cash-on-Cash</div>
                      <div className="text-2xl font-bold">{formatPercent(analysis.cashOnCash)}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Inkomen
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lange termijn (jaar)</span>
                        <span className="font-medium">{formatCurrency(analysis.yearlyIncomeLT)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Korte termijn (jaar)</span>
                        <span className="font-medium">{formatCurrency(analysis.yearlyIncomeST)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">NOI</span>
                        <span className="font-bold">{formatCurrency(analysis.noi)}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        Financiering
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Eigen geld</span>
                        <span className="font-medium">{formatCurrency(analysis.eigenGeld)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lening</span>
                        <span className="font-medium">{formatCurrency(analysis.lening)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Effectieve LTV</span>
                        <span className="font-medium">{formatPercent(analysis.effectieveLTV)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Maandlast</span>
                        <span className="font-bold">{formatCurrency(analysis.maandlast)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Financing Tab */}
              <TabsContent value="financing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Financieringsmethode
                    </CardTitle>
                    <CardDescription>
                      Kies hoe je de financiering wilt berekenen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <RadioGroup 
                      value={financing.mode} 
                      onValueChange={(v) => handleFinancingChange('mode', v as 'ltv' | 'eigengeld')}
                      className="grid gap-4 md:grid-cols-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ltv" id="ltv" />
                        <Label htmlFor="ltv" className="flex items-center gap-2 cursor-pointer">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          Gebruik LTV %
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="eigengeld" id="eigengeld" />
                        <Label htmlFor="eigengeld" className="flex items-center gap-2 cursor-pointer">
                          <PiggyBank className="h-4 w-4 text-muted-foreground" />
                          Gebruik Eigen geld €
                        </Label>
                      </div>
                    </RadioGroup>

                    {financingWarning && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{financingWarning}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      {financing.mode === 'ltv' ? (
                        <div className="space-y-2">
                          <Label>LTV Percentage</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={financing.ltvPercentage}
                              onChange={(e) => handleFinancingChange('ltvPercentage', parseFloat(e.target.value) || 0)}
                              className="flex-1"
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Lening = aankoopprijs × LTV%
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Eigen geld</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">€</span>
                            <Input
                              type="number"
                              value={financing.eigenGeldBedrag}
                              onChange={(e) => handleFinancingChange('eigenGeldBedrag', parseFloat(e.target.value) || 0)}
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Lening = totale investering − eigen geld
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Rente percentage</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={financing.rentePercentage}
                            onChange={(e) => handleFinancingChange('rentePercentage', parseFloat(e.target.value) || 0)}
                            className="flex-1"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Looptijd</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={financing.looptijdJaren}
                            onChange={(e) => handleFinancingChange('looptijdJaren', parseInt(e.target.value) || 30)}
                            className="flex-1"
                          />
                          <span className="text-muted-foreground">jaar</span>
                        </div>
                      </div>
                    </div>

                    {/* Financing Summary */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <h4 className="font-medium">Samenvatting</h4>
                      <div className="grid gap-2 text-sm md:grid-cols-4">
                        <div>
                          <span className="text-muted-foreground">Totale investering:</span>
                          <div className="font-medium">{formatCurrency(analysis.totalInvestment)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Eigen geld:</span>
                          <div className="font-medium">{formatCurrency(analysis.eigenGeld)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lening:</span>
                          <div className="font-medium">{formatCurrency(analysis.lening)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Effectieve LTV:</span>
                          <div className="font-medium">{formatPercent(analysis.effectieveLTV)}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Overrides Tab */}
              <TabsContent value="overrides" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Edit3 className="h-4 w-4 text-primary" />
                      Waarden Aanpassen
                    </CardTitle>
                    <CardDescription>
                      Pas waardes aan voor een nauwkeurigere analyse. Wijzigingen worden direct doorberekend.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Core Fields */}
                      <div className="space-y-2">
                        <Label>Aankoopprijs</Label>
                        <Input
                          type="number"
                          placeholder={String(originalJson.aankoopprijs || '')}
                          value={overrides.aankoopprijs ?? ''}
                          onChange={(e) => handleOverrideChange('aankoopprijs', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Oppervlakte (m²)</Label>
                        <Input
                          type="number"
                          placeholder={String(originalJson.oppervlakte_m2 || '')}
                          value={overrides.oppervlakte_m2 ?? ''}
                          onChange={(e) => handleOverrideChange('oppervlakte_m2', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Locatie</Label>
                        <Input
                          type="text"
                          placeholder={originalJson.locatie || ''}
                          value={overrides.locatie ?? ''}
                          onChange={(e) => handleOverrideChange('locatie', e.target.value)}
                        />
                      </div>

                      {/* Rental */}
                      <div className="space-y-2">
                        <Label>Huur LT (maand)</Label>
                        <Input
                          type="number"
                          placeholder={String(originalJson.huurpotentie_lt || '')}
                          value={overrides.huurpotentie_lt ?? ''}
                          onChange={(e) => handleOverrideChange('huurpotentie_lt', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ST Dagprijs (ADR)</Label>
                        <Input
                          type="number"
                          placeholder={String(originalJson.huurpotentie_st_adr || '')}
                          value={overrides.huurpotentie_st_adr ?? ''}
                          onChange={(e) => handleOverrideChange('huurpotentie_st_adr', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ST Bezetting (%)</Label>
                        <Input
                          type="number"
                          placeholder={String(originalJson.bezetting_st_pct || '')}
                          value={overrides.bezetting_st_pct ?? ''}
                          onChange={(e) => handleOverrideChange('bezetting_st_pct', e.target.value)}
                        />
                      </div>

                      {/* Costs */}
                      <div className="space-y-2">
                        <Label>Renovatiekosten</Label>
                        <Input
                          type="number"
                          placeholder={String(originalJson.renovatiekosten || '')}
                          value={overrides.renovatiekosten ?? ''}
                          onChange={(e) => handleOverrideChange('renovatiekosten', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Notariskosten</Label>
                        <Input
                          type="number"
                          placeholder={String(originalJson.notariskosten || '')}
                          value={overrides.notariskosten ?? ''}
                          onChange={(e) => handleOverrideChange('notariskosten', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Makelaarskosten</Label>
                        <Input
                          type="number"
                          placeholder={String(originalJson.makelaarskosten || '')}
                          value={overrides.makelaarskosten ?? ''}
                          onChange={(e) => handleOverrideChange('makelaarskosten', e.target.value)}
                        />
                      </div>

                      {/* Taxes */}
                      <div className="space-y-2">
                        <Label>IMT (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder={String(originalJson.imt_pct || '')}
                          value={overrides.imt_pct ?? ''}
                          onChange={(e) => handleOverrideChange('imt_pct', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IMI (jaarlijks)</Label>
                        <Input
                          type="number"
                          placeholder={String(originalJson.imi_jaarlijks || '')}
                          value={overrides.imi_jaarlijks ?? ''}
                          onChange={(e) => handleOverrideChange('imi_jaarlijks', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slaapkamers</Label>
                        <Input
                          type="number"
                          placeholder={String(originalJson.aantal_slaapkamers || '')}
                          value={overrides.aantal_slaapkamers ?? ''}
                          onChange={(e) => handleOverrideChange('aantal_slaapkamers', e.target.value)}
                        />
                      </div>
                    </div>

                    {Object.keys(overrides).length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => setOverrides({})}
                          className="gap-2"
                        >
                          Reset aanpassingen
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* JSON Tab */}
              <TabsContent value="json" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Gegenereerde JSON
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={copyJson} className="gap-2">
                        {jsonCopied ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Gekopieerd
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Kopieer
                          </>
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      Dit is de automatisch gegenereerde JSON van de advertentie-analyse
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">
                      {JSON.stringify(originalJson, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleSaveAsProperty} 
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Opslaan als Pand
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("from", "ai-analyzer");
                  if (mergedData.aankoopprijs) params.set("price", String(mergedData.aankoopprijs));
                  if (mergedData.huurpotentie_lt) params.set("rent", String(mergedData.huurpotentie_lt));
                  if (mergedData.locatie) params.set("location", mergedData.locatie);
                  navigate(`/analysator?${params.toString()}`);
                }}
                className="gap-2"
              >
                <Building2 className="h-4 w-4" />
                Uitgebreide Analyse
              </Button>
            </div>

            {/* Disclaimer */}
            <Alert>
              <AlertDescription className="text-xs">
                ⚠️ <strong>Let op:</strong> Deze analyse is gebaseerd op automatisch geëxtraheerde data en AI-schattingen. 
                Controleer alle waarden en pas ze aan indien nodig. Gebruik dit als startpunt, niet als definitief advies.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
