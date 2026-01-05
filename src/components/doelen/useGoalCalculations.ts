import { useMemo } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { calculatePropertyCashflow, TenantRent } from "@/lib/financialCalculations";

type Property = Tables<"properties">;
type Goal = Tables<"goals">;
type Loan = Tables<"loans">;
type Tenant = Tables<"tenants">;

interface GoalBron {
  id: string;
  goal_id: string;
  property_id: string | null;
  percentage_bijdrage: number;
}

interface CalculationResult {
  totalMonthlySurplus: number;
  monthlyContribution: number;
  monthsToGoal: number | null;
  yearsToGoal: number | null;
  estimatedEndDate: Date | null;
  cashflowImpact: number;
  wealthImpact: number;
  riskLevel: "low" | "medium" | "high";
  conflictWarnings: string[];
}

/**
 * Calculate property surplus using the consistent calculatePropertyCashflow function.
 * This ensures the same calculation as the Dashboard.
 */
export const calculatePropertySurplus = (
  property: Property,
  loans: Loan[],
  tenants?: Tenant[]
): number => {
  // Get active tenants for this property
  const propertyTenants = tenants?.filter(t => t.property_id === property.id && t.actief) || [];
  
  // Calculate total monthly rent from active tenants, or fall back to property.maandelijkse_huur
  const totalMonthlyRent = propertyTenants.length > 0
    ? propertyTenants.reduce((sum, t) => sum + Number(t.huurbedrag || 0), 0)
    : Number(property.maandelijkse_huur || 0);
  
  // Loan costs for this property
  const propertyLoans = loans.filter(l => l.property_id === property.id);
  const monthlyLoanPayments = propertyLoans.reduce(
    (sum, loan) => sum + Number(loan.maandlast || 0),
    0
  );
  
  // Build tenant rents for IRS calculation (per-tenant)
  const tenantRents: TenantRent[] = propertyTenants.map(t => ({
    monthlyRent: Number(t.huurbedrag || 0),
  }));
  
  // Use the same calculation as Dashboard
  const cashflow = calculatePropertyCashflow(
    totalMonthlyRent,
    Number(property.subsidie_bedrag || 0),
    monthlyLoanPayments,
    Number(property.waardering || property.aankoopprijs),
    Number(property.imi_percentage || 0.003),
    Number(property.verzekering_jaarlijks || 0),
    Number(property.onderhoud_jaarlijks || 0),
    Number(property.leegstand_buffer_percentage || 5),
    Number(property.beheerkosten_percentage || 0),
    Number(property.condominium_maandelijks || 0) + Number(property.vve_maandbijdrage || 0),
    undefined,
    tenantRents.length > 0 ? tenantRents : undefined
  );
  
  return cashflow.netCashflow;
};

export const useGoalCalculations = (
  goal: Goal,
  properties: Property[],
  loans: Loan[],
  goalBronnen: GoalBron[],
  allGoals: Goal[],
  tenants?: Tenant[]
): CalculationResult => {
  return useMemo(() => {
    const remaining = Number(goal.doelbedrag) - Number(goal.huidig_bedrag);
    const manualContribution = Number(goal.maandelijkse_inleg || 0);
    
    // Calculate surplus from linked properties
    const linkedBronnen = goalBronnen.filter(b => b.goal_id === goal.id);
    let propertySurplus = 0;
    
    // Also check legacy bron_property_id for backwards compatibility
    if (goal.bron_property_id && linkedBronnen.length === 0) {
      const property = properties.find(p => p.id === goal.bron_property_id);
      if (property) {
        propertySurplus = calculatePropertySurplus(property, loans, tenants);
      }
    } else {
      linkedBronnen.forEach(bron => {
        const property = properties.find(p => p.id === bron.property_id);
        if (property) {
          const surplus = calculatePropertySurplus(property, loans, tenants);
          propertySurplus += surplus * (Number(bron.percentage_bijdrage) / 100);
        }
      });
    }
    
    const totalMonthlySurplus = propertySurplus;
    // Use manual contribution + 10% of property surplus
    const monthlyContribution = manualContribution + (propertySurplus > 0 ? propertySurplus * 0.1 : 0);
    
    let monthsToGoal: number | null = null;
    let yearsToGoal: number | null = null;
    let estimatedEndDate: Date | null = null;
    
    if (remaining <= 0) {
      monthsToGoal = 0;
      yearsToGoal = 0;
    } else if (monthlyContribution > 0) {
      monthsToGoal = Math.ceil(remaining / monthlyContribution);
      yearsToGoal = monthsToGoal / 12;
      estimatedEndDate = new Date();
      estimatedEndDate.setMonth(estimatedEndDate.getMonth() + monthsToGoal);
    }
    
    // Impact calculations
    const cashflowImpact = -monthlyContribution; // Money flowing out
    const wealthImpact = Number(goal.doelbedrag); // Future wealth once achieved
    
    // Risk assessment
    let riskLevel: "low" | "medium" | "high" = "low";
    const conflictWarnings: string[] = [];
    
    // Check for conflicts with other goals
    const activeGoals = allGoals.filter(g => !g.bereikt && g.id !== goal.id);
    const totalMonthlyCommitments = activeGoals.reduce((sum, g) => {
      return sum + Number(g.maandelijkse_inleg || 0);
    }, 0) + monthlyContribution;
    
    // If total commitments exceed surplus, warn
    if (totalMonthlySurplus > 0 && totalMonthlyCommitments > totalMonthlySurplus * 0.5) {
      riskLevel = "medium";
      conflictWarnings.push("Je committeert meer dan 50% van je overschot aan doelen");
    }
    
    if (totalMonthlySurplus > 0 && totalMonthlyCommitments > totalMonthlySurplus * 0.8) {
      riskLevel = "high";
      conflictWarnings.push("Je committeert bijna al je overschot - let op je liquiditeit!");
    }
    
    // Check for specific goal conflicts
    const hasNoodbuffer = activeGoals.some(g => g.doel_type === "noodbuffer" && Number(g.huidig_bedrag) >= Number(g.doelbedrag) * 0.5);
    const isBuyingProperty = goal.doel_type === "eerste_pand" || goal.doel_type === "volgend_pand";
    
    if (isBuyingProperty && !hasNoodbuffer) {
      conflictWarnings.push("Tip: Zorg eerst voor een noodbuffer voordat je een pand koopt");
    }
    
    // Check if goal end date is before target
    if (goal.eind_datum && estimatedEndDate) {
      const targetDate = new Date(goal.eind_datum);
      if (estimatedEndDate > targetDate) {
        conflictWarnings.push(`Huidige inleg haalt de deadline niet - verhoog je inleg of pas de datum aan`);
        riskLevel = "high";
      }
    }
    
    return {
      totalMonthlySurplus,
      monthlyContribution,
      monthsToGoal,
      yearsToGoal,
      estimatedEndDate,
      cashflowImpact,
      wealthImpact,
      riskLevel,
      conflictWarnings,
    };
  }, [goal, properties, loans, goalBronnen, allGoals, tenants]);
};

// Scenario comparison helper
export const calculateScenarioImpact = (
  originalGoal: Goal,
  modifiedGoal: Partial<Goal>,
  properties: Property[],
  loans: Loan[],
  goalBronnen: GoalBron[],
  allGoals: Goal[]
) => {
  const mergedGoal = { ...originalGoal, ...modifiedGoal } as Goal;
  
  // Calculate original timeline
  const remaining = Number(originalGoal.doelbedrag) - Number(originalGoal.huidig_bedrag);
  const originalContribution = Number(originalGoal.maandelijkse_inleg || 0);
  const originalMonths = originalContribution > 0 ? Math.ceil(remaining / originalContribution) : null;
  
  // Calculate new timeline
  const newRemaining = Number(mergedGoal.doelbedrag) - Number(mergedGoal.huidig_bedrag);
  const newContribution = Number(mergedGoal.maandelijkse_inleg || 0);
  const newMonths = newContribution > 0 ? Math.ceil(newRemaining / newContribution) : null;
  
  return {
    monthsDifference: originalMonths && newMonths ? newMonths - originalMonths : null,
    contributionDifference: newContribution - originalContribution,
    amountDifference: Number(mergedGoal.doelbedrag) - Number(originalGoal.doelbedrag),
  };
};
