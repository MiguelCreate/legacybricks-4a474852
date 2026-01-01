import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  MapPin, 
  Euro, 
  TrendingUp, 
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Heart,
  Palmtree,
  Sparkles,
  Info,
  Building2,
  ArrowRight,
  Wallet
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";

interface Property {
  id: string;
  naam: string;
  locatie: string;
  aankoopprijs: number;
  maandelijkse_huur: number | null;
  waardering: number | null;
}

interface Loan {
  property_id: string;
  maandlast: number;
}

interface PortfolioSummary {
  totalProperties: number;
  locations: { city: string; country: string; count: number }[];
  totalMonthlyRent: number;
  totalMonthlyExpenses: number;
  netMonthlyCashflow: number;
  totalValue: number;
  totalEquity: number;
  safetyStatus: 'green' | 'orange' | 'red';
  safetyMessage: string;
  futureProjections: { year: number; value: number; label?: string }[];
}

const InfoBadge = ({ content }: { content: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1 hover:bg-primary/10">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export function SimplePartnerDashboard() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchPortfolioData();
  }, [user]);

  const fetchPortfolioData = async () => {
    if (!user) return;

    try {
      // Fetch properties
      const { data: properties } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "te_koop")
        .is("gearchiveerd", false);

      // Fetch loans
      const { data: loans } = await supabase
        .from("loans")
        .select("property_id, maandlast");

      // Fetch expenses
      const { data: expenses } = await supabase
        .from("recurring_expenses")
        .select("property_id, bedrag, frequentie");

      if (!properties) {
        setLoading(false);
        return;
      }

      // Calculate locations
      const locationMap = new Map<string, { city: string; country: string; count: number }>();
      properties.forEach((p) => {
        const parts = p.locatie.split(",").map((s: string) => s.trim());
        const city = parts[0] || p.locatie;
        const country = parts[1] || "Portugal";
        const key = `${city}-${country}`;
        if (!locationMap.has(key)) {
          locationMap.set(key, { city, country, count: 0 });
        }
        locationMap.get(key)!.count++;
      });

      // Calculate totals
      const totalMonthlyRent = properties.reduce((sum, p) => sum + (p.maandelijkse_huur || 0), 0);
      const totalValue = properties.reduce((sum, p) => sum + (p.waardering || p.aankoopprijs), 0);
      
      // Calculate monthly expenses from loans
      const loanExpenses = (loans || []).reduce((sum, l) => sum + (l.maandlast || 0), 0);
      
      // Add VvE and other recurring expenses (convert to monthly)
      const vveExpenses = properties.reduce((sum, p) => sum + (p.vve_maandbijdrage || 0), 0);
      const condoExpenses = properties.reduce((sum, p) => sum + (p.condominium_maandelijks || 0), 0);
      
      let recurringExpensesTotal = 0;
      (expenses || []).forEach(e => {
        let monthlyAmount = e.bedrag;
        if (e.frequentie === 'jaarlijks') monthlyAmount = e.bedrag / 12;
        else if (e.frequentie === 'kwartaal') monthlyAmount = e.bedrag / 3;
        else if (e.frequentie === 'halfjaarlijks') monthlyAmount = e.bedrag / 6;
        recurringExpensesTotal += monthlyAmount;
      });

      const totalMonthlyExpenses = loanExpenses + vveExpenses + condoExpenses + recurringExpensesTotal;
      const netMonthlyCashflow = totalMonthlyRent - totalMonthlyExpenses;

      // Calculate equity (value - debt)
      const totalDebt = (loans || []).reduce((sum, l) => {
        const property = properties.find(p => p.id === l.property_id);
        if (!property) return sum;
        // Estimate remaining debt based on loan
        return sum + (property.aankoopprijs * 0.7); // Rough estimate
      }, 0);
      const totalEquity = totalValue - totalDebt;

      // Safety status
      let safetyStatus: 'green' | 'orange' | 'red' = 'green';
      let safetyMessage = '';

      const cashflowRatio = totalMonthlyRent > 0 ? (netMonthlyCashflow / totalMonthlyRent) * 100 : 0;
      
      if (netMonthlyCashflow >= 500) {
        safetyStatus = 'green';
        safetyMessage = 'Jullie panden leveren stabiele inkomsten op. Er blijft elke maand geld over.';
      } else if (netMonthlyCashflow >= 0) {
        safetyStatus = 'orange';
        safetyMessage = 'Het gaat quitte - de panden dekken hun eigen kosten, maar er is weinig buffer.';
      } else {
        safetyStatus = 'red';
        safetyMessage = 'Let op: de kosten zijn hoger dan de inkomsten. Dit vraagt aandacht.';
      }

      // Future projections (assume 3% annual growth)
      const growthRate = 0.03;
      const projections = [
        { year: 0, value: totalEquity, label: 'Nu' },
        { year: 5, value: totalEquity * Math.pow(1 + growthRate, 5) + (netMonthlyCashflow * 12 * 5) },
        { year: 10, value: totalEquity * Math.pow(1 + growthRate, 10) + (netMonthlyCashflow * 12 * 10), label: 'Extra vrijheid' },
        { year: 20, value: totalEquity * Math.pow(1 + growthRate, 20) + (netMonthlyCashflow * 12 * 20), label: 'Pensioen' },
      ];

      setPortfolio({
        totalProperties: properties.length,
        locations: Array.from(locationMap.values()),
        totalMonthlyRent,
        totalMonthlyExpenses,
        netMonthlyCashflow,
        totalValue,
        totalEquity,
        safetyStatus,
        safetyMessage,
        futureProjections: projections,
      });
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (!portfolio || portfolio.totalProperties === 0) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="pt-6 text-center">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Nog geen panden toegevoegd. Begin met het analyseren van een woning!
          </p>
        </CardContent>
      </Card>
    );
  }

  const safetyIcon = {
    green: <ShieldCheck className="h-8 w-8 text-green-600" />,
    orange: <ShieldAlert className="h-8 w-8 text-orange-500" />,
    red: <ShieldX className="h-8 w-8 text-red-500" />,
  };

  const safetyColor = {
    green: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    red: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  };

  const cashflowData = [
    { name: 'Huur', value: portfolio.totalMonthlyRent, color: '#10B981' },
    { name: 'Kosten', value: -portfolio.totalMonthlyExpenses, color: '#EF4444' },
    { name: 'Overblijft', value: portfolio.netMonthlyCashflow, color: portfolio.netMonthlyCashflow >= 0 ? '#4A6CF7' : '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          Ons Vastgoed Overzicht
        </h2>
        <p className="text-muted-foreground mt-1">
          Eenvoudig inzicht in onze vastgoedinvesteringen
        </p>
      </div>

      {/* Blok 1: Wat bezitten we? */}
      <Card className="shadow-lg border-2 border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Wat bezitten we?
            <InfoBadge content="Een overzicht van al onze panden en waar ze staan. Dit is ons 'vastgoed vermogen'." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Property count */}
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-2xl p-4">
                <Home className="h-10 w-10 text-primary" />
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">{portfolio.totalProperties}</div>
                <div className="text-sm text-muted-foreground">
                  {portfolio.totalProperties === 1 ? 'pand' : 'panden'}
                </div>
              </div>
            </div>

            {/* Locations */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {portfolio.locations.map((loc, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="text-sm px-3 py-1 flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    {loc.city}, {loc.country}
                    {loc.count > 1 && (
                      <span className="bg-primary/20 rounded-full px-1.5 ml-1 text-xs">
                        {loc.count}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Total value */}
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Totale waarde</div>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(portfolio.totalValue)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blok 2: Wat levert het op per maand? */}
      <Card className="shadow-lg border-2 border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Wat levert het op per maand?
            <InfoBadge content="Elke maand komt er huur binnen, en gaat er geld uit voor hypotheek en onderhoud. Wat overblijft is 'netto cashflow' - dat is echt van jullie!" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Visual bar */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cashflowData}
                  layout="vertical"
                  margin={{ left: 60, right: 20 }}
                >
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => `€${Math.abs(v).toLocaleString()}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 14, fontWeight: 500 }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {cashflowData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Big numbers */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-3">
                <ArrowRight className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Elke maand binnen</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(portfolio.totalMonthlyRent)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ArrowRight className="h-5 w-5 text-red-500 rotate-180" />
                <div>
                  <div className="text-sm text-muted-foreground">Elke maand eruit</div>
                  <div className="text-2xl font-bold text-red-500">
                    {formatCurrency(portfolio.totalMonthlyExpenses)}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center gap-3">
                  <Sparkles className={`h-5 w-5 ${portfolio.netMonthlyCashflow >= 0 ? 'text-primary' : 'text-red-500'}`} />
                  <div>
                    <div className="text-sm text-muted-foreground">Wat overblijft voor ons</div>
                    <div className={`text-3xl font-bold ${portfolio.netMonthlyCashflow >= 0 ? 'text-primary' : 'text-red-500'}`}>
                      {formatCurrency(portfolio.netMonthlyCashflow)}
                      <span className="text-lg">/maand</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blok 3: Is dit veilig? */}
      <Card className={`shadow-lg border-2 ${safetyColor[portfolio.safetyStatus]}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Is dit veilig?
            <InfoBadge content="We kijken of er genoeg buffer is. Groen = prima, Oranje = opletten, Rood = actie nodig." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {safetyIcon[portfolio.safetyStatus]}
            <div className="flex-1">
              <div className="font-semibold text-lg">
                {portfolio.safetyStatus === 'green' && '✅ Dit zit goed'}
                {portfolio.safetyStatus === 'orange' && '⚠️ Hier moeten we opletten'}
                {portfolio.safetyStatus === 'red' && '🚨 Dit vraagt actie'}
              </div>
              <p className="text-muted-foreground mt-1">
                {portfolio.safetyMessage}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blok 4: Wat betekent dit voor later? */}
      <Card className="shadow-lg border-2 border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Wat betekent dit voor later?
            <InfoBadge content="Als we de panden behouden, groeit ons vermogen in de loop van de tijd. Dit is een schatting gebaseerd op de huidige situatie." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolio.futureProjections} margin={{ left: 10, right: 10 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A6CF7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4A6CF7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="year" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v === 0 ? 'Nu' : `${v}j`}
                  />
                  <YAxis 
                    hide 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4A6CF7" 
                    strokeWidth={3}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Milestones */}
            <div className="space-y-4">
              {portfolio.futureProjections.filter(p => p.label).map((proj, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    {proj.year === 0 && <Wallet className="h-4 w-4 text-primary" />}
                    {proj.year === 10 && <Palmtree className="h-4 w-4 text-primary" />}
                    {proj.year === 20 && <Clock className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">
                      {proj.year === 0 ? 'Nu' : `Over ${proj.year} jaar`}
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(proj.value)}
                      {proj.label && proj.year > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          → {proj.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-3 bg-primary/5 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>In gewone taal:</strong> Als alles zo doorgaat, hebben we over 20 jaar een vermogen van{' '}
                  {formatCurrency(portfolio.futureProjections[3]?.value || 0)}. 
                  Dat betekent meer vrijheid en een comfortabeler pensioen.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
