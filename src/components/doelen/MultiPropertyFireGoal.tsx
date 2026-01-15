import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Flame, Building2, TrendingUp, Euro, AlertTriangle, 
  ChevronRight, Target, PiggyBank
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
  targetAmount: number;
  currentAmount: number;
  manualMonthlyContribution: number;
  onContributionsChange: (contributions: PropertyContribution[]) => void;
  contributions: PropertyContribution[];
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
  
  // IRS estimate (28% of net rent)
  const netBeforeTax = monthlyRent - imi - insurance - maintenance - vacancy - management;
  const irsEstimate = netBeforeTax > 0 ? netBeforeTax * 0.28 : 0;
  
  return monthlyRent - mortgagePayment - imi - insurance - maintenance - vacancy - management - irsEstimate;
};

export const MultiPropertyFireGoal = ({
  properties,
  loans,
  tenants,
  targetAmount,
  currentAmount,
  manualMonthlyContribution,
  onContributionsChange,
  contributions
}: MultiPropertyFireGoalProps) => {
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
  const progress = (currentAmount / targetAmount) * 100;

  const toggleProperty = (propertyId: string, enabled: boolean) => {
    const existing = contributions.find(c => c.propertyId === propertyId);
    if (existing) {
      onContributionsChange(
        contributions.map(c => 
          c.propertyId === propertyId ? { ...c, enabled } : c
        )
      );
    } else {
      onContributionsChange([
        ...contributions,
        { propertyId, enabled, percentageContribution: 100 }
      ]);
    }
  };

  const updatePercentage = (propertyId: string, percentage: number) => {
    const existing = contributions.find(c => c.propertyId === propertyId);
    if (existing) {
      onContributionsChange(
        contributions.map(c => 
          c.propertyId === propertyId ? { ...c, percentageContribution: percentage } : c
        )
      );
    } else {
      onContributionsChange([
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
          FIRE Doel - Multi-Property Strategie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Voortgang</span>
            <span className="font-medium">{formatCurrency(currentAmount)} / {formatCurrency(targetAmount)}</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(1)}% bereikt</span>
            <span>
              {monthsToGoal < Infinity 
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
                          {formatCurrency(cashflow)}/mnd cashflow
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
              Voeg eerst panden toe met huurinkomsten die de kosten dekken
            </p>
          </div>
        )}

        {/* FIRE Insights */}
        {totalMonthlyContribution > 0 && (
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-orange-700">
              <Target className="w-4 h-4" />
              FIRE Inzichten
            </h4>
            <ul className="text-sm text-orange-700/80 space-y-1">
              <li>• Jaarlijkse opbouw: {formatCurrency(totalMonthlyContribution * 12)}</li>
              <li>• Na 5 jaar: {formatCurrency(currentAmount + totalMonthlyContribution * 60)}</li>
              <li>• Na 10 jaar: {formatCurrency(currentAmount + totalMonthlyContribution * 120)}</li>
              {yearsToGoal < 30 && (
                <li className="font-medium">• FIRE bereikt over {yearsToGoal.toFixed(1)} jaar! 🔥</li>
              )}
            </ul>
          </div>
        )}

        {/* Warning if no contributions */}
        {totalMonthlyContribution === 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-700 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Selecteer panden of voeg een handmatige maandelijkse inleg toe om je FIRE-doel te bereiken.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
