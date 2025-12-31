import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { ExitAnalysis } from "@/lib/rendementsCalculations";
import { DoorOpen, TrendingUp, Building2, Wallet } from "lucide-react";

interface ExitAnalysisCardProps {
  exitAnalysis: ExitAnalysis;
  years: number;
  ownCapital: number;
}

export function ExitAnalysisCard({ exitAnalysis, years, ownCapital }: ExitAnalysisCardProps) {
  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const totalROI = ownCapital > 0 
    ? Math.round((exitAnalysis.totalReturn / ownCapital) * 100) 
    : 0;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DoorOpen className="h-4 w-4 text-primary" />
          Exit Analyse (Jaar {years})
          <InfoTooltip 
            content="Dit is wat je overhoudt als je het pand verkoopt na de gekozen periode, rekening houdend met waardegroei en resterende hypotheekschuld."
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="bg-accent/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Geschatte Waarde</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(exitAnalysis.marketValue)}
            </p>
          </div>
          
          <div className="bg-red-50/50 dark:bg-red-950/20 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Wallet className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Resterende Schuld</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              -{formatCurrency(exitAnalysis.remainingDebt)}
            </p>
          </div>
          
          <div className="bg-green-50/50 dark:bg-green-950/20 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DoorOpen className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Netto Exit</span>
              <InfoTooltip 
                content="Dit is wat je overhoudt na verkoop en aflossing van de hypotheek. Dit is je echte winst bij verkoop."
              />
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(exitAnalysis.netExit)}
            </p>
          </div>
          
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Totaal Rendement</span>
              <InfoTooltip 
                content="Cumulatieve cashflow + netto exit opbrengst. Dit is je totale winst over de hele periode."
              />
            </div>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(exitAnalysis.totalReturn)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalROI}% ROI op eigen inleg
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
