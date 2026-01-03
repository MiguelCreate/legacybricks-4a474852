// Portuguese Tax Calculations - 2025 rates and 2026-2029 new rental income rules

/**
 * IMT (Imposto Municipal sobre Transmissões) - Transfer Tax at Purchase
 * 2025 rates for non-residential/investment properties
 */
export interface IMTResult {
  bedrag: number;
  marginaalTarief: number;
  gemiddeldTarief: number;
  taxaUnica: boolean;
  uitleg: string;
}

/**
 * IMT 2026 progressive brackets for "woning" (residential):
 * - Tot €106.346 → 0%
 * - €106.347 – €145.470 → 2% marginaal
 * - €145.471 – €198.347 → 5% marginaal  
 * - €198.348 – €330.539 → 7% marginaal
 * - €330.540 – €633.453 → 8% marginaal
 * - €633.454 – €1.102.920 → 6% taxa única
 * - Boven €1.102.920 → 7,5% taxa única
 * 
 * For "niet-woning" (investment): flat 6.5%
 */
export function calculateIMT2025(
  aankoopprijs: number,
  pandType: 'woning' | 'niet-woning' = 'niet-woning'
): IMTResult {
  if (aankoopprijs <= 0) {
    return {
      bedrag: 0,
      marginaalTarief: 0,
      gemiddeldTarief: 0,
      taxaUnica: false,
      uitleg: 'Geen aankoopprijs opgegeven.'
    };
  }

  // Non-residential (investment): 6.5% flat rate (taxa única)
  if (pandType === 'niet-woning') {
    const imtBedrag = aankoopprijs * 0.065;
    return {
      bedrag: Math.round(imtBedrag * 100) / 100,
      marginaalTarief: 6.5,
      gemiddeldTarief: 6.5,
      taxaUnica: true,
      uitleg: 'Voor niet-woningen (investeerders) geldt een vast tarief van 6,5%.'
    };
  }

  // 2026 progressive rates for residential properties (woning)
  // Using progressive bracket calculation
  let imtBedrag = 0;
  let marginaalTarief = 0;
  let taxaUnica = false;
  let uitleg = '';

  // Bracket thresholds (2026 projection)
  const BRACKET_1 = 106346;  // 0%
  const BRACKET_2 = 145470;  // 2% marginaal
  const BRACKET_3 = 198347;  // 5% marginaal
  const BRACKET_4 = 330539;  // 7% marginaal
  const BRACKET_5 = 633453;  // 8% marginaal
  const BRACKET_6 = 1102920; // 6% taxa única above this
  // Above BRACKET_6: 7.5% taxa única

  if (aankoopprijs <= BRACKET_1) {
    // Tot €106.346 → 0%
    imtBedrag = 0;
    marginaalTarief = 0;
    uitleg = 'Vrijgesteld tot €106.346 voor woningen.';
  } else if (aankoopprijs <= BRACKET_2) {
    // €106.347 – €145.470 → 2% marginaal
    // Progressive calculation: 0% on first bracket, 2% on excess
    imtBedrag = (aankoopprijs - BRACKET_1) * 0.02;
    marginaalTarief = 2;
    uitleg = 'Progressief tarief: 0% tot €106.346, daarna 2%.';
  } else if (aankoopprijs <= BRACKET_3) {
    // €145.471 – €198.347 → 5% marginaal
    imtBedrag = (BRACKET_2 - BRACKET_1) * 0.02 + (aankoopprijs - BRACKET_2) * 0.05;
    marginaalTarief = 5;
    uitleg = 'Progressief tarief: 2% tot €145.470, daarna 5%.';
  } else if (aankoopprijs <= BRACKET_4) {
    // €198.348 – €330.539 → 7% marginaal
    imtBedrag = (BRACKET_2 - BRACKET_1) * 0.02 + 
                (BRACKET_3 - BRACKET_2) * 0.05 + 
                (aankoopprijs - BRACKET_3) * 0.07;
    marginaalTarief = 7;
    uitleg = 'Progressief tarief: 5% tot €198.347, daarna 7%.';
  } else if (aankoopprijs <= BRACKET_5) {
    // €330.540 – €633.453 → 8% marginaal
    imtBedrag = (BRACKET_2 - BRACKET_1) * 0.02 + 
                (BRACKET_3 - BRACKET_2) * 0.05 + 
                (BRACKET_4 - BRACKET_3) * 0.07 +
                (aankoopprijs - BRACKET_4) * 0.08;
    marginaalTarief = 8;
    uitleg = 'Progressief tarief: 7% tot €330.539, daarna 8%.';
  } else if (aankoopprijs <= BRACKET_6) {
    // €633.454 – €1.102.920 → 6% taxa única
    imtBedrag = aankoopprijs * 0.06;
    marginaalTarief = 6;
    taxaUnica = true;
    uitleg = 'Taxa única 6% voor woningen €633.454 – €1.102.920.';
  } else {
    // Boven €1.102.920 → 7,5% taxa única
    imtBedrag = aankoopprijs * 0.075;
    marginaalTarief = 7.5;
    taxaUnica = true;
    uitleg = 'Taxa única 7,5% voor woningen boven €1.102.920.';
  }

  const gemiddeldTarief = aankoopprijs > 0 ? (imtBedrag / aankoopprijs) * 100 : 0;

  return {
    bedrag: Math.max(0, Math.round(imtBedrag * 100) / 100),
    marginaalTarief,
    gemiddeldTarief: Math.round(gemiddeldTarief * 10000) / 10000, // 4 decimals for accuracy
    taxaUnica,
    uitleg
  };
}

/**
 * IMI (Imposto Municipal sobre Imóveis) - Annual Property Tax
 * Based on VPT (Valor Patrimonial Tributário), not purchase price
 */
export interface IMIResult {
  jaarlijksBedrag: number;
  maandelijksBedrag: number;
  tarief: number;
  uitleg: string;
  volgendeBetaling: string;
}

export type GemeenteType = 'standaard' | 'grote_stad' | 'landelijk';

export function calculateIMI(
  vptWaarde: number,
  gemeenteType: GemeenteType = 'standaard',
  customTarief?: number
): IMIResult {
  if (vptWaarde <= 0) {
    return {
      jaarlijksBedrag: 0,
      maandelijksBedrag: 0,
      tarief: 0,
      uitleg: 'Geen VPT-waarde opgegeven.',
      volgendeBetaling: ''
    };
  }

  // Determine tariff based on gemeente type
  let tarief = customTarief ?? 0.5; // Default 0.5%
  
  if (!customTarief) {
    switch (gemeenteType) {
      case 'grote_stad':
        tarief = 0.45; // Lissabon, Porto typically 0.3-0.45%
        break;
      case 'landelijk':
        tarief = 0.3; // Rural areas often lower
        break;
      default:
        tarief = 0.5; // Standard rate for non-residents
    }
  }

  const jaarlijksBedrag = vptWaarde * (tarief / 100);
  
  // Next payment is typically in May/June
  const now = new Date();
  const currentYear = now.getFullYear();
  const mayDeadline = new Date(currentYear, 4, 31); // May 31
  const volgendJaar = now > mayDeadline ? currentYear + 1 : currentYear;

  return {
    jaarlijksBedrag: Math.round(jaarlijksBedrag * 100) / 100,
    maandelijksBedrag: Math.round((jaarlijksBedrag / 12) * 100) / 100,
    tarief,
    uitleg: `IMI wordt berekend op basis van de fiscale waarde (VPT) × ${tarief}%. De VPT is meestal 50-70% van de marktwaarde.`,
    volgendeBetaling: `Mei/Juni ${volgendJaar}`
  };
}

/**
 * IRS (Imposto sobre o Rendimento de Pessoas Singulares) - Rental Income Tax
 * Supports both old regime (≤2025) and new regime (2026-2029)
 */
export interface IRSResult {
  jaarlijksBedrag: number;
  maandelijksBedrag: number;
  brutoJaarHuur: number;
  nettoJaarHuur: number;
  nettoMaandHuur: number;
  tarief: number;
  regeling: 'oud' | 'nieuw' | 'onbekend';
  uitleg: string;
  besparing?: number;
  waarschuwing?: string;
}

export interface IRSInput {
  jaarHuurinkomst: number; // Year of rental income
  maandHuur: number;
  contractduurJaren?: number; // Only for old regime
  aantalVerlengingen?: number; // For old regime renewal discount
  englobamento?: boolean;
  dhdContract?: boolean; // Direito de Habitação Duradoura
}

export function calculateIRS(input: IRSInput): IRSResult {
  const { 
    jaarHuurinkomst, 
    maandHuur, 
    contractduurJaren = 1, 
    aantalVerlengingen = 0,
    englobamento = false,
    dhdContract = false 
  } = input;

  const brutoJaarHuur = maandHuur * 12;

  if (brutoJaarHuur <= 0) {
    return {
      jaarlijksBedrag: 0,
      maandelijksBedrag: 0,
      brutoJaarHuur: 0,
      nettoJaarHuur: 0,
      nettoMaandHuur: 0,
      tarief: 0,
      regeling: 'onbekend',
      uitleg: 'Geen huurinkomsten opgegeven.'
    };
  }

  // Determine which regime applies
  if (jaarHuurinkomst >= 2030) {
    return {
      jaarlijksBedrag: brutoJaarHuur * 0.25, // Default rate
      maandelijksBedrag: (brutoJaarHuur * 0.25) / 12,
      brutoJaarHuur,
      nettoJaarHuur: brutoJaarHuur * 0.75,
      nettoMaandHuur: (brutoJaarHuur * 0.75) / 12,
      tarief: 25,
      regeling: 'onbekend',
      uitleg: 'Na 2029 is de regeling onbekend.',
      waarschuwing: 'Na 2029 is de regeling onzeker — plan voorzichtig en raadpleeg een fiscalist.'
    };
  }

  // New regime 2026-2029
  if (jaarHuurinkomst >= 2026 && jaarHuurinkomst <= 2029) {
    return calculateIRSNewRegime(maandHuur, brutoJaarHuur, englobamento);
  }

  // Old regime ≤2025
  return calculateIRSOldRegime(brutoJaarHuur, contractduurJaren, aantalVerlengingen, dhdContract);
}

function calculateIRSNewRegime(
  maandHuur: number,
  brutoJaarHuur: number,
  englobamento: boolean
): IRSResult {
  // New regime (2026-2029): based on monthly rent threshold €2,300
  if (englobamento) {
    // Progressive rate - estimate at 30%
    const tarief = 30;
    const irsBedrag = brutoJaarHuur * (tarief / 100);
    return {
      jaarlijksBedrag: Math.round(irsBedrag * 100) / 100,
      maandelijksBedrag: Math.round((irsBedrag / 12) * 100) / 100,
      brutoJaarHuur,
      nettoJaarHuur: Math.round((brutoJaarHuur - irsBedrag) * 100) / 100,
      nettoMaandHuur: Math.round(((brutoJaarHuur - irsBedrag) / 12) * 100) / 100,
      tarief,
      regeling: 'nieuw',
      uitleg: 'Bij englobamento wordt je huurinkomen opgeteld bij je andere inkomsten en progressief belast (13-48%).',
      waarschuwing: 'Schatting: 30%. De exacte belasting hangt af van je totale inkomen. Raadpleeg een fiscalist.'
    };
  }

  let tarief: number;
  let uitleg: string;
  let besparing: number | undefined;

  if (maandHuur <= 2300) {
    tarief = 10;
    uitleg = `Omdat je huur ≤ €2.300/maand en je inkomen tussen 2026-2029 valt, betaal je slechts 10% belasting.`;
    // Calculate savings compared to old 25% rate
    besparing = brutoJaarHuur * 0.15; // 25% - 10% = 15%
  } else {
    tarief = 25;
    uitleg = `Je huur is > €2.300/maand, waardoor het standaardtarief van 25% van toepassing is.`;
  }

  const irsBedrag = brutoJaarHuur * (tarief / 100);

  return {
    jaarlijksBedrag: Math.round(irsBedrag * 100) / 100,
    maandelijksBedrag: Math.round((irsBedrag / 12) * 100) / 100,
    brutoJaarHuur,
    nettoJaarHuur: Math.round((brutoJaarHuur - irsBedrag) * 100) / 100,
    nettoMaandHuur: Math.round(((brutoJaarHuur - irsBedrag) / 12) * 100) / 100,
    tarief,
    regeling: 'nieuw',
    uitleg,
    besparing
  };
}

function calculateIRSOldRegime(
  brutoJaarHuur: number,
  contractduurJaren: number,
  aantalVerlengingen: number,
  dhdContract: boolean
): IRSResult {
  // Old regime (≤2025): based on contract duration
  let tarief: number;
  let uitleg: string;

  if (contractduurJaren < 2) {
    tarief = 28; // Standard rate for short-term
    uitleg = 'Korte contracten (< 2 jaar) worden belast tegen 28%.';
  } else if (contractduurJaren < 5) {
    tarief = 25;
    uitleg = 'Contracten van 2-5 jaar worden belast tegen 25%.';
  } else if (contractduurJaren < 10) {
    // 5-10 years: 15% with potential reductions for renewals
    tarief = Math.max(5, 15 - (aantalVerlengingen * 2));
    uitleg = `Contracten van 5-10 jaar: 15% met ${aantalVerlengingen > 0 ? `${aantalVerlengingen * 2}% korting voor verlengingen` : 'mogelijke kortingen bij verlenging'}.`;
  } else if (contractduurJaren < 20) {
    tarief = 10;
    uitleg = 'Contracten van 10-20 jaar worden belast tegen 10%.';
  } else {
    tarief = 5;
    uitleg = 'Contracten van 20+ jaar worden belast tegen het laagste tarief van 5%.';
  }

  // DHD (Direito de Habitação Duradoura) discount
  if (dhdContract) {
    const dhdKorting = tarief * 0.20; // 20% discount on tax
    tarief = tarief - dhdKorting;
    uitleg += ` DHD-contract geeft 20% korting op de belasting.`;
  }

  const irsBedrag = brutoJaarHuur * (tarief / 100);

  return {
    jaarlijksBedrag: Math.round(irsBedrag * 100) / 100,
    maandelijksBedrag: Math.round((irsBedrag / 12) * 100) / 100,
    brutoJaarHuur,
    nettoJaarHuur: Math.round((brutoJaarHuur - irsBedrag) * 100) / 100,
    nettoMaandHuur: Math.round(((brutoJaarHuur - irsBedrag) / 12) * 100) / 100,
    tarief: Math.round(tarief * 100) / 100,
    regeling: 'oud',
    uitleg
  };
}

/**
 * Calculate total annual Portuguese taxes
 */
export interface TotalTaxSummary {
  imt: IMTResult;
  imi: IMIResult;
  irs: IRSResult;
  totaalEenmalig: number;
  totaalJaarlijks: number;
  totaalMaandelijks: number;
}

export function calculateTotalPortugueseTaxes(
  aankoopprijs: number,
  vptWaarde: number,
  irsInput: IRSInput,
  pandType: 'woning' | 'niet-woning' = 'niet-woning',
  gemeenteType: GemeenteType = 'standaard'
): TotalTaxSummary {
  const imt = calculateIMT2025(aankoopprijs, pandType);
  const imi = calculateIMI(vptWaarde, gemeenteType);
  const irs = calculateIRS(irsInput);

  return {
    imt,
    imi,
    irs,
    totaalEenmalig: imt.bedrag,
    totaalJaarlijks: imi.jaarlijksBedrag + irs.jaarlijksBedrag,
    totaalMaandelijks: imi.maandelijksBedrag + irs.maandelijksBedrag
  };
}

/**
 * Estimate VPT from purchase price
 * VPT is typically 50-70% of market value
 */
export function estimateVPT(aankoopprijs: number, percentage: number = 60): number {
  return Math.round(aankoopprijs * (percentage / 100));
}
