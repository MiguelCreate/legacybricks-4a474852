import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Info, TrendingUp, Home, Wallet, PiggyBank, Heart, 
  FileDown, RotateCcw, Scale, Building2, Globe
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  LineChart, Line, Legend, Tooltip as RechartsTooltip
} from "recharts";
import { 
  PropertyInputs, 
  DEFAULT_VALUES, 
  analyzeProperty, 
  translations,
  AnalysisResult 
} from "@/lib/sellOrKeepCalculations";
import jsPDF from "jspdf";

type Language = 'nl' | 'pt';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const InfoTooltip = ({ content }: { content: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="w-4 h-4 text-muted-foreground cursor-help inline-block ml-1" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p className="text-sm">{content}</p>
    </TooltipContent>
  </Tooltip>
);

const StabilityBadge = ({ level, lang }: { level: 'high' | 'medium' | 'low'; lang: Language }) => {
  const labels = {
    nl: { high: 'Hoog', medium: 'Midden', low: 'Laag' },
    pt: { high: 'Alto', medium: 'Médio', low: 'Baixo' },
  };
  const colors = {
    high: 'bg-green-500/20 text-green-700 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    low: 'bg-red-500/20 text-red-700 border-red-500/30',
  };
  return (
    <Badge variant="outline" className={colors[level]}>
      {labels[lang][level]}
    </Badge>
  );
};

const VerkopenOfBehouden = () => {
  const [lang, setLang] = useState<Language>('nl');
  const t = translations[lang];
  
  const [inputs, setInputs] = useState<PropertyInputs>({
    currentMarketValue: 300000,
    originalPurchasePrice: 250000,
    purchaseDate: '2020-01-01',
    cadastralValue: 180000,
    rentalType: 'longterm',
    remainingMortgage: 150000,
    mortgageRate: DEFAULT_VALUES.mortgageRate!,
    mortgageType: 'annuity',
    remainingYears: 20,
    monthlyRent: 1200,
    maintenanceCosts: DEFAULT_VALUES.maintenanceCosts!,
    renovationReserve: DEFAULT_VALUES.renovationReserve!,
    vacancyRate: DEFAULT_VALUES.vacancyRate!,
    propertyManager: 'self',
    imiRate: DEFAULT_VALUES.imiRate!,
    rentalTaxRegime: 'autonomous',
    salesCosts: DEFAULT_VALUES.salesCosts!,
    capitalGainsTaxRegime: 'autonomous',
    reinvestInEUResidence: false,
    annualGrowthRate: DEFAULT_VALUES.annualGrowthRate!,
    alternativeInvestmentReturn: DEFAULT_VALUES.alternativeInvestmentReturn!,
    investmentHorizon: 10,
    primaryGoal: 'wealth',
    riskProfile: 'medium',
  });

  const [activeTab, setActiveTab] = useState('input');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    const analysis = analyzeProperty(inputs);
    setResult(analysis);
    setActiveTab('results');
  };

  const handleReset = () => {
    setInputs({
      ...inputs,
      currentMarketValue: 300000,
      originalPurchasePrice: 250000,
      purchaseDate: '2020-01-01',
      cadastralValue: 180000,
      remainingMortgage: 150000,
      remainingYears: 20,
      monthlyRent: 1200,
    });
    setResult(null);
    setActiveTab('input');
  };

  const handleExportPDF = () => {
    if (!result) return;
    
    const pdf = new jsPDF();
    const margin = 20;
    let y = margin;
    
    // Title
    pdf.setFontSize(18);
    pdf.text(t.title, margin, y);
    y += 10;
    pdf.setFontSize(12);
    pdf.text(t.subtitle, margin, y);
    y += 15;
    
    // Input summary
    pdf.setFontSize(14);
    pdf.text(t.sections.basicData, margin, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.text(`${t.fields.currentMarketValue.label}: ${formatCurrency(inputs.currentMarketValue)}`, margin, y);
    y += 6;
    pdf.text(`${t.fields.originalPurchasePrice.label}: ${formatCurrency(inputs.originalPurchasePrice)}`, margin, y);
    y += 6;
    pdf.text(`${t.fields.monthlyRent.label}: ${formatCurrency(inputs.monthlyRent)}`, margin, y);
    y += 15;
    
    // Results summary
    pdf.setFontSize(14);
    pdf.text(t.tabs.results, margin, y);
    y += 10;
    
    const scenarios = [
      { name: t.scenarios.a, data: result.scenarioA },
      { name: t.scenarios.b, data: result.scenarioB },
      { name: t.scenarios.c, data: result.scenarioC },
    ];
    
    pdf.setFontSize(10);
    scenarios.forEach(scenario => {
      pdf.text(`${scenario.name}:`, margin, y);
      y += 6;
      pdf.text(`  ${t.results.monthlyIncome}: ${formatCurrency(scenario.data.monthlyIncome)}`, margin, y);
      y += 6;
      pdf.text(`  ${t.results.netWorth} 10 ${t.results.years}: ${formatCurrency(scenario.data.netWorth10Years)}`, margin, y);
      y += 6;
      pdf.text(`  ${t.results.netWorth} 30 ${t.results.years}: ${formatCurrency(scenario.data.netWorth30Years)}`, margin, y);
      y += 10;
    });
    
    // Recommendation
    y += 5;
    pdf.setFontSize(14);
    pdf.text(t.advice.title, margin, y);
    y += 10;
    pdf.setFontSize(10);
    
    const splitReasoning = pdf.splitTextToSize(result.recommendation.reasoning, 170);
    pdf.text(splitReasoning, margin, y);
    y += splitReasoning.length * 5 + 10;
    
    pdf.setFontSize(12);
    pdf.text(t.advice.tradeoffs + ':', margin, y);
    y += 8;
    pdf.setFontSize(10);
    result.recommendation.tradeoffs.forEach(tradeoff => {
      const splitTradeoff = pdf.splitTextToSize(`• ${tradeoff}`, 170);
      pdf.text(splitTradeoff, margin, y);
      y += splitTradeoff.length * 5 + 3;
    });
    
    // Disclaimer
    y += 10;
    pdf.setFontSize(8);
    pdf.setTextColor(128);
    const disclaimer = pdf.splitTextToSize(t.advice.disclaimer, 170);
    pdf.text(disclaimer, margin, y);
    
    pdf.save('vastgoed-analyse.pdf');
  };

  const updateInput = <K extends keyof PropertyInputs>(key: K, value: PropertyInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const chartData = useMemo(() => {
    if (!result) return { income: [], wealth: [] };
    
    return {
      income: [
        { name: t.scenarios.a, value: Math.round(result.scenarioA.monthlyIncome) },
        { name: t.scenarios.b, value: Math.round(result.scenarioB.monthlyIncome) },
        { name: t.scenarios.c, value: Math.round(result.scenarioC.monthlyIncome) },
      ],
      wealth: [
        { 
          name: '10 ' + t.results.years, 
          [t.scenarios.a]: Math.round(result.scenarioA.netWorth10Years),
          [t.scenarios.b]: Math.round(result.scenarioB.netWorth10Years),
          [t.scenarios.c]: Math.round(result.scenarioC.netWorth10Years),
        },
        { 
          name: '30 ' + t.results.years, 
          [t.scenarios.a]: Math.round(result.scenarioA.netWorth30Years),
          [t.scenarios.b]: Math.round(result.scenarioB.netWorth30Years),
          [t.scenarios.c]: Math.round(result.scenarioC.netWorth30Years),
        },
      ],
    };
  }, [result, t]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Scale className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
          
          {/* Language Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={lang === 'nl' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLang('nl')}
              className="gap-2"
            >
              🇳🇱 NL
            </Button>
            <Button
              variant={lang === 'pt' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLang('pt')}
              className="gap-2"
            >
              🇵🇹 PT
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="input" className="gap-2">
              <Building2 className="w-4 h-4" />
              {t.tabs.input}
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2" disabled={!result}>
              <TrendingUp className="w-4 h-4" />
              {t.tabs.results}
            </TabsTrigger>
            <TabsTrigger value="advice" className="gap-2" disabled={!result}>
              <Heart className="w-4 h-4" />
              {t.tabs.advice}
            </TabsTrigger>
          </TabsList>

          {/* Input Tab */}
          <TabsContent value="input" className="space-y-6">
            {/* Basic Property Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  {t.sections.basicData}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>
                    {t.fields.currentMarketValue.label}
                    <InfoTooltip content={t.fields.currentMarketValue.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    value={inputs.currentMarketValue}
                    onChange={(e) => updateInput('currentMarketValue', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.originalPurchasePrice.label}
                    <InfoTooltip content={t.fields.originalPurchasePrice.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    value={inputs.originalPurchasePrice}
                    onChange={(e) => updateInput('originalPurchasePrice', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.purchaseDate.label}
                    <InfoTooltip content={t.fields.purchaseDate.tooltip} />
                  </Label>
                  <Input
                    type="date"
                    value={inputs.purchaseDate}
                    onChange={(e) => updateInput('purchaseDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.cadastralValue.label}
                    <InfoTooltip content={t.fields.cadastralValue.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    value={inputs.cadastralValue}
                    onChange={(e) => updateInput('cadastralValue', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.rentalType.label}
                    <InfoTooltip content={t.fields.rentalType.tooltip} />
                  </Label>
                  <Select value={inputs.rentalType} onValueChange={(v) => updateInput('rentalType', v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="longterm">{lang === 'nl' ? 'Langlopend' : 'Longa duração'}</SelectItem>
                      <SelectItem value="shortterm">{lang === 'nl' ? 'Vakantieverhuur (AL)' : 'Alojamento Local (AL)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Financing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  {t.sections.financing}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>
                    {t.fields.remainingMortgage.label}
                    <InfoTooltip content={t.fields.remainingMortgage.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    value={inputs.remainingMortgage}
                    onChange={(e) => updateInput('remainingMortgage', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.mortgageRate.label} (%)
                    <InfoTooltip content={t.fields.mortgageRate.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.mortgageRate}
                    onChange={(e) => updateInput('mortgageRate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.mortgageType.label}
                    <InfoTooltip content={t.fields.mortgageType.tooltip} />
                  </Label>
                  <Select value={inputs.mortgageType} onValueChange={(v) => updateInput('mortgageType', v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interest_only">{lang === 'nl' ? 'Aflossingsvrij' : 'Só juros'}</SelectItem>
                      <SelectItem value="annuity">{lang === 'nl' ? 'Annuïtair' : 'Amortização'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.remainingYears.label}
                    <InfoTooltip content={t.fields.remainingYears.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    value={inputs.remainingYears}
                    onChange={(e) => updateInput('remainingYears', Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rent & Operating Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {t.sections.rental}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>
                    {t.fields.monthlyRent.label}
                    <InfoTooltip content={t.fields.monthlyRent.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    value={inputs.monthlyRent}
                    onChange={(e) => updateInput('monthlyRent', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.maintenanceCosts.label}
                    <InfoTooltip content={t.fields.maintenanceCosts.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    value={inputs.maintenanceCosts}
                    onChange={(e) => updateInput('maintenanceCosts', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.renovationReserve.label} (%)
                    <InfoTooltip content={t.fields.renovationReserve.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={inputs.renovationReserve}
                    onChange={(e) => updateInput('renovationReserve', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.vacancyRate.label} (%)
                    <InfoTooltip content={t.fields.vacancyRate.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={inputs.vacancyRate}
                    onChange={(e) => updateInput('vacancyRate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.propertyManager.label}
                    <InfoTooltip content={t.fields.propertyManager.tooltip} />
                  </Label>
                  <Select value={inputs.propertyManager} onValueChange={(v) => updateInput('propertyManager', v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">{lang === 'nl' ? 'Zelf (0%)' : 'Próprio (0%)'}</SelectItem>
                      <SelectItem value="longterm">{lang === 'nl' ? 'Langlopend (10%)' : 'Longa duração (10%)'}</SelectItem>
                      <SelectItem value="shortterm">{lang === 'nl' ? 'Vakantie (25%)' : 'Curta duração (25%)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Taxes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t.sections.taxes}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>
                    {t.fields.imiRate.label} (%)
                    <InfoTooltip content={t.fields.imiRate.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.imiRate}
                    onChange={(e) => updateInput('imiRate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.rentalTaxRegime.label}
                    <InfoTooltip content={t.fields.rentalTaxRegime.tooltip} />
                  </Label>
                  <Select value={inputs.rentalTaxRegime} onValueChange={(v) => updateInput('rentalTaxRegime', v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="autonomous">{lang === 'nl' ? 'Autonoom (28%)' : 'Autónoma (28%)'}</SelectItem>
                      <SelectItem value="progressive">{lang === 'nl' ? 'Progressief (IRS)' : 'Englobamento (IRS)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.salesCosts.label} (%)
                    <InfoTooltip content={t.fields.salesCosts.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={inputs.salesCosts}
                    onChange={(e) => updateInput('salesCosts', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.capitalGainsTaxRegime.label}
                    <InfoTooltip content={t.fields.capitalGainsTaxRegime.tooltip} />
                  </Label>
                  <Select value={inputs.capitalGainsTaxRegime} onValueChange={(v) => updateInput('capitalGainsTaxRegime', v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="autonomous">{lang === 'nl' ? 'Autonoom' : 'Autónoma'}</SelectItem>
                      <SelectItem value="progressive">{lang === 'nl' ? 'Progressief' : 'Englobamento'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {t.fields.reinvestInEUResidence.label}
                    <InfoTooltip content={t.fields.reinvestInEUResidence.tooltip} />
                  </Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={inputs.reinvestInEUResidence}
                      onCheckedChange={(v) => updateInput('reinvestInEUResidence', v)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {inputs.reinvestInEUResidence ? (lang === 'nl' ? 'Ja' : 'Sim') : (lang === 'nl' ? 'Nee' : 'Não')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assumptions & Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5" />
                  {t.sections.assumptions}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>
                    {t.fields.annualGrowthRate.label} (%)
                    <InfoTooltip content={t.fields.annualGrowthRate.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.annualGrowthRate}
                    onChange={(e) => updateInput('annualGrowthRate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.alternativeInvestmentReturn.label} (%)
                    <InfoTooltip content={t.fields.alternativeInvestmentReturn.tooltip} />
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.alternativeInvestmentReturn}
                    onChange={(e) => updateInput('alternativeInvestmentReturn', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.investmentHorizon.label}
                    <InfoTooltip content={t.fields.investmentHorizon.tooltip} />
                  </Label>
                  <Select value={String(inputs.investmentHorizon)} onValueChange={(v) => updateInput('investmentHorizon', Number(v) as 10 | 30)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 {t.results.years}</SelectItem>
                      <SelectItem value="30">30 {t.results.years}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.primaryGoal.label}
                    <InfoTooltip content={t.fields.primaryGoal.tooltip} />
                  </Label>
                  <Select value={inputs.primaryGoal} onValueChange={(v) => updateInput('primaryGoal', v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cashflow">💰 Cashflow</SelectItem>
                      <SelectItem value="wealth">📈 {lang === 'nl' ? 'Vermogen' : 'Património'}</SelectItem>
                      <SelectItem value="retirement">🌅 {lang === 'nl' ? 'Pensioen/FI' : 'Reforma/IF'}</SelectItem>
                      <SelectItem value="legacy">❤️ Legacy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {t.fields.riskProfile.label}
                    <InfoTooltip content={t.fields.riskProfile.tooltip} />
                  </Label>
                  <Select value={inputs.riskProfile} onValueChange={(v) => updateInput('riskProfile', v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{lang === 'nl' ? 'Laag' : 'Baixo'}</SelectItem>
                      <SelectItem value="medium">{lang === 'nl' ? 'Midden' : 'Médio'}</SelectItem>
                      <SelectItem value="high">{lang === 'nl' ? 'Hoog' : 'Alto'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button onClick={handleAnalyze} className="gap-2 flex-1 sm:flex-none">
                <TrendingUp className="w-4 h-4" />
                {t.buttons.analyze}
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                {t.buttons.reset}
              </Button>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {result && (
              <>
                {/* Monthly Income Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.results.monthlyIncome}</CardTitle>
                    <CardDescription>
                      {lang === 'nl' ? 'Vergelijking van maandelijks beschikbaar inkomen per scenario' : 'Comparação do rendimento mensal disponível por cenário'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.income}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis tickFormatter={(v) => `€${v}`} className="text-xs" />
                          <RechartsTooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Net Worth Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.results.netWorth}</CardTitle>
                    <CardDescription>
                      {lang === 'nl' ? 'Vergelijking van vermogensopbouw over tijd' : 'Comparação da evolução patrimonial'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.wealth}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} className="text-xs" />
                          <RechartsTooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Legend />
                          <Bar dataKey={t.scenarios.a} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey={t.scenarios.b} fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey={t.scenarios.c} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Scenario Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { key: 'A', scenario: result.scenarioA, name: t.scenarios.a },
                    { key: 'B', scenario: result.scenarioB, name: t.scenarios.b },
                    { key: 'C', scenario: result.scenarioC, name: t.scenarios.c },
                  ].map(({ key, scenario, name }) => (
                    <Card key={key} className={result.recommendation.bestScenario === key ? 'ring-2 ring-primary' : ''}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{name}</span>
                          {result.recommendation.bestScenario === key && (
                            <Badge className="bg-primary">
                              {lang === 'nl' ? 'Aanbevolen' : 'Recomendado'}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{t.results.monthlyIncome}</p>
                          <p className="text-2xl font-bold">{formatCurrency(scenario.monthlyIncome)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">{t.results.netWorth} 10j</p>
                            <p className="font-medium">{formatCurrency(scenario.netWorth10Years)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t.results.netWorth} 30j</p>
                            <p className="font-medium">{formatCurrency(scenario.netWorth30Years)}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{t.results.cashflowStability}</span>
                            <StabilityBadge level={scenario.cashflowStability} lang={lang} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{t.results.fiscalPredictability}</span>
                            <StabilityBadge level={scenario.fiscalPredictability} lang={lang} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{t.results.operationalComplexity}</span>
                            <StabilityBadge level={scenario.operationalComplexity} lang={lang} />
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{t.results.legacyYears}</p>
                          <p className="font-medium">{scenario.legacyYears} {t.results.years}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Stress Tests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Stress Tests</CardTitle>
                    <CardDescription>
                      {lang === 'nl' ? 'Impact van ongunstige scenario\'s op je investering' : 'Impacto de cenários adversos no seu investimento'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {result.stressTests.map((test, i) => (
                        <div key={i} className="p-4 rounded-lg bg-muted/50">
                          <p className="font-medium">{test.scenario}</p>
                          <p className="text-2xl font-bold text-destructive">{formatCurrency(test.impact)}/m</p>
                          <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Advice Tab */}
          <TabsContent value="advice" className="space-y-6">
            {result && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      {t.advice.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-lg leading-relaxed">{result.recommendation.reasoning}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">{t.advice.tradeoffs}</h4>
                      <ul className="space-y-2">
                        {result.recommendation.tradeoffs.map((tradeoff, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{tradeoff}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                      <p>⚠️ {t.advice.disclaimer}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Export Button */}
                <Button onClick={handleExportPDF} className="gap-2">
                  <FileDown className="w-4 h-4" />
                  {t.buttons.export}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default VerkopenOfBehouden;
