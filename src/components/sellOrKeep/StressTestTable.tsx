import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { StressTestResult, Language } from "@/lib/sellOrKeepCalculations";
import { cn } from "@/lib/utils";

interface StressTestTableProps {
  stressTests: StressTestResult[];
  language: Language;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function getChangePercent(base: number, stressed: number): number {
  return ((stressed - base) / base) * 100;
}

function ChangeCell({ base, stressed }: { base: number; stressed: number }) {
  const change = getChangePercent(base, stressed);
  const isNegative = change < 0;
  
  return (
    <div className="space-y-1">
      <div className={cn("font-medium", isNegative ? "text-red-600" : "text-green-600")}>
        {formatCurrency(stressed)}
      </div>
      <div className={cn("text-xs", isNegative ? "text-red-500" : "text-green-500")}>
        {isNegative ? '' : '+'}{change.toFixed(1)}%
      </div>
    </div>
  );
}

export function StressTestTable({ stressTests, language }: StressTestTableProps) {
  const labels = {
    nl: {
      title: 'Stress-test Resultaten',
      subtitle: 'Wat gebeurt er als de omstandigheden veranderen?',
      scenario: 'Scenario',
      baseCase: 'Basis',
      rateIncrease: 'Rente +2%',
      vacancyIncrease: 'Leegstand +5%',
      zeroGrowth: 'Groei 0%',
    },
    pt: {
      title: 'Resultados do Teste de Stress',
      subtitle: 'O que acontece se as condições mudarem?',
      scenario: 'Cenário',
      baseCase: 'Base',
      rateIncrease: 'Taxa +2%',
      vacancyIncrease: 'Vacância +5%',
      zeroGrowth: 'Crescimento 0%',
    },
  };

  const t = labels[language];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          {t.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.scenario}</TableHead>
                <TableHead className="text-right">{t.baseCase}</TableHead>
                <TableHead className="text-right">{t.rateIncrease}</TableHead>
                <TableHead className="text-right">{t.vacancyIncrease}</TableHead>
                <TableHead className="text-right">{t.zeroGrowth}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stressTests.map((test, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    <Badge variant="outline" className="text-xs">
                      {test.scenario}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(test.baseCase)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ChangeCell base={test.baseCase} stressed={test.rateIncrease} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ChangeCell base={test.baseCase} stressed={test.vacancyIncrease} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ChangeCell base={test.baseCase} stressed={test.zeroGrowth} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
