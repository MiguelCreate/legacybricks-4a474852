import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle, Scale, TrendingUp, Wallet, BarChart3, Info } from "lucide-react";
import { SellOrKeepAnalysis, translations, Language } from "@/lib/sellOrKeepCalculations";
import { cn } from "@/lib/utils";

interface DecisionAdviceProps {
  analysis: SellOrKeepAnalysis;
  language: Language;
}

export function DecisionAdvice({ analysis, language }: DecisionAdviceProps) {
  const t = translations[language];
  const { recommendation } = analysis;

  const scenarioIcons = {
    A: <TrendingUp className="w-5 h-5" />,
    B: <BarChart3 className="w-5 h-5" />,
    C: <Wallet className="w-5 h-5" />,
  };

  const scenarioColors = {
    A: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    B: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    C: 'bg-green-500/10 text-green-600 border-green-500/20',
  };

  const scenarioNames = {
    nl: {
      A: 'Verkopen + ETF Beleggen',
      B: 'Verkopen + Nieuw Vastgoed',
      C: 'Behouden als Huurwoning',
    },
    pt: {
      A: 'Vender + Investir em ETF',
      B: 'Vender + Novo Imóvel',
      C: 'Manter como Arrendamento',
    },
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          {t.advice.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best Choice */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t.advice.bestFor}:</span>
            <Badge className={cn('gap-1', scenarioColors[recommendation.bestForGoal])}>
              {scenarioIcons[recommendation.bestForGoal]}
              {scenarioNames[language][recommendation.bestForGoal]}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed">{recommendation.summary}</p>
        </div>

        {/* Trade-offs */}
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-muted-foreground" />
            {t.advice.tradeoffs}
          </h4>
          <ul className="space-y-1">
            {recommendation.tradeoffs.map((tradeoff, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                {tradeoff}
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        {recommendation.risks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              {t.advice.risks}
            </h4>
            <ul className="space-y-1">
              {recommendation.risks.map((risk, i) => (
                <li key={i} className="text-sm text-yellow-600 dark:text-yellow-500 flex items-start gap-2">
                  <span>⚠️</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <Alert className="bg-muted/50">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-xs">
            {t.advice.disclaimer}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
