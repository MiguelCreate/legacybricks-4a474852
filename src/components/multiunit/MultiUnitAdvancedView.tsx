import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TrendingUp, 
  PiggyBank, 
  Building2, 
  Percent, 
  Users,
  FileDown,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { MultiUnitAnalysis, getMetricStatus } from "@/lib/multiUnitCalculations";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

interface MultiUnitAdvancedViewProps {
  analysis: MultiUnitAnalysis;
  pandNaam: string;
  onExport?: () => void;
}

export const MultiUnitAdvancedView = ({ analysis, pandNaam, onExport }: MultiUnitAdvancedViewProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

  const getStatusBadge = (status: "good" | "warning" | "danger") => {
    const config = {
      good: { icon: CheckCircle2, color: "bg-success/10 text-success border-success/20" },
      warning: { icon: AlertTriangle, color: "bg-warning/10 text-warning border-warning/20" },
      danger: { icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20" },
    };
    const StatusIcon = config[status].icon;
    return (
      <Badge variant="outline" className={config[status].color}>
        <StatusIcon className="h-3 w-3" />
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Dashboard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              KPI Dashboard
            </CardTitle>
            <CardDescription>Overzicht van alle kerncijfers</CardDescription>
          </div>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
              <FileDown className="h-4 w-4" />
              Exporteer PDF
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Totale Investering</p>
                <InfoTooltip title="Totale Investering" content="Aankoopprijs + IMT + notariskosten + renovatie" />
              </div>
              <p className="text-2xl font-bold mt-1">{formatCurrency(analysis.totaleInvestering)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Eigen Inleg</p>
                <InfoTooltip title="Eigen Inleg" content="Het bedrag dat je zelf hebt ingelegd" />
              </div>
              <p className="text-2xl font-bold mt-1">{formatCurrency(analysis.eigenInleg)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Jaarlijkse Cashflow</p>
                <InfoTooltip title="Jaarlijkse Cashflow" content="Pure cashflow na alle kosten en hypotheek" />
              </div>
              <p className={`text-2xl font-bold mt-1 ${analysis.jaarlijkseCashflow >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(analysis.jaarlijkseCashflow)}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">IRR (10 jaar)</p>
                <InfoTooltip title="IRR" content="Internal Rate of Return over 10 jaar incl. verkoop" />
              </div>
              <p className="text-2xl font-bold mt-1">{analysis.irr10Jaar.toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mt-4">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Cap Rate</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <p className="text-lg font-semibold">{analysis.capRate.toFixed(2)}%</p>
                {getStatusBadge(getMetricStatus("capRate", analysis.capRate))}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Gem. DSCR</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <p className="text-lg font-semibold">{analysis.gemiddeldDSCR.toFixed(2)}</p>
                {getStatusBadge(getMetricStatus("dscr", analysis.gemiddeldDSCR))}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Gem. CoC</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <p className="text-lg font-semibold">{analysis.gemiddeldCashOnCash.toFixed(1)}%</p>
                {getStatusBadge(getMetricStatus("cashOnCash", analysis.gemiddeldCashOnCash))}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Gem. OPEX</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <p className="text-lg font-semibold">{analysis.gemiddeldOpexRatio.toFixed(1)}%</p>
                {getStatusBadge(getMetricStatus("opexRatio", analysis.gemiddeldOpexRatio))}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Gem. Bezetting</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <p className="text-lg font-semibold">{analysis.gemiddeldBezettingsgraad.toFixed(0)}%</p>
                {getStatusBadge(getMetricStatus("bezettingsgraad", analysis.gemiddeldBezettingsgraad))}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Retentie</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <p className="text-lg font-semibold">{analysis.gemiddeldHuurderretentie.toFixed(0)} mnd</p>
                {getStatusBadge(getMetricStatus("huurderretentie", analysis.gemiddeldHuurderretentie))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Units Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Analyse per Unit
          </CardTitle>
          <CardDescription>Gedetailleerde metrics per unit</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Unit</TableHead>
                <TableHead className="text-right">m²</TableHead>
                <TableHead className="text-right">Maandhuur</TableHead>
                <TableHead className="text-right">NOI</TableHead>
                <TableHead className="text-right">Cashflow</TableHead>
                <TableHead className="text-right">CoC %</TableHead>
                <TableHead className="text-right">€/m²</TableHead>
                <TableHead className="text-right">OPEX %</TableHead>
                <TableHead className="text-right">Bezetting</TableHead>
                <TableHead className="text-right">DSCR</TableHead>
                <TableHead className="text-center">Label</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {unit.naam || "—"}
                      <Badge variant="outline" className="text-xs">
                        {unit.huurdertype === "langdurig" ? "🏠" : unit.huurdertype === "toerisme" ? "✈️" : "🎓"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{unit.oppervlakte_m2}</TableCell>
                  <TableCell className="text-right">{formatCurrency(unit.brutoHuur / 12)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(unit.noi)}</TableCell>
                  <TableCell className={`text-right ${unit.pureCashflow >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(unit.pureCashflow)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {unit.cashOnCash.toFixed(1)}%
                      {getStatusBadge(getMetricStatus("cashOnCash", unit.cashOnCash))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">€{unit.rendementPerM2.toFixed(0)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {unit.opexRatio.toFixed(0)}%
                      {getStatusBadge(getMetricStatus("opexRatio", unit.opexRatio))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{unit.bezettingsgraad}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {unit.dscr.toFixed(2)}
                      {getStatusBadge(getMetricStatus("dscr", unit.dscr))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={
                      unit.energielabel === "A" || unit.energielabel === "B" ? "default" :
                      unit.energielabel === "C" || unit.energielabel === "D" ? "secondary" : "destructive"
                    }>
                      {unit.energielabel}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Totaal</TableCell>
                <TableCell className="text-right">
                  {analysis.units.reduce((sum, u) => sum + u.oppervlakte_m2, 0)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(analysis.totaalBrutoHuur / 12)}</TableCell>
                <TableCell className="text-right">{formatCurrency(analysis.totaalNOI)}</TableCell>
                <TableCell className={`text-right ${analysis.totaalPureCashflow >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(analysis.totaalPureCashflow)}
                </TableCell>
                <TableCell className="text-right">{analysis.gemiddeldCashOnCash.toFixed(1)}%</TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right">{analysis.gemiddeldOpexRatio.toFixed(0)}%</TableCell>
                <TableCell className="text-right">{analysis.gemiddeldBezettingsgraad.toFixed(0)}%</TableCell>
                <TableCell className="text-right">{analysis.gemiddeldDSCR.toFixed(2)}</TableCell>
                <TableCell className="text-center">—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Risk & Outlook */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio Diversity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Portefeuille Diversiteit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.portfolioDiversiteit.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <span className="capitalize">
                    {item.type === "langdurig" ? "🏠 Langdurig" : 
                     item.type === "toerisme" ? "✈️ Toerisme" : "🎓 Student"}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
              {analysis.portfolioDiversiteit.length >= 2 
                ? "✅ Goede spreiding over verschillende huurdertypen" 
                : "⚠️ Overweeg diversificatie voor risicospreiding"}
            </p>
          </CardContent>
        </Card>

        {/* Financial Outlook */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Financieel Overzicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Break-even bezetting</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{analysis.breakEvenBezetting.toFixed(1)}%</span>
                  {getStatusBadge(getMetricStatus("breakEvenBezetting", analysis.breakEvenBezetting))}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Geschatte renovatie (3 jaar)</span>
                <span className="font-semibold">{formatCurrency(analysis.geschatteRenovatiekosten3Jaar)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Cashflow na belasting</span>
                <span className={`font-semibold ${analysis.totaalCashflowNaBelasting >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(analysis.totaalCashflowNaBelasting)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">IRR (10 jaar projectie)</span>
                <span className="font-bold text-primary">{analysis.irr10Jaar.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
