// Verkopen of Behouden? - Calculation Logic

export interface SellOrKeepInputs {
  // 1. Property basics
  currentMarketValue: number;
  originalPurchasePrice: number;
  purchaseDate: string;
  cadastralValue: number; // VPT
  rentalType: 'longterm' | 'vacation'; // AL

  // 2. Financing
  remainingDebt: number;
  mortgageRate: number;
  mortgageType: 'interest_only' | 'annuity';
  remainingYears: number;

  // 3. Rent & costs
  grossMonthlyRent: number;
  maintenanceCostsMonthly: number;
  renovationReservePercent: number; // default 6%
  vacancyPercent: number; // default 5%
  propertyManager: 'self' | 'pm_longterm' | 'pm_vacation';

  // 4. Taxes (Portugal)
  imiAnnual: number;
  rentalTaxType: 'autonomous' | 'progressive';
  rentalTaxRate: number; // 28% for autonomous
  saleCostsPercent: number; // default 7%
  capitalGainsTaxType: 'autonomous' | 'progressive';
  capitalGainsTaxRate: number;
  reinvestInEUResidence: boolean;

  // 5. Assumptions & goals
  annualGrowthPercent: number; // default 3.4%
  alternativeReturnPercent: number; // default 7.5%
  investmentHorizon: 10 | 30;
  primaryGoal: 'cashflow' | 'networth' | 'pension' | 'legacy';
  riskProfile: 'low' | 'medium' | 'high';
}

export interface YearlyProjection {
  year: number;
  scenarioA: {
    portfolioValue: number;
    annualIncome: number;
  };
  scenarioB: {
    propertyValue: number;
    equity: number;
    netCashflow: number;
  };
  scenarioC: {
    propertyValue: number;
    equity: number;
    netCashflow: number;
    remainingDebt: number;
  };
}

export interface ScenarioResult {
  name: string;
  description: string;
  monthlyIncome: number;
  finalNetWorth: number;
  totalCashflowReceived: number;
  irr: number;
  cashflowStability: 'high' | 'medium' | 'low';
  fiscalPredictability: 'high' | 'medium' | 'low';
  operationalComplexity: 'high' | 'medium' | 'low';
  legacyYears: number;
  pros: string[];
  cons: string[];
}

export interface StressTestResult {
  scenario: string;
  baseCase: number;
  rateIncrease: number;
  vacancyIncrease: number;
  zeroGrowth: number;
}

export interface SellOrKeepAnalysis {
  inputs: SellOrKeepInputs;
  scenarioA: ScenarioResult; // Sell + ETF
  scenarioB: ScenarioResult; // Sell + New Property
  scenarioC: ScenarioResult; // Keep
  yearlyProjections: YearlyProjection[];
  stressTests: StressTestResult[];
  recommendation: {
    bestForGoal: 'A' | 'B' | 'C';
    bestOverall: 'A' | 'B' | 'C';
    summary: string;
    tradeoffs: string[];
    risks: string[];
  };
}

// Default values for Portugal 2026
export const defaultInputs: SellOrKeepInputs = {
  currentMarketValue: 250000,
  originalPurchasePrice: 200000,
  purchaseDate: '2020-01-01',
  cadastralValue: 150000,
  rentalType: 'longterm',
  remainingDebt: 150000,
  mortgageRate: 4.0,
  mortgageType: 'annuity',
  remainingYears: 25,
  grossMonthlyRent: 1200,
  maintenanceCostsMonthly: 100,
  renovationReservePercent: 6,
  vacancyPercent: 5,
  propertyManager: 'self',
  imiAnnual: 600,
  rentalTaxType: 'autonomous',
  rentalTaxRate: 28,
  saleCostsPercent: 7,
  capitalGainsTaxType: 'autonomous',
  capitalGainsTaxRate: 28,
  reinvestInEUResidence: false,
  annualGrowthPercent: 3.4,
  alternativeReturnPercent: 7.5,
  investmentHorizon: 10,
  primaryGoal: 'networth',
  riskProfile: 'medium',
};

function getPropertyManagerFee(type: string): number {
  switch (type) {
    case 'self': return 0;
    case 'pm_longterm': return 0.10;
    case 'pm_vacation': return 0.25;
    default: return 0;
  }
}

function calculateMonthlyMortgagePayment(
  principal: number,
  annualRate: number,
  years: number,
  type: 'interest_only' | 'annuity'
): number {
  if (type === 'interest_only') {
    return principal * (annualRate / 100) / 12;
  }
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
}

function calculateRemainingDebt(
  initialPrincipal: number,
  annualRate: number,
  totalYears: number,
  yearsElapsed: number,
  type: 'interest_only' | 'annuity'
): number {
  if (type === 'interest_only') {
    return initialPrincipal;
  }
  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = totalYears * 12;
  const paymentsElapsed = yearsElapsed * 12;
  
  if (monthlyRate === 0) {
    return initialPrincipal * (1 - paymentsElapsed / totalPayments);
  }
  
  const remaining = initialPrincipal * 
    (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, paymentsElapsed)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
  
  return Math.max(0, remaining);
}

function calculateNetRentalIncome(inputs: SellOrKeepInputs): number {
  const annualGrossRent = inputs.grossMonthlyRent * 12;
  const pmFee = getPropertyManagerFee(inputs.propertyManager);
  
  const renovationReserve = annualGrossRent * (inputs.renovationReservePercent / 100);
  const vacancyLoss = annualGrossRent * (inputs.vacancyPercent / 100);
  const pmCost = annualGrossRent * pmFee;
  const maintenanceAnnual = inputs.maintenanceCostsMonthly * 12;
  
  const netBeforeTax = annualGrossRent - renovationReserve - vacancyLoss - pmCost - maintenanceAnnual - inputs.imiAnnual;
  const rentalTax = netBeforeTax > 0 ? netBeforeTax * (inputs.rentalTaxRate / 100) : 0;
  
  return netBeforeTax - rentalTax;
}

function calculateNetSaleProceeds(inputs: SellOrKeepInputs): number {
  const saleCosts = inputs.currentMarketValue * (inputs.saleCostsPercent / 100);
  const grossProceeds = inputs.currentMarketValue - saleCosts - inputs.remainingDebt;
  
  // Capital gains calculation
  const capitalGain = inputs.currentMarketValue - inputs.originalPurchasePrice;
  
  if (capitalGain <= 0 || inputs.reinvestInEUResidence) {
    return grossProceeds;
  }
  
  // In Portugal, 50% of gains are taxable for residents
  const taxableGain = capitalGain * 0.5;
  const cgtTax = taxableGain * (inputs.capitalGainsTaxRate / 100);
  
  return grossProceeds - cgtTax;
}

function calculateScenarioA(inputs: SellOrKeepInputs): ScenarioResult {
  const netProceeds = calculateNetSaleProceeds(inputs);
  const annualReturn = inputs.alternativeReturnPercent / 100;
  const years = inputs.investmentHorizon;
  
  // Compound growth
  const finalValue = netProceeds * Math.pow(1 + annualReturn, years);
  
  // Assume 4% safe withdrawal rate for income
  const annualIncome = netProceeds * 0.04;
  const monthlyIncome = annualIncome / 12;
  
  // Total dividends/income over period (simplified)
  const totalCashflow = annualIncome * years;
  
  // IRR approximation
  const irr = annualReturn * 100;
  
  return {
    name: 'Verkopen + ETF Beleggen',
    description: 'Verkoop het pand en beleg de netto opbrengst in gediversifieerde ETFs',
    monthlyIncome,
    finalNetWorth: finalValue,
    totalCashflowReceived: totalCashflow,
    irr,
    cashflowStability: 'medium',
    fiscalPredictability: 'high',
    operationalComplexity: 'low',
    legacyYears: Math.round(finalValue / (inputs.grossMonthlyRent * 12 * 2)), // Years of support
    pros: [
      'Volledige liquiditeit',
      'Geen operationele zorgen',
      'Makkelijk overdraagbaar',
      'Fiscaal eenvoudig (dividendbelasting)',
    ],
    cons: [
      'Geen hefboomwerking',
      'Marktvolatiliteit',
      'Geen fysiek bezit',
      'Inflatiegevoelig zonder vastgoed',
    ],
  };
}

function calculateScenarioB(inputs: SellOrKeepInputs): ScenarioResult {
  const netProceeds = calculateNetSaleProceeds(inputs);
  const years = inputs.investmentHorizon;
  const growthRate = inputs.annualGrowthPercent / 100;
  
  // Assume 70% LTV on new property
  const ltv = 0.70;
  const newPropertyValue = netProceeds / (1 - ltv);
  const newLoanAmount = newPropertyValue * ltv;
  
  // New property rent (estimate based on yield)
  const estimatedYield = 0.05; // 5% gross yield
  const newGrossRent = newPropertyValue * estimatedYield;
  
  // Calculate costs similar to current property
  const newPmFee = getPropertyManagerFee(inputs.propertyManager);
  const newNetRent = newGrossRent * (1 - inputs.vacancyPercent / 100) * (1 - newPmFee) * (1 - inputs.rentalTaxRate / 100);
  
  // New mortgage payment
  const newMortgagePayment = calculateMonthlyMortgagePayment(newLoanAmount, inputs.mortgageRate, 25, 'annuity') * 12;
  
  const annualCashflow = newNetRent - newMortgagePayment - (newPropertyValue * 0.004); // IMI estimate
  const monthlyIncome = annualCashflow / 12;
  
  // Property value after growth
  const finalPropertyValue = newPropertyValue * Math.pow(1 + growthRate, years);
  const finalDebt = calculateRemainingDebt(newLoanAmount, inputs.mortgageRate, 25, years, 'annuity');
  const finalNetWorth = finalPropertyValue - finalDebt;
  
  // Total cashflow
  const totalCashflow = annualCashflow * years;
  
  // IRR calculation (simplified)
  const irr = ((finalNetWorth + totalCashflow) / netProceeds) ** (1 / years) - 1;
  
  return {
    name: 'Verkopen + Nieuw Vastgoed',
    description: 'Verkoop en herinvesteer in nieuw Portugees vastgoed met hefboom',
    monthlyIncome: Math.max(0, monthlyIncome),
    finalNetWorth,
    totalCashflowReceived: Math.max(0, totalCashflow),
    irr: irr * 100,
    cashflowStability: 'medium',
    fiscalPredictability: 'medium',
    operationalComplexity: 'high',
    legacyYears: Math.round(finalNetWorth / (inputs.grossMonthlyRent * 12 * 2)),
    pros: [
      'Hefboomwerking op groter vermogen',
      'Mogelijk betere locatie/pand',
      'Fresh start zonder achterstallig onderhoud',
      'Optimalisatie van rendement',
    ],
    cons: [
      'Transactiekosten (2x)',
      'Nieuwe hypotheek nodig',
      'Opnieuw aankoopproces',
      'Onbekende risico\'s nieuw pand',
    ],
  };
}

function calculateScenarioC(inputs: SellOrKeepInputs): ScenarioResult {
  const years = inputs.investmentHorizon;
  const growthRate = inputs.annualGrowthPercent / 100;
  
  const netAnnualRent = calculateNetRentalIncome(inputs);
  const mortgagePaymentAnnual = calculateMonthlyMortgagePayment(
    inputs.remainingDebt,
    inputs.mortgageRate,
    inputs.remainingYears,
    inputs.mortgageType
  ) * 12;
  
  const annualCashflow = netAnnualRent - mortgagePaymentAnnual;
  const monthlyIncome = annualCashflow / 12;
  
  // Property value after growth
  const finalPropertyValue = inputs.currentMarketValue * Math.pow(1 + growthRate, years);
  
  // Remaining debt
  const yearsToUse = Math.min(years, inputs.remainingYears);
  const finalDebt = calculateRemainingDebt(
    inputs.remainingDebt,
    inputs.mortgageRate,
    inputs.remainingYears,
    yearsToUse,
    inputs.mortgageType
  );
  
  // Latent CGT
  const futureCapitalGain = finalPropertyValue - inputs.originalPurchasePrice;
  const latentCGT = futureCapitalGain > 0 ? (futureCapitalGain * 0.5 * inputs.capitalGainsTaxRate / 100) : 0;
  const futureSaleCosts = finalPropertyValue * (inputs.saleCostsPercent / 100);
  
  const finalNetWorth = finalPropertyValue - finalDebt - latentCGT - futureSaleCosts;
  
  // Total cashflow
  const totalCashflow = annualCashflow * years;
  
  // IRR calculation
  const initialEquity = inputs.currentMarketValue - inputs.remainingDebt;
  const irr = ((finalNetWorth + totalCashflow) / initialEquity) ** (1 / years) - 1;
  
  return {
    name: 'Behouden als Huurwoning',
    description: 'Blijf verhuren en profiteer van waardegroei en aflossing',
    monthlyIncome,
    finalNetWorth,
    totalCashflowReceived: totalCashflow,
    irr: irr * 100,
    cashflowStability: inputs.rentalType === 'longterm' ? 'high' : 'medium',
    fiscalPredictability: 'medium',
    operationalComplexity: inputs.propertyManager === 'self' ? 'high' : 'medium',
    legacyYears: Math.round(finalNetWorth / (inputs.grossMonthlyRent * 12 * 2)),
    pros: [
      'Geen transactiekosten',
      'Bekende situatie',
      'Waardegroei + aflossing',
      'Stabiele huurinkomsten',
    ],
    cons: [
      'Kapitaal vastzit in pand',
      'Operationele verantwoordelijkheid',
      'Toekomstige onderhoudskosten',
      'Concentratierisico',
    ],
  };
}

function calculateYearlyProjections(inputs: SellOrKeepInputs): YearlyProjection[] {
  const projections: YearlyProjection[] = [];
  const netProceeds = calculateNetSaleProceeds(inputs);
  const growthRate = inputs.annualGrowthPercent / 100;
  const etfReturn = inputs.alternativeReturnPercent / 100;
  
  // Scenario B: New property values
  const ltv = 0.70;
  const newPropertyValue = netProceeds / (1 - ltv);
  const newLoanAmount = newPropertyValue * ltv;
  const newGrossRent = newPropertyValue * 0.05;
  const newPmFee = getPropertyManagerFee(inputs.propertyManager);
  const newNetRent = newGrossRent * (1 - inputs.vacancyPercent / 100) * (1 - newPmFee) * (1 - inputs.rentalTaxRate / 100);
  const newMortgagePayment = calculateMonthlyMortgagePayment(newLoanAmount, inputs.mortgageRate, 25, 'annuity') * 12;
  const newAnnualCashflow = newNetRent - newMortgagePayment - (newPropertyValue * 0.004);
  
  // Scenario C: Current property values
  const netAnnualRent = calculateNetRentalIncome(inputs);
  const mortgagePaymentAnnual = calculateMonthlyMortgagePayment(
    inputs.remainingDebt,
    inputs.mortgageRate,
    inputs.remainingYears,
    inputs.mortgageType
  ) * 12;
  const currentAnnualCashflow = netAnnualRent - mortgagePaymentAnnual;
  
  for (let year = 1; year <= inputs.investmentHorizon; year++) {
    // Scenario A
    const portfolioValue = netProceeds * Math.pow(1 + etfReturn, year);
    const annualIncome = netProceeds * 0.04;
    
    // Scenario B
    const bPropertyValue = newPropertyValue * Math.pow(1 + growthRate, year);
    const bRemainingDebt = calculateRemainingDebt(newLoanAmount, inputs.mortgageRate, 25, year, 'annuity');
    const bEquity = bPropertyValue - bRemainingDebt;
    
    // Scenario C
    const cPropertyValue = inputs.currentMarketValue * Math.pow(1 + growthRate, year);
    const yearsToUse = Math.min(year, inputs.remainingYears);
    const cRemainingDebt = calculateRemainingDebt(
      inputs.remainingDebt,
      inputs.mortgageRate,
      inputs.remainingYears,
      yearsToUse,
      inputs.mortgageType
    );
    const cEquity = cPropertyValue - cRemainingDebt;
    
    projections.push({
      year,
      scenarioA: {
        portfolioValue,
        annualIncome,
      },
      scenarioB: {
        propertyValue: bPropertyValue,
        equity: bEquity,
        netCashflow: newAnnualCashflow * Math.pow(1 + growthRate, year - 1),
      },
      scenarioC: {
        propertyValue: cPropertyValue,
        equity: cEquity,
        netCashflow: currentAnnualCashflow * Math.pow(1 + growthRate, year - 1),
        remainingDebt: cRemainingDebt,
      },
    });
  }
  
  return projections;
}

function calculateStressTests(inputs: SellOrKeepInputs): StressTestResult[] {
  const baseA = calculateScenarioA(inputs).finalNetWorth;
  const baseB = calculateScenarioB(inputs).finalNetWorth;
  const baseC = calculateScenarioC(inputs).finalNetWorth;
  
  // Stress test: Rate +2%
  const rateInputs = { ...inputs, mortgageRate: inputs.mortgageRate + 2 };
  const rateA = calculateScenarioA(rateInputs).finalNetWorth;
  const rateB = calculateScenarioB(rateInputs).finalNetWorth;
  const rateC = calculateScenarioC(rateInputs).finalNetWorth;
  
  // Stress test: Vacancy +5%
  const vacancyInputs = { ...inputs, vacancyPercent: inputs.vacancyPercent + 5 };
  const vacancyA = calculateScenarioA(vacancyInputs).finalNetWorth;
  const vacancyB = calculateScenarioB(vacancyInputs).finalNetWorth;
  const vacancyC = calculateScenarioC(vacancyInputs).finalNetWorth;
  
  // Stress test: Zero growth for 5 years
  const zeroGrowthInputs = { ...inputs, annualGrowthPercent: 0 };
  const zeroA = calculateScenarioA(zeroGrowthInputs).finalNetWorth;
  const zeroB = calculateScenarioB(zeroGrowthInputs).finalNetWorth;
  const zeroC = calculateScenarioC(zeroGrowthInputs).finalNetWorth;
  
  return [
    { scenario: 'Verkopen + ETF', baseCase: baseA, rateIncrease: rateA, vacancyIncrease: vacancyA, zeroGrowth: zeroA },
    { scenario: 'Verkopen + Vastgoed', baseCase: baseB, rateIncrease: rateB, vacancyIncrease: vacancyB, zeroGrowth: zeroB },
    { scenario: 'Behouden', baseCase: baseC, rateIncrease: rateC, vacancyIncrease: vacancyC, zeroGrowth: zeroC },
  ];
}

function generateRecommendation(
  inputs: SellOrKeepInputs,
  scenarioA: ScenarioResult,
  scenarioB: ScenarioResult,
  scenarioC: ScenarioResult
): SellOrKeepAnalysis['recommendation'] {
  const scenarios = [
    { id: 'A' as const, result: scenarioA },
    { id: 'B' as const, result: scenarioB },
    { id: 'C' as const, result: scenarioC },
  ];
  
  // Best for specific goals
  let bestForGoal: 'A' | 'B' | 'C';
  switch (inputs.primaryGoal) {
    case 'cashflow':
      bestForGoal = scenarios.reduce((a, b) => 
        a.result.monthlyIncome > b.result.monthlyIncome ? a : b
      ).id;
      break;
    case 'networth':
      bestForGoal = scenarios.reduce((a, b) => 
        a.result.finalNetWorth > b.result.finalNetWorth ? a : b
      ).id;
      break;
    case 'pension':
      bestForGoal = inputs.riskProfile === 'low' ? 'A' : 
        scenarios.reduce((a, b) => a.result.irr > b.result.irr ? a : b).id;
      break;
    case 'legacy':
      bestForGoal = scenarios.reduce((a, b) => 
        a.result.legacyYears > b.result.legacyYears ? a : b
      ).id;
      break;
  }
  
  // Best overall (weighted score)
  const weights = {
    networth: 0.4,
    cashflow: 0.25,
    stability: 0.2,
    simplicity: 0.15,
  };
  
  const stabilityScore = { high: 3, medium: 2, low: 1 };
  const complexityScore = { low: 3, medium: 2, high: 1 };
  
  const scores = scenarios.map(s => ({
    id: s.id,
    score: 
      (s.result.finalNetWorth / Math.max(...scenarios.map(x => x.result.finalNetWorth))) * weights.networth +
      (s.result.monthlyIncome / Math.max(...scenarios.map(x => x.result.monthlyIncome || 1))) * weights.cashflow +
      (stabilityScore[s.result.cashflowStability] / 3) * weights.stability +
      (complexityScore[s.result.operationalComplexity] / 3) * weights.simplicity
  }));
  
  const bestOverall = scores.reduce((a, b) => a.score > b.score ? a : b).id;
  
  const goalNames = {
    cashflow: 'maandelijkse cashflow',
    networth: 'netto vermogen',
    pension: 'pensioen/financiële onafhankelijkheid',
    legacy: 'nalatenschap voor kinderen',
  };
  
  const scenarioNames = {
    A: 'Verkopen + ETF beleggen',
    B: 'Verkopen + nieuw vastgoed',
    C: 'Behouden als huurwoning',
  };
  
  const bestResult = scenarios.find(s => s.id === bestForGoal)!.result;
  
  return {
    bestForGoal,
    bestOverall,
    summary: `Op basis van jouw cijfers en doel (${goalNames[inputs.primaryGoal]}) scoort ${scenarioNames[bestForGoal]} het beste. ` +
      `Dit scenario levert een eindvermogen van €${bestResult.finalNetWorth.toLocaleString('nl-NL', { maximumFractionDigits: 0 })} ` +
      `met een maandelijks inkomen van €${bestResult.monthlyIncome.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}.`,
    tradeoffs: [
      `${scenarioNames.A} biedt de hoogste liquiditeit maar geen hefboomwerking`,
      `${scenarioNames.B} maximaliseert potentieel rendement maar heeft hogere transactiekosten`,
      `${scenarioNames.C} behoudt stabiliteit maar houdt kapitaal vast in één asset`,
    ],
    risks: [
      inputs.riskProfile === 'low' ? 'Met een laag risicoprofiel past scenario A mogelijk het beste' : '',
      inputs.mortgageRate > 5 ? 'Hoge hypotheekrente drukt rendement van vastgoedscenario\'s' : '',
      inputs.vacancyPercent > 10 ? 'Hoge leegstand vormt risico voor cashflow' : '',
      inputs.remainingDebt > inputs.currentMarketValue * 0.8 ? 'Hoge LTV beperkt flexibiliteit' : '',
    ].filter(Boolean),
  };
}

export function analyzeSellOrKeep(inputs: SellOrKeepInputs): SellOrKeepAnalysis {
  const scenarioA = calculateScenarioA(inputs);
  const scenarioB = calculateScenarioB(inputs);
  const scenarioC = calculateScenarioC(inputs);
  const yearlyProjections = calculateYearlyProjections(inputs);
  const stressTests = calculateStressTests(inputs);
  const recommendation = generateRecommendation(inputs, scenarioA, scenarioB, scenarioC);
  
  return {
    inputs,
    scenarioA,
    scenarioB,
    scenarioC,
    yearlyProjections,
    stressTests,
    recommendation,
  };
}

// Translations
export const translations = {
  nl: {
    title: 'Verkopen of Behouden?',
    subtitle: 'Portugese Vastgoed Analyzer',
    sections: {
      basics: 'Basisgegevens Pand',
      financing: 'Financiering',
      rental: 'Huur & Kosten',
      taxes: 'Belastingen (Portugal)',
      assumptions: 'Aannames & Doelen',
    },
    fields: {
      currentMarketValue: 'Huidige marktwaarde',
      originalPurchasePrice: 'Oorspronkelijke aankoopprijs',
      purchaseDate: 'Aankoopdatum',
      cadastralValue: 'Cadastrale waarde (VPT)',
      rentalType: 'Type verhuur',
      remainingDebt: 'Restschuld hypotheek',
      mortgageRate: 'Hypotheekrente',
      mortgageType: 'Hypotheektype',
      remainingYears: 'Resterende looptijd',
      grossMonthlyRent: 'Bruto huur per maand',
      maintenanceCostsMonthly: 'Onderhoudskosten per maand',
      renovationReservePercent: 'Renovatie-reserve',
      vacancyPercent: 'Leegstand',
      propertyManager: 'Beheer',
      imiAnnual: 'IMI-belasting per jaar',
      rentalTaxType: 'Belasting huurinkomsten',
      saleCostsPercent: 'Verkoopkosten',
      capitalGainsTaxType: 'Capital Gains belasting',
      reinvestInEUResidence: 'Herinvestering EU-hoofdverblijf',
      annualGrowthPercent: 'Jaarlijkse huur- & waardegroei',
      alternativeReturnPercent: 'Alternatief beleggingsrendement',
      investmentHorizon: 'Investeringshorizon',
      primaryGoal: 'Primair doel',
      riskProfile: 'Risicoprofiel',
    },
    options: {
      longterm: 'Langlopend',
      vacation: 'Vakantieverhuur (AL)',
      interest_only: 'Aflossingsvrij',
      annuity: 'Annuïtair',
      self: 'Zelf beheren (0%)',
      pm_longterm: 'PM langlopend (10%)',
      pm_vacation: 'PM vakantieverhuur (25%)',
      autonomous: 'Autonoom (28%)',
      progressive: 'Progressief via IRS',
      cashflow: 'Cashflow',
      networth: 'Netto vermogen',
      pension: 'Pensioen / FI',
      legacy: 'Legacy voor kinderen',
      low: 'Laag',
      medium: 'Midden',
      high: 'Hoog',
    },
    results: {
      monthlyIncome: 'Maandelijks inkomen',
      finalNetWorth: 'Eindvermogen',
      totalCashflow: 'Totale cashflow',
      irr: 'IRR',
      stability: 'Stabiliteit',
      predictability: 'Voorspelbaarheid',
      complexity: 'Complexiteit',
      legacyYears: 'Legacy-jaren',
    },
    advice: {
      title: 'Investeerdersadvies',
      disclaimer: 'Dit advies is niet juridisch of fiscaal bindend. Raadpleeg altijd een gekwalificeerde adviseur.',
      bestFor: 'Beste voor jouw doel',
      tradeoffs: 'Afwegingen',
      risks: 'Risico\'s',
    },
    charts: {
      monthlyIncome: 'Maandelijks beschikbaar inkomen per scenario (€)',
      netWorth: 'Netto vermogen na',
      years: 'jaar',
    },
    export: 'Exporteer PDF Rapport',
  },
  pt: {
    title: 'Vender ou Manter?',
    subtitle: 'Analisador de Imóveis Portugueses',
    sections: {
      basics: 'Dados Básicos do Imóvel',
      financing: 'Financiamento',
      rental: 'Renda & Custos',
      taxes: 'Impostos (Portugal)',
      assumptions: 'Pressupostos & Objetivos',
    },
    fields: {
      currentMarketValue: 'Valor de mercado atual',
      originalPurchasePrice: 'Preço de compra original',
      purchaseDate: 'Data de compra',
      cadastralValue: 'Valor patrimonial (VPT)',
      rentalType: 'Tipo de arrendamento',
      remainingDebt: 'Dívida hipotecária restante',
      mortgageRate: 'Taxa de hipoteca',
      mortgageType: 'Tipo de hipoteca',
      remainingYears: 'Anos restantes',
      grossMonthlyRent: 'Renda bruta mensal',
      maintenanceCostsMonthly: 'Custos de manutenção mensais',
      renovationReservePercent: 'Reserva de renovação',
      vacancyPercent: 'Taxa de vacância',
      propertyManager: 'Gestão',
      imiAnnual: 'IMI anual',
      rentalTaxType: 'Imposto sobre rendas',
      saleCostsPercent: 'Custos de venda',
      capitalGainsTaxType: 'Imposto sobre mais-valias',
      reinvestInEUResidence: 'Reinvestimento em habitação própria UE',
      annualGrowthPercent: 'Crescimento anual de renda & valor',
      alternativeReturnPercent: 'Retorno alternativo de investimento',
      investmentHorizon: 'Horizonte de investimento',
      primaryGoal: 'Objetivo principal',
      riskProfile: 'Perfil de risco',
    },
    options: {
      longterm: 'Longa duração',
      vacation: 'Alojamento Local (AL)',
      interest_only: 'Só juros',
      annuity: 'Amortização',
      self: 'Auto-gestão (0%)',
      pm_longterm: 'PM longa duração (10%)',
      pm_vacation: 'PM AL (25%)',
      autonomous: 'Autónomo (28%)',
      progressive: 'Progressivo via IRS',
      cashflow: 'Fluxo de caixa',
      networth: 'Património líquido',
      pension: 'Reforma / IF',
      legacy: 'Herança para filhos',
      low: 'Baixo',
      medium: 'Médio',
      high: 'Alto',
    },
    results: {
      monthlyIncome: 'Rendimento mensal',
      finalNetWorth: 'Património final',
      totalCashflow: 'Fluxo de caixa total',
      irr: 'TIR',
      stability: 'Estabilidade',
      predictability: 'Previsibilidade',
      complexity: 'Complexidade',
      legacyYears: 'Anos de herança',
    },
    advice: {
      title: 'Aconselhamento ao Investidor',
      disclaimer: 'Este aconselhamento não é juridicamente ou fiscalmente vinculativo. Consulte sempre um consultor qualificado.',
      bestFor: 'Melhor para o seu objetivo',
      tradeoffs: 'Compensações',
      risks: 'Riscos',
    },
    charts: {
      monthlyIncome: 'Rendimento mensal disponível por cenário (€)',
      netWorth: 'Património líquido após',
      years: 'anos',
    },
    export: 'Exportar Relatório PDF',
  },
};

export type Language = 'nl' | 'pt';
