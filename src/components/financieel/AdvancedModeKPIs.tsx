import { useState } from "react";
import { FileDown, TrendingUp, Euro, Calendar, Target, ChevronDown, ChevronUp, Table2, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvestmentAnalysis, getRiskAssessment } from "@/lib/rendementsCalculations";
import { SensitivityAnalysis } from "@/components/analysator/SensitivityAnalysis";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Loan = Tables<"loans">;

interface AdvancedModeKPIsProps {
  analysis: InvestmentAnalysis;
  property: Property;
  loans: Loan[];
}

export const AdvancedModeKPIs = ({ analysis, property, loans }: AdvancedModeKPIsProps) => {
  const [showInputs, setShowInputs] = useState(false);
  const riskAssessment = getRiskAssessment(analysis);
  const primaryLoan = loans.find(l => l.property_id === property.id);

  const formatCurrency = (value: number) => `€${value.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const handleExportExcel = () => {
    // Generate CSV content
    let csv = "Jaar,Omzet,Kosten,NOI,Schuldendienst,Netto Cashflow,Cumulatief\n";
    analysis.yearlyCashflows.forEach(row => {
      csv += `${row.year},${row.grossRent},${row.opex},${row.noi},${row.debtService},${row.netCashflow},${row.cumulativeCashflow}\n`;
    });
    
    // Add exit analysis
    csv += "\nExit Analyse\n";
    csv += `Marktwaarde,${analysis.exitAnalysis.marketValue}\n`;
    csv += `Resterende schuld,${analysis.exitAnalysis.remainingDebt}\n`;
    csv += `Netto exit,${analysis.exitAnalysis.netExit}\n`;
    csv += `Totaal rendement,${analysis.exitAnalysis.totalReturn}\n`;
    
    // Add KPIs
    csv += "\nKPI's\n";
    csv += `BAR,${analysis.bar}%\n`;
    csv += `NAR,${analysis.nar}%\n`;
    csv += `Cash-on-Cash,${analysis.cashOnCash}%\n`;
    csv += `DSCR,${analysis.dscr}\n`;
    csv += `IRR,${analysis.irr}%\n`;
    csv += `Break-even bezetting,${analysis.breakEvenOccupancy}%\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${property.naam}_financieel_overzicht.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Quick KPI Strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "BAR", value: `${analysis.bar}%`, good: analysis.bar >= 8 },
          { label: "NAR", value: `${analysis.nar}%`, good: analysis.nar >= 6 },
          { label: "CoC", value: `${analysis.cashOnCash}%`, good: analysis.cashOnCash >= 8 },
          { label: "DSCR", value: `${analysis.dscr.toFixed(2)}x`, good: analysis.dscr >= 1.2 },
          { label: "IRR", value: `${analysis.irr}%`, good: analysis.irr >= 12 },
          { label: "BE%", value: `${analysis.breakEvenOccupancy}%`, good: analysis.breakEvenOccupancy <= 60 },
        ].map((kpi) => (
          <Card key={kpi.label} className={kpi.good ? "border-success/50" : "border-warning/50"}>
            <CardContent className="py-3 text-center">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={`text-lg font-bold ${kpi.good ? "text-success" : "text-warning"}`}>
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Assessment */}
      <Card className={`border-${riskAssessment.color}/50`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={riskAssessment.color === "success" ? "default" : riskAssessment.color === "warning" ? "warning" : "destructive"}>
                {riskAssessment.level === "good" ? "Laag risico" : riskAssessment.level === "moderate" ? "Gemiddeld risico" : "Hoog risico"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Gebaseerd op {riskAssessment.reasons.length} factoren
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
              <FileDown className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Input Summary */}
      <Collapsible open={showInputs} onOpenChange={setShowInputs}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Input Overzicht</CardTitle>
                {showInputs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Aankoopprijs</p>
                  <p className="font-medium">{formatCurrency(Number(property.aankoopprijs))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Totale investering</p>
                  <p className="font-medium">{formatCurrency(analysis.totalInvestment)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Eigen inleg</p>
                  <p className="font-medium">{formatCurrency(analysis.ownCapital)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lening</p>
                  <p className="font-medium">{formatCurrency(analysis.loanAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Maandelijkse huur</p>
                  <p className="font-medium">{formatCurrency(Number(property.maandelijkse_huur) || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rente</p>
                  <p className="font-medium">{primaryLoan?.rente_percentage || 0}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Looptijd</p>
                  <p className="font-medium">{primaryLoan?.looptijd_jaren || 30} jaar</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type verhuur</p>
                  <p className="font-medium capitalize">{property.type_verhuur || "Langdurig"}</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Main Tabs */}
      <Tabs defaultValue="cashflow" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cashflow" className="gap-2">
            <Table2 className="w-4 h-4" />
            Cashflow Tabel
          </TabsTrigger>
          <TabsTrigger value="exit" className="gap-2">
            <Target className="w-4 h-4" />
            Exit Analyse
          </TabsTrigger>
          <TabsTrigger value="sensitivity" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Sensitivity
          </TabsTrigger>
        </TabsList>

        {/* 10-Year Cashflow Table */}
        <TabsContent value="cashflow" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {analysis.yearlyCashflows.length}-Jarige Cashflow Projectie
              </CardTitle>
              <CardDescription>
                Jaarlijkse inkomsten, kosten en netto cashflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Jaar</TableHead>
                      <TableHead className="text-right">Omzet</TableHead>
                      <TableHead className="text-right">Kosten</TableHead>
                      <TableHead className="text-right">NOI</TableHead>
                      <TableHead className="text-right">Schuld</TableHead>
                      <TableHead className="text-right">Netto</TableHead>
                      <TableHead className="text-right">Cumulatief</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.yearlyCashflows.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell className="font-medium">{row.year}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.grossRent)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(row.opex)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.noi)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(row.debtService)}</TableCell>
                        <TableCell className={`text-right font-medium ${row.netCashflow >= 0 ? "text-success" : "text-destructive"}`}>
                          {formatCurrency(row.netCashflow)}
                        </TableCell>
                        <TableCell className={`text-right ${row.cumulativeCashflow >= 0 ? "text-success" : "text-destructive"}`}>
                          {formatCurrency(row.cumulativeCashflow)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exit Analysis */}
        <TabsContent value="exit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Exit Analyse (Jaar {analysis.yearlyCashflows.length})
              </CardTitle>
              <CardDescription>
                Geschatte waarde en opbrengst bij verkoop
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Geschatte marktwaarde</span>
                    <span className="text-xl font-bold">{formatCurrency(analysis.exitAnalysis.marketValue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Resterende schuld</span>
                    <span className="text-lg font-medium text-destructive">-{formatCurrency(analysis.exitAnalysis.remainingDebt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Netto exit opbrengst</span>
                    <span className="text-xl font-bold text-success">{formatCurrency(analysis.exitAnalysis.netExit)}</span>
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Totale Return (incl. cashflow)</p>
                    <p className="text-4xl font-bold text-success">{formatCurrency(analysis.exitAnalysis.totalReturn)}</p>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">IRR over {analysis.yearlyCashflows.length} jaar</p>
                      <p className="text-2xl font-bold">{analysis.irr}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sensitivity Analysis */}
        <TabsContent value="sensitivity" className="mt-4">
          <SensitivityAnalysis 
            baseInputs={{
              purchasePrice: Number(property.aankoopprijs),
              imt: Number(property.imt_betaald) || 0,
              notaryFees: Number(property.notaris_kosten) || 0,
              renovationCosts: Number(property.renovatie_kosten) || 0,
              furnishingCosts: Number(property.inrichting_kosten) || 0,
              ltv: analysis.loanAmount > 0 ? (analysis.loanAmount / Number(property.aankoopprijs)) * 100 : 75,
              interestRate: primaryLoan?.rente_percentage ? Number(primaryLoan.rente_percentage) : 3.5,
              loanTermYears: primaryLoan?.looptijd_jaren || 30,
              monthlyRentLT: Number(property.maandelijkse_huur) || 0,
              stOccupancy: Number(property.st_bezetting_percentage) || 70,
              stADR: Number(property.st_gemiddelde_dagprijs) || 0,
              rentalType: "longterm" as const,
              managementPercent: Number(property.beheerkosten_percentage) || 0,
              maintenanceYearly: Number(property.onderhoud_jaarlijks) || 0,
              imiYearly: Number(property.aankoopprijs) * Number(property.imi_percentage || 0.003),
              insuranceYearly: Number(property.verzekering_jaarlijks) || 0,
              condoMonthly: Number(property.condominium_maandelijks) || 0,
              utilitiesMonthly: 0,
              rentGrowth: Number(property.huurgroei_percentage) || 2,
              costGrowth: Number(property.kostenstijging_percentage) || 2,
              valueGrowth: Number(property.waardegroei_percentage) || 3,
              years: 10,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
