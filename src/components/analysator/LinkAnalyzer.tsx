import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Link2, 
  Search, 
  Sparkles, 
  Home, 
  MapPin, 
  Euro, 
  TrendingUp,
  Edit3,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { analyzeInvestment, AnalysisInputs, InvestmentAnalysis, getRiskAssessment } from "@/lib/rendementsCalculations";

interface PropertyEstimate {
  address: string;
  price: number;
  m2: number;
  type: string;
  estimatedRent: number;
  estimatedMortgage: number;
  estimatedCosts: number;
  estimatedCashflow: number;
  estimatedYield: number;
}

interface LinkAnalyzerProps {
  onAnalysisComplete?: (analysis: InvestmentAnalysis, inputs: AnalysisInputs) => void;
}

// Standard assumptions for quick analysis
const STANDARD_ASSUMPTIONS = {
  ltv: 70, // Conservative LTV
  interestRate: 4.0, // Current market rate
  loanTermYears: 25,
  managementPercent: 10,
  maintenancePercent: 1, // 1% of purchase price per year
  imiPercent: 0.4, // 0.4% of cadastral value
  insuranceYearly: 400,
  condoMonthly: 100, // Estimated VvE
  rentPerM2: 12, // €12/m² average for Portugal
  imtPercent: 6.5, // Average IMT
  notaryPercent: 1.5,
};

export function LinkAnalyzer({ onAnalysisComplete }: LinkAnalyzerProps) {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [estimate, setEstimate] = useState<PropertyEstimate | null>(null);
  const [analysis, setAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<"standard" | "custom">("standard");
  
  // Custom inputs for "reality" mode
  const [customInputs, setCustomInputs] = useState({
    price: 0,
    m2: 0,
    monthlyRent: 0,
    ltv: STANDARD_ASSUMPTIONS.ltv,
    interestRate: STANDARD_ASSUMPTIONS.interestRate,
    ownContribution: 0,
    monthlyExpenses: 0,
  });

  const extractPropertyInfo = (inputUrl: string): PropertyEstimate | null => {
    // Simulate extracting info from URL
    // In production, this would call an edge function to scrape the listing
    
    // For demo purposes, generate realistic estimates based on URL patterns
    const isIdalista = inputUrl.includes("idealista");
    const isFunda = inputUrl.includes("funda");
    
    // Extract any numbers from the URL as hints
    const priceMatch = inputUrl.match(/(\d{5,7})/);
    const m2Match = inputUrl.match(/(\d{2,3})m2/i) || inputUrl.match(/m2-(\d{2,3})/);
    
    const estimatedPrice = priceMatch ? parseInt(priceMatch[1]) : 250000;
    const estimatedM2 = m2Match ? parseInt(m2Match[1]) : 75;
    
    // Calculate estimates based on standard assumptions
    const estimatedRent = Math.round(estimatedM2 * STANDARD_ASSUMPTIONS.rentPerM2);
    const loanAmount = estimatedPrice * (STANDARD_ASSUMPTIONS.ltv / 100);
    const monthlyInterest = loanAmount * (STANDARD_ASSUMPTIONS.interestRate / 100) / 12;
    const estimatedMortgage = Math.round(monthlyInterest * 1.3); // Rough PMT approximation
    const estimatedCosts = Math.round(
      estimatedRent * (STANDARD_ASSUMPTIONS.managementPercent / 100) +
      (estimatedPrice * STANDARD_ASSUMPTIONS.maintenancePercent / 100) / 12 +
      STANDARD_ASSUMPTIONS.condoMonthly
    );
    const estimatedCashflow = estimatedRent - estimatedMortgage - estimatedCosts;
    const estimatedYield = (estimatedRent * 12) / estimatedPrice * 100;

    return {
      address: isIdalista ? "Appartement, Lisboa" : isFunda ? "Woning, Amsterdam" : "Woning, Portugal",
      price: estimatedPrice,
      m2: estimatedM2,
      type: "Appartement",
      estimatedRent,
      estimatedMortgage,
      estimatedCosts,
      estimatedCashflow,
      estimatedYield: Math.round(estimatedYield * 10) / 10,
    };
  };

  const analyzeUrl = async () => {
    if (!url.trim()) {
      toast.error("Plak eerst een link naar een woning");
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const propertyInfo = extractPropertyInfo(url);
      if (!propertyInfo) {
        toast.error("Kon geen gegevens ophalen van deze link");
        return;
      }

      setEstimate(propertyInfo);
      
      // Set custom inputs based on estimate
      setCustomInputs({
        price: propertyInfo.price,
        m2: propertyInfo.m2,
        monthlyRent: propertyInfo.estimatedRent,
        ltv: STANDARD_ASSUMPTIONS.ltv,
        interestRate: STANDARD_ASSUMPTIONS.interestRate,
        ownContribution: propertyInfo.price * (1 - STANDARD_ASSUMPTIONS.ltv / 100),
        monthlyExpenses: propertyInfo.estimatedCosts,
      });

      // Run full analysis with standard assumptions
      const inputs: AnalysisInputs = {
        purchasePrice: propertyInfo.price,
        pandType: 'niet-woning',
        imt: propertyInfo.price * (STANDARD_ASSUMPTIONS.imtPercent / 100),
        notaryFees: propertyInfo.price * (STANDARD_ASSUMPTIONS.notaryPercent / 100),
        renovationCosts: 0,
        furnishingCosts: 5000,
        ltv: STANDARD_ASSUMPTIONS.ltv,
        interestRate: STANDARD_ASSUMPTIONS.interestRate,
        loanTermYears: STANDARD_ASSUMPTIONS.loanTermYears,
        monthlyRentLT: propertyInfo.estimatedRent,
        stOccupancy: 70,
        stADR: 100,
        rentalType: 'longterm',
        managementPercent: STANDARD_ASSUMPTIONS.managementPercent,
        maintenanceYearly: propertyInfo.price * STANDARD_ASSUMPTIONS.maintenancePercent / 100,
        imiYearly: propertyInfo.price * STANDARD_ASSUMPTIONS.imiPercent / 100,
        insuranceYearly: STANDARD_ASSUMPTIONS.insuranceYearly,
        condoMonthly: STANDARD_ASSUMPTIONS.condoMonthly,
        utilitiesMonthly: 0,
        rentGrowth: 2,
        costGrowth: 2,
        valueGrowth: 3,
        years: 10,
      };

      const result = analyzeInvestment(inputs);
      setAnalysis(result);
      
      toast.success("Analyse voltooid!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Er ging iets mis bij de analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runCustomAnalysis = () => {
    if (!estimate) return;

    const inputs: AnalysisInputs = {
      purchasePrice: customInputs.price,
      pandType: 'niet-woning',
      imt: customInputs.price * (STANDARD_ASSUMPTIONS.imtPercent / 100),
      notaryFees: customInputs.price * (STANDARD_ASSUMPTIONS.notaryPercent / 100),
      renovationCosts: 0,
      furnishingCosts: 5000,
      ltv: customInputs.ltv,
      interestRate: customInputs.interestRate,
      loanTermYears: STANDARD_ASSUMPTIONS.loanTermYears,
      monthlyRentLT: customInputs.monthlyRent,
      stOccupancy: 70,
      stADR: 100,
      rentalType: 'longterm',
      managementPercent: STANDARD_ASSUMPTIONS.managementPercent,
      maintenanceYearly: customInputs.price * STANDARD_ASSUMPTIONS.maintenancePercent / 100,
      imiYearly: customInputs.price * STANDARD_ASSUMPTIONS.imiPercent / 100,
      insuranceYearly: STANDARD_ASSUMPTIONS.insuranceYearly,
      condoMonthly: STANDARD_ASSUMPTIONS.condoMonthly,
      utilitiesMonthly: 0,
      rentGrowth: 2,
      costGrowth: 2,
      valueGrowth: 3,
      years: 10,
    };

    const result = analyzeInvestment(inputs);
    setAnalysis(result);
    
    if (onAnalysisComplete) {
      onAnalysisComplete(result, inputs);
    }
  };

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getVerdict = () => {
    if (!analysis) return null;
    
    const risk = getRiskAssessment(analysis);
    
    if (risk.level === 'good') {
      return {
        icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
        title: "Goede deal! 👍",
        description: "Op basis van standaard aannames lijkt dit een goede investering. De cijfers zien er gezond uit.",
        color: "bg-green-50 dark:bg-green-950/30 border-green-200",
      };
    } else if (risk.level === 'moderate') {
      return {
        icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
        title: "Twijfelachtig ⚠️",
        description: "Dit kan werken, maar er zijn aandachtspunten. Bekijk de details en pas aan naar jouw situatie.",
        color: "bg-orange-50 dark:bg-orange-950/30 border-orange-200",
      };
    } else {
      return {
        icon: <XCircle className="h-8 w-8 text-red-500" />,
        title: "Niet interessant ❌",
        description: "Met de huidige aannames is dit geen aantrekkelijke investering. De marges zijn te krap.",
        color: "bg-red-50 dark:bg-red-950/30 border-red-200",
      };
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Plak een woninglink
        </CardTitle>
        <CardDescription>
          Plak een link van Idealista, Funda of een andere woningsite. 
          We schatten automatisch wat deze woning kan opleveren.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="https://www.idealista.pt/imovel/12345678/"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pr-10"
            />
            {url && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setUrl("")}
              >
                ×
              </Button>
            )}
          </div>
          <Button 
            onClick={analyzeUrl} 
            disabled={isAnalyzing || !url}
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="h-4 w-4 animate-pulse" />
                Analyseren...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Analyseer
              </>
            )}
          </Button>
        </div>

        {/* Supported sites */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            idealista.pt ✓
          </Badge>
          <Badge variant="outline" className="text-xs">
            funda.nl ✓
          </Badge>
          <Badge variant="outline" className="text-xs">
            imovirtual.com ✓
          </Badge>
        </div>

        {/* Results */}
        {estimate && (
          <>
            <Separator />

            {/* Property summary */}
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 rounded-lg p-3">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{estimate.address}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                  <span>{formatCurrency(estimate.price)}</span>
                  <span>{estimate.m2}m²</span>
                  <span>{estimate.type}</span>
                </div>
              </div>
            </div>

            {/* Verdict */}
            {analysis && (
              <Card className={`${getVerdict()?.color}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    {getVerdict()?.icon}
                    <div>
                      <h4 className="font-semibold text-lg">{getVerdict()?.title}</h4>
                      <p className="text-muted-foreground mt-1">{getVerdict()?.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Standard vs Custom tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standard" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Standaard inschatting
                </TabsTrigger>
                <TabsTrigger value="custom" className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  Jullie echte situatie
                </TabsTrigger>
              </TabsList>

              <TabsContent value="standard" className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      Geschatte huur
                      <Info className="h-3 w-3" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(estimate.estimatedRent)}/mnd
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Gebaseerd op €{STANDARD_ASSUMPTIONS.rentPerM2}/m²
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Geschatte hypotheek</div>
                    <div className="text-2xl font-bold text-orange-500">
                      {formatCurrency(estimate.estimatedMortgage)}/mnd
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {STANDARD_ASSUMPTIONS.ltv}% LTV, {STANDARD_ASSUMPTIONS.interestRate}% rente
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Overige kosten</div>
                    <div className="text-2xl font-bold text-red-500">
                      {formatCurrency(estimate.estimatedCosts)}/mnd
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Beheer, onderhoud, VvE
                    </div>
                  </div>

                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="text-sm text-muted-foreground">Netto cashflow</div>
                    <div className={`text-2xl font-bold ${estimate.estimatedCashflow >= 0 ? 'text-primary' : 'text-red-500'}`}>
                      {formatCurrency(estimate.estimatedCashflow)}/mnd
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Dit blijft over
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg text-sm">
                  <strong>Let op:</strong> Dit zijn schattingen gebaseerd op standaard aannames. 
                  Pas de cijfers aan naar jullie echte situatie voor een nauwkeuriger beeld.
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm">Koopprijs</Label>
                    <Input
                      type="number"
                      value={customInputs.price}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Werkelijke huur</Label>
                    <Input
                      type="number"
                      value={customInputs.monthlyRent}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, monthlyRent: parseFloat(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Eigen inbreng</Label>
                    <Input
                      type="number"
                      value={customInputs.ownContribution}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, ownContribution: parseFloat(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">LTV (%)</Label>
                    <Input
                      type="number"
                      value={customInputs.ltv}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, ltv: parseFloat(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Rente (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={customInputs.interestRate}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Maandelijkse kosten</Label>
                    <Input
                      type="number"
                      value={customInputs.monthlyExpenses}
                      onChange={(e) => setCustomInputs(prev => ({ ...prev, monthlyExpenses: parseFloat(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button onClick={runCustomAnalysis} className="w-full gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Herbereken met jullie cijfers
                </Button>

                {/* Comparison */}
                {analysis && (
                  <div className="grid gap-3 sm:grid-cols-2 mt-4">
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4 text-center">
                        <div className="text-sm text-muted-foreground">Standaard</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(estimate.estimatedCashflow)}/mnd
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-primary/10">
                      <CardContent className="pt-4 text-center">
                        <div className="text-sm text-muted-foreground">Jullie situatie</div>
                        <div className="text-lg font-bold text-primary">
                          {formatCurrency(Math.round(analysis.yearlyCashflows[0]?.netCashflow / 12 || 0))}/mnd
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
