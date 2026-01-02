import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  TrendingUp, 
  PiggyBank, 
  Building2, 
  Percent, 
  Users,
  Leaf,
  Wrench,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { MultiUnitAnalysis, multiUnitMetricExplanations, getMetricStatus } from "@/lib/multiUnitCalculations";

interface MultiUnitBeginnerViewProps {
  analysis: MultiUnitAnalysis;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  status: "good" | "warning" | "danger";
  explanation: {
    wat: string;
    waarom: string;
    goed: string;
    matig: string;
    slecht: string;
  };
  icon: React.ElementType;
  suffix?: string;
}

const MetricCard = ({ title, value, status, explanation, icon: Icon, suffix = "" }: MetricCardProps) => {
  const statusConfig = {
    good: { 
      icon: CheckCircle2, 
      color: "text-success", 
      bg: "bg-success/10", 
      border: "border-success/20",
      label: "Goed"
    },
    warning: { 
      icon: AlertTriangle, 
      color: "text-warning", 
      bg: "bg-warning/10", 
      border: "border-warning/20",
      label: "Matig"
    },
    danger: { 
      icon: XCircle, 
      color: "text-destructive", 
      bg: "bg-destructive/10", 
      border: "border-destructive/20",
      label: "Let op"
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={`${config.bg} ${config.border} border`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-background">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Badge variant="outline" className={`${config.color} ${config.bg}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Jouw waarde */}
        <div className="text-center py-3 bg-background rounded-lg">
          <p className="text-3xl font-bold text-foreground">
            {typeof value === "number" ? value.toFixed(1) : value}{suffix}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Jouw waarde</p>
        </div>

        {/* Uitleg */}
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Wat is dit?
            </p>
            <p className="text-muted-foreground mt-1">{explanation.wat}</p>
          </div>
          
          <div>
            <p className="font-medium text-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Waarom belangrijk?
            </p>
            <p className="text-muted-foreground mt-1">{explanation.waarom}</p>
          </div>

          <div className="pt-2 border-t">
            <p className="font-medium text-foreground mb-2">Is dit goed?</p>
            <div className="space-y-1 text-xs">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-success" />
                <span>{explanation.goed}</span>
              </p>
              <p className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-warning" />
                <span>{explanation.matig}</span>
              </p>
              <p className="flex items-center gap-2">
                <XCircle className="h-3 w-3 text-destructive" />
                <span>{explanation.slecht}</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MultiUnitBeginnerView = ({ analysis }: MultiUnitBeginnerViewProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

  // Determine overall health
  const healthyUnits = analysis.units.filter(u => u.pureCashflow > 0).length;
  const totalUnits = analysis.units.length;
  const overallStatus = analysis.totaalPureCashflow > 0 && analysis.gemiddeldDSCR >= 1.2 ? "good" 
    : analysis.totaalPureCashflow >= 0 ? "warning" : "danger";

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Jouw Multi-Unit Analyse Resultaten
          </CardTitle>
          <CardDescription>
            Hieronder vind je een stapsgewijze uitleg van elk kengetal. Elk onderdeel legt uit wat het betekent, 
            waarom het belangrijk is, en of jouw waarde goed, matig of slecht is.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Samenvatting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-foreground">{totalUnits}</p>
              <p className="text-sm text-muted-foreground">Units totaal</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-success">{healthyUnits}</p>
              <p className="text-sm text-muted-foreground">Winstgevende units</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(analysis.totaalPureCashflow)}</p>
              <p className="text-sm text-muted-foreground">Totale jaarlijkse cashflow</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-foreground">{analysis.gemiddeldCashOnCash.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Gemiddeld rendement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Totale Bruto Huur"
          value={formatCurrency(analysis.totaalBrutoHuur)}
          status={analysis.totaalBrutoHuur > 0 ? "good" : "danger"}
          explanation={multiUnitMetricExplanations.brutoHuur}
          icon={PiggyBank}
        />

        <MetricCard
          title="Netto Huurinkomsten (NOI)"
          value={formatCurrency(analysis.totaalNOI)}
          status={analysis.totaalNOI / analysis.totaalBrutoHuur >= 0.7 ? "good" : 
                  analysis.totaalNOI / analysis.totaalBrutoHuur >= 0.5 ? "warning" : "danger"}
          explanation={multiUnitMetricExplanations.noi}
          icon={TrendingUp}
        />

        <MetricCard
          title="Pure Cash Flow"
          value={formatCurrency(analysis.totaalPureCashflow)}
          status={analysis.totaalPureCashflow > 0 ? "good" : 
                  analysis.totaalPureCashflow >= 0 ? "warning" : "danger"}
          explanation={multiUnitMetricExplanations.pureCashflow}
          icon={BarChart3}
        />

        <MetricCard
          title="Cash-on-Cash Return"
          value={analysis.gemiddeldCashOnCash}
          status={getMetricStatus("cashOnCash", analysis.gemiddeldCashOnCash)}
          explanation={multiUnitMetricExplanations.cashOnCash}
          icon={Percent}
          suffix="%"
        />

        <MetricCard
          title="Cap Rate"
          value={analysis.capRate}
          status={getMetricStatus("capRate", analysis.capRate)}
          explanation={multiUnitMetricExplanations.capRate}
          icon={TrendingUp}
          suffix="%"
        />

        <MetricCard
          title="DSCR"
          value={analysis.gemiddeldDSCR}
          status={getMetricStatus("dscr", analysis.gemiddeldDSCR)}
          explanation={multiUnitMetricExplanations.dscr}
          icon={Building2}
          suffix="x"
        />

        <MetricCard
          title="OPEX-ratio"
          value={analysis.gemiddeldOpexRatio}
          status={getMetricStatus("opexRatio", analysis.gemiddeldOpexRatio)}
          explanation={multiUnitMetricExplanations.opexRatio}
          icon={Percent}
          suffix="%"
        />

        <MetricCard
          title="Bezettingsgraad"
          value={analysis.gemiddeldBezettingsgraad}
          status={getMetricStatus("bezettingsgraad", analysis.gemiddeldBezettingsgraad)}
          explanation={multiUnitMetricExplanations.bezettingsgraad}
          icon={Users}
          suffix="%"
        />

        <MetricCard
          title="Huurderretentie"
          value={analysis.gemiddeldHuurderretentie}
          status={getMetricStatus("huurderretentie", analysis.gemiddeldHuurderretentie)}
          explanation={multiUnitMetricExplanations.huurderretentie}
          icon={Users}
          suffix=" mnd"
        />

        <MetricCard
          title="Break-even bezetting"
          value={analysis.breakEvenBezetting}
          status={getMetricStatus("breakEvenBezetting", analysis.breakEvenBezetting)}
          explanation={multiUnitMetricExplanations.breakEvenBezetting}
          icon={BarChart3}
          suffix="%"
        />
      </div>

      {/* Portfolio Diversity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Portefeuille Diversiteit
          </CardTitle>
          <CardDescription>
            {multiUnitMetricExplanations.portfolioDiversiteit.wat}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {analysis.portfolioDiversiteit.map((item) => (
              <Badge key={item.type} variant="secondary" className="px-4 py-2 text-sm">
                {item.type === "langdurig" ? "🏠 Langdurig" : 
                 item.type === "toerisme" ? "✈️ Toerisme" : "🎓 Student"}: {item.count} ({item.percentage.toFixed(0)}%)
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {analysis.portfolioDiversiteit.length === 1 
              ? "⚠️ Je hebt alleen één type huurder. Overweeg diversificatie voor minder risico."
              : "✅ Je hebt een mix van huurdertypen, wat zorgt voor spreiding van risico."}
          </p>
        </CardContent>
      </Card>

      {/* Per Unit Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Per Unit Overzicht
          </CardTitle>
          <CardDescription>
            Bekijk de prestaties van elke individuele unit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.units.map((unit) => {
              const unitStatus = unit.pureCashflow > 0 ? "good" : unit.pureCashflow >= 0 ? "warning" : "danger";
              const statusConfig = {
                good: { color: "text-success", bg: "bg-success/10", label: "Winstgevend" },
                warning: { color: "text-warning", bg: "bg-warning/10", label: "Break-even" },
                danger: { color: "text-destructive", bg: "bg-destructive/10", label: "Verliesgevend" },
              };
              const config = statusConfig[unitStatus];

              return (
                <div key={unit.id} className={`p-4 rounded-lg border ${config.bg}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{unit.naam || "Naamloze unit"}</span>
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                      <Badge variant="outline">
                        {unit.energielabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Huur: {formatCurrency(unit.brutoHuur)}/jaar</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className={unit.pureCashflow >= 0 ? "text-success" : "text-destructive"}>
                        Cashflow: {formatCurrency(unit.pureCashflow)}/jaar
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Volgende Stappen</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {analysis.totaalPureCashflow < 0 && (
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-destructive mt-0.5" />
                <span>Je totale cashflow is negatief. Overweeg huurverhoging of kostenverlaging.</span>
              </li>
            )}
            {analysis.gemiddeldDSCR < 1.2 && (
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-warning mt-0.5" />
                <span>Je DSCR is laag. Dit kan problemen geven bij herfinanciering.</span>
              </li>
            )}
            {analysis.geschatteRenovatiekosten3Jaar > 5000 && (
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-warning mt-0.5" />
                <span>Geschatte renovatiekosten komende 3 jaar: {formatCurrency(analysis.geschatteRenovatiekosten3Jaar)}. Reserveer hiervoor.</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
              <span>Schakel naar Gevorderdenmodus voor gedetailleerde tabellen en export mogelijkheden.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
