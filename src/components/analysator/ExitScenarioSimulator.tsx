import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  Tooltip as RechartsTooltip, Legend, Area, AreaChart, ReferenceLine
} from "recharts";
import { 
  TrendingUp, TrendingDown, Target, AlertTriangle, 
  Calculator, DollarSign, Percent, Clock, Play, RefreshCw
} from "lucide-react";

interface ExitScenarioSimulatorProps {
  currentValue: number;
  purchasePrice: number;
  monthlyRent: number;
  monthlyMortgage: number;
  remainingDebt: number;
  yearlyOpex: number;
  valueGrowthRate?: number;
  rentGrowthRate?: number;
}

interface SimulationResult {
  year: number;
  propertyValue: number;
  equity: number;
  cumulativeRent: number;
  cumulativeCosts: number;
  netPosition: number;
  sellProceeds: number;
  keepTotal: number;
  optimistic: number;
  pessimistic: number;
}

// Monte Carlo simulation for property value
const runMonteCarloSimulation = (
  startValue: number,
  years: number,
  meanGrowth: number,
  volatility: number,
  simulations: number = 1000
): { median: number; p10: number; p90: number; all: number[] }[] => {
  const results: { median: number; p10: number; p90: number; all: number[] }[] = [];
  
  for (let year = 0; year <= years; year++) {
    const yearResults: number[] = [];
    
    for (let sim = 0; sim < simulations; sim++) {
      let value = startValue;
      for (let y = 0; y < year; y++) {
        // Log-normal random walk
        const randomReturn = meanGrowth + volatility * (Math.random() * 2 - 1);
        value *= (1 + randomReturn / 100);
      }
      yearResults.push(value);
    }
    
    yearResults.sort((a, b) => a - b);
    results.push({
      median: yearResults[Math.floor(simulations * 0.5)],
      p10: yearResults[Math.floor(simulations * 0.1)],
      p90: yearResults[Math.floor(simulations * 0.9)],
      all: yearResults,
    });
  }
  
  return results;
};

export function ExitScenarioSimulator({
  currentValue,
  purchasePrice,
  monthlyRent,
  monthlyMortgage,
  remainingDebt,
  yearlyOpex,
  valueGrowthRate = 3,
  rentGrowthRate = 2,
}: ExitScenarioSimulatorProps) {
  const [horizon, setHorizon] = useState(10);
  const [valueGrowth, setValueGrowth] = useState(valueGrowthRate);
  const [volatility, setVolatility] = useState(8);
  const [rentGrowth, setRentGrowth] = useState(rentGrowthRate);
  const [salesCosts, setSalesCosts] = useState(5);
  const [capitalGainsTax, setCapitalGainsTax] = useState(28);
  const [isSimulating, setIsSimulating] = useState(false);

  const simulation = useMemo(() => {
    const results: SimulationResult[] = [];
    const monteCarloResults = runMonteCarloSimulation(currentValue, horizon, valueGrowth, volatility);
    
    let cumulativeRent = 0;
    let cumulativeCosts = 0;
    let currentRent = monthlyRent * 12;
    let currentDebt = remainingDebt;
    
    for (let year = 0; year <= horizon; year++) {
      const propertyValue = currentValue * Math.pow(1 + valueGrowth / 100, year);
      const equity = propertyValue - currentDebt;
      
      cumulativeRent += currentRent;
      cumulativeCosts += yearlyOpex + (monthlyMortgage * 12);
      currentRent *= (1 + rentGrowth / 100);
      currentDebt = Math.max(0, currentDebt - (monthlyMortgage * 12 * 0.3)); // Rough principal paydown
      
      // Sell scenario: property value minus sales costs and CGT
      const capitalGain = Math.max(0, propertyValue - purchasePrice);
      const taxOnGain = capitalGain * (capitalGainsTax / 100);
      const sellProceeds = propertyValue * (1 - salesCosts / 100) - taxOnGain - currentDebt;
      
      // Keep scenario: accumulated rent minus costs + remaining equity
      const keepTotal = cumulativeRent - cumulativeCosts + equity;
      
      results.push({
        year,
        propertyValue: Math.round(propertyValue),
        equity: Math.round(equity),
        cumulativeRent: Math.round(cumulativeRent),
        cumulativeCosts: Math.round(cumulativeCosts),
        netPosition: Math.round(cumulativeRent - cumulativeCosts),
        sellProceeds: Math.round(sellProceeds),
        keepTotal: Math.round(keepTotal),
        optimistic: Math.round(monteCarloResults[year].p90),
        pessimistic: Math.round(monteCarloResults[year].p10),
      });
    }
    
    return results;
  }, [currentValue, purchasePrice, monthlyRent, monthlyMortgage, remainingDebt, yearlyOpex, horizon, valueGrowth, volatility, rentGrowth, salesCosts, capitalGainsTax]);

  const lastResult = simulation[simulation.length - 1];
  const breakEvenYear = simulation.find(s => s.sellProceeds > s.keepTotal)?.year || horizon;
  const recommendation = lastResult.sellProceeds > lastResult.keepTotal ? 'sell' : 'keep';

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Simulatie Parameters
          </CardTitle>
          <CardDescription>
            Pas de parameters aan om verschillende scenario's te verkennen
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Horizon (jaren)
              </Label>
              <span className="text-sm font-medium">{horizon}</span>
            </div>
            <Slider
              value={[horizon]}
              onValueChange={([v]) => setHorizon(v)}
              min={1}
              max={30}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Waardestijging (%)
              </Label>
              <span className="text-sm font-medium">{valueGrowth}%</span>
            </div>
            <Slider
              value={[valueGrowth]}
              onValueChange={([v]) => setValueGrowth(v)}
              min={-5}
              max={10}
              step={0.5}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Volatiliteit (%)
              </Label>
              <span className="text-sm font-medium">{volatility}%</span>
            </div>
            <Slider
              value={[volatility]}
              onValueChange={([v]) => setVolatility(v)}
              min={0}
              max={20}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Huurgroei (%)
              </Label>
              <span className="text-sm font-medium">{rentGrowth}%</span>
            </div>
            <Slider
              value={[rentGrowth]}
              onValueChange={([v]) => setRentGrowth(v)}
              min={0}
              max={5}
              step={0.5}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Percent className="w-4 h-4" />
                Verkoopkosten (%)
              </Label>
              <span className="text-sm font-medium">{salesCosts}%</span>
            </div>
            <Slider
              value={[salesCosts]}
              onValueChange={([v]) => setSalesCosts(v)}
              min={0}
              max={10}
              step={0.5}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Calculator className="w-4 h-4" />
                Meerwaarde belasting (%)
              </Label>
              <span className="text-sm font-medium">{capitalGainsTax}%</span>
            </div>
            <Slider
              value={[capitalGainsTax]}
              onValueChange={([v]) => setCapitalGainsTax(v)}
              min={0}
              max={50}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={recommendation === 'sell' ? 'border-warning' : 'border-success'}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Target className="w-4 h-4" />
              Aanbeveling
            </div>
            <p className={`text-xl font-bold ${recommendation === 'sell' ? 'text-warning' : 'text-success'}`}>
              {recommendation === 'sell' ? 'Verkopen overwegen' : 'Behouden'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Verkoop na {horizon}j
            </div>
            <p className="text-xl font-bold">{formatCurrency(lastResult.sellProceeds)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Behouden na {horizon}j
            </div>
            <p className="text-xl font-bold">{formatCurrency(lastResult.keepTotal)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="w-4 h-4" />
              Break-even punt
            </div>
            <p className="text-xl font-bold">{breakEvenYear} jaar</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList>
          <TabsTrigger value="comparison">Vergelijking</TabsTrigger>
          <TabsTrigger value="uncertainty">Onzekerheidsband</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Verkopen vs Behouden</CardTitle>
              <CardDescription>
                Netto vermogenspositie over tijd bij beide strategieën
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulation}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="year" 
                    className="text-muted-foreground"
                    tickFormatter={(v) => `${v}j`}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Jaar ${label}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="sellProceeds" 
                    name="Verkopen" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="keepTotal" 
                    name="Behouden" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uncertainty">
          <Card>
            <CardHeader>
              <CardTitle>Monte Carlo Simulatie</CardTitle>
              <CardDescription>
                Onzekerheidsband (P10-P90) voor vastgoedwaarde gebaseerd op {volatility}% volatiliteit
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulation}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="year" 
                    className="text-muted-foreground"
                    tickFormatter={(v) => `${v}j`}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Jaar ${label}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="optimistic" 
                    name="Optimistisch (P90)" 
                    stroke="hsl(var(--success))" 
                    fill="hsl(var(--success)/0.2)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="propertyValue" 
                    name="Verwacht" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary)/0.3)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pessimistic" 
                    name="Pessimistisch (P10)" 
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive)/0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Cumulatieve Cashflow</CardTitle>
              <CardDescription>
                Huurinkomsten vs kosten over tijd
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulation}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="year" 
                    className="text-muted-foreground"
                    tickFormatter={(v) => `${v}j`}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Jaar ${label}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeRent" 
                    name="Cumulatieve Huur" 
                    stroke="hsl(var(--success))" 
                    fill="hsl(var(--success)/0.3)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeCosts" 
                    name="Cumulatieve Kosten" 
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive)/0.3)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netPosition" 
                    name="Netto Positie" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Jaarlijkse Projectie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Jaar</th>
                  <th className="text-right py-2">Waarde</th>
                  <th className="text-right py-2">Eigen Vermogen</th>
                  <th className="text-right py-2">Cum. Huur</th>
                  <th className="text-right py-2">Netto Positie</th>
                  <th className="text-right py-2">Verkoop</th>
                  <th className="text-right py-2">Behouden</th>
                </tr>
              </thead>
              <tbody>
                {simulation.filter((_, i) => i % Math.ceil(horizon / 5) === 0 || i === simulation.length - 1).map((row) => (
                  <tr key={row.year} className="border-b last:border-0">
                    <td className="py-2 font-medium">{row.year}</td>
                    <td className="text-right">{formatCurrency(row.propertyValue)}</td>
                    <td className="text-right">{formatCurrency(row.equity)}</td>
                    <td className="text-right text-success">{formatCurrency(row.cumulativeRent)}</td>
                    <td className={`text-right ${row.netPosition >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(row.netPosition)}
                    </td>
                    <td className="text-right">{formatCurrency(row.sellProceeds)}</td>
                    <td className="text-right">{formatCurrency(row.keepTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
