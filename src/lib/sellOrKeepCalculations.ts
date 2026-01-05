// Sell or Keep - Portuguese Real Estate Analyzer Calculations

export interface PropertyInputs {
  // Basic property data
  currentMarketValue: number;
  originalPurchasePrice: number;
  purchaseDate: string;
  cadastralValue: number; // VPT
  rentalType: 'longterm' | 'shortterm'; // AL = shortterm

  // Financing
  remainingMortgage: number;
  mortgageRate: number;
  mortgageType: 'interest_only' | 'annuity';
  remainingYears: number;

  // Rent & operating costs
  monthlyRent: number;
  maintenanceCosts: number;
  renovationReserve: number; // percentage
  vacancyRate: number; // percentage
  propertyManager: 'self' | 'longterm' | 'shortterm';

  // Taxes (Portugal)
  imiRate: number; // percentage of VPT
  rentalTaxRegime: 'autonomous' | 'progressive';
  salesCosts: number; // percentage
  capitalGainsTaxRegime: 'autonomous' | 'progressive';
  reinvestInEUResidence: boolean;

  // Assumptions & goals
  annualGrowthRate: number; // percentage
  alternativeInvestmentReturn: number; // percentage
  investmentHorizon: 10 | 30;
  primaryGoal: 'cashflow' | 'wealth' | 'retirement' | 'legacy';
  riskProfile: 'low' | 'medium' | 'high';
}

export interface ScenarioResult {
  name: string;
  monthlyIncome: number;
  netWorth10Years: number;
  netWorth30Years: number;
  cashflowStability: 'high' | 'medium' | 'low';
  fiscalPredictability: 'high' | 'medium' | 'low';
  operationalComplexity: 'high' | 'medium' | 'low';
  legacyYears: number;
  details: {
    label: string;
    value: number;
    description: string;
  }[];
}

export interface StressTestResult {
  scenario: string;
  impact: number;
  description: string;
}

export interface AnalysisResult {
  scenarioA: ScenarioResult; // Sell + ETF
  scenarioB: ScenarioResult; // Sell + New Property
  scenarioC: ScenarioResult; // Keep as rental
  stressTests: StressTestResult[];
  recommendation: {
    bestScenario: 'A' | 'B' | 'C';
    reasoning: string;
    tradeoffs: string[];
  };
}

// Default values for Portugal 2026
export const DEFAULT_VALUES: Partial<PropertyInputs> = {
  mortgageRate: 3.8,
  maintenanceCosts: 300,
  renovationReserve: 6,
  vacancyRate: 5,
  imiRate: 0.4,
  salesCosts: 7,
  annualGrowthRate: 3.4,
  alternativeInvestmentReturn: 7.5,
  investmentHorizon: 10,
  riskProfile: 'medium',
};

// Property manager fees
const MANAGER_FEES = {
  self: 0,
  longterm: 10,
  shortterm: 25,
};

// Calculate monthly mortgage payment
function calculateMortgagePayment(
  principal: number,
  annualRate: number,
  years: number,
  type: 'interest_only' | 'annuity'
): number {
  if (principal <= 0 || years <= 0) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  
  if (type === 'interest_only') {
    return principal * monthlyRate;
  }
  
  // Annuity calculation
  const numPayments = years * 12;
  if (monthlyRate === 0) return principal / numPayments;
  
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

// Calculate Portuguese capital gains tax
function calculateCapitalGainsTax(
  purchasePrice: number,
  salePrice: number,
  purchaseDate: string,
  regime: 'autonomous' | 'progressive',
  reinvestInEU: boolean
): number {
  const gain = salePrice - purchasePrice;
  if (gain <= 0) return 0;
  
  // Reinvestment exemption
  if (reinvestInEU) return 0;
  
  // Calculate holding period for reduction
  const purchaseYear = new Date(purchaseDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const holdingYears = currentYear - purchaseYear;
  
  // Portugal: 50% of gain is taxable, with reductions for long-term holding
  let taxablePercentage = 50;
  if (holdingYears >= 2) {
    // Reduction of 2% per year after 2 years, up to 50%
    const reduction = Math.min((holdingYears - 2) * 2, 50);
    taxablePercentage = 50 - reduction;
  }
  
  const taxableGain = gain * (taxablePercentage / 100);
  
  if (regime === 'autonomous') {
    // Flat 28% rate
    return taxableGain * 0.28;
  } else {
    // Progressive rates (simplified - actual depends on total income)
    // Using average effective rate of 35% for higher gains
    return taxableGain * 0.35;
  }
}

// Calculate net rental income after all deductions
function calculateNetRentalIncome(inputs: PropertyInputs): number {
  const monthlyGross = inputs.monthlyRent;
  const managerFee = monthlyGross * (MANAGER_FEES[inputs.propertyManager] / 100);
  const renovationReserve = monthlyGross * (inputs.renovationReserve / 100);
  const vacancyDeduction = monthlyGross * (inputs.vacancyRate / 100);
  const monthlyIMI = (inputs.cadastralValue * (inputs.imiRate / 100)) / 12;
  
  const netBeforeTax = monthlyGross - inputs.maintenanceCosts - managerFee - 
                       renovationReserve - vacancyDeduction - monthlyIMI;
  
  // Calculate rental income tax
  const annualNet = netBeforeTax * 12;
  let rentalTax = 0;
  
  if (inputs.rentalTaxRegime === 'autonomous') {
    rentalTax = annualNet * 0.28;
  } else {
    // Progressive (simplified - 25% effective for medium incomes)
    rentalTax = annualNet * 0.25;
  }
  
  return netBeforeTax - (rentalTax / 12);
}

// Compound growth calculation
function compoundGrowth(principal: number, annualRate: number, years: number): number {
  return principal * Math.pow(1 + annualRate / 100, years);
}

// Calculate Scenario A: Sell + Invest in ETF
function calculateScenarioA(inputs: PropertyInputs): ScenarioResult {
  const saleProceeds = inputs.currentMarketValue;
  const salesCosts = saleProceeds * (inputs.salesCosts / 100);
  const capitalGainsTax = calculateCapitalGainsTax(
    inputs.originalPurchasePrice,
    saleProceeds,
    inputs.purchaseDate,
    inputs.capitalGainsTaxRegime,
    inputs.reinvestInEUResidence
  );
  
  const netProceeds = saleProceeds - inputs.remainingMortgage - salesCosts - capitalGainsTax;
  
  // ETF investment returns
  const netWorth10Years = compoundGrowth(netProceeds, inputs.alternativeInvestmentReturn, 10);
  const netWorth30Years = compoundGrowth(netProceeds, inputs.alternativeInvestmentReturn, 30);
  
  // Monthly income from 4% safe withdrawal rate
  const monthlyIncome = (netProceeds * 0.04) / 12;
  
  // Legacy calculation (years of FI for children at €2000/month)
  const legacyYears = Math.floor(netWorth30Years / (2000 * 12));
  
  return {
    name: 'Verkopen + ETF',
    monthlyIncome,
    netWorth10Years,
    netWorth30Years,
    cashflowStability: 'high',
    fiscalPredictability: 'high',
    operationalComplexity: 'low',
    legacyYears,
    details: [
      { label: 'Verkoopprijs', value: saleProceeds, description: 'Huidige marktwaarde' },
      { label: 'Verkoopkosten', value: salesCosts, description: 'Makelaar, notaris, etc.' },
      { label: 'Vermogenswinstbelasting', value: capitalGainsTax, description: 'CGT Portugal' },
      { label: 'Aflossing hypotheek', value: inputs.remainingMortgage, description: 'Restschuld' },
      { label: 'Netto opbrengst', value: netProceeds, description: 'Beschikbaar voor investering' },
    ],
  };
}

// Calculate Scenario B: Sell + Buy New Property
function calculateScenarioB(inputs: PropertyInputs): ScenarioResult {
  const saleProceeds = inputs.currentMarketValue;
  const salesCosts = saleProceeds * (inputs.salesCosts / 100);
  const capitalGainsTax = calculateCapitalGainsTax(
    inputs.originalPurchasePrice,
    saleProceeds,
    inputs.purchaseDate,
    inputs.capitalGainsTaxRegime,
    inputs.reinvestInEUResidence
  );
  
  const netProceeds = saleProceeds - inputs.remainingMortgage - salesCosts - capitalGainsTax;
  
  // Use proceeds as 30% down payment for new property
  const newPropertyValue = netProceeds / 0.30;
  const newMortgage = newPropertyValue * 0.70;
  const newMortgagePayment = calculateMortgagePayment(newMortgage, inputs.mortgageRate, 25, 'annuity');
  
  // Assume similar yield on new property
  const newMonthlyRent = newPropertyValue * 0.005; // ~6% gross yield
  const newNetRental = newMonthlyRent * 0.65; // After all costs
  const monthlyIncome = newNetRental - newMortgagePayment;
  
  // Property appreciation + mortgage paydown
  const propertyValue10Years = compoundGrowth(newPropertyValue, inputs.annualGrowthRate, 10);
  const propertyValue30Years = compoundGrowth(newPropertyValue, inputs.annualGrowthRate, 30);
  
  // Simplified: assume 30% of mortgage paid off in 10 years, 100% in 30 years
  const equity10Years = propertyValue10Years - (newMortgage * 0.70);
  const equity30Years = propertyValue30Years;
  
  const legacyYears = Math.floor(equity30Years / (2000 * 12));
  
  return {
    name: 'Verkopen + Nieuw Vastgoed',
    monthlyIncome,
    netWorth10Years: equity10Years,
    netWorth30Years: equity30Years,
    cashflowStability: 'medium',
    fiscalPredictability: 'medium',
    operationalComplexity: 'high',
    legacyYears,
    details: [
      { label: 'Netto opbrengst verkoop', value: netProceeds, description: 'Eigen inleg nieuw pand' },
      { label: 'Waarde nieuw pand', value: newPropertyValue, description: 'Op basis van 30% eigen inleg' },
      { label: 'Nieuwe hypotheek', value: newMortgage, description: '70% financiering' },
      { label: 'Nieuwe hypotheeklast', value: newMortgagePayment, description: 'Maandelijkse betaling' },
      { label: 'Verwachte huur', value: newMonthlyRent, description: '~6% bruto rendement' },
    ],
  };
}

// Calculate Scenario C: Keep as Rental
function calculateScenarioC(inputs: PropertyInputs): ScenarioResult {
  const netRentalIncome = calculateNetRentalIncome(inputs);
  const mortgagePayment = calculateMortgagePayment(
    inputs.remainingMortgage,
    inputs.mortgageRate,
    inputs.remainingYears,
    inputs.mortgageType
  );
  
  const monthlyIncome = netRentalIncome - mortgagePayment;
  
  // Property appreciation
  const propertyValue10Years = compoundGrowth(inputs.currentMarketValue, inputs.annualGrowthRate, 10);
  const propertyValue30Years = compoundGrowth(inputs.currentMarketValue, inputs.annualGrowthRate, 30);
  
  // Mortgage paydown (simplified)
  const yearsToPayoff = inputs.remainingYears;
  const remainingMortgage10Years = yearsToPayoff <= 10 ? 0 : inputs.remainingMortgage * (1 - 10 / yearsToPayoff);
  const remainingMortgage30Years = 0;
  
  // Latent capital gains tax
  const latentCGT10Years = calculateCapitalGainsTax(
    inputs.originalPurchasePrice,
    propertyValue10Years,
    inputs.purchaseDate,
    inputs.capitalGainsTaxRegime,
    false
  );
  const latentCGT30Years = calculateCapitalGainsTax(
    inputs.originalPurchasePrice,
    propertyValue30Years,
    inputs.purchaseDate,
    inputs.capitalGainsTaxRegime,
    false
  );
  
  const netWorth10Years = propertyValue10Years - remainingMortgage10Years - latentCGT10Years;
  const netWorth30Years = propertyValue30Years - remainingMortgage30Years - latentCGT30Years;
  
  const legacyYears = Math.floor(netWorth30Years / (2000 * 12));
  
  return {
    name: 'Behouden als Huurwoning',
    monthlyIncome,
    netWorth10Years,
    netWorth30Years,
    cashflowStability: inputs.propertyManager === 'self' ? 'low' : 'medium',
    fiscalPredictability: 'medium',
    operationalComplexity: inputs.propertyManager === 'self' ? 'high' : 'medium',
    legacyYears,
    details: [
      { label: 'Bruto huur', value: inputs.monthlyRent, description: 'Maandelijkse huurinkomsten' },
      { label: 'Netto huur na kosten', value: netRentalIncome, description: 'Na alle aftrekposten' },
      { label: 'Hypotheeklast', value: mortgagePayment, description: 'Maandelijkse betaling' },
      { label: 'Cashflow', value: monthlyIncome, description: 'Netto maandelijks inkomen' },
      { label: 'Latente CGT (10j)', value: latentCGT10Years, description: 'Bij verkoop na 10 jaar' },
    ],
  };
}

// Stress tests
function calculateStressTests(inputs: PropertyInputs, scenarioC: ScenarioResult): StressTestResult[] {
  const baseMonthlyIncome = scenarioC.monthlyIncome;
  
  // Interest rate +2%
  const higherRateMortgage = calculateMortgagePayment(
    inputs.remainingMortgage,
    inputs.mortgageRate + 2,
    inputs.remainingYears,
    inputs.mortgageType
  );
  const currentMortgage = calculateMortgagePayment(
    inputs.remainingMortgage,
    inputs.mortgageRate,
    inputs.remainingYears,
    inputs.mortgageType
  );
  const rateImpact = higherRateMortgage - currentMortgage;
  
  // Vacancy +5%
  const vacancyImpact = inputs.monthlyRent * 0.05;
  
  // 0% growth for 5 years
  const noGrowthValue = inputs.currentMarketValue;
  const normalGrowthValue = compoundGrowth(inputs.currentMarketValue, inputs.annualGrowthRate, 5);
  const growthImpact = normalGrowthValue - noGrowthValue;
  
  return [
    {
      scenario: 'Rente +2%',
      impact: -rateImpact,
      description: `Je maandelijkse cashflow daalt met €${Math.round(rateImpact)} bij een rentestijging van 2%.`,
    },
    {
      scenario: 'Leegstand +5%',
      impact: -vacancyImpact,
      description: `Extra leegstand kost je €${Math.round(vacancyImpact)} per maand aan gemiste huur.`,
    },
    {
      scenario: 'Geen waardegroei (5j)',
      impact: -growthImpact,
      description: `Bij 5 jaar stagnatie mis je €${Math.round(growthImpact).toLocaleString()} aan waardestijging.`,
    },
  ];
}

// Generate recommendation
function generateRecommendation(
  inputs: PropertyInputs,
  scenarioA: ScenarioResult,
  scenarioB: ScenarioResult,
  scenarioC: ScenarioResult
): AnalysisResult['recommendation'] {
  const horizon = inputs.investmentHorizon;
  const goal = inputs.primaryGoal;
  const risk = inputs.riskProfile;
  
  // Determine best scenario based on goals
  let bestScenario: 'A' | 'B' | 'C' = 'C';
  let reasoning = '';
  const tradeoffs: string[] = [];
  
  const netWorthKey = horizon === 30 ? 'netWorth30Years' : 'netWorth10Years';
  const scenarios = { A: scenarioA, B: scenarioB, C: scenarioC };
  
  switch (goal) {
    case 'cashflow':
      // Highest monthly income wins
      if (scenarioA.monthlyIncome >= scenarioB.monthlyIncome && scenarioA.monthlyIncome >= scenarioC.monthlyIncome) {
        bestScenario = 'A';
      } else if (scenarioB.monthlyIncome >= scenarioC.monthlyIncome) {
        bestScenario = 'B';
      } else {
        bestScenario = 'C';
      }
      reasoning = `Voor maximale cashflow biedt ${scenarios[bestScenario].name} het hoogste maandelijkse inkomen van €${Math.round(scenarios[bestScenario].monthlyIncome)}.`;
      break;
      
    case 'wealth':
      // Highest net worth wins
      if (scenarioA[netWorthKey] >= scenarioB[netWorthKey] && scenarioA[netWorthKey] >= scenarioC[netWorthKey]) {
        bestScenario = 'A';
      } else if (scenarioB[netWorthKey] >= scenarioC[netWorthKey]) {
        bestScenario = 'B';
      } else {
        bestScenario = 'C';
      }
      reasoning = `Voor maximale vermogensopbouw over ${horizon} jaar levert ${scenarios[bestScenario].name} het hoogste eindvermogen op.`;
      break;
      
    case 'retirement':
      // Balance of income and stability
      if (risk === 'low') {
        bestScenario = scenarioA.cashflowStability === 'high' ? 'A' : 'C';
      } else {
        bestScenario = scenarioC[netWorthKey] > scenarioA[netWorthKey] ? 'C' : 'A';
      }
      reasoning = `Voor pensioenplanning met jouw ${risk === 'low' ? 'lage' : risk === 'medium' ? 'gemiddelde' : 'hoge'} risicoprofiel is ${scenarios[bestScenario].name} het meest geschikt.`;
      break;
      
    case 'legacy':
      // Highest legacy years
      if (scenarioA.legacyYears >= scenarioB.legacyYears && scenarioA.legacyYears >= scenarioC.legacyYears) {
        bestScenario = 'A';
      } else if (scenarioB.legacyYears >= scenarioC.legacyYears) {
        bestScenario = 'B';
      } else {
        bestScenario = 'C';
      }
      reasoning = `Voor legacy-opbouw biedt ${scenarios[bestScenario].name} de meeste jaren financiële zekerheid voor je kinderen (${scenarios[bestScenario].legacyYears} jaar).`;
      break;
  }
  
  // Add trade-offs
  if (bestScenario === 'A') {
    tradeoffs.push('Je verliest de fysieke asset en potentiële waardegroei van vastgoed.');
    tradeoffs.push('ETF-rendement is niet gegarandeerd en kan fluctueren.');
  } else if (bestScenario === 'B') {
    tradeoffs.push('Nieuw vastgoed brengt transactiekosten en onbekende risico\\\'s.');
    tradeoffs.push('Je neemt een nieuwe hypotheek en mogelijk hogere operationele lasten.');
  } else {
    tradeoffs.push('Onderhoud en leegstand blijven je verantwoordelijkheid.');
    tradeoffs.push('Je vermogen blijft illiquide tot verkoop.');
  }
  
  if (inputs.propertyManager === 'self') {
    tradeoffs.push('Zelf beheren kost tijd en energie - overweeg een property manager.');
  }
  
  return { bestScenario, reasoning, tradeoffs };
}

// Main analysis function
export function analyzeProperty(inputs: PropertyInputs): AnalysisResult {
  const scenarioA = calculateScenarioA(inputs);
  const scenarioB = calculateScenarioB(inputs);
  const scenarioC = calculateScenarioC(inputs);
  const stressTests = calculateStressTests(inputs, scenarioC);
  const recommendation = generateRecommendation(inputs, scenarioA, scenarioB, scenarioC);
  
  return {
    scenarioA,
    scenarioB,
    scenarioC,
    stressTests,
    recommendation,
  };
}

// Translations
export const translations = {
  nl: {
    title: 'Verkopen of Behouden?',
    subtitle: 'Portugese Vastgoed Analyzer',
    tabs: {
      input: 'Gegevens',
      results: 'Resultaten',
      advice: 'Advies',
    },
    sections: {
      basicData: 'Basisgegevens Pand',
      financing: 'Financiering',
      rental: 'Huur & Bedrijfskosten',
      taxes: 'Belastingen Portugal',
      assumptions: 'Aannames & Doelen',
    },
    fields: {
      currentMarketValue: {
        label: 'Huidige marktwaarde',
        tooltip: 'De geschatte waarde van je pand bij verkoop vandaag.',
      },
      originalPurchasePrice: {
        label: 'Oorspronkelijke aankoopprijs',
        tooltip: 'De prijs die je hebt betaald bij aankoop van het pand.',
      },
      purchaseDate: {
        label: 'Aankoopdatum',
        tooltip: 'Datum van aankoop - belangrijk voor berekening vermogenswinstbelasting.',
      },
      cadastralValue: {
        label: 'Cadastrale waarde (VPT)',
        tooltip: 'Valor Patrimonial Tributário - de fiscale waarde van je pand. Te vinden op je IMI-aanslag.',
      },
      rentalType: {
        label: 'Type verhuur',
        tooltip: 'Langlopend = traditionele jaarhuur. Vakantieverhuur (AL) = korte termijn verhuur.',
      },
      remainingMortgage: {
        label: 'Restschuld hypotheek',
        tooltip: 'Het bedrag dat je nog moet aflossen op je hypotheek.',
      },
      mortgageRate: {
        label: 'Hypotheekrente',
        tooltip: 'Je huidige jaarlijkse hypotheekrente percentage.',
      },
      mortgageType: {
        label: 'Hypotheektype',
        tooltip: 'Aflossingsvrij = alleen rente betalen. Annuïtair = rente + aflossing.',
      },
      remainingYears: {
        label: 'Resterende looptijd',
        tooltip: 'Aantal jaren tot je hypotheek is afgelost.',
      },
      monthlyRent: {
        label: 'Brutohuur per maand',
        tooltip: 'Je totale maandelijkse huurinkomsten vóór kosten.',
      },
      maintenanceCosts: {
        label: 'Onderhoudskosten per maand',
        tooltip: 'Gemiddelde maandelijkse kosten voor onderhoud en reparaties.',
      },
      renovationReserve: {
        label: 'Renovatie-reserve',
        tooltip: 'Percentage van de huur dat je reserveert voor grote renovaties.',
      },
      vacancyRate: {
        label: 'Leegstand',
        tooltip: 'Geschat percentage van het jaar dat je pand leeg staat.',
      },
      propertyManager: {
        label: 'Property manager',
        tooltip: 'Zelf beheren = 0% kosten. Langlopend = ~10%. Vakantie = 20-30%.',
      },
      imiRate: {
        label: 'IMI-belasting',
        tooltip: 'Imposto Municipal sobre Imóveis - jaarlijkse gemeentelijke belasting (0.3-0.8% van VPT).',
      },
      rentalTaxRegime: {
        label: 'Belasting huurinkomsten',
        tooltip: 'Autonoom = vast 28%. Progressief = afhankelijk van totale inkomen (kan lager zijn).',
      },
      salesCosts: {
        label: 'Verkoopkosten bij verkoop',
        tooltip: 'Makelaarskosten, notaris, certificaten etc. Typisch 5-8%.',
      },
      capitalGainsTaxRegime: {
        label: 'Vermogenswinstbelasting regime',
        tooltip: 'Autonoom = 28% over 50% winst. Progressief = tarief afhankelijk van totaal inkomen.',
      },
      reinvestInEUResidence: {
        label: 'Herinvestering in EU-hoofdverblijf?',
        tooltip: 'Bij herinvestering in je eigen woning binnen EU binnen 36 maanden is CGT vrijgesteld.',
      },
      annualGrowthRate: {
        label: 'Jaarlijkse huur- en waardegroei',
        tooltip: 'Verwachte jaarlijkse stijging van huur en vastgoedwaarde. Portugal gemiddelde: 3-4%.',
      },
      alternativeInvestmentReturn: {
        label: 'Alternatief beleggingsrendement',
        tooltip: 'Verwacht rendement bij beleggen in bijv. MSCI World ETF. Historisch ~7-8%.',
      },
      investmentHorizon: {
        label: 'Investeringshorizon',
        tooltip: 'Over hoeveel jaar wil je de scenario\\\'s vergelijken?',
      },
      primaryGoal: {
        label: 'Primair doel',
        tooltip: 'Wat is je belangrijkste financiële doel met dit pand?',
      },
      riskProfile: {
        label: 'Risicoprofiel',
        tooltip: 'Hoeveel risico ben je bereid te nemen met je investeringen?',
      },
    },
    scenarios: {
      a: 'Verkopen + ETF',
      b: 'Verkopen + Nieuw Vastgoed',
      c: 'Behouden als Huurwoning',
    },
    results: {
      monthlyIncome: 'Maandelijks inkomen',
      netWorth: 'Netto vermogen na',
      years: 'jaar',
      legacyYears: 'Legacy: jaren FI voor kinderen',
      cashflowStability: 'Cashflow-stabiliteit',
      fiscalPredictability: 'Fiscale voorspelbaarheid',
      operationalComplexity: 'Operationele complexiteit',
    },
    advice: {
      title: 'Persoonlijk Advies',
      disclaimer: 'Dit advies is niet-bindend en dient alleen ter oriëntatie. Raadpleeg altijd een fiscalist of financieel adviseur.',
      tradeoffs: 'Belangrijke overwegingen',
    },
    buttons: {
      analyze: 'Analyseer',
      export: 'Exporteer PDF',
      reset: 'Reset',
    },
  },
  pt: {
    title: 'Vender ou Manter?',
    subtitle: 'Analisador de Imóveis em Portugal',
    tabs: {
      input: 'Dados',
      results: 'Resultados',
      advice: 'Conselho',
    },
    sections: {
      basicData: 'Dados Básicos do Imóvel',
      financing: 'Financiamento',
      rental: 'Renda & Custos Operacionais',
      taxes: 'Impostos Portugal',
      assumptions: 'Pressupostos & Objetivos',
    },
    fields: {
      currentMarketValue: {
        label: 'Valor de mercado atual',
        tooltip: 'O valor estimado do seu imóvel se vendido hoje.',
      },
      originalPurchasePrice: {
        label: 'Preço de compra original',
        tooltip: 'O preço que pagou quando comprou o imóvel.',
      },
      purchaseDate: {
        label: 'Data de compra',
        tooltip: 'Data da compra - importante para cálculo de mais-valias.',
      },
      cadastralValue: {
        label: 'Valor Patrimonial Tributário (VPT)',
        tooltip: 'O valor fiscal do seu imóvel. Encontra-se na nota de IMI.',
      },
      rentalType: {
        label: 'Tipo de arrendamento',
        tooltip: 'Longa duração = arrendamento tradicional. Alojamento Local (AL) = curta duração.',
      },
      remainingMortgage: {
        label: 'Dívida hipotecária',
        tooltip: 'O montante que ainda tem de pagar da hipoteca.',
      },
      mortgageRate: {
        label: 'Taxa de juro',
        tooltip: 'A sua taxa de juro anual atual.',
      },
      mortgageType: {
        label: 'Tipo de hipoteca',
        tooltip: 'Só juros = apenas paga juros. Amortização = juros + capital.',
      },
      remainingYears: {
        label: 'Prazo restante',
        tooltip: 'Anos até a hipoteca estar paga.',
      },
      monthlyRent: {
        label: 'Renda bruta mensal',
        tooltip: 'As suas receitas totais de renda antes dos custos.',
      },
      maintenanceCosts: {
        label: 'Custos de manutenção mensais',
        tooltip: 'Custos médios mensais de manutenção e reparações.',
      },
      renovationReserve: {
        label: 'Reserva para renovações',
        tooltip: 'Percentagem da renda que reserva para grandes renovações.',
      },
      vacancyRate: {
        label: 'Taxa de vacância',
        tooltip: 'Percentagem estimada do ano em que o imóvel está vazio.',
      },
      propertyManager: {
        label: 'Gestor de propriedade',
        tooltip: 'Autogestão = 0%. Longa duração = ~10%. Curta duração = 20-30%.',
      },
      imiRate: {
        label: 'IMI',
        tooltip: 'Imposto Municipal sobre Imóveis - imposto anual (0.3-0.8% do VPT).',
      },
      rentalTaxRegime: {
        label: 'Tributação de rendas',
        tooltip: 'Autónoma = taxa fixa 28%. Englobamento = depende do rendimento total.',
      },
      salesCosts: {
        label: 'Custos de venda',
        tooltip: 'Comissão imobiliária, notário, certificados, etc. Tipicamente 5-8%.',
      },
      capitalGainsTaxRegime: {
        label: 'Regime de mais-valias',
        tooltip: 'Autónoma = 28% sobre 50% do ganho. Englobamento = taxa depende do rendimento.',
      },
      reinvestInEUResidence: {
        label: 'Reinvestimento em habitação própria UE?',
        tooltip: 'Reinvestimento em habitação própria na UE dentro de 36 meses isenta de mais-valias.',
      },
      annualGrowthRate: {
        label: 'Crescimento anual de renda e valor',
        tooltip: 'Aumento anual esperado de renda e valor do imóvel. Média Portugal: 3-4%.',
      },
      alternativeInvestmentReturn: {
        label: 'Retorno de investimento alternativo',
        tooltip: 'Retorno esperado ao investir em ETF MSCI World. Histórico ~7-8%.',
      },
      investmentHorizon: {
        label: 'Horizonte de investimento',
        tooltip: 'Em quantos anos quer comparar os cenários?',
      },
      primaryGoal: {
        label: 'Objetivo principal',
        tooltip: 'Qual é o seu principal objetivo financeiro com este imóvel?',
      },
      riskProfile: {
        label: 'Perfil de risco',
        tooltip: 'Quanto risco está disposto a assumir com os seus investimentos?',
      },
    },
    scenarios: {
      a: 'Vender + ETF',
      b: 'Vender + Novo Imóvel',
      c: 'Manter como Arrendamento',
    },
    results: {
      monthlyIncome: 'Rendimento mensal',
      netWorth: 'Património líquido após',
      years: 'anos',
      legacyYears: 'Legado: anos de IF para filhos',
      cashflowStability: 'Estabilidade de cash flow',
      fiscalPredictability: 'Previsibilidade fiscal',
      operationalComplexity: 'Complexidade operacional',
    },
    advice: {
      title: 'Conselho Pessoal',
      disclaimer: 'Este conselho não é vinculativo e serve apenas para orientação. Consulte sempre um fiscalista ou consultor financeiro.',
      tradeoffs: 'Considerações importantes',
    },
    buttons: {
      analyze: 'Analisar',
      export: 'Exportar PDF',
      reset: 'Resetar',
    },
  },
};
