// Rendements calculations for property investment analyzer

/**
 * Calculate DSCR (Debt Service Coverage Ratio)
 * Formula: NOI / Annual Debt Service
 */
export function calculateDSCR(noi: number, annualDebtService: number): number {
  if (annualDebtService <= 0) return Infinity;
  return Math.round((noi / annualDebtService) * 100) / 100;
}

/**
 * Calculate BAR (Bruto Aanvangsrendement / Gross Initial Yield)
 * Formula: (Annual Gross Rent / Purchase Price) × 100
 */
export function calculateBAR(annualGrossRent: number, purchasePrice: number): number {
  if (purchasePrice <= 0) return 0;
  return Math.round((annualGrossRent / purchasePrice) * 100 * 100) / 100;
}

/**
 * Calculate NAR (Netto Aanvangsrendement / Net Initial Yield)
 * Formula: (Annual NOI / Total Investment) × 100
 */
export function calculateNAR(annualNOI: number, totalInvestment: number): number {
  if (totalInvestment <= 0) return 0;
  return Math.round((annualNOI / totalInvestment) * 100 * 100) / 100;
}

/**
 * Calculate Cash-on-Cash Return
 * Formula: (Annual Net Cashflow / Own Capital) × 100
 */
export function calculateCashOnCash(annualNetCashflow: number, ownCapital: number): number {
  if (ownCapital <= 0) return 0;
  return Math.round((annualNetCashflow / ownCapital) * 100 * 100) / 100;
}

/**
 * Calculate break-even occupancy rate
 * Formula: (Operating Expenses + Debt Service) / Potential Gross Income × 100
 */
export function calculateBreakEvenOccupancy(
  operatingExpenses: number,
  annualDebtService: number,
  potentialGrossIncome: number
): number {
  if (potentialGrossIncome <= 0) return 100;
  const result = ((operatingExpenses + annualDebtService) / potentialGrossIncome) * 100;
  return Math.round(Math.min(100, result) * 100) / 100;
}

/**
 * Calculate IRR using Newton-Raphson method
 * Approximates XIRR functionality
 */
export function calculateIRR(cashflows: number[], maxIterations: number = 100): number {
  if (cashflows.length < 2) return 0;
  
  // Initial guess
  let rate = 0.1;
  const tolerance = 0.0001;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;
    
    for (let j = 0; j < cashflows.length; j++) {
      const denominator = Math.pow(1 + rate, j);
      npv += cashflows[j] / denominator;
      if (j > 0) {
        derivative -= j * cashflows[j] / Math.pow(1 + rate, j + 1);
      }
    }
    
    if (Math.abs(npv) < tolerance) {
      return Math.round(rate * 100 * 100) / 100;
    }
    
    if (Math.abs(derivative) < 0.0001) break;
    
    rate = rate - npv / derivative;
    
    // Bound the rate
    if (rate < -0.99) rate = -0.5;
    if (rate > 10) rate = 0.5;
  }
  
  return Math.round(rate * 100 * 100) / 100;
}

/**
 * Generate yearly cashflow projection
 */
export interface YearlyCashflow {
  year: number;
  grossRent: number;
  opex: number;
  noi: number;
  debtService: number;
  netCashflow: number;
  cumulativeCashflow: number;
}

export interface ExitAnalysis {
  marketValue: number;
  remainingDebt: number;
  netExit: number;
  totalReturn: number;
}

export interface InvestmentAnalysis {
  // Inputs summary
  totalInvestment: number;
  ownCapital: number;
  loanAmount: number;
  
  // KPIs
  bar: number;
  nar: number;
  cashOnCash: number;
  dscr: number;
  irr: number;
  breakEvenOccupancy: number;
  
  // Projections
  yearlyCashflows: YearlyCashflow[];
  exitAnalysis: ExitAnalysis;
}

export interface AnalysisInputs {
  // Purchase
  purchasePrice: number;
  imt: number;
  notaryFees: number;
  renovationCosts: number;
  furnishingCosts: number;
  
  // Mortgage
  ltv: number; // percentage
  interestRate: number; // percentage
  loanTermYears: number;
  
  // Rental Income
  monthlyRentLT: number; // Long-term monthly rent
  stOccupancy: number; // Short-term occupancy percentage
  stADR: number; // Short-term Average Daily Rate
  rentalType: 'longterm' | 'shortterm' | 'mixed';
  
  // OPEX
  managementPercent: number;
  maintenanceYearly: number;
  imiYearly: number;
  insuranceYearly: number;
  condoMonthly: number;
  utilitiesMonthly: number;
  
  // Assumptions
  rentGrowth: number; // percentage
  costGrowth: number; // percentage
  valueGrowth: number; // percentage
  
  // Time horizon
  years: number;
}

/**
 * Calculate annual gross rent based on rental type
 */
function calculateAnnualGrossRent(inputs: AnalysisInputs): number {
  if (inputs.rentalType === 'longterm') {
    return inputs.monthlyRentLT * 12;
  } else if (inputs.rentalType === 'shortterm') {
    const daysPerYear = 365;
    const occupiedDays = daysPerYear * (inputs.stOccupancy / 100);
    return occupiedDays * inputs.stADR;
  } else {
    // Mixed: assume 6 months LT, 6 months ST
    const ltIncome = inputs.monthlyRentLT * 6;
    const stDays = 180 * (inputs.stOccupancy / 100);
    const stIncome = stDays * inputs.stADR;
    return ltIncome + stIncome;
  }
}

/**
 * Calculate annual OPEX
 */
function calculateAnnualOPEX(grossRent: number, inputs: AnalysisInputs): number {
  const management = grossRent * (inputs.managementPercent / 100);
  const maintenance = inputs.maintenanceYearly;
  const imi = inputs.imiYearly;
  const insurance = inputs.insuranceYearly;
  const condo = inputs.condoMonthly * 12;
  const utilities = inputs.utilitiesMonthly * 12;
  
  return management + maintenance + imi + insurance + condo + utilities;
}

/**
 * Calculate mortgage payment (PMT)
 */
function calculatePMT(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate <= 0) return principal / (years * 12);
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  
  const pmt = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
              (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return pmt;
}

/**
 * Calculate remaining loan balance after n years
 */
function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  totalYears: number,
  yearsElapsed: number
): number {
  if (principal <= 0 || totalYears <= 0) return 0;
  if (yearsElapsed >= totalYears) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = totalYears * 12;
  const paymentsMade = yearsElapsed * 12;
  const pmt = calculatePMT(principal, annualRate, totalYears);
  
  if (annualRate <= 0) {
    return principal - (pmt * paymentsMade);
  }
  
  const balance = principal * Math.pow(1 + monthlyRate, paymentsMade) - 
                  pmt * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate);
  
  return Math.max(0, balance);
}

/**
 * Main analysis function - generates complete investment analysis
 */
export function analyzeInvestment(inputs: AnalysisInputs): InvestmentAnalysis {
  // Calculate total investment and financing
  const totalInvestment = inputs.purchasePrice + inputs.imt + inputs.notaryFees + 
                          inputs.renovationCosts + inputs.furnishingCosts;
  const loanAmount = inputs.purchasePrice * (inputs.ltv / 100);
  const ownCapital = totalInvestment - loanAmount;
  
  // Calculate mortgage payment
  const monthlyMortgage = calculatePMT(loanAmount, inputs.interestRate, inputs.loanTermYears);
  const annualDebtService = monthlyMortgage * 12;
  
  // Generate yearly cashflow projections
  const yearlyCashflows: YearlyCashflow[] = [];
  let cumulativeCashflow = -ownCapital; // Initial investment as negative
  const cashflowsForIRR: number[] = [-ownCapital];
  
  let currentGrossRent = calculateAnnualGrossRent(inputs);
  let currentOPEX = calculateAnnualOPEX(currentGrossRent, inputs);
  
  for (let year = 1; year <= inputs.years; year++) {
    // Apply growth rates
    if (year > 1) {
      currentGrossRent *= (1 + inputs.rentGrowth / 100);
      currentOPEX *= (1 + inputs.costGrowth / 100);
    }
    
    const noi = currentGrossRent - currentOPEX;
    const netCashflow = noi - annualDebtService;
    cumulativeCashflow += netCashflow;
    
    yearlyCashflows.push({
      year,
      grossRent: Math.round(currentGrossRent * 100) / 100,
      opex: Math.round(currentOPEX * 100) / 100,
      noi: Math.round(noi * 100) / 100,
      debtService: Math.round(annualDebtService * 100) / 100,
      netCashflow: Math.round(netCashflow * 100) / 100,
      cumulativeCashflow: Math.round(cumulativeCashflow * 100) / 100,
    });
    
    cashflowsForIRR.push(netCashflow);
  }
  
  // Exit analysis
  const marketValue = inputs.purchasePrice * Math.pow(1 + inputs.valueGrowth / 100, inputs.years);
  const remainingDebt = calculateRemainingBalance(
    loanAmount,
    inputs.interestRate,
    inputs.loanTermYears,
    inputs.years
  );
  const netExit = marketValue - remainingDebt;
  const totalReturn = cumulativeCashflow + netExit;
  
  // Add exit value to IRR calculation
  cashflowsForIRR[cashflowsForIRR.length - 1] += netExit;
  
  // Calculate KPIs (based on year 1)
  const year1GrossRent = calculateAnnualGrossRent(inputs);
  const year1OPEX = calculateAnnualOPEX(year1GrossRent, inputs);
  const year1NOI = year1GrossRent - year1OPEX;
  const year1NetCashflow = year1NOI - annualDebtService;
  
  const bar = calculateBAR(year1GrossRent, inputs.purchasePrice);
  const nar = calculateNAR(year1NOI, totalInvestment);
  const cashOnCash = calculateCashOnCash(year1NetCashflow, ownCapital);
  const dscr = calculateDSCR(year1NOI, annualDebtService);
  const breakEvenOccupancy = calculateBreakEvenOccupancy(year1OPEX, annualDebtService, year1GrossRent);
  const irr = calculateIRR(cashflowsForIRR);
  
  return {
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    ownCapital: Math.round(ownCapital * 100) / 100,
    loanAmount: Math.round(loanAmount * 100) / 100,
    bar,
    nar,
    cashOnCash,
    dscr,
    irr,
    breakEvenOccupancy,
    yearlyCashflows,
    exitAnalysis: {
      marketValue: Math.round(marketValue * 100) / 100,
      remainingDebt: Math.round(remainingDebt * 100) / 100,
      netExit: Math.round(netExit * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
    },
  };
}

/**
 * Get risk assessment based on KPIs
 */
export function getRiskAssessment(analysis: InvestmentAnalysis): {
  level: 'good' | 'moderate' | 'risky';
  color: 'success' | 'warning' | 'destructive';
  reasons: string[];
} {
  const reasons: string[] = [];
  let riskScore = 0;
  
  // DSCR check
  if (analysis.dscr >= 1.2) {
    reasons.push('DSCR > 1.2: Goede dekking van hypotheeklasten');
  } else if (analysis.dscr >= 1.0) {
    reasons.push('DSCR tussen 1.0-1.2: Krappe marge');
    riskScore += 1;
  } else {
    reasons.push('DSCR < 1.0: Negatieve cashflow!');
    riskScore += 2;
  }
  
  // IRR check
  if (analysis.irr >= 12) {
    reasons.push('IRR > 12%: Uitstekend rendement');
  } else if (analysis.irr >= 8) {
    reasons.push('IRR 8-12%: Redelijk rendement');
    riskScore += 1;
  } else {
    reasons.push('IRR < 8%: Laag rendement');
    riskScore += 2;
  }
  
  // Cash-on-Cash check
  if (analysis.cashOnCash >= 8) {
    reasons.push('Cash-on-Cash > 8%: Goed rendement op eigen geld');
  } else if (analysis.cashOnCash >= 4) {
    reasons.push('Cash-on-Cash 4-8%: Matig rendement');
    riskScore += 1;
  } else {
    reasons.push('Cash-on-Cash < 4%: Laag rendement');
    riskScore += 2;
  }
  
  // Break-even check
  if (analysis.breakEvenOccupancy <= 60) {
    reasons.push('Break-even < 60%: Veel marge bij leegstand');
  } else if (analysis.breakEvenOccupancy <= 80) {
    reasons.push('Break-even 60-80%: Acceptabele marge');
    riskScore += 1;
  } else {
    reasons.push('Break-even > 80%: Weinig marge bij leegstand');
    riskScore += 2;
  }
  
  if (riskScore <= 1) {
    return { level: 'good', color: 'success', reasons };
  } else if (riskScore <= 3) {
    return { level: 'moderate', color: 'warning', reasons };
  } else {
    return { level: 'risky', color: 'destructive', reasons };
  }
}

/**
 * Metric explanations for non-experts
 */
export const metricExplanations: Record<string, { title: string; explanation: string; importance: string }> = {
  bar: {
    title: 'BAR (Bruto Aanvangsrendement)',
    explanation: 'Hoeveel procent huur je jaarlijks ontvangt ten opzichte van de aankoopprijs.',
    importance: 'Handig om snel panden met elkaar te vergelijken. Hoe hoger, hoe beter.',
  },
  nar: {
    title: 'NAR (Netto Aanvangsrendement)',
    explanation: 'Je werkelijke rendement na aftrek van onderhoud, belastingen en verzekering.',
    importance: 'Geeft een realistisch beeld van je winst, rekening houdend met kosten.',
  },
  cashOnCash: {
    title: 'Cash-on-Cash Rendement',
    explanation: 'Hoeveel procent rendement je maakt op je eigen ingelegde geld.',
    importance: 'Meet de efficiëntie van je investering. Hoe minder eigen geld voor hetzelfde rendement, hoe beter.',
  },
  dscr: {
    title: 'DSCR (Debt Service Coverage Ratio)',
    explanation: 'Hoeveel keer je huurinkomsten je hypotheek kunnen betalen. >1.2 is veilig.',
    importance: 'Banken kijken hier naar bij financiering. Jij ook! Het toont hoeveel buffer je hebt.',
  },
  irr: {
    title: 'IRR (Internal Rate of Return)',
    explanation: 'Je gemiddelde jaarlijkse rendement over de hele houdduur, inclusief verkoop.',
    importance: 'De ultieme maat voor rendabiliteit. Houdt rekening met de waarde van geld in de tijd.',
  },
  breakEvenOccupancy: {
    title: 'Break-even Bezetting',
    explanation: 'De minimale bezetting die je nodig hebt om je hypotheek te betalen.',
    importance: 'Risicometing bij toeristische verhuur. Hoe lager, hoe minder risico bij leegstand.',
  },
  ltv: {
    title: 'LTV (Loan-to-Value)',
    explanation: 'Hoeveel procent je leent van de aankoopprijs. 75% LTV = je betaalt 25% zelf.',
    importance: 'Hogere LTV = hoger rendement op eigen geld, maar ook hoger risico.',
  },
};
