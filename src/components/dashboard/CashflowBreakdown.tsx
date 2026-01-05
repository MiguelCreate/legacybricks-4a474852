import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Home, Users, Landmark, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { calculatePropertyCashflow, TenantRent } from "@/lib/financialCalculations";

type Property = Tables<"properties">;
type Tenant = Tables<"tenants">;
type Loan = Tables<"loans">;

interface CashflowBreakdownProps {
  properties: Property[];
  tenants: Tenant[];
  loans: Loan[];
}

interface PropertyBreakdown {
  property: Property;
  tenants: Tenant[];
  loan: Loan | undefined;
  totalRent: number;
  loanPayment: number;
  imiMonthly: number;
  irsMonthly: number;
  irsTarief: number;
  insuranceMonthly: number;
  maintenanceMonthly: number;
  vacancyBuffer: number;
  managementCost: number;
  netCashflow: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const CashflowBreakdown = ({ properties, tenants, loans }: CashflowBreakdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const breakdowns: PropertyBreakdown[] = properties.map((property) => {
    const propertyTenants = tenants.filter((t) => t.property_id === property.id);
    const loan = loans.find((l) => l.property_id === property.id);
    const totalRent = propertyTenants.reduce((sum, t) => sum + Number(t.huurbedrag || 0), 0);
    
    const loanPayment = loan ? Number(loan.maandlast) : 0;
    const imiMonthly = (Number(property.aankoopprijs) * (Number(property.imi_percentage) || 0.003)) / 12;
    const insuranceMonthly = (Number(property.verzekering_jaarlijks) || 0) / 12;
    const maintenanceMonthly = (Number(property.onderhoud_jaarlijks) || 0) / 12;
    const vacancyBuffer = totalRent * ((Number(property.leegstand_buffer_percentage) || 5) / 100);
    const managementCost = totalRent * ((Number(property.beheerkosten_percentage) || 0) / 100);
    
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

    return {
      property,
      tenants: propertyTenants,
      loan,
      totalRent,
      loanPayment,
      imiMonthly,
      irsMonthly: cashflowResult.expenses.irs,
      irsTarief: cashflowResult.irsTarief,
      insuranceMonthly,
      maintenanceMonthly,
      vacancyBuffer,
      managementCost,
      netCashflow: cashflowResult.netCashflow,
    };
  });

  const totalIncome = breakdowns.reduce((sum, b) => sum + b.totalRent, 0);
  const totalCosts = breakdowns.reduce((sum, b) => 
    sum + b.loanPayment + b.imiMonthly + b.irsMonthly + b.insuranceMonthly + b.maintenanceMonthly + b.vacancyBuffer + b.managementCost, 0
  );
  const totalNetCashflow = breakdowns.reduce((sum, b) => sum + b.netCashflow, 0);

  if (properties.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                Cashflow Breakdown
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${totalNetCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalNetCashflow)}/maand
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-muted-foreground text-xs">Inkomsten</p>
                  <p className="font-semibold text-green-600">{formatCurrency(totalIncome)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-muted-foreground text-xs">Kosten</p>
                  <p className="font-semibold text-red-600">-{formatCurrency(totalCosts)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-muted-foreground text-xs">Netto</p>
                  <p className={`font-semibold ${totalNetCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalNetCashflow)}
                  </p>
                </div>
              </div>
            </div>

            {/* Per property breakdown */}
            <div className="space-y-3">
              {breakdowns.map((breakdown) => (
                <div key={breakdown.property.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{breakdown.property.naam}</span>
                    </div>
                    <span className={`text-sm font-semibold ${breakdown.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(breakdown.netCashflow)}
                    </span>
                  </div>
                  
                  {/* Tenants */}
                  {breakdown.tenants.length > 0 && (
                    <div className="pl-6 space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>Huurders ({breakdown.tenants.length})</span>
                      </div>
                      {breakdown.tenants.map((tenant) => (
                        <div key={tenant.id} className="flex justify-between text-xs pl-4">
                          <span className="text-muted-foreground">{tenant.naam}</span>
                          <span className="text-green-600">+{formatCurrency(Number(tenant.huurbedrag))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Costs */}
                  <div className="pl-6 space-y-1 pt-1 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Landmark className="h-3 w-3" />
                      <span>Kosten</span>
                    </div>
                    {breakdown.loanPayment > 0 && (
                      <div className="flex justify-between text-xs pl-4">
                        <span className="text-muted-foreground">Hypotheek</span>
                        <span className="text-red-600">-{formatCurrency(breakdown.loanPayment)}</span>
                      </div>
                    )}
                    {breakdown.imiMonthly > 0 && (
                      <div className="flex justify-between text-xs pl-4">
                        <span className="text-muted-foreground">IMI (belasting)</span>
                        <span className="text-red-600">-{formatCurrency(breakdown.imiMonthly)}</span>
                      </div>
                    )}
                    {breakdown.irsMonthly > 0 && (
                      <div className="flex justify-between text-xs pl-4">
                        <span className="text-muted-foreground">IRS ({breakdown.irsTarief}%)</span>
                        <span className="text-red-600">-{formatCurrency(breakdown.irsMonthly)}</span>
                      </div>
                    )}
                    {breakdown.insuranceMonthly > 0 && (
                      <div className="flex justify-between text-xs pl-4">
                        <span className="text-muted-foreground">Verzekering</span>
                        <span className="text-red-600">-{formatCurrency(breakdown.insuranceMonthly)}</span>
                      </div>
                    )}
                    {breakdown.maintenanceMonthly > 0 && (
                      <div className="flex justify-between text-xs pl-4">
                        <span className="text-muted-foreground">Onderhoud</span>
                        <span className="text-red-600">-{formatCurrency(breakdown.maintenanceMonthly)}</span>
                      </div>
                    )}
                    {breakdown.vacancyBuffer > 0 && (
                      <div className="flex justify-between text-xs pl-4">
                        <span className="text-muted-foreground">Leegstandbuffer ({breakdown.property.leegstand_buffer_percentage || 5}%)</span>
                        <span className="text-red-600">-{formatCurrency(breakdown.vacancyBuffer)}</span>
                      </div>
                    )}
                    {breakdown.managementCost > 0 && (
                      <div className="flex justify-between text-xs pl-4">
                        <span className="text-muted-foreground">Beheerkosten ({breakdown.property.beheerkosten_percentage}%)</span>
                        <span className="text-red-600">-{formatCurrency(breakdown.managementCost)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Formula explanation */}
            <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
              <strong>Formule:</strong> Huurinkomsten − Hypotheek − IMI − IRS − Verzekering − Onderhoud − Leegstandbuffer − Beheerkosten = Netto Cashflow
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
