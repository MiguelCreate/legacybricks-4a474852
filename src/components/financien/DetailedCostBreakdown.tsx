import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Building2, ChevronDown, ChevronRight, Home, Landmark, Receipt, Shield, Wrench, Users, Percent, PiggyBank } from "lucide-react";
import { useState } from "react";
import { calculatePropertyCashflow, TenantRent } from "@/lib/financialCalculations";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Tenant = Tables<"tenants">;
type Loan = Tables<"loans">;

interface PropertyBreakdown {
  property: Property;
  grossIncome: number;
  expenses: {
    mortgage: number;
    imi: number;
    irs: number;
    insurance: number;
    maintenance: number;
    vacancyBuffer: number;
    management: number;
    other: number;
  };
  irsTarief: number;
  netCashflow: number;
  tenantCount: number;
}

interface DetailedCostBreakdownProps {
  properties: Property[];
  tenants: Tenant[];
  loans: Loan[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
};

const CostRow = ({ 
  icon: Icon, 
  label, 
  value, 
  description,
  highlight = false 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number; 
  description?: string;
  highlight?: boolean;
}) => (
  <div className={`flex items-center justify-between py-2 ${highlight ? 'font-medium' : ''}`}>
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <div>
        <span className={highlight ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
    <span className={`${value < 0 ? 'text-destructive' : highlight ? 'text-foreground' : 'text-muted-foreground'}`}>
      {value < 0 ? '-' : ''}{formatCurrency(Math.abs(value))}
    </span>
  </div>
);

export const DetailedCostBreakdown = ({ properties, tenants, loans }: DetailedCostBreakdownProps) => {
  const [openProperties, setOpenProperties] = useState<Set<string>>(new Set());
  const [isMainOpen, setIsMainOpen] = useState(true);

  const toggleProperty = (propertyId: string) => {
    const newSet = new Set(openProperties);
    if (newSet.has(propertyId)) {
      newSet.delete(propertyId);
    } else {
      newSet.add(propertyId);
    }
    setOpenProperties(newSet);
  };

  // Calculate breakdown for each property
  const breakdowns: PropertyBreakdown[] = properties.map(property => {
    const propertyTenants = tenants.filter(t => t.property_id === property.id);
    const actualRent = propertyTenants.reduce((s, t) => s + Number(t.huurbedrag || 0), 0);
    
    const tenantRents: TenantRent[] = propertyTenants.map(t => ({
      monthlyRent: Number(t.huurbedrag || 0)
    }));
    
    const loan = loans.find((l) => l.property_id === property.id);
    
    const cashflowResult = calculatePropertyCashflow(
      actualRent,
      Number(property.subsidie_bedrag) || 0,
      loan ? Number(loan.maandlast) : 0,
      Number(property.aankoopprijs),
      Number(property.imi_percentage) || 0.003,
      Number(property.verzekering_jaarlijks) || 0,
      Number(property.onderhoud_jaarlijks) || 0,
      Number(property.leegstand_buffer_percentage) || 5,
      Number(property.beheerkosten_percentage) || 0,
      0,
      { jaarHuurinkomst: new Date().getFullYear() },
      tenantRents
    );

    return {
      property,
      grossIncome: cashflowResult.grossIncome,
      expenses: cashflowResult.expenses,
      irsTarief: cashflowResult.irsTarief,
      netCashflow: cashflowResult.netCashflow,
      tenantCount: propertyTenants.length,
    };
  });

  // Calculate totals
  const totals = breakdowns.reduce((acc, b) => ({
    grossIncome: acc.grossIncome + b.grossIncome,
    mortgage: acc.mortgage + b.expenses.mortgage,
    imi: acc.imi + b.expenses.imi,
    irs: acc.irs + b.expenses.irs,
    insurance: acc.insurance + b.expenses.insurance,
    maintenance: acc.maintenance + b.expenses.maintenance,
    vacancyBuffer: acc.vacancyBuffer + b.expenses.vacancyBuffer,
    management: acc.management + b.expenses.management,
    other: acc.other + b.expenses.other,
    netCashflow: acc.netCashflow + b.netCashflow,
  }), {
    grossIncome: 0,
    mortgage: 0,
    imi: 0,
    irs: 0,
    insurance: 0,
    maintenance: 0,
    vacancyBuffer: 0,
    management: 0,
    other: 0,
    netCashflow: 0,
  });

  const totalExpenses = totals.mortgage + totals.imi + totals.irs + totals.insurance + 
                        totals.maintenance + totals.vacancyBuffer + totals.management + totals.other;

  return (
    <Collapsible open={isMainOpen} onOpenChange={setIsMainOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="w-5 h-5 text-primary" />
                Gedetailleerde Kostenbreakdown
              </CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant={totals.netCashflow >= 0 ? "default" : "destructive"}>
                  Netto: {formatCurrency(totals.netCashflow)}/mnd
                </Badge>
                {isMainOpen ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Portfolio Totals */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <PiggyBank className="w-4 h-4" />
                Portefeuille Totaal (maandelijks)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <CostRow icon={Home} label="Bruto Huurinkomsten" value={totals.grossIncome} highlight />
                </div>
                <div className="space-y-1">
                  <CostRow icon={Landmark} label="Hypotheeklasten" value={-totals.mortgage} />
                  <CostRow icon={Building2} label="IMI (onroerendgoedbelasting)" value={-totals.imi} />
                  <CostRow icon={Percent} label="IRS (inkomstenbelasting)" value={-totals.irs} />
                  <CostRow icon={Shield} label="Verzekering" value={-totals.insurance} />
                  <CostRow icon={Wrench} label="Onderhoud" value={-totals.maintenance} />
                  <CostRow icon={Users} label="Leegstandsbuffer" value={-totals.vacancyBuffer} />
                  <CostRow icon={Receipt} label="Beheerkosten" value={-totals.management} />
                  {totals.other > 0 && (
                    <CostRow icon={Receipt} label="Overige kosten" value={-totals.other} />
                  )}
                </div>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Totale Kosten</span>
                  <span className="text-destructive">-{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-xl mt-2">
                  <span>Netto Cashflow</span>
                  <span className={totals.netCashflow >= 0 ? 'text-green-600' : 'text-destructive'}>
                    {formatCurrency(totals.netCashflow)}
                  </span>
                </div>
              </div>
            </div>

            {/* Per Property Breakdown */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Per Pand
              </h3>
              
              {breakdowns.map(breakdown => (
                <Collapsible
                  key={breakdown.property.id}
                  open={openProperties.has(breakdown.property.id)}
                  onOpenChange={() => toggleProperty(breakdown.property.id)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                        <div className="text-left">
                          <p className="font-medium">{breakdown.property.naam}</p>
                          <p className="text-sm text-muted-foreground">
                            {breakdown.tenantCount} huurder{breakdown.tenantCount !== 1 ? 's' : ''} • 
                            IRS tarief: {breakdown.irsTarief}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Netto cashflow</p>
                          <p className={`font-semibold ${breakdown.netCashflow >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {formatCurrency(breakdown.netCashflow)}
                          </p>
                        </div>
                        {openProperties.has(breakdown.property.id) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t space-y-2">
                        <CostRow 
                          icon={Home} 
                          label="Bruto Inkomsten" 
                          value={breakdown.grossIncome}
                          description="Huur + subsidie"
                          highlight 
                        />
                        <div className="h-px bg-border my-2" />
                        
                        {breakdown.expenses.mortgage > 0 && (
                          <CostRow 
                            icon={Landmark} 
                            label="Hypotheek" 
                            value={-breakdown.expenses.mortgage}
                            description="Maandelijkse aflossing + rente"
                          />
                        )}
                        
                        {breakdown.expenses.imi > 0 && (
                          <CostRow 
                            icon={Building2} 
                            label="IMI" 
                            value={-breakdown.expenses.imi}
                            description={`${((breakdown.property.imi_percentage || 0.003) * 100).toFixed(2)}% van aankoopprijs`}
                          />
                        )}
                        
                        {breakdown.expenses.irs > 0 && (
                          <CostRow 
                            icon={Percent} 
                            label="IRS" 
                            value={-breakdown.expenses.irs}
                            description={`${breakdown.irsTarief}% belasting over huurinkomsten`}
                          />
                        )}
                        
                        {breakdown.expenses.insurance > 0 && (
                          <CostRow 
                            icon={Shield} 
                            label="Verzekering" 
                            value={-breakdown.expenses.insurance}
                            description={`€${breakdown.property.verzekering_jaarlijks}/jaar`}
                          />
                        )}
                        
                        {breakdown.expenses.maintenance > 0 && (
                          <CostRow 
                            icon={Wrench} 
                            label="Onderhoud" 
                            value={-breakdown.expenses.maintenance}
                            description={`€${breakdown.property.onderhoud_jaarlijks}/jaar gereserveerd`}
                          />
                        )}
                        
                        {breakdown.expenses.vacancyBuffer > 0 && (
                          <CostRow 
                            icon={Users} 
                            label="Leegstandsbuffer" 
                            value={-breakdown.expenses.vacancyBuffer}
                            description={`${breakdown.property.leegstand_buffer_percentage || 5}% buffer`}
                          />
                        )}
                        
                        {breakdown.expenses.management > 0 && (
                          <CostRow 
                            icon={Receipt} 
                            label="Beheerkosten" 
                            value={-breakdown.expenses.management}
                            description={`${breakdown.property.beheerkosten_percentage}% van huur`}
                          />
                        )}
                        
                        <div className="h-px bg-border my-2" />
                        <div className="flex justify-between items-center font-semibold pt-1">
                          <span>Netto Cashflow</span>
                          <span className={breakdown.netCashflow >= 0 ? 'text-green-600' : 'text-destructive'}>
                            {formatCurrency(breakdown.netCashflow)}
                          </span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>

            {/* Info about calculation */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                Hoe wordt dit berekend?
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Netto Cashflow</strong> = Huurinkomsten − Hypotheek − IMI − IRS − Verzekering − Onderhoud − Leegstandsbuffer − Beheerkosten
              </p>
              <p className="text-blue-600 dark:text-blue-400 mt-2 text-xs">
                💡 IRS wordt per huurder berekend (drempel €2.300/mnd). Huurders onder deze drempel betalen 10%, daarboven 25%.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
