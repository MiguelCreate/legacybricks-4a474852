import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet, BarChart3, Shield, Clock, Settings, Heart, CheckCircle2, XCircle } from "lucide-react";
import { ScenarioResult, translations, Language } from "@/lib/sellOrKeepCalculations";
import { cn } from "@/lib/utils";

interface ScenarioResultsProps {
  scenarioA: ScenarioResult;
  scenarioB: ScenarioResult;
  scenarioC: ScenarioResult;
  bestForGoal: 'A' | 'B' | 'C';
  language: Language;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function StabilityBadge({ level, language }: { level: 'high' | 'medium' | 'low'; language: Language }) {
  const labels = {
    nl: { high: 'Hoog', medium: 'Midden', low: 'Laag' },
    pt: { high: 'Alto', medium: 'Médio', low: 'Baixo' },
  };
  const colors = {
    high: 'bg-green-500/10 text-green-600 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    low: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  return (
    <Badge variant="outline" className={cn('text-xs', colors[level])}>
      {labels[language][level]}
    </Badge>
  );
}

function ScenarioCard({ 
  scenario, 
  id, 
  isBest, 
  language 
}: { 
  scenario: ScenarioResult; 
  id: 'A' | 'B' | 'C'; 
  isBest: boolean;
  language: Language;
}) {
  const t = translations[language];
  const colors = {
    A: 'border-blue-500/30 bg-blue-500/5',
    B: 'border-purple-500/30 bg-purple-500/5',
    C: 'border-green-500/30 bg-green-500/5',
  };
  const icons = {
    A: <TrendingUp className="w-5 h-5 text-blue-500" />,
    B: <BarChart3 className="w-5 h-5 text-purple-500" />,
    C: <Wallet className="w-5 h-5 text-green-500" />,
  };

  return (
    <Card className={cn('relative transition-all', colors[id], isBest && 'ring-2 ring-primary')}>
      {isBest && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground shadow-lg">
            {language === 'nl' ? '✨ Beste keuze' : '✨ Melhor escolha'}
          </Badge>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icons[id]}
            <CardTitle className="text-lg">{scenario.name}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Scenario {id}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{scenario.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              {t.results.monthlyIncome}
            </div>
            <div className={cn(
              "text-lg font-bold",
              scenario.monthlyIncome >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(scenario.monthlyIncome)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {t.results.finalNetWorth}
            </div>
            <div className="text-lg font-bold text-primary">
              {formatCurrency(scenario.finalNetWorth)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{t.results.totalCashflow}</div>
            <div className="text-sm font-medium">
              {formatCurrency(scenario.totalCashflowReceived)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{t.results.irr}</div>
            <div className="text-sm font-medium">
              {formatPercent(scenario.irr)}
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Shield className="w-3 h-3" />
              {t.results.stability}
            </span>
            <StabilityBadge level={scenario.cashflowStability} language={language} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              {t.results.predictability}
            </span>
            <StabilityBadge level={scenario.fiscalPredictability} language={language} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Settings className="w-3 h-3" />
              {t.results.complexity}
            </span>
            <StabilityBadge level={scenario.operationalComplexity} language={language} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Heart className="w-3 h-3" />
              {t.results.legacyYears}
            </span>
            <span className="font-medium">{scenario.legacyYears} {language === 'nl' ? 'jaar' : 'anos'}</span>
          </div>
        </div>

        {/* Pros & Cons */}
        <div className="border-t pt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {language === 'nl' ? 'Voordelen' : 'Vantagens'}
            </div>
            <ul className="space-y-1">
              {scenario.pros.slice(0, 3).map((pro, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {pro}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {language === 'nl' ? 'Nadelen' : 'Desvantagens'}
            </div>
            <ul className="space-y-1">
              {scenario.cons.slice(0, 3).map((con, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {con}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScenarioResults({ scenarioA, scenarioB, scenarioC, bestForGoal, language }: ScenarioResultsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <ScenarioCard scenario={scenarioA} id="A" isBest={bestForGoal === 'A'} language={language} />
      <ScenarioCard scenario={scenarioB} id="B" isBest={bestForGoal === 'B'} language={language} />
      <ScenarioCard scenario={scenarioC} id="C" isBest={bestForGoal === 'C'} language={language} />
    </div>
  );
}
