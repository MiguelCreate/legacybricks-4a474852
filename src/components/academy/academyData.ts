import { 
  Home, Calculator, TrendingUp, PiggyBank, Snowflake, Sunset, Building2, 
  Euro, Percent, BarChart3, LineChart, Wallet, Target, Users
} from "lucide-react";

export type LessonLevel = "beginner" | "gevorderd" | "professional";

export interface LessonBadge {
  id: string;
  name: string;
  icon: string;
}

export interface LessonExample {
  title: string;
  simple?: string;
  realistic: string;
  calculation?: string;
}

export interface LessonExercise {
  question: string;
  options: { label: string; value: string; correct?: boolean }[];
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  level: LessonLevel;
  icon: React.ElementType;
  duration: number; // in minutes
  badge?: LessonBadge;
  content: {
    intro: string;
    theory: string[];
    example: LessonExample;
    exercise: LessonExercise;
    keyTakeaways: string[];
  };
}

// Portuguese Real Estate Market Data 2025
export const marketData = {
  lissabon: {
    avgRent: 1450,
    avgPriceM2: 4200,
  },
  porto: {
    avgRent: 1100,
    avgPriceM2: 3500,
  },
  binnenland: {
    avgRent: 600,
    avgPriceM2: 2100,
  },
  figueiraDaFoz: {
    avgRent: 650,
    avgPriceM2: 2100,
  },
  coimbra: {
    avgRent: 700,
    avgPriceM2: 2400,
  },
  mortgageRate: 3.8,
  imiRate: 0.5,
  irsNonResident: 28,
  imtInvestment: 6.5,
  avgVacancy: 8,
};

export const lessons: Lesson[] = [
  // LEVEL 1: BEGINNERS
  {
    id: "les1-huur-bruto-netto",
    title: "Wat is Huur? Bruto vs. Netto",
    description: "Leer het verschil tussen bruto en netto huurinkomsten",
    level: "beginner",
    icon: Euro,
    duration: 5,
    badge: {
      id: "eerste-huurberekening",
      name: "Eerste Huurberekening!",
      icon: "💰",
    },
    content: {
      intro: "Als vastgoedbelegger is het cruciaal om het verschil te begrijpen tussen wat je ontvangt (bruto) en wat je overhoudt (netto). Dit is de basis van elke vastgoedinvestering.",
      theory: [
        "**Bruto huur** is het totale bedrag dat de huurder maandelijks betaalt.",
        "**Netto huur** is wat je overhoudt na aftrek van alle kosten (belasting, onderhoud, verzekering, VvE).",
        "De formule is simpel: Netto Huur = Bruto Huur - Kosten",
        "Een goede vuistregel: verwacht 20-35% aan kosten af te trekken van je bruto huur.",
      ],
      example: {
        title: "Appartement in Figueira da Foz",
        simple: "Stel: Huur = €100, Kosten = €20 → Netto = €80",
        realistic: `In Figueira da Foz betaalt een huurder gemiddeld **€650/maand**.

Je maandelijkse kosten zijn:
- IMI (onroerendgoedbelasting): €50/maand
- Onderhoud reservering: €80/maand  
- Verzekering: €20/maand

**Totale kosten: €150/maand**

→ Jouw netto huur = €650 - €150 = **€500/maand**`,
        calculation: "650 - 150 = 500",
      },
      exercise: {
        question: "Een appartement in Porto wordt verhuurd voor €1.100/maand. De maandelijkse kosten zijn €280. Wat is de netto huur?",
        options: [
          { label: "€820/maand", value: "820", correct: true },
          { label: "€1.100/maand", value: "1100" },
          { label: "€1.380/maand", value: "1380" },
          { label: "€280/maand", value: "280" },
        ],
        explanation: "Netto huur = Bruto huur - Kosten = €1.100 - €280 = €820/maand",
      },
      keyTakeaways: [
        "Bruto huur is wat de huurder betaalt",
        "Netto huur is wat jij overhoudt na kosten",
        "Reken altijd met 20-35% kosten",
        "In Portugal is IMI (0,5%) een vaste jaarlijkse kost",
      ],
    },
  },
  {
    id: "les2-kosten-overzicht",
    title: "Welke Kosten Zijn Er?",
    description: "Overzicht van alle kosten bij vastgoedbezit in Portugal",
    level: "beginner",
    icon: Wallet,
    duration: 7,
    content: {
      intro: "Om succesvol te investeren moet je alle kosten kennen. In Portugal zijn er specifieke belastingen en kosten die je rendement beïnvloeden.",
      theory: [
        "**IMI (Imposto Municipal sobre Imóveis)**: Jaarlijkse onroerendgoedbelasting van 0,3-0,5% van de fiscale waarde (VPT). Voor niet-ingezetenen is dit vaak 0,5%.",
        "**Onderhoud**: Reserveer 5-10% van je bruto huur voor onderhoud en reparaties.",
        "**Verzekering**: Opstalverzekering is verplicht en kost €150-400/jaar afhankelijk van het pand.",
        "**Condominium/VvE**: Bij appartementen betaal je maandelijks voor gemeenschappelijke kosten.",
        "**IRS (belasting op huurinkomsten)**: Niet-ingezetenen betalen 28% over de netto huurinkomsten.",
      ],
      example: {
        title: "Kostenopbouw appartement",
        realistic: `Voor een appartement met fiscale waarde (VPT) van €120.000:

**Vaste jaarlijkse kosten:**
- IMI = 0,5% × €120.000 = €600/jaar = **€50/maand**
- Verzekering = €240/jaar = **€20/maand**
- Onderhoud reservering = **€80/maand**

**Totale maandelijkse kosten: €150/maand**

Dit is exclusief condominium (VvE) bijdrage, die varieert per gebouw.`,
        calculation: "(120000 × 0.005) / 12 = 50",
      },
      exercise: {
        question: "Een pand heeft VPT €180.000 en IMI-tarief 0,5%. Wat is de jaarlijkse IMI?",
        options: [
          { label: "€900", value: "900", correct: true },
          { label: "€90", value: "90" },
          { label: "€1.800", value: "1800" },
          { label: "€450", value: "450" },
        ],
        explanation: "IMI = VPT × tarief = €180.000 × 0,5% = €180.000 × 0,005 = €900/jaar",
      },
      keyTakeaways: [
        "IMI is 0,3-0,5% van de fiscale waarde (VPT)",
        "Reserveer altijd voor onderhoud (5-10% van huur)",
        "Verzekering is verplicht in Portugal",
        "Niet-ingezetenen betalen 28% IRS over huurinkomsten",
      ],
    },
  },

  // LEVEL 2: GEVORDERDEN
  {
    id: "les3-bar",
    title: "BAR (Bruto Aanvangsrendement)",
    description: "Bereken het bruto rendement van een vastgoedinvestering",
    level: "gevorderd",
    icon: Percent,
    duration: 8,
    badge: {
      id: "bar-meester",
      name: "BAR Meester",
      icon: "📊",
    },
    content: {
      intro: "Het Bruto Aanvangsrendement (BAR) is de eerste metric die investeerders gebruiken om snel te bepalen of een pand interessant is. Het geeft aan hoeveel procent van je investering je jaarlijks terugkrijgt aan huur.",
      theory: [
        "**BAR** = (Jaarlijkse bruto huur / Aankoopprijs) × 100%",
        "Dit is een snelle indicator, maar houdt geen rekening met kosten.",
        "In Portugal is een BAR van 5-7% gebruikelijk in grote steden.",
        "In het binnenland kun je 7-10% BAR vinden, maar met hoger risico.",
        "BAR is handig voor snelle vergelijkingen, maar niet voor definitieve beslissingen.",
      ],
      example: {
        title: "Appartement in Porto",
        realistic: `Je koopt een appartement in Porto:
- Oppervlakte: 60 m²
- Prijs per m²: €3.500
- **Aankoopprijs: 60 × €3.500 = €210.000**

De gemiddelde maandhuur in Porto is €1.100:
- **Jaarhuur: €1.100 × 12 = €13.200**

**BAR = (€13.200 / €210.000) × 100 = 6,3%**

Dit is een gezond rendement voor een grote stad in Portugal.`,
        calculation: "(13200 / 210000) × 100 = 6.3",
      },
      exercise: {
        question: "Een pand in Lissabon kost €250.000 en verhuurt voor €1.450/maand. Wat is de BAR?",
        options: [
          { label: "6,96%", value: "6.96", correct: true },
          { label: "5,8%", value: "5.8" },
          { label: "7,5%", value: "7.5" },
          { label: "4,2%", value: "4.2" },
        ],
        explanation: "BAR = (€1.450 × 12 / €250.000) × 100 = (€17.400 / €250.000) × 100 = 6,96%",
      },
      keyTakeaways: [
        "BAR = Jaarhuur / Aankoopprijs × 100%",
        "Snelle indicator, maar exclusief kosten",
        "5-7% is normaal in Portugese steden",
        "Hoger BAR betekent vaak hoger risico",
      ],
    },
  },
  {
    id: "les4-nar",
    title: "NAR (Netto Aanvangsrendement)",
    description: "Het werkelijke rendement na aftrek van kosten",
    level: "gevorderd",
    icon: BarChart3,
    duration: 10,
    content: {
      intro: "NAR geeft een realistischer beeld dan BAR omdat het rekening houdt met operationele kosten. Dit is de metric waar ervaren investeerders naar kijken.",
      theory: [
        "**NOI (Net Operating Income)** = Bruto huur - Operationele kosten (OPEX)",
        "**NAR** = (NOI / Aankoopprijs) × 100%",
        "OPEX omvat: IMI, verzekering, onderhoud, condominium, leegstandbuffer",
        "NAR is typisch 1-2% lager dan BAR",
        "Een NAR van 4-5% is solide in Portugal",
      ],
      example: {
        title: "NAR berekening Porto",
        realistic: `Voortbouwend op het Porto-voorbeeld:
- Aankoopprijs: €210.000
- Jaarhuur: €13.200

**Jaarlijkse operationele kosten (OPEX):**
- IMI (0,5% van VPT €150.000): €750
- Verzekering: €300
- Onderhoud: €850
- Leegstandbuffer (8%): €500

**Totale OPEX: €2.400/jaar**

**NOI = €13.200 - €2.400 = €10.800**

**NAR = (€10.800 / €210.000) × 100 = 5,1%**`,
        calculation: "(10800 / 210000) × 100 = 5.1",
      },
      exercise: {
        question: "Jaarhuur is €15.000, OPEX is €3.500, aankoopprijs €280.000. Wat is de NAR?",
        options: [
          { label: "4,1%", value: "4.1", correct: true },
          { label: "5,4%", value: "5.4" },
          { label: "6,2%", value: "6.2" },
          { label: "3,5%", value: "3.5" },
        ],
        explanation: "NOI = €15.000 - €3.500 = €11.500. NAR = (€11.500 / €280.000) × 100 = 4,1%",
      },
      keyTakeaways: [
        "NAR = NOI / Aankoopprijs × 100%",
        "NOI = Bruto huur - Operationele kosten",
        "Realistischer dan BAR",
        "4-5% NAR is solide in Portugal",
      ],
    },
  },
  {
    id: "les5-coc",
    title: "Cash-on-Cash Return",
    description: "Rendement op je eigen ingebrachte kapitaal",
    level: "gevorderd",
    icon: PiggyBank,
    duration: 12,
    badge: {
      id: "dscr-meester",
      name: "DSCR Meester!",
      icon: "🎯",
    },
    content: {
      intro: "Cash-on-Cash Return meet het rendement op je eigen ingebrachte geld (eigen vermogen), niet op de totale waarde van het pand. Dit is cruciaal bij gefinancierde aankopen.",
      theory: [
        "**Cash-on-Cash** = (Jaarlijkse netto cashflow / Eigen inbreng) × 100%",
        "Eigen inbreng = Aanbetaling + Aankoopkosten (IMT, notaris)",
        "Netto cashflow = NOI - Hypotheeklasten",
        "Bij financiering kan je CoC hoger zijn dan NAR (leverage effect)",
        "Maar let op: negatieve CoC betekent dat je maandelijks bijlegt!",
      ],
      example: {
        title: "Cash-on-Cash in Porto",
        realistic: `Je koopt het Porto-appartement van €210.000 met financiering:
- Eigen inbreng: 33% = €70.000
- Hypotheek: €140.000 tegen 3,8% rente (25 jaar)
- Maandlast: ~€725
- **Jaarlast: €8.700**

**Netto cashflow = NOI - Hypotheeklasten**
= €10.800 - €8.700 = **€2.100/jaar**

**Cash-on-Cash = (€2.100 / €70.000) × 100 = 3,0%**

💡 Dit is positief! Je verdient op je eigen inleg terwijl je vermogen opbouwt.`,
        calculation: "(2100 / 70000) × 100 = 3.0",
      },
      exercise: {
        question: "Eigen inbreng €80.000, jaarlijkse netto cashflow €4.800. Wat is de Cash-on-Cash?",
        options: [
          { label: "6,0%", value: "6.0", correct: true },
          { label: "4,8%", value: "4.8" },
          { label: "8,0%", value: "8.0" },
          { label: "5,5%", value: "5.5" },
        ],
        explanation: "Cash-on-Cash = (€4.800 / €80.000) × 100 = 6,0%",
      },
      keyTakeaways: [
        "CoC meet rendement op je eigen geld",
        "Belangrijk bij financiering met hypotheek",
        "Positieve CoC = je verdient vanaf dag 1",
        "Negatieve CoC = je legt maandelijks bij",
      ],
    },
  },

  // LEVEL 3: PROFESSIONAL
  {
    id: "les6-sneeuwbal",
    title: "Het Sneeuwbaleffect",
    description: "Strategisch aflossen voor versnelde vermogensopbouw",
    level: "professional",
    icon: Snowflake,
    duration: 15,
    badge: {
      id: "sneeuwbal-strateeg",
      name: "Sneeuwbal Strateeg",
      icon: "❄️",
    },
    content: {
      intro: "Het sneeuwbaleffect is een strategie waarbij je cashflow van rendabele panden gebruikt om andere panden versneld af te lossen. Zo bouw je exponentieel vermogen op.",
      theory: [
        "**Kern principe**: Focus alle extra aflossingen op één pand totdat het schuldenvrij is.",
        "Zodra pand 1 vrij is, gebruik je die volledige cashflow voor pand 2.",
        "Dit creëert een 'sneeuwbal' die steeds groter wordt.",
        "Kies startpand op basis van: kleinste schuld OF hoogste rente.",
        "Emotionele boost: snelle eerste 'winst' motiveert om door te gaan.",
      ],
      example: {
        title: "Sneeuwbal met 2 panden",
        realistic: `Je hebt 2 panden:

**Pand A (Lissabon):**
- Restschuld: €180.000
- Netto cashflow: €400/maand

**Pand B (Porto):**
- Restschuld: €60.000
- Netto cashflow: €200/maand

**Strategie:** Focus op Pand B (kleinste schuld)
- Normale aflossing: €400/maand
- Extra aflossing uit A: €400/maand
- **Totaal naar B: €800/maand**

→ Pand B schuldenvrij in ~6 jaar i.p.v. 15 jaar!
→ Daarna: €800 + €200 = €1.000/maand naar Pand A
→ Pand A dan vrij in nog eens ~10 jaar`,
      },
      exercise: {
        question: "Je hebt Pand X (restschuld €100k, cashflow €300/maand) en Pand Y (restschuld €40k, cashflow €150/maand). Welk pand kies je voor de sneeuwbal?",
        options: [
          { label: "Pand Y (kleinste schuld)", value: "Y", correct: true },
          { label: "Pand X (hoogste cashflow)", value: "X" },
          { label: "Beide tegelijk", value: "beide" },
          { label: "Maakt niet uit", value: "geen" },
        ],
        explanation: "Bij de sneeuwbalmethode kies je het pand met de kleinste schuld voor snelle 'winst' en motivatie. Pand Y met €40k is sneller afgelost.",
      },
      keyTakeaways: [
        "Focus alle extra aflossingen op één pand",
        "Kies kleinste schuld of hoogste rente",
        "Vrijgekomen cashflow gaat naar volgende pand",
        "Exponentieel effect door compounding",
      ],
    },
  },
  {
    id: "les7-rente-op-rente",
    title: "Rente-op-Rente Effect",
    description: "Compound interest gecorrigeerd voor inflatie",
    level: "professional",
    icon: LineChart,
    duration: 12,
    content: {
      intro: "Het rente-op-rente effect is krachtig, maar je moet rekening houden met inflatie om een realistisch beeld te krijgen van je toekomstige koopkracht.",
      theory: [
        "**Nominaal rendement**: Het percentage dat je ziet groeien.",
        "**Reëel rendement**: Nominaal rendement - Inflatie.",
        "Bij 7% nominaal en 2,5% inflatie is je reëel rendement 4,4%.",
        "Na 20 jaar groeit €300/maand naar €113.000 nominaal, maar ~€70.000 in huidige koopkracht.",
        "Vastgoed biedt natuurlijke inflatiebescherming: huren stijgen mee.",
      ],
      example: {
        title: "20 jaar sparen met reële correctie",
        realistic: `Je zet €300/maand opzij in een beleggingsportefeuille:

**Aannames:**
- Nominaal rendement: 7% per jaar
- Inflatie: 2,5% per jaar
- Reëel rendement: 4,4%

**Na 20 jaar:**
- Nominale waarde: ~€113.000
- Reële waarde (koopkracht 2025): ~€70.000

Het verschil van €43.000 is 'verdampt' door inflatie.

💡 Vastgoed voordeel: huren stijgen met inflatie, dus je inkomen groeit mee!`,
        calculation: "113000 × (1 - 0.38) ≈ 70000",
      },
      exercise: {
        question: "Bij 8% nominaal rendement en 3% inflatie, wat is het reële rendement?",
        options: [
          { label: "5%", value: "5", correct: true },
          { label: "8%", value: "8" },
          { label: "11%", value: "11" },
          { label: "3%", value: "3" },
        ],
        explanation: "Reëel rendement = Nominaal - Inflatie = 8% - 3% = 5%",
      },
      keyTakeaways: [
        "Reëel rendement = Nominaal - Inflatie",
        "Denk altijd in koopkracht, niet in euro's",
        "Vastgoed biedt natuurlijke inflatiebescherming",
        "Start vroeg: tijd is je grootste bondgenoot",
      ],
    },
  },
  {
    id: "les8-pensioengat",
    title: "Het Pensioengat Dichten",
    description: "Bereken je benodigde vermogen voor financiële vrijheid",
    level: "professional",
    icon: Sunset,
    duration: 15,
    badge: {
      id: "pensioengat-gesloten",
      name: "Pensioengat Gesloten!",
      icon: "🌅",
    },
    content: {
      intro: "Het pensioengat is het verschil tussen je gewenste inkomen en wat je daadwerkelijk ontvangt aan pensioen. In Portugal is dit vaak groter dan in Nederland.",
      theory: [
        "**Pensioengat** = Gewenst inkomen - (AOW + Pensioen + Andere inkomsten)",
        "**4%-regel**: Je kunt jaarlijks 4% van je vermogen opnemen zonder het op te maken.",
        "Benodigd vermogen = Jaarlijks gat × 25",
        "Vastgoedinkomsten kunnen dit gat vullen zonder vermogen op te eten.",
        "In Portugal is er geen AOW, alleen eventueel Portugees staatspensioen.",
      ],
      example: {
        title: "Pensioengat berekenen",
        realistic: `**Jouw situatie:**
- Gewenste pensioenleeftijd: 60 jaar
- Gewenste levensstijl: €2.800/maand netto
- Portuguees staatspensioen: €500/maand
- Nederlands pensioen: €0 (je woont in PT)

**Pensioengat:** €2.800 - €500 = **€2.300/maand**
**Jaarlijks gat:** €2.300 × 12 = €27.600

**Benodigd vermogen (4% regel):** €27.600 × 25 = **€690.000**

Je huidige vastgoedportefeuille: €500.000
→ Je mist: €190.000

**Oplossing:** €190.000 kan je bereiken door:
- Extra pand kopen
- Huidige panden verder aflossen
- Beleggingen opbouwen`,
        calculation: "27600 × 25 = 690000",
      },
      exercise: {
        question: "Je wilt €3.000/maand netto. Je ontvangt €800/maand pensioen. Wat is je benodigde vermogen volgens de 4%-regel?",
        options: [
          { label: "€660.000", value: "660000", correct: true },
          { label: "€900.000", value: "900000" },
          { label: "€500.000", value: "500000" },
          { label: "€750.000", value: "750000" },
        ],
        explanation: "Gat = €3.000 - €800 = €2.200/maand = €26.400/jaar. Vermogen = €26.400 × 25 = €660.000",
      },
      keyTakeaways: [
        "Bereken je pensioengat zo vroeg mogelijk",
        "4%-regel: vermogen × 0,04 = veilig jaarlijks inkomen",
        "Vastgoed kan inkomen leveren zonder vermogen op te eten",
        "Start nu met vermogensopbouw!",
      ],
    },
  },
  {
    id: "les9-multi-unit",
    title: "Multi-Unit Analyse",
    description: "Kostenverdeling bij meerdere verhuurbare units",
    level: "professional",
    icon: Building2,
    duration: 15,
    content: {
      intro: "Bij panden met meerdere units moet je kosten eerlijk verdelen. Dit is essentieel voor correcte rendementsbepaling per unit.",
      theory: [
        "**Verdeelsleutel**: Meestal op basis van oppervlakte (m²).",
        "Alternatief: op basis van huurwaarde of aantal units.",
        "Gemeenschappelijke kosten: onderhoud gebouw, verzekering, condominium.",
        "Unit-specifieke kosten: alleen toerekenen aan die unit.",
        "Elke unit moet individueel rendabel zijn.",
      ],
      example: {
        title: "3-unit flat in Coimbra",
        realistic: `Je koopt een flat in Coimbra voor €180.000 met 3 units:

**Units:**
- Unit 1: 70 m² → huur €700/maand (41% van totaal)
- Unit 2: 50 m² → huur €500/maand (29%)
- Unit 3: 50 m² → huur €500/maand (29%)
- **Totaal: 170 m²**

**Gemeenschappelijke kosten: €300/maand**

**Verdeling op oppervlakte:**
- Unit 1: 70/170 × €300 = **€123/maand**
- Unit 2: 50/170 × €300 = **€88/maand**
- Unit 3: 50/170 × €300 = **€88/maand**

**Netto per unit:**
- Unit 1: €700 - €123 = €577/maand
- Unit 2: €500 - €88 = €412/maand
- Unit 3: €500 - €88 = €412/maand`,
        calculation: "(70 / 170) × 300 = 123.5",
      },
      exercise: {
        question: "Een pand heeft 3 units: 40m², 60m², 100m². Gemeenschappelijke kosten €400/maand. Wat betaalt de 60m² unit?",
        options: [
          { label: "€120", value: "120", correct: true },
          { label: "€133", value: "133" },
          { label: "€200", value: "200" },
          { label: "€100", value: "100" },
        ],
        explanation: "Totaal = 200m². Unit 60m² = 60/200 = 30%. Kosten = 30% × €400 = €120",
      },
      keyTakeaways: [
        "Verdeel kosten op basis van m² of huurwaarde",
        "Elke unit moet individueel rendabel zijn",
        "Gemeenschappelijke kosten eerlijk verdelen",
        "Documenteer de verdeelsleutel goed",
      ],
    },
  },
];
