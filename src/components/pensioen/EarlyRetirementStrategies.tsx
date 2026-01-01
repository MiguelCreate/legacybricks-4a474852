import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  Lightbulb, TrendingUp, Building2, PiggyBank, 
  Clock, DoorOpen, ArrowUp, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Loan = Tables<"loans">;

interface Strategy {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  result: string;
  achievable: boolean;
  details: string[];
  priority: "high" | "medium" | "low";
}

interface EarlyRetirementStrategiesProps {
  totalSavingsNeeded: number;
  yearsToDesiredRetirement: number;
  monthlyGapPreRetirement: number;
  netRentalIncome: number;
  properties: Property[];
  loans: Loan[];
  desiredIncome: number;
  incomePreRetirement: number;
}

// Calculate remaining loan balance
function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  totalYears: number,
  yearsElapsed: number
): number {
  if (principal <= 0 || totalYears <= 0) return 0;
  if (yearsElapsed >= totalYears) return 0;
  if (annualRate <= 0) return principal * (1 - yearsElapsed / totalYears);
  
  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = totalYears * 12;
  const paymentsMade = yearsElapsed * 12;
  
  const pmt = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
              (Math.pow(1 + monthlyRate, totalPayments) - 1);
  
  const balance = principal * Math.pow(1 + monthlyRate, paymentsMade) - 
                  pmt * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate);
  
  return Math.max(0, balance);
}

export function EarlyRetirementStrategies({
  totalSavingsNeeded,
  yearsToDesiredRetirement,
  monthlyGapPreRetirement,
  netRentalIncome,
  properties,
  loans,
  desiredIncome,
  incomePreRetirement,
}: EarlyRetirementStrategiesProps) {
  const strategies = useMemo<Strategy[]>(() => {
    const result: Strategy[] = [];
    
    if (totalSavingsNeeded <= 0) {
      return []; // No strategies needed if already covered
    }
    
    // Strategy 1: Monthly savings from current cashflow
    const monthlySavingsNeeded = yearsToDesiredRetirement > 0 
      ? totalSavingsNeeded / (yearsToDesiredRetirement * 12) 
      : totalSavingsNeeded;
    
    // Calculate "leftover" cashflow (assume some buffer is already used)
    const availableCashflowForSaving = Math.max(0, netRentalIncome * 0.5); // Assume 50% can be saved
    const yearsNeededWithCashflow = availableCashflowForSaving > 0 
      ? totalSavingsNeeded / (availableCashflowForSaving * 12) 
      : Infinity;
    
    result.push({
      id: "cashflow-saving",
      title: "Sparen van Resterende Cashflow",
      description: `Als je 50% van je netto huurinkomsten kunt sparen (€${Math.round(availableCashflowForSaving).toLocaleString()}/mnd)`,
      icon: <PiggyBank className="w-5 h-5" />,
      result: availableCashflowForSaving > 0 
        ? yearsNeededWithCashflow <= yearsToDesiredRetirement 
          ? `✓ Je bereikt je doel in ${Math.round(yearsNeededWithCashflow * 10) / 10} jaar`
          : `Na ${Math.round(yearsNeededWithCashflow * 10) / 10} jaar (${Math.round(yearsNeededWithCashflow - yearsToDesiredRetirement)} jaar later dan gewenst)`
        : "Geen resterende cashflow beschikbaar",
      achievable: yearsNeededWithCashflow <= yearsToDesiredRetirement,
      details: [
        `Maandelijks nodig om in tijd te sparen: €${Math.round(monthlySavingsNeeded).toLocaleString()}`,
        `Beschikbaar uit cashflow (50%): €${Math.round(availableCashflowForSaving).toLocaleString()}/mnd`,
        availableCashflowForSaving >= monthlySavingsNeeded 
          ? "Dit is voldoende om je doel te halen!" 
          : `Tekort: €${Math.round(monthlySavingsNeeded - availableCashflowForSaving).toLocaleString()}/mnd extra nodig`,
      ],
      priority: availableCashflowForSaving >= monthlySavingsNeeded ? "high" : "medium",
    });
    
    // Strategy 2-4: Property exit scenarios
    const exitYears = [5, 10, 20];
    
    for (const years of exitYears) {
      let totalNetExit = 0;
      const propertyDetails: string[] = [];
      
      for (const property of properties) {
        const purchasePrice = Number(property.aankoopprijs || 0);
        const valueGrowth = Number(property.waardegroei_percentage || 2);
        const futureValue = purchasePrice * Math.pow(1 + valueGrowth / 100, years);
        
        // Find loan for this property
        const propertyLoan = loans.find(l => l.property_id === property.id);
        let remainingDebt = 0;
        
        if (propertyLoan) {
          const principal = Number(propertyLoan.hoofdsom || 0);
          const interestRate = Number(propertyLoan.rente_percentage || 3);
          const loanTerm = Number(propertyLoan.looptijd_jaren || 30);
          remainingDebt = calculateRemainingBalance(principal, interestRate, loanTerm, years);
        }
        
        const netExit = futureValue - remainingDebt;
        totalNetExit += netExit;
        
        propertyDetails.push(
          `${property.naam}: €${Math.round(futureValue).toLocaleString()} - €${Math.round(remainingDebt).toLocaleString()} schuld = €${Math.round(netExit).toLocaleString()}`
        );
      }
      
      const isAchievable = totalNetExit >= totalSavingsNeeded;
      const coverage = totalSavingsNeeded > 0 ? (totalNetExit / totalSavingsNeeded) * 100 : 0;
      
      result.push({
        id: `exit-${years}`,
        title: `Pand(en) Verkopen na ${years} Jaar`,
        description: `Verkoop al je panden na ${years} jaar en gebruik de opbrengst om eerder te stoppen`,
        icon: <DoorOpen className="w-5 h-5" />,
        result: isAchievable 
          ? `✓ Opbrengst €${Math.round(totalNetExit).toLocaleString()} dekt je spaardoel volledig!`
          : `Opbrengst €${Math.round(totalNetExit).toLocaleString()} (${Math.round(coverage)}% van benodigd)`,
        achievable: isAchievable,
        details: propertyDetails.length > 0 ? propertyDetails : ["Geen panden beschikbaar"],
        priority: isAchievable ? "high" : "low",
      });
    }
    
    // Strategy 5: Increase rental income
    const additionalRentNeeded = monthlyGapPreRetirement;
    const percentageIncrease = incomePreRetirement > 0 
      ? (additionalRentNeeded / incomePreRetirement) * 100 
      : 0;
    
    result.push({
      id: "increase-rent",
      title: "Verhoog je Huurinkomsten",
      description: "Sluit het gat door hogere huur of extra panden",
      icon: <ArrowUp className="w-5 h-5" />,
      result: `Je hebt €${Math.round(additionalRentNeeded).toLocaleString()}/mnd extra nodig`,
      achievable: percentageIncrease < 50,
      details: [
        `Huidig passief inkomen: €${Math.round(incomePreRetirement).toLocaleString()}/mnd`,
        `Gewenst inkomen: €${Math.round(desiredIncome).toLocaleString()}/mnd`,
        percentageIncrease > 0 
          ? `Dit is een stijging van ${Math.round(percentageIncrease)}%` 
          : "Je inkomen dekt al je wensen!",
        "Opties: huurverhoging, extra kamers verhuren, of een nieuw pand aankopen",
      ],
      priority: percentageIncrease < 30 ? "high" : "medium",
    });
    
    // Strategy 6: Combination strategy
    const halfFromSavings = totalSavingsNeeded / 2;
    const halfFromExit = totalSavingsNeeded / 2;
    
    const monthlySavingsForHalf = yearsToDesiredRetirement > 0 
      ? halfFromSavings / (yearsToDesiredRetirement * 12) 
      : halfFromSavings;
    
    // Check if selling 1 property after 10 years could cover half
    const bestProperty = properties.reduce((best, property) => {
      const purchasePrice = Number(property.aankoopprijs || 0);
      const valueGrowth = Number(property.waardegroei_percentage || 2);
      const futureValue = purchasePrice * Math.pow(1 + valueGrowth / 100, 10);
      
      const propertyLoan = loans.find(l => l.property_id === property.id);
      let remainingDebt = 0;
      
      if (propertyLoan) {
        const principal = Number(propertyLoan.hoofdsom || 0);
        const interestRate = Number(propertyLoan.rente_percentage || 3);
        const loanTerm = Number(propertyLoan.looptijd_jaren || 30);
        remainingDebt = calculateRemainingBalance(principal, interestRate, loanTerm, 10);
      }
      
      const netExit = futureValue - remainingDebt;
      return netExit > (best?.netExit || 0) ? { property, netExit } : best;
    }, null as { property: Property; netExit: number } | null);
    
    if (properties.length > 1 && bestProperty) {
      result.push({
        id: "combination",
        title: "Combinatiestrategie",
        description: "Deel sparen + deel uit pandverkoop",
        icon: <Lightbulb className="w-5 h-5" />,
        result: bestProperty.netExit >= halfFromExit 
          ? `✓ Verkoop 1 pand + spaar €${Math.round(monthlySavingsForHalf).toLocaleString()}/mnd`
          : `Verkoop ${bestProperty.property.naam} + aanvullend sparen`,
        achievable: bestProperty.netExit >= halfFromExit && monthlySavingsForHalf <= netRentalIncome,
        details: [
          `Verkoop "${bestProperty.property.naam}" na 10 jaar: €${Math.round(bestProperty.netExit).toLocaleString()}`,
          `Aanvullend sparen: €${Math.round(halfFromSavings).toLocaleString()} = €${Math.round(monthlySavingsForHalf).toLocaleString()}/mnd`,
          `Totaal: €${Math.round(bestProperty.netExit + halfFromSavings).toLocaleString()}`,
        ],
        priority: "high",
      });
    }
    
    // Strategy 7: Work part-time longer
    const partTimeYears = Math.ceil(totalSavingsNeeded / (desiredIncome * 12 * 0.5)); // 50% income for longer
    
    result.push({
      id: "part-time",
      title: "Deeltijd Blijven Werken",
      description: "Langer doorwerken in deeltijd om de overbrugging te verkleinen",
      icon: <Clock className="w-5 h-5" />,
      result: `${partTimeYears} jaar extra parttimen kan je spaarbehoefte halveren`,
      achievable: true,
      details: [
        `In plaats van volledig stoppen op ${yearsToDesiredRetirement > 0 ? "je gewenste leeftijd" : "nu"}`,
        `Werk nog ${partTimeYears} jaar parttime (50%) door`,
        `Dit genereert ~€${Math.round(desiredIncome * 0.5 * 12 * partTimeYears).toLocaleString()} extra`,
        "En je hoeft minder lang op spaargeld te teren",
      ],
      priority: "low",
    });
    
    // Sort by achievability and priority
    return result.sort((a, b) => {
      if (a.achievable && !b.achievable) return -1;
      if (!a.achievable && b.achievable) return 1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [totalSavingsNeeded, yearsToDesiredRetirement, monthlyGapPreRetirement, netRentalIncome, properties, loans, desiredIncome, incomePreRetirement]);

  if (totalSavingsNeeded <= 0) {
    return (
      <Card className="shadow-card border-success/30 bg-success/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Je Bent al op Koers!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Je passieve inkomsten dekken al je gewenste inkomen. Je hebt geen extra spaarpot nodig om eerder te stoppen met werken.
          </p>
        </CardContent>
      </Card>
    );
  }

  const [isOpen, setIsOpen] = useState(false);
  const achievableCount = strategies.filter(s => s.achievable).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="shadow-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                Strategieën om Eerder te Stoppen
                {achievableCount > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-success/20 text-success rounded-full">
                    {achievableCount} haalbaar
                  </span>
                )}
                <InfoTooltip 
                  title="Gepersonaliseerde Strategieën"
                  content="Op basis van je panden, cashflow en doelen geven we je concrete opties om je spaardoel te bereiken en eerder te stoppen met werken."
                />
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                <strong>Doel:</strong> €{Math.round(totalSavingsNeeded).toLocaleString()} sparen in{" "}
                {yearsToDesiredRetirement > 0 ? `${Math.round(yearsToDesiredRetirement)} jaar` : "korte tijd"}
              </p>
            </div>
            
            <div className="grid gap-4">
              {strategies.map((strategy) => (
                <div 
                  key={strategy.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    strategy.achievable 
                      ? "bg-success/5 border-success/30" 
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      strategy.achievable ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {strategy.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground">{strategy.title}</h3>
                        {strategy.achievable && (
                          <span className="text-xs px-2 py-0.5 bg-success/20 text-success rounded-full">
                            Haalbaar
                          </span>
                        )}
                        {strategy.priority === "high" && !strategy.achievable && (
                          <span className="text-xs px-2 py-0.5 bg-warning/20 text-warning rounded-full">
                            Kansrijk
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                      <p className={`text-sm font-medium mt-2 ${
                        strategy.achievable ? "text-success" : "text-foreground"
                      }`}>
                        {strategy.result}
                      </p>
                      
                      <div className="mt-3 space-y-1">
                        {strategy.details.map((detail, idx) => (
                          <p key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">
                <strong>Tip:</strong> Combineer meerdere strategieën voor het beste resultaat. 
                Bijvoorbeeld: spaar een deel van je cashflow én plan de verkoop van een pand rond je gewenste pensioenleeftijd.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
