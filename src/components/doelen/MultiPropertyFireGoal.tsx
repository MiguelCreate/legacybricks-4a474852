import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  Flame, Building2, Target, PiggyBank, AlertTriangle, Calendar
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Loan = Tables<"loans">;
type Tenant = Tables<"tenants">;

interface PropertyContribution {
  propertyId: string;
  enabled: boolean;
  percentageContribution: number;
}

interface MultiPropertyFireGoalProps {
  properties: Property[];
  loans: Loan[];
  tenants: Tenant[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

// Calculate property cashflow (simplified version)
const calculatePropertyCashflow = (
  property: Property, 
  loans: Loan[], 
  tenants: Tenant[]
): number => {
  const propertyTenants = tenants.filter(t => t.property_id === property.id);
  const monthlyRent = propertyTenants.reduce((sum, t) => sum + Number(t.huurbedrag || 0), 0);
  const loan = loans.find(l => l.property_id === property.id);
  const mortgagePayment = loan ? Number(loan.maandlast || 0) : 0;
  
  // Estimate costs
  const imi = (Number(property.aankoopprijs) * (Number(property.imi_percentage) || 0.003)) / 12;
  const insurance = (Number(property.verzekering_jaarlijks) || 0) / 12;
  const maintenance = (Number(property.onderhoud_jaarlijks) || 0) / 12;
  const vacancy = monthlyRent * ((Number(property.leegstand_buffer_percentage) || 5) / 100);
  const management = monthlyRent * ((Number(property.beheerkosten_percentage) || 0) / 100);
  
  // IRS estimate (simplified)
  const netBeforeTax = monthlyRent - imi - insurance - maintenance - vacancy - management;
  const irsEstimate = netBeforeTax > 0 ? netBeforeTax * 0.25 : 0;
  
  return monthlyRent - mortgagePayment - imi - insurance - maintenance - vacancy - management - irsEstimate;
};

export const MultiPropertyFireGoal = ({
  properties,
  loans,
  tenants,
}: MultiPropertyFireGoalProps) => {
  // Local state for FIRE goal configuration
  const [targetAmount, setTargetAmount] = useState<number>(500000);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [manualMonthlyContribution, setManualMonthlyContribution] = useState<number>(0);
  const [contributions, setContributions] = useState<PropertyContribution[]>([]);

  // Calculate cashflow for each property
  const propertyMetrics = properties.map(property => {
    const cashflow = calculatePropertyCashflow(property, loans, tenants);
    const contribution = contributions.find(c => c.propertyId === property.id);
    const contributionAmount = contribution?.enabled 
      ? cashflow * ((contribution.percentageContribution || 100) / 100)
      : 0;
    
    return {
      property,
      cashflow,
      contribution,
      contributionAmount: Math.max(0, contributionAmount)
    };
  }).filter(m => m.cashflow > 0); // Only show properties with positive cashflow

  const totalPropertyContribution = propertyMetrics.reduce(
    (sum, m) => sum + m.contributionAmount, 0
  );
  
  const totalMonthlyContribution = manualMonthlyContribution + totalPropertyContribution;
  const remaining = targetAmount - currentAmount;
  const monthsToGoal = totalMonthlyContribution > 0 
    ? Math.ceil(remaining / totalMonthlyContribution) 
    : Infinity;
  const yearsToGoal = monthsToGoal / 12;
  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

  const toggleProperty = (propertyId: string, enabled: boolean) => {
    const existing = contributions.find(c => c.propertyId === propertyId);
    if (existing) {
      setContributions(
        contributions.map(c => 
          c.propertyId === propertyId ? { ...c, enabled } : c
        )
      );
    } else {
      setContributions([
        ...contributions,
        { propertyId, enabled, percentageContribution: 100 }
      ]);
    }
  };

  const updatePercentage = (propertyId: string, percentage: number) => {
    const existing = contributions.find(c => c.propertyId === propertyId);
    if (existing) {
      setContributions(
        contributions.map(c => 
          c.propertyId === propertyId ? { ...c, percentageContribution: percentage } : c
        )
      );
    } else {
      setContributions([
        ...contributions,
        { propertyId, enabled: true, percentageContribution: percentage }
      ]);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="w-5 h-5 text-orange-500" />
          FIRE Portfolio Analyse
          <InfoTooltip 
            title="Multi-Property FIRE"
            content="Bereken hoeveel je cashflow uit vastgoed kan bijdragen aan je financiële onafhankelijkheid (FIRE). Selecteer panden en bepaal welk percentage van de cashflow je wilt gebruiken."
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* FIRE Goal Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1">
              FIRE Doelbedrag (€)
              <InfoTooltip title="Doelbedrag" content="Het vermogen dat je nodig hebt om financieel onafhankelijk te zijn. Vaak 25x je jaarlijkse uitgaven." />
            </Label>
            <Input
              type="number"
              value={targetAmount || ""}
              onChange={(e) => setTargetAmount(Number(e.target.value) || 0)}
              placeholder="500000"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Huidig vermogen (€)</Label>
            <Input
              type="number"
              value={currentAmount || ""}
              onChange={(e) => setCurrentAmount(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-1">
            Extra maandelijkse inleg (€)
            <InfoTooltip title="Extra inleg" content="Naast de vastgoed cashflow kun je hier extra maandelijkse beleggingen toevoegen." />
          </Label>
          <Input
            type="number"
            value={manualMonthlyContribution || ""}
            onChange={(e) => setManualMonthlyContribution(Number(e.target.value) || 0)}
            placeholder="0"
          />
        </div>

        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Voortgang</span>
            <span className="font-medium">{formatCurrency(currentAmount)} / {formatCurrency(targetAmount)}</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(1)}% bereikt</span>
            <span>
              {monthsToGoal < Infinity && monthsToGoal > 0
                ? `Nog ~${yearsToGoal.toFixed(1)} jaar` 
                : 'Voeg bijdragen toe'
              }
            </span>
          </div>
        </div>

        {/* Contribution Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totalMonthlyContribution)}
            </div>
            <div className="text-xs text-muted-foreground">Totale maandelijkse inleg</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalPropertyContribution)}
            </div>
            <div className="text-xs text-muted-foreground">Vanuit vastgoed cashflow</div>
          </div>
        </div>

        {/* Property Selection */}
        {propertyMetrics.length > 0 ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Selecteer panden die bijdragen aan FIRE</Label>
            
            {propertyMetrics.map(({ property, cashflow, contribution, contributionAmount }) => {
              const isEnabled = contribution?.enabled ?? false;
              const percentage = contribution?.percentageContribution ?? 100;
              
              return (
                <div 
                  key={property.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    isEnabled ? 'border-primary/30 bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleProperty(property.id, !!checked)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium truncate">{property.naam}</span>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {formatCurrency(cashflow)}/mnd
                        </Badge>
                      </div>
                      
                      {isEnabled && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Bijdrage percentage</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <Slider
                            value={[percentage]}
                            onValueChange={([v]) => updatePercentage(property.id, v)}
                            min={10}
                            max={100}
                            step={10}
                            className="my-2"
                          />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Maandelijkse bijdrage</span>
                            <span className="font-semibold text-success">
                              {formatCurrency(contributionAmount)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <PiggyBank className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Geen panden met positieve cashflow gevonden</p>
            <p className="text-xs mt-1">
              Voeg panden toe met huurinkomsten die de kosten dekken
            </p>
          </div>
        )}

        {/* FIRE Insights */}
        {totalMonthlyContribution > 0 && (
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-foreground">
              <Target className="w-4 h-4 text-orange-500" />
              FIRE Inzichten
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Jaarlijkse opbouw: {formatCurrency(totalMonthlyContribution * 12)}</li>
              <li>• Na 5 jaar: {formatCurrency(currentAmount + totalMonthlyContribution * 60)}</li>
              <li>• Na 10 jaar: {formatCurrency(currentAmount + totalMonthlyContribution * 120)}</li>
              {yearsToGoal < 30 && yearsToGoal > 0 && (
                <li className="font-medium text-success">• FIRE bereikt over {yearsToGoal.toFixed(1)} jaar! 🔥</li>
              )}
            </ul>
          </div>
        )}

        {/* Warning if no contributions */}
        {totalMonthlyContribution === 0 && targetAmount > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Selecteer panden of voeg een extra maandelijkse inleg toe om je FIRE-doel te bereiken.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
