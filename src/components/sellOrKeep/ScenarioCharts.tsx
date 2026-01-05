import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { YearlyProjection, translations, Language } from "@/lib/sellOrKeepCalculations";

interface ScenarioChartsProps {
  yearlyProjections: YearlyProjection[];
  investmentHorizon: 10 | 30;
  language: Language;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}k`;
  }
  return `€${value.toFixed(0)}`;
}

export function ScenarioCharts({ yearlyProjections, investmentHorizon, language }: ScenarioChartsProps) {
  const t = translations[language];

  // Prepare data for monthly income comparison (bar chart - first year and last year)
  const incomeComparisonData = [
    {
      name: language === 'nl' ? 'Jaar 1' : 'Ano 1',
      'Scenario A': yearlyProjections[0]?.scenarioA.annualIncome / 12 || 0,
      'Scenario B': yearlyProjections[0]?.scenarioB.netCashflow / 12 || 0,
      'Scenario C': yearlyProjections[0]?.scenarioC.netCashflow / 12 || 0,
    },
    {
      name: `${language === 'nl' ? 'Jaar' : 'Ano'} ${investmentHorizon}`,
      'Scenario A': yearlyProjections[investmentHorizon - 1]?.scenarioA.annualIncome / 12 || 0,
      'Scenario B': yearlyProjections[investmentHorizon - 1]?.scenarioB.netCashflow / 12 || 0,
      'Scenario C': yearlyProjections[investmentHorizon - 1]?.scenarioC.netCashflow / 12 || 0,
    },
  ];

  // Prepare data for net worth over time (line chart)
  const netWorthData = yearlyProjections.map((projection) => ({
    year: projection.year,
    'Verkopen + ETF': projection.scenarioA.portfolioValue,
    'Verkopen + Vastgoed': projection.scenarioB.equity,
    'Behouden': projection.scenarioC.equity,
  }));

  // Filter to show key years for readability
  const filteredNetWorthData = investmentHorizon === 30
    ? netWorthData.filter((_, i) => i % 3 === 0 || i === netWorthData.length - 1)
    : netWorthData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Monthly Income Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.charts.monthlyIncome}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} className="text-xs" />
              <Tooltip
                formatter={(value: number) => [`€${value.toFixed(0)}`, '']}
                labelClassName="font-medium"
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="Scenario A" name={language === 'nl' ? 'ETF Beleggen' : 'Investir em ETF'} fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Scenario B" name={language === 'nl' ? 'Nieuw Vastgoed' : 'Novo Imóvel'} fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Scenario C" name={language === 'nl' ? 'Behouden' : 'Manter'} fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Net Worth Over Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {t.charts.netWorth} {investmentHorizon} {t.charts.years} (€)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredNetWorthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="year" 
                className="text-xs"
                label={{ value: language === 'nl' ? 'Jaar' : 'Ano', position: 'bottom', offset: -5 }}
              />
              <YAxis tickFormatter={(value) => formatCurrency(value)} className="text-xs" />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), '']}
                labelFormatter={(label) => `${language === 'nl' ? 'Jaar' : 'Ano'} ${label}`}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Verkopen + ETF" 
                name={language === 'nl' ? 'ETF Beleggen' : 'Investir em ETF'}
                stroke="hsl(221, 83%, 53%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(221, 83%, 53%)', r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="Verkopen + Vastgoed" 
                name={language === 'nl' ? 'Nieuw Vastgoed' : 'Novo Imóvel'}
                stroke="hsl(262, 83%, 58%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(262, 83%, 58%)', r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="Behouden" 
                name={language === 'nl' ? 'Behouden' : 'Manter'}
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(142, 76%, 36%)', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
