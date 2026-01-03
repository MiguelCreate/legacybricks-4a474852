// Multi-Unit Investment Analysis Calculations
import { calculateIMT2025 } from './portugueseTaxCalculations';

export interface UnitInput {
  id: string;
  naam: string;
  oppervlakte_m2: number;
  maandhuur: number;
  verdelingsfactor_pct: number;
  energielabel: "A" | "B" | "C" | "D" | "E" | "F";
  huurderretentie_maanden: number;
  renovatiebehoeftescore: number; // 1-10
  bezettingsgraad: number; // percentage
  huurdertype: "langdurig" | "toerisme" | "student";
}

export interface GemeenschappelijkeKosten {
  gas_maandelijks: number;
  water_maandelijks: number;
  vve_maandelijks: number;
  onderhoud_jaarlijks: number;
  verzekering_jaarlijks: number;
}

export interface MultiUnitInputs {
  // Property level
  pandNaam: string;
  aankoopprijs: number;
  imt: number;
  imtAutomatisch: boolean; // Calculate IMT automatically
  notarisKosten: number;
  renovatieKosten: number;
  eigenInleg: number;
  hypotheekBedrag: number;
  hypotheekMaandlast: number;
  maandlastHandmatig: boolean; // true = manual input, false = calculate
  rentePercentage: number;
  looptijdJaren: number;
  marktwaarde: number;
  pandType: 'woning' | 'niet-woning'; // For IMT calculation
  
  // Units
  units: UnitInput[];
  
  // Gemeenschappelijke kosten
  gemeenschappelijkeKosten: GemeenschappelijkeKosten;
  
  // Tax settings - IRS
  irsJaar: number; // Year for which IRS is calculated (affects regime)
  contractduurJaren: number; // Contract duration for old regime
}

export interface UnitAnalysis {
  id: string;
  naam: string;
  oppervlakte_m2: number;
  
  // Income
  brutoHuur: number;
  verdeeldeKosten: number;
  noi: number;
  hypotheekAandeel: number;
  pureCashflow: number;
  cashflowNaBelasting: number;
  
  // Metrics
  rendementPerM2: number;
  opexRatio: number;
  bezettingsgraad: number;
  huurderretentie: number;
  cashOnCash: number;
  dscr: number;
  
  // Qualitative
  energielabel: string;
  renovatiebehoeftescore: number;
  huurdertype: string;
}

export interface MultiUnitAnalysis {
  // Totals
  totaalBrutoHuur: number;
  totaalNOI: number;
  totaalPureCashflow: number;
  totaalCashflowNaBelasting: number;
  
  // Aggregated metrics
  gemiddeldCashOnCash: number;
  gemiddeldDSCR: number;
  gemiddeldOpexRatio: number;
  gemiddeldBezettingsgraad: number;
  gemiddeldHuurderretentie: number;
  
  // Property-level metrics
  totaleInvestering: number;
  eigenInleg: number;
  capRate: number;
  jaarlijkseCashflow: number;
  irr10Jaar: number;
  
  // Risk indicators
  geschatteRenovatiekosten3Jaar: number;
  portfolioDiversiteit: { type: string; count: number; percentage: number }[];
  
  // Per unit analysis
  units: UnitAnalysis[];
  
  // Break-even
  breakEvenBezetting: number;
}

// Helper: Calculate monthly mortgage payment
function calculatePMT(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || annualRate <= 0 || years <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

// Helper: Calculate IRR approximation
function calculateIRR(cashflows: number[], maxIterations: number = 100): number {
  let rate = 0.1;
  const tolerance = 0.0001;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let j = 0; j < cashflows.length; j++) {
      npv += cashflows[j] / Math.pow(1 + rate, j);
      dnpv -= j * cashflows[j] / Math.pow(1 + rate, j + 1);
    }
    
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100;
    }
    rate = newRate;
    
    if (rate < -1 || rate > 10) return 0;
  }
  
  return rate * 100;
}

// Helper: Calculate IRS percentage based on year and contract duration
function calculateIRSPercentage(jaar: number, contractduurJaren: number, units: UnitInput[]): number {
  // Calculate average monthly rent across units
  const totaalMaandHuur = units.reduce((sum, u) => sum + u.maandhuur, 0);
  const gemiddeldeMaandHuur = units.length > 0 ? totaalMaandHuur / units.length : 0;
  
  // New regime 2026-2029: based on monthly rent threshold €2,300
  if (jaar >= 2026 && jaar <= 2029) {
    if (gemiddeldeMaandHuur <= 2300) {
      return 10; // Reduced rate for affordable housing
    }
    return 25; // Standard rate
  }
  
  // Old regime ≤2025 or after 2029: based on contract duration
  if (contractduurJaren < 2) {
    return 28; // Short-term
  } else if (contractduurJaren < 5) {
    return 25;
  } else if (contractduurJaren < 10) {
    return 15;
  } else if (contractduurJaren < 20) {
    return 10;
  } else {
    return 5; // 20+ years
  }
}

// Calculate IMT based on Portuguese 2026 rates
// Uses calculateIMT2025 from portugueseTaxCalculations for consistency

export function calculateIMTForMultiUnit(
  aankoopprijs: number,
  pandType: 'woning' | 'niet-woning' = 'niet-woning'
): number {
  const result = calculateIMT2025(aankoopprijs, pandType);
  return result.bedrag;
}

export function analyzeMultiUnit(inputs: MultiUnitInputs): MultiUnitAnalysis {
  const { units, gemeenschappelijkeKosten, eigenInleg, hypotheekBedrag, rentePercentage, looptijdJaren, marktwaarde, aankoopprijs, imt, notarisKosten, renovatieKosten, irsJaar, contractduurJaren, maandlastHandmatig, hypotheekMaandlast } = inputs;
  
  // Calculate totals
  const totaleInvestering = aankoopprijs + imt + notarisKosten + renovatieKosten;
  
  // Total monthly gemeenschappelijke kosten
  const totaalGemeenschappelijkMaand = 
    gemeenschappelijkeKosten.gas_maandelijks +
    gemeenschappelijkeKosten.water_maandelijks +
    gemeenschappelijkeKosten.vve_maandelijks +
    (gemeenschappelijkeKosten.onderhoud_jaarlijks / 12) +
    (gemeenschappelijkeKosten.verzekering_jaarlijks / 12);
  
  // Monthly mortgage payment - use manual input or calculate
  const maandelijkseHypotheek = maandlastHandmatig 
    ? hypotheekMaandlast 
    : calculatePMT(hypotheekBedrag, rentePercentage, looptijdJaren);
  
  // Calculate IRS percentage based on regime
  const irsPercentage = calculateIRSPercentage(irsJaar, contractduurJaren, units);
  
  // Analyze each unit
  const unitAnalyses: UnitAnalysis[] = units.map(unit => {
    const verdeelFactor = unit.verdelingsfactor_pct / 100;
    const brutoHuurJaar = unit.maandhuur * 12 * (unit.bezettingsgraad / 100);
    const verdeeldeKostenJaar = totaalGemeenschappelijkMaand * 12 * verdeelFactor;
    const noi = brutoHuurJaar - verdeeldeKostenJaar;
    const hypotheekAandeelJaar = maandelijkseHypotheek * 12 * verdeelFactor;
    const pureCashflow = noi - hypotheekAandeelJaar;
    const cashflowNaBelasting = pureCashflow * (1 - irsPercentage / 100);
    
    // Calculate metrics
    const rendementPerM2 = unit.oppervlakte_m2 > 0 ? brutoHuurJaar / unit.oppervlakte_m2 : 0;
    const opexRatio = brutoHuurJaar > 0 ? (verdeeldeKostenJaar / brutoHuurJaar) * 100 : 0;
    const eigenInlegUnit = eigenInleg * verdeelFactor;
    const cashOnCash = eigenInlegUnit > 0 ? (pureCashflow / eigenInlegUnit) * 100 : 0;
    const dscr = hypotheekAandeelJaar > 0 ? noi / hypotheekAandeelJaar : 999;
    
    return {
      id: unit.id,
      naam: unit.naam,
      oppervlakte_m2: unit.oppervlakte_m2,
      brutoHuur: brutoHuurJaar,
      verdeeldeKosten: verdeeldeKostenJaar,
      noi,
      hypotheekAandeel: hypotheekAandeelJaar,
      pureCashflow,
      cashflowNaBelasting,
      rendementPerM2,
      opexRatio,
      bezettingsgraad: unit.bezettingsgraad,
      huurderretentie: unit.huurderretentie_maanden,
      cashOnCash,
      dscr,
      energielabel: unit.energielabel,
      renovatiebehoeftescore: unit.renovatiebehoeftescore,
      huurdertype: unit.huurdertype,
    };
  });
  
  // Aggregate totals
  const totaalBrutoHuur = unitAnalyses.reduce((sum, u) => sum + u.brutoHuur, 0);
  const totaalNOI = unitAnalyses.reduce((sum, u) => sum + u.noi, 0);
  const totaalPureCashflow = unitAnalyses.reduce((sum, u) => sum + u.pureCashflow, 0);
  const totaalCashflowNaBelasting = unitAnalyses.reduce((sum, u) => sum + u.cashflowNaBelasting, 0);
  
  // Aggregate averages
  const numUnits = unitAnalyses.length || 1;
  const gemiddeldCashOnCash = unitAnalyses.reduce((sum, u) => sum + u.cashOnCash, 0) / numUnits;
  const gemiddeldDSCR = unitAnalyses.reduce((sum, u) => sum + u.dscr, 0) / numUnits;
  const gemiddeldOpexRatio = unitAnalyses.reduce((sum, u) => sum + u.opexRatio, 0) / numUnits;
  const gemiddeldBezettingsgraad = unitAnalyses.reduce((sum, u) => sum + u.bezettingsgraad, 0) / numUnits;
  const gemiddeldHuurderretentie = unitAnalyses.reduce((sum, u) => sum + u.huurderretentie, 0) / numUnits;
  
  // Property-level metrics
  const effectiveMarktwaarde = marktwaarde > 0 ? marktwaarde : totaleInvestering;
  const capRate = effectiveMarktwaarde > 0 ? (totaalNOI / effectiveMarktwaarde) * 100 : 0;
  
  // Calculate 10-year IRR
  const initialInvestment = -eigenInleg;
  const annualCashflows = Array(10).fill(totaalPureCashflow);
  const exitValue = effectiveMarktwaarde * Math.pow(1.03, 10); // 3% annual growth
  const remainingDebt = hypotheekBedrag * 0.7; // Simplified: 30% paid off after 10 years
  annualCashflows[9] += exitValue - remainingDebt;
  const irr10Jaar = calculateIRR([initialInvestment, ...annualCashflows]);
  
  // Estimate renovation costs for next 3 years
  const avgRenovatiescore = units.reduce((sum, u) => sum + u.renovatiebehoeftescore, 0) / numUnits;
  const geschatteRenovatiekosten3Jaar = avgRenovatiescore * 500 * numUnits; // €500 per score point per unit
  
  // Portfolio diversity
  const huurderTypes = units.reduce((acc, u) => {
    acc[u.huurdertype] = (acc[u.huurdertype] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const portfolioDiversiteit = Object.entries(huurderTypes).map(([type, count]) => ({
    type,
    count,
    percentage: (count / numUnits) * 100,
  }));
  
  // Break-even occupancy
  const totalFixedCosts = totaalGemeenschappelijkMaand * 12 + maandelijkseHypotheek * 12;
  const maxPotentialRent = units.reduce((sum, u) => sum + u.maandhuur * 12, 0);
  const breakEvenBezetting = maxPotentialRent > 0 ? (totalFixedCosts / maxPotentialRent) * 100 : 100;
  
  return {
    totaalBrutoHuur,
    totaalNOI,
    totaalPureCashflow,
    totaalCashflowNaBelasting,
    gemiddeldCashOnCash,
    gemiddeldDSCR,
    gemiddeldOpexRatio,
    gemiddeldBezettingsgraad,
    gemiddeldHuurderretentie,
    totaleInvestering,
    eigenInleg,
    capRate,
    jaarlijkseCashflow: totaalPureCashflow,
    irr10Jaar,
    geschatteRenovatiekosten3Jaar,
    portfolioDiversiteit,
    units: unitAnalyses,
    breakEvenBezetting,
  };
}

// Metric explanations for beginner mode
export const multiUnitMetricExplanations = {
  brutoHuur: {
    title: "Bruto Huurinkomsten",
    wat: "Het bedrag dat je per jaar ontvangt van huurders, vóór enige kosten.",
    waarom: "Dit is je bruto inkomen — de basis van je cashflow.",
    goed: "> €20/m²/maand = sterk (Portugal)",
    matig: "€15–20 = redelijk",
    slecht: "< €15 = laag — overweeg huuraanpassing",
  },
  noi: {
    title: "Netto Huurinkomsten (NOI)",
    wat: "Huur na aftrek van onderhoud, verzekering, IMI en andere bedrijfskosten (maar vóór hypotheek).",
    waarom: "Dit laat zien hoe rendabel je pand is, onafhankelijk van financiering.",
    goed: "NOI > 70% van bruto huur = efficiënt",
    matig: "50-70% = redelijk",
    slecht: "NOI < 50% = te veel kosten",
  },
  pureCashflow: {
    title: "Pure Cash Flow",
    wat: "Het geld dat overblijft na alle kosten én hypotheek.",
    waarom: "Dit is wat je daadwerkelijk kunt sparen of herinvesteren.",
    goed: "Positief = gezond",
    matig: "€0 = break-even",
    slecht: "Negatief = je betaalt uit eigen zak",
  },
  cashOnCash: {
    title: "Cash-on-Cash Return",
    wat: "Rendement op je eigen ingelede geld.",
    waarom: "Meet efficiëntie van je investering, niet je totale vermogen.",
    goed: ">12% = sterk voor Portugal",
    matig: "8–12% = redelijk",
    slecht: "<8% = laag",
  },
  capRate: {
    title: "Cap Rate",
    wat: "Jaarlijkse NOI gedeeld door de marktwaarde van het pand.",
    waarom: "Vergelijkt de waarde van panden onafhankelijk van financiering.",
    goed: "6–8% = gezond in Portugal",
    matig: "5-6% = acceptabel",
    slecht: "<5% = laag rendement op waarde",
  },
  dscr: {
    title: "DSCR (Debt Service Coverage Ratio)",
    wat: "Hoeveel keer je huur je hypotheek betaalt.",
    waarom: "Banken eisen vaak >1.2. Jij ook!",
    goed: ">1.5 = veilig",
    matig: "1.2–1.5 = acceptabel",
    slecht: "<1.2 = risico op betalingsproblemen",
  },
  rendementPerM2: {
    title: "Rendement per m²",
    wat: "Jaarhuur gedeeld door oppervlakte.",
    waarom: "Laat zien hoe efficiënt je ruimte gebruikt wordt.",
    goed: "> €150/m²/jaar = sterk",
    matig: "€100-150 = redelijk",
    slecht: "< €100/m²/jaar = ruimte wordt onderbenut",
  },
  opexRatio: {
    title: "OPEX-ratio",
    wat: "Percentage van huur dat opgaat aan kosten.",
    waarom: "Hoge ratio = minder winst.",
    goed: "<30% = efficiënt",
    matig: "30-50% = redelijk",
    slecht: ">50% = te duur",
  },
  bezettingsgraad: {
    title: "Bezettingsgraad",
    wat: "Percentage van het jaar dat de unit verhuurd is.",
    waarom: "Leegstand kost geld.",
    goed: ">90% = stabiel",
    matig: "70-90% = redelijk",
    slecht: "<70% = risico",
  },
  huurderretentie: {
    title: "Huurderretentie",
    wat: "Gemiddelde duur van huurcontracten in maanden.",
    waarom: "Minder wisseling = minder administratie en leegstand.",
    goed: ">24 maanden = stabiel",
    matig: "6-24 maanden = redelijk",
    slecht: "<6 maanden = veel wisseling",
  },
  cashflowNaBelasting: {
    title: "Cashflow na belasting",
    wat: "Pure cashflow na aftrek van IRS-belasting.",
    waarom: "Dit is je echte netto inkomen.",
    goed: "Positief na belasting",
    matig: "Rond break-even",
    slecht: "Negatief na belasting",
  },
  breakEvenBezetting: {
    title: "Break-even bezettingsgraad",
    wat: "Minimale bezetting om quitte te spelen.",
    waarom: "Weet hoeveel je moet verhuren om kosten te dekken.",
    goed: "<50% = comfortabel",
    matig: "50-70% = redelijk",
    slecht: ">70% = hoge druk",
  },
  energielabel: {
    title: "Duurzaamheidsscore",
    wat: "Energie-efficiëntie van de unit (A t/m F).",
    waarom: "Hogere huur, lagere kosten, toekomstbestendig.",
    goed: "A of B = uitstekend",
    matig: "C of D = redelijk",
    slecht: "E of F = verbetering nodig",
  },
  renovatiebehoeftescore: {
    title: "Renovatiebehoeftescore",
    wat: "Schatting van benodigde investering de komende 3 jaar (1–10).",
    waarom: "Voorspel onverwachte kosten.",
    goed: "1–3 = onderhoudsarm",
    matig: "4-7 = normale slijtage",
    slecht: "8–10 = grote investering nodig",
  },
  portfolioDiversiteit: {
    title: "Unit-Portefeuille Diversiteit",
    wat: "Mix van huurders (langdurig, toerisme, student).",
    waarom: "Diversiteit = balans tussen rendement en risico.",
    goed: "Gebalanceerd = stabiel",
    matig: "Overwegend één type",
    slecht: "Alleen Airbnb = risicovol",
  },
};

export function getMetricStatus(
  metric: keyof typeof multiUnitMetricExplanations,
  value: number
): "good" | "warning" | "danger" {
  switch (metric) {
    case "cashOnCash":
      return value >= 12 ? "good" : value >= 8 ? "warning" : "danger";
    case "capRate":
      return value >= 6 ? "good" : value >= 5 ? "warning" : "danger";
    case "dscr":
      return value >= 1.5 ? "good" : value >= 1.2 ? "warning" : "danger";
    case "rendementPerM2":
      return value >= 150 ? "good" : value >= 100 ? "warning" : "danger";
    case "opexRatio":
      return value <= 30 ? "good" : value <= 50 ? "warning" : "danger";
    case "bezettingsgraad":
      return value >= 90 ? "good" : value >= 70 ? "warning" : "danger";
    case "huurderretentie":
      return value >= 24 ? "good" : value >= 6 ? "warning" : "danger";
    case "breakEvenBezetting":
      return value <= 50 ? "good" : value <= 70 ? "warning" : "danger";
    case "renovatiebehoeftescore":
      return value <= 3 ? "good" : value <= 7 ? "warning" : "danger";
    default:
      return "warning";
  }
}
