import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Tables } from "@/integrations/supabase/types";
import { calculatePropertyCashflow, TenantRent } from "@/lib/financialCalculations";
import { BarChart3 } from "lucide-react";

type Property = Tables<"properties">;
type Tenant = Tables<"tenants">;
type Loan = Tables<"loans">;

interface CashflowBarChartProps {
  properties: Property[];
  tenants: Tenant[];
  loans: Loan[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const CashflowBarChart = ({ properties, tenants, loans }: CashflowBarChartProps) => {
  const data = properties.map((property) => {
    const propertyTenants = tenants.filter((t) => t.property_id === property.id);
    const loan = loans.find((l) => l.property_id === property.id);
    const totalRent = propertyTenants.reduce((sum, t) => sum + Number(t.huurbedrag || 0), 0);
    
    const loanPayment = loan ? Number(loan.maandlast) : 0;
    
    // Create tenant rents array for per-tenant IRS calculation
    const tenantRents: TenantRent[] = propertyTenants.map(t => ({
      monthlyRent: Number(t.huurbedrag || 0)
    }));
    
    const cashflowResult = calculatePropertyCashflow(
      totalRent,
      Number(property.subsidie_bedrag) || 0,
      loanPayment,
      Number(property.aankoopprijs),
      Number(property.imi_percentage) || 0.003,
      Number(property.verzekering_jaarlijks) || 0,
      Number(property.onderhoud_jaarlijks) || 0,
      Number(property.leegstand_buffer_percentage) || 5,
      Number(property.beheerkosten_percentage) || 0,
      0, // other expenses
      { jaarHuurinkomst: new Date().getFullYear() },
      tenantRents // Pass tenant rents for per-tenant IRS calculation
    );

    // Truncate property name for chart display
    const displayName = property.naam.length > 15 
      ? property.naam.substring(0, 15) + "..." 
      : property.naam;

    return {
      name: displayName,
      fullName: property.naam,
      cashflow: Math.round(cashflowResult.netCashflow),
      income: totalRent,
      costs: Math.round(totalRent - cashflowResult.netCashflow),
    };
  });

  const totalCashflow = data.reduce((sum, d) => sum + d.cashflow, 0);

  if (properties.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Cashflow per Pand
          </CardTitle>
          <span className={`text-sm font-semibold ${totalCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Totaal: {formatCurrency(totalCashflow)}/mnd
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                className="text-muted-foreground"
              />
              <YAxis 
                tickFormatter={(value) => `€${value}`}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                        <p className="font-semibold mb-2">{data.fullName}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Inkomsten:</span>
                            <span className="text-green-600 font-medium">{formatCurrency(data.income)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Kosten:</span>
                            <span className="text-red-600 font-medium">-{formatCurrency(data.costs)}</span>
                          </div>
                          <div className="flex justify-between gap-4 pt-1 border-t">
                            <span className="text-muted-foreground">Netto:</span>
                            <span className={`font-semibold ${data.cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(data.cashflow)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
              <Bar dataKey="cashflow" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.cashflow >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
