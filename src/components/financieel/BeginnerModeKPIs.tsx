import { CheckCircle2, AlertTriangle, XCircle, Lightbulb, Info, TrendingUp, Shield, PiggyBank, Target, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InvestmentAnalysis } from "@/lib/rendementsCalculations";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;

interface BeginnerModeKPIsProps {
  analysis: InvestmentAnalysis;
  property: Property;
}

interface MetricCard {
  id: string;
  title: string;
  value: number;
  unit: string;
  explanation: string;
  interpretation: { status: "good" | "moderate" | "risk"; message: string };
  advice: string;
  icon: React.ElementType;
}

const getInterpretation = (
  metric: string,
  value: number
): { status: "good" | "moderate" | "risk"; message: string } => {
  switch (metric) {
    case "bar":
      if (value >= 8) return { status: "good", message: ">8% is sterk voor Portugal." };
      if (value >= 5) return { status: "moderate", message: "5–8% is redelijk, maar controleer de kosten." };
      return { status: "risk", message: "<5% is laag — overweeg renovatie of verkoop." };
    
    case "nar":
      if (value >= 6) return { status: "good", message: ">6% netto is uitstekend." };
      if (value >= 4) return { status: "moderate", message: "4–6% is acceptabel." };
      return { status: "risk", message: "<4% netto vraagt om actie." };
    
    case "cashOnCash":
      if (value >= 8) return { status: "good", message: ">8% op eigen geld is sterk." };
      if (value >= 4) return { status: "moderate", message: "4–8% is redelijk rendement." };
      return { status: "risk", message: "<4% — weinig rendement op je inleg." };
    
    case "dscr":
      if (value >= 1.2) return { status: "good", message: "DSCR >1.2 geeft voldoende buffer." };
      if (value >= 1.0) return { status: "moderate", message: "DSCR 1.0–1.2 is krap maar haalbaar." };
      return { status: "risk", message: "DSCR <1.0 betekent negatieve cashflow!" };
    
    case "breakEvenOccupancy":
      if (value <= 60) return { status: "good", message: "<60% break-even is veilig." };
      if (value <= 80) return { status: "moderate", message: "60–80% is acceptabel risico." };
      return { status: "risk", message: ">80% — weinig marge bij leegstand." };
    
    case "irr":
      if (value >= 12) return { status: "good", message: "IRR >12% is uitstekend." };
      if (value >= 8) return { status: "moderate", message: "IRR 8–12% is redelijk." };
      return { status: "risk", message: "IRR <8% — overweeg alternatieven." };
    
    default:
      return { status: "moderate", message: "Geen interpretatie beschikbaar." };
  }
};

const getAdvice = (metric: string, value: number): string => {
  switch (metric) {
    case "bar":
      if (value >= 8) return "Dit pand genereert sterke bruto-inkomsten. Veilig om te behouden.";
      if (value >= 5) return "Overweeg huurverhoging of kostenreductie om rendement te verbeteren.";
      return "Onderzoek mogelijkheden voor hogere huur of overweeg verkoop.";
    
    case "nar":
      if (value >= 6) return "Je netto rendement is gezond. Focus op behoud van deze kosten.";
      if (value >= 4) return "Bekijk je operationele kosten — zijn er besparingen mogelijk?";
      return "Je kosten zijn te hoog. Analyseer elke kostenpost kritisch.";
    
    case "cashOnCash":
      if (value >= 8) return "Uitstekend rendement op je eigen geld. Overweeg dit model te herhalen.";
      if (value >= 4) return "Bekijk of herfinanciering met meer leverage zinvol is.";
      return "Je eigen geld werkt niet hard genoeg. Onderzoek alternatieve investeringen.";
    
    case "dscr":
      if (value >= 1.2) return "Voldoende buffer om schommelingen op te vangen. Goed beheerd!";
      if (value >= 1.0) return "Krappe marge. Bouw een reservefonds op voor onverwachte kosten.";
      return "Urgente actie nodig! Verhoog huur of verlaag kosten.";
    
    case "breakEvenOccupancy":
      if (value <= 60) return "Veel ruimte voor leegstand zonder financiële problemen.";
      if (value <= 80) return "Acceptabel, maar zorg voor goede marketing bij korte verhuur.";
      return "Hoog risico bij leegstand. Overweeg langdurige verhuur.";
    
    case "irr":
      if (value >= 12) return "Top-investering! Dit pand presteert uitstekend over de looptijd.";
      if (value >= 8) return "Solide investering. Overweeg waardeverhoging door renovatie.";
      return "Ondergemiddeld rendement. Vergelijk met andere beleggingen.";
    
    default:
      return "Geen specifiek advies beschikbaar.";
  }
};

export const BeginnerModeKPIs = ({ analysis, property }: BeginnerModeKPIsProps) => {
  const metrics: MetricCard[] = [
    {
      id: "bar",
      title: "Bruto Aanvangsrendement (BAR)",
      value: analysis.bar,
      unit: "%",
      explanation: "Hoeveel procent huur je per jaar ontvangt ten opzichte van de aankoopprijs. Dit is de eerste snelle check of een pand interessant is.",
      interpretation: getInterpretation("bar", analysis.bar),
      advice: getAdvice("bar", analysis.bar),
      icon: Percent,
    },
    {
      id: "nar",
      title: "Netto Aanvangsrendement (NAR)",
      value: analysis.nar,
      unit: "%",
      explanation: "Je werkelijke rendement na aftrek van alle kosten zoals onderhoud, belastingen en verzekering. Dit is realistischer dan BAR.",
      interpretation: getInterpretation("nar", analysis.nar),
      advice: getAdvice("nar", analysis.nar),
      icon: TrendingUp,
    },
    {
      id: "cashOnCash",
      title: "Cash-on-Cash Return",
      value: analysis.cashOnCash,
      unit: "%",
      explanation: "Hoeveel rendement je maakt op het geld dat je zelf hebt ingelegd. Hoe hoger, hoe efficiënter je eigen geld werkt.",
      interpretation: getInterpretation("cashOnCash", analysis.cashOnCash),
      advice: getAdvice("cashOnCash", analysis.cashOnCash),
      icon: PiggyBank,
    },
    {
      id: "dscr",
      title: "Debt Service Coverage Ratio (DSCR)",
      value: analysis.dscr,
      unit: "x",
      explanation: "Hoeveel keer je huurinkomsten (na kosten) je hypotheeklasten kunnen dekken. Een DSCR van 1.5 betekent dat je 50% buffer hebt.",
      interpretation: getInterpretation("dscr", analysis.dscr),
      advice: getAdvice("dscr", analysis.dscr),
      icon: Shield,
    },
    {
      id: "breakEvenOccupancy",
      title: "Break-even Bezetting",
      value: analysis.breakEvenOccupancy,
      unit: "%",
      explanation: "De minimale bezettingsgraad die je nodig hebt om alle kosten en hypotheek te dekken. Relevant voor korte termijn verhuur.",
      interpretation: getInterpretation("breakEvenOccupancy", analysis.breakEvenOccupancy),
      advice: getAdvice("breakEvenOccupancy", analysis.breakEvenOccupancy),
      icon: Target,
    },
    {
      id: "irr",
      title: "IRR (Internal Rate of Return)",
      value: analysis.irr,
      unit: "%",
      explanation: "Je gemiddelde jaarlijkse rendement over de hele periode, inclusief verkoop aan het einde. De ultieme maat voor rendabiliteit.",
      interpretation: getInterpretation("irr", analysis.irr),
      advice: getAdvice("irr", analysis.irr),
      icon: TrendingUp,
    },
  ];

  const getStatusIcon = (status: "good" | "moderate" | "risk") => {
    switch (status) {
      case "good":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "moderate":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "risk":
        return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getStatusColor = (status: "good" | "moderate" | "risk") => {
    switch (status) {
      case "good": return "bg-success/10 border-success/30";
      case "moderate": return "bg-warning/10 border-warning/30";
      case "risk": return "bg-destructive/10 border-destructive/30";
    }
  };

  const getStatusBadge = (status: "good" | "moderate" | "risk") => {
    switch (status) {
      case "good": return <Badge variant="default" className="bg-success">Goed</Badge>;
      case "moderate": return <Badge variant="warning">Matig</Badge>;
      case "risk": return <Badge variant="destructive">Risico</Badge>;
    }
  };

  // Overall score
  const goodCount = metrics.filter(m => m.interpretation.status === "good").length;
  const overallScore = Math.round((goodCount / metrics.length) * 100);

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card className={`${overallScore >= 70 ? "border-success/30" : overallScore >= 40 ? "border-warning/30" : "border-destructive/30"}`}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Totaalscore: {property.naam}</h3>
              <p className="text-sm text-muted-foreground">
                {goodCount} van {metrics.length} kengetallen scoren goed
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {overallScore}%
              </div>
              <Badge variant={overallScore >= 70 ? "default" : overallScore >= 40 ? "warning" : "destructive"}>
                {overallScore >= 70 ? "Sterk pand" : overallScore >= 40 ? "Aandacht nodig" : "Actie vereist"}
              </Badge>
            </div>
          </div>
          <Progress value={overallScore} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <Card key={metric.id} className={`${getStatusColor(metric.interpretation.status)} border`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base font-medium">{metric.title}</CardTitle>
                </div>
                {getStatusBadge(metric.interpretation.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* What is this? */}
              <div className="bg-background/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Info className="w-3 h-3" />
                  Wat is dit?
                </div>
                <p className="text-sm">{metric.explanation}</p>
              </div>

              {/* Your value */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Jouw waarde:</span>
                <span className="text-2xl font-bold">
                  {metric.value.toFixed(metric.id === "dscr" ? 2 : 1)}{metric.unit}
                </span>
              </div>

              {/* Interpretation */}
              <div className="flex items-start gap-2">
                {getStatusIcon(metric.interpretation.status)}
                <p className="text-sm">{metric.interpretation.message}</p>
              </div>

              {/* Advice */}
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                <div className="flex items-center gap-2 text-xs text-primary mb-1">
                  <Lightbulb className="w-3 h-3" />
                  Advies
                </div>
                <p className="text-sm">{metric.advice}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
