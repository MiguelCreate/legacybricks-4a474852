// Financial calculation utilities for Portuguese real estate
import { calculateIRS } from '@/lib/portugueseTaxCalculations';
/**
 * Calculate PMT (monthly payment) for a loan
 * Formula: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculatePMT(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate <= 0) return principal / (years * 12);
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  
  const pmt = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
              (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return Math.round(pmt * 100) / 100;
}

/**
 * Calculate remaining balance after n payments
 */
export function calculateRemainingBalance(
  principal: number, 
  annualRate: number, 
  years: number, 
  paymentsMade: number
): number {
  if (principal <= 0 || years <= 0) return 0;
  if (paymentsMade >= years * 12) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const pmt = calculatePMT(principal, annualRate, years);
  
  if (annualRate <= 0) {
    return principal - (pmt * paymentsMade);
  }
  
  const balance = principal * Math.pow(1 + monthlyRate, paymentsMade) - 
                  pmt * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate);
  
  return Math.max(0, Math.round(balance * 100) / 100);
}

/**
 * Generate amortization schedule
 */
export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  const monthlyRate = annualRate / 100 / 12;
  const pmt = calculatePMT(principal, annualRate, years);
  let balance = principal;
  
  for (let month = 1; month <= years * 12; month++) {
    const interest = balance * monthlyRate;
    const principalPayment = pmt - interest;
    balance = Math.max(0, balance - principalPayment);
    
    schedule.push({
      month,
      payment: Math.round(pmt * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }
  
  return schedule;
}

/**
 * Calculate gross rental yield
 * Formula: (Annual Rent / Purchase Price) * 100
 */
export function calculateGrossYield(annualRent: number, purchasePrice: number): number {
  if (purchasePrice <= 0) return 0;
  return Math.round((annualRent / purchasePrice) * 100 * 100) / 100;
}

/**
 * Calculate net rental yield
 * Formula: (Annual Net Cashflow / Total Investment) * 100
 */
export function calculateNetYield(annualNetCashflow: number, totalInvestment: number): number {
  if (totalInvestment <= 0) return 0;
  return Math.round((annualNetCashflow / totalInvestment) * 100 * 100) / 100;
}

/**
 * Calculate Cash-on-Cash return
 * Formula: (Annual Net Cashflow / Own Capital Invested) * 100
 */
export function calculateCashOnCash(annualNetCashflow: number, ownCapital: number): number {
  if (ownCapital <= 0) return 0;
  return Math.round((annualNetCashflow / ownCapital) * 100 * 100) / 100;
}

/**
 * Calculate IMT (transfer tax) for Portugal - 2026 rates
 * Progressive rates for residential property ("woning")
 * Flat 6.5% for investment property ("niet-woning")
 */
export function calculateIMT(purchasePrice: number, isFirstHome: boolean = false): number {
  if (purchasePrice <= 0) return 0;
  
  // For non-first home (investment): flat 6.5%
  if (!isFirstHome) {
    return Math.round(purchasePrice * 0.065 * 100) / 100;
  }
  
  // 2026 progressive rates for residential property (woning)
  const BRACKET_1 = 106346;  // 0%
  const BRACKET_2 = 145470;  // 2% marginaal
  const BRACKET_3 = 198347;  // 5% marginaal
  const BRACKET_4 = 330539;  // 7% marginaal
  const BRACKET_5 = 633453;  // 8% marginaal
  const BRACKET_6 = 1102920; // 6% taxa única above this
  
  let imtBedrag = 0;

  if (purchasePrice <= BRACKET_1) {
    imtBedrag = 0;
  } else if (purchasePrice <= BRACKET_2) {
    imtBedrag = (purchasePrice - BRACKET_1) * 0.02;
  } else if (purchasePrice <= BRACKET_3) {
    imtBedrag = (BRACKET_2 - BRACKET_1) * 0.02 + (purchasePrice - BRACKET_2) * 0.05;
  } else if (purchasePrice <= BRACKET_4) {
    imtBedrag = (BRACKET_2 - BRACKET_1) * 0.02 + 
                (BRACKET_3 - BRACKET_2) * 0.05 + 
                (purchasePrice - BRACKET_3) * 0.07;
  } else if (purchasePrice <= BRACKET_5) {
    imtBedrag = (BRACKET_2 - BRACKET_1) * 0.02 + 
                (BRACKET_3 - BRACKET_2) * 0.05 + 
                (BRACKET_4 - BRACKET_3) * 0.07 +
                (purchasePrice - BRACKET_4) * 0.08;
  } else if (purchasePrice <= BRACKET_6) {
    imtBedrag = purchasePrice * 0.06;
  } else {
    imtBedrag = purchasePrice * 0.075;
  }

  return Math.max(0, Math.round(imtBedrag * 100) / 100);
}

/**
 * Calculate IMI (annual property tax) for Portugal
 * Typically 0.3% - 0.8% of property value
 */
export function calculateIMI(propertyValue: number, imiRate: number = 0.003): number {
  return Math.round(propertyValue * imiRate * 100) / 100;
}

/**
 * Calculate Plusvalia (capital gains tax) for Portugal
 * 28% on 50% of gains for residents, 28% on full gains for non-residents
 */
export function calculatePlusvalia(
  salePrice: number, 
  purchasePrice: number, 
  isResident: boolean = false
): number {
  const gain = salePrice - purchasePrice;
  if (gain <= 0) return 0;
  
  const taxableGain = isResident ? gain * 0.5 : gain;
  return Math.round(taxableGain * 0.28 * 100) / 100;
}

/**
 * Calculate monthly net cashflow for a property
 */
export interface PropertyCashflow {
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
}

export interface IRSOptions {
  jaarHuurinkomst?: number; // Year for which to calculate (default: current year)
  contractduurJaren?: number;
  aantalVerlengingen?: number;
  englobamento?: boolean;
  dhdContract?: boolean;
}

export function calculatePropertyCashflow(
  monthlyRent: number,
  subsidyMonthly: number,
  mortgagePayment: number,
  propertyValue: number,
  imiRate: number,
  insuranceYearly: number,
  maintenanceYearly: number,
  vacancyBufferPercent: number,
  managementPercent: number,
  otherExpensesMonthly: number = 0,
  irsOptions?: IRSOptions
): PropertyCashflow {
  const grossIncome = monthlyRent + subsidyMonthly;
  
  const imi = (propertyValue * imiRate) / 12;
  const insurance = insuranceYearly / 12;
  const maintenance = maintenanceYearly / 12;
  const vacancyBuffer = grossIncome * (vacancyBufferPercent / 100);
  const management = grossIncome * (managementPercent / 100);
  
  // Calculate IRS using the Portuguese tax calculation
  const currentYear = new Date().getFullYear();
  const irsResult = calculateIRS({
    jaarHuurinkomst: irsOptions?.jaarHuurinkomst ?? currentYear,
    maandHuur: monthlyRent,
    contractduurJaren: irsOptions?.contractduurJaren ?? 1,
    aantalVerlengingen: irsOptions?.aantalVerlengingen ?? 0,
    englobamento: irsOptions?.englobamento ?? false,
    dhdContract: irsOptions?.dhdContract ?? false,
  });
  
  const irsMonthly = irsResult.maandelijksBedrag;
  
  const totalExpenses = mortgagePayment + imi + irsMonthly + insurance + maintenance + 
                        vacancyBuffer + management + otherExpensesMonthly;
  
  return {
    grossIncome: Math.round(grossIncome * 100) / 100,
    expenses: {
      mortgage: Math.round(mortgagePayment * 100) / 100,
      imi: Math.round(imi * 100) / 100,
      irs: Math.round(irsMonthly * 100) / 100,
      insurance: Math.round(insurance * 100) / 100,
      maintenance: Math.round(maintenance * 100) / 100,
      vacancyBuffer: Math.round(vacancyBuffer * 100) / 100,
      management: Math.round(management * 100) / 100,
      other: Math.round(otherExpensesMonthly * 100) / 100,
    },
    irsTarief: irsResult.tarief,
    netCashflow: Math.round((grossIncome - totalExpenses) * 100) / 100,
  };
}

/**
 * Snowball debt payoff simulation
 */
export interface SnowballProperty {
  id: string;
  name: string;
  debt: number;
  monthlyPayment: number;
  netCashflow: number;
  interestRate: number;
}

export interface SnowballResult {
  propertyId: string;
  propertyName: string;
  monthsToPayoff: number;
  payoffDate: Date;
}

export function simulateSnowball(
  properties: SnowballProperty[],
  extraMonthlyPayment: number = 0,
  strategy: 'smallest' | 'highest_interest' = 'smallest'
): SnowballResult[] {
  // Sort based on strategy
  const sortedProperties = [...properties].sort((a, b) => {
    if (strategy === 'smallest') return a.debt - b.debt;
    return b.interestRate - a.interestRate;
  });
  
  const results: SnowballResult[] = [];
  let availableExtra = extraMonthlyPayment;
  let currentMonth = 0;
  const today = new Date();
  
  // Calculate total surplus from all properties
  const totalSurplus = properties.reduce((sum, p) => sum + Math.max(0, p.netCashflow), 0);
  
  for (const property of sortedProperties) {
    if (property.debt <= 0) {
      results.push({
        propertyId: property.id,
        propertyName: property.name,
        monthsToPayoff: 0,
        payoffDate: today,
      });
      continue;
    }
    
    // Calculate months to pay off with current surplus + extra
    const totalMonthlyPayment = property.monthlyPayment + availableExtra + 
                                (totalSurplus - property.netCashflow);
    
    const monthlyRate = property.interestRate / 100 / 12;
    let balance = property.debt;
    let months = 0;
    
    while (balance > 0 && months < 360) { // Max 30 years
      const interest = balance * monthlyRate;
      const principalPayment = Math.min(balance, totalMonthlyPayment - interest);
      balance -= principalPayment;
      months++;
    }
    
    const payoffDate = new Date(today);
    payoffDate.setMonth(payoffDate.getMonth() + currentMonth + months);
    
    results.push({
      propertyId: property.id,
      propertyName: property.name,
      monthsToPayoff: currentMonth + months,
      payoffDate,
    });
    
    // After this property is paid off, add its cashflow to available extra
    currentMonth += months;
    availableExtra += property.netCashflow + property.monthlyPayment;
  }
  
  return results;
}

/**
 * Calculate pension gap
 */
export function calculatePensionGap(
  desiredMonthlyIncome: number,
  aowMonthly: number,
  pensionMonthly: number,
  otherIncomeMonthly: number,
  rentalIncomeMonthly: number
): number {
  const expectedIncome = aowMonthly + pensionMonthly + otherIncomeMonthly + rentalIncomeMonthly;
  return Math.max(0, desiredMonthlyIncome - expectedIncome);
}

/**
 * Calculate inflation-adjusted value
 */
export function adjustForInflation(
  amount: number, 
  years: number, 
  inflationRate: number = 2.5
): number {
  return Math.round(amount * Math.pow(1 + inflationRate / 100, years) * 100) / 100;
}

/**
 * Calculate years until financial freedom
 */
export function calculateYearsToFreedom(
  monthlyGap: number,
  currentNetCashflow: number,
  monthlyGrowthRate: number = 0.5 // 0.5% monthly growth in cashflow
): number {
  if (monthlyGap <= 0) return 0;
  if (currentNetCashflow <= 0) return Infinity;
  
  let cashflow = currentNetCashflow;
  let months = 0;
  
  while (cashflow < monthlyGap && months < 600) { // Max 50 years
    cashflow *= (1 + monthlyGrowthRate / 100);
    months++;
  }
  
  return Math.ceil(months / 12);
}

/**
 * Calculate risk score color
 */
export function getRiskColor(totalScore: number): 'success' | 'warning' | 'destructive' {
  if (totalScore < 10) return 'success';
  if (totalScore <= 15) return 'warning';
  return 'destructive';
}

/**
 * Calculate liquidity ratio
 * Formula: (Cash + Investments) / Monthly Expenses
 */
export function calculateLiquidityRatio(
  cash: number, 
  investments: number, 
  monthlyExpenses: number
): number {
  if (monthlyExpenses <= 0) return 0;
  return Math.round((cash + investments) / monthlyExpenses * 100) / 100;
}

/**
 * Calculate debt-to-asset ratio
 */
export function calculateDebtToAssetRatio(totalDebt: number, totalAssets: number): number {
  if (totalAssets <= 0) return 0;
  return Math.round((totalDebt / totalAssets) * 100 * 100) / 100;
}
