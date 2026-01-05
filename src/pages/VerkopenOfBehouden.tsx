import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Calculator, BarChart3, Lightbulb, Globe } from "lucide-react";
import { SellOrKeepForm } from "@/components/sellOrKeep/SellOrKeepForm";
import { ScenarioResults } from "@/components/sellOrKeep/ScenarioResults";
import { ScenarioCharts } from "@/components/sellOrKeep/ScenarioCharts";
import { DecisionAdvice } from "@/components/sellOrKeep/DecisionAdvice";
import { StressTestTable } from "@/components/sellOrKeep/StressTestTable";
import { 
  SellOrKeepInputs, 
  SellOrKeepAnalysis, 
  defaultInputs, 
  analyzeSellOrKeep,
  translations,
  Language 
} from "@/lib/sellOrKeepCalculations";
import { exportSellOrKeepPdf } from "@/lib/sellOrKeepPdfExport";

export default function VerkopenOfBehouden() {
  const [language, setLanguage] = useState<Language>('nl');
  const [inputs, setInputs] = useState<SellOrKeepInputs>(defaultInputs);
  const [analysis, setAnalysis] = useState<SellOrKeepAnalysis | null>(null);

  const t = translations[language];

  // Run analysis when inputs change
  useEffect(() => {
    const result = analyzeSellOrKeep(inputs);
    setAnalysis(result);
  }, [inputs]);

  const updateInput = <K extends keyof SellOrKeepInputs>(key: K, value: SellOrKeepInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleExportPdf = () => {
    if (analysis) {
      exportSellOrKeepPdf(analysis, language);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="w-7 h-7 text-primary" />
              {t.title}
            </h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={language === 'nl' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('nl')}
                className="h-8 px-3"
              >
                <Globe className="w-4 h-4 mr-1" />
                NL
              </Button>
              <Button
                variant={language === 'pt' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('pt')}
                className="h-8 px-3"
              >
                <Globe className="w-4 h-4 mr-1" />
                PT
              </Button>
            </div>
            {/* Export Button */}
            <Button onClick={handleExportPdf} disabled={!analysis}>
              <FileText className="w-4 h-4 mr-2" />
              {t.export}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Input Form - Left Side */}
          <div className="xl:col-span-1">
            <SellOrKeepForm 
              inputs={inputs} 
              updateInput={updateInput} 
              language={language} 
            />
          </div>

          {/* Results - Right Side */}
          <div className="xl:col-span-2 space-y-6">
            {analysis && (
              <Tabs defaultValue="scenarios" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="scenarios" className="flex items-center gap-1">
                    <Calculator className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {language === 'nl' ? 'Scenario\'s' : 'Cenários'}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {language === 'nl' ? 'Grafieken' : 'Gráficos'}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="stress" className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs px-1">!</Badge>
                    <span className="hidden sm:inline">
                      {language === 'nl' ? 'Stress-test' : 'Teste'}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="advice" className="flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {language === 'nl' ? 'Advies' : 'Conselho'}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="scenarios" className="mt-4">
                  <ScenarioResults
                    scenarioA={analysis.scenarioA}
                    scenarioB={analysis.scenarioB}
                    scenarioC={analysis.scenarioC}
                    bestForGoal={analysis.recommendation.bestForGoal}
                    language={language}
                  />
                </TabsContent>

                <TabsContent value="charts" className="mt-4">
                  <ScenarioCharts
                    yearlyProjections={analysis.yearlyProjections}
                    investmentHorizon={inputs.investmentHorizon}
                    language={language}
                  />
                </TabsContent>

                <TabsContent value="stress" className="mt-4">
                  <StressTestTable
                    stressTests={analysis.stressTests}
                    language={language}
                  />
                </TabsContent>

                <TabsContent value="advice" className="mt-4">
                  <DecisionAdvice analysis={analysis} language={language} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
