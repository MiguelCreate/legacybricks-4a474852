import jsPDF from "jspdf";
import { MultiUnitAnalysis, multiUnitMetricExplanations, MultiUnitInputs } from "./multiUnitCalculations";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export function generateMultiUnitPDF(
  analysis: MultiUnitAnalysis,
  inputs: MultiUnitInputs
): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper to add page break if needed
  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to add section header
  const addSectionHeader = (title: string) => {
    checkPageBreak(20);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(40, 40, 40);
    pdf.text(title, margin, yPos);
    yPos += 8;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  };

  // Helper to add metric with explanation
  const addMetricWithExplanation = (
    label: string,
    value: string,
    explanation: { wat: string; waarom: string; goed: string; matig: string; slecht: string } | null,
    status?: "good" | "warning" | "danger"
  ) => {
    checkPageBreak(30);
    
    // Set status color for value
    if (status === "good") {
      pdf.setTextColor(34, 139, 34); // Green
    } else if (status === "warning") {
      pdf.setTextColor(184, 134, 11); // Orange/Yellow
    } else if (status === "danger") {
      pdf.setTextColor(178, 34, 34); // Red
    } else {
      pdf.setTextColor(40, 40, 40);
    }

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${label}: ${value}`, margin, yPos);
    yPos += 6;

    if (explanation) {
      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      
      const watText = pdf.splitTextToSize(`Wat: ${explanation.wat}`, pageWidth - 2 * margin);
      pdf.text(watText, margin + 5, yPos);
      yPos += watText.length * 4 + 2;
      
      const waaromText = pdf.splitTextToSize(`Waarom: ${explanation.waarom}`, pageWidth - 2 * margin);
      pdf.text(waaromText, margin + 5, yPos);
      yPos += waaromText.length * 4 + 2;
      
      pdf.setTextColor(34, 139, 34);
      pdf.text(`✓ Goed: ${explanation.goed}`, margin + 5, yPos);
      yPos += 4;
      
      pdf.setTextColor(184, 134, 11);
      pdf.text(`◐ Matig: ${explanation.matig}`, margin + 5, yPos);
      yPos += 4;
      
      pdf.setTextColor(178, 34, 34);
      pdf.text(`✗ Slecht: ${explanation.slecht}`, margin + 5, yPos);
      yPos += 8;
    }
    
    pdf.setTextColor(40, 40, 40);
  };

  // Helper to add simple row
  const addRow = (label: string, value: string) => {
    checkPageBreak(8);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(label, margin, yPos);
    pdf.setFont("helvetica", "bold");
    pdf.text(value, pageWidth - margin - pdf.getTextWidth(value), yPos);
    yPos += 6;
  };

  // ========== TITLE PAGE ==========
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 40, 40);
  pdf.text("Multi-Unit Vastgoedanalyse", margin, yPos);
  yPos += 12;

  pdf.setFontSize(16);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(80, 80, 80);
  pdf.text(inputs.pandNaam || "Analyse", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.text(`Gegenereerd op: ${new Date().toLocaleDateString("nl-NL")}`, margin, yPos);
  yPos += 20;

  // ========== SAMENVATTING ==========
  addSectionHeader("Samenvatting");
  
  addRow("Totaal Aantal Units", `${analysis.units.length}`);
  addRow("Winstgevende Units", `${analysis.units.filter(u => u.pureCashflow > 0).length} van ${analysis.units.length}`);
  addRow("Totale Investering", formatCurrency(analysis.totaleInvestering));
  addRow("Eigen Inleg", formatCurrency(analysis.eigenInleg));
  addRow("Jaarlijkse Bruto Huur", formatCurrency(analysis.totaalBrutoHuur));
  addRow("Jaarlijkse Pure Cashflow", formatCurrency(analysis.totaalPureCashflow));
  addRow("Jaarlijkse Cashflow na Belasting", formatCurrency(analysis.totaalCashflowNaBelasting));
  yPos += 10;

  // ========== INVESTERING DETAILS ==========
  addSectionHeader("Investeringsoverzicht");
  
  addRow("Aankoopprijs", formatCurrency(inputs.aankoopprijs));
  addRow("IMT (overdrachtsbelasting)", formatCurrency(inputs.imt));
  addRow("Notariskosten", formatCurrency(inputs.notarisKosten));
  addRow("Renovatiekosten", formatCurrency(inputs.renovatieKosten));
  addRow("Totale Kosten", formatCurrency(analysis.totaleInvestering));
  yPos += 5;
  addRow("Eigen Inleg", formatCurrency(inputs.eigenInleg));
  addRow("Hypotheekbedrag", formatCurrency(inputs.hypotheekBedrag));
  addRow("Rente", formatPercent(inputs.rentePercentage));
  addRow("Looptijd", `${inputs.looptijdJaren} jaar`);
  addRow("Marktwaarde", formatCurrency(inputs.marktwaarde));
  yPos += 10;

  // ========== KEY METRICS MET UITLEG ==========
  pdf.addPage();
  yPos = margin;
  addSectionHeader("Belangrijkste Metrics met Uitleg");

  // Cash-on-Cash Return
  const cocStatus = analysis.gemiddeldCashOnCash >= 12 ? "good" : analysis.gemiddeldCashOnCash >= 8 ? "warning" : "danger";
  addMetricWithExplanation(
    "Cash-on-Cash Return (Gemiddeld)",
    formatPercent(analysis.gemiddeldCashOnCash),
    multiUnitMetricExplanations.cashOnCash,
    cocStatus
  );

  // Cap Rate
  const capStatus = analysis.capRate >= 6 ? "good" : analysis.capRate >= 5 ? "warning" : "danger";
  addMetricWithExplanation(
    "Cap Rate",
    formatPercent(analysis.capRate),
    multiUnitMetricExplanations.capRate,
    capStatus
  );

  // DSCR
  const dscrStatus = analysis.gemiddeldDSCR >= 1.5 ? "good" : analysis.gemiddeldDSCR >= 1.2 ? "warning" : "danger";
  addMetricWithExplanation(
    "DSCR (Gemiddeld)",
    analysis.gemiddeldDSCR.toFixed(2),
    multiUnitMetricExplanations.dscr,
    dscrStatus
  );

  // OPEX Ratio
  const opexStatus = analysis.gemiddeldOpexRatio <= 30 ? "good" : analysis.gemiddeldOpexRatio <= 50 ? "warning" : "danger";
  addMetricWithExplanation(
    "OPEX-ratio (Gemiddeld)",
    formatPercent(analysis.gemiddeldOpexRatio),
    multiUnitMetricExplanations.opexRatio,
    opexStatus
  );

  // Bezettingsgraad
  const bezStatus = analysis.gemiddeldBezettingsgraad >= 90 ? "good" : analysis.gemiddeldBezettingsgraad >= 70 ? "warning" : "danger";
  addMetricWithExplanation(
    "Bezettingsgraad (Gemiddeld)",
    formatPercent(analysis.gemiddeldBezettingsgraad),
    multiUnitMetricExplanations.bezettingsgraad,
    bezStatus
  );

  // Break-even bezetting
  const beStatus = analysis.breakEvenBezetting <= 50 ? "good" : analysis.breakEvenBezetting <= 70 ? "warning" : "danger";
  addMetricWithExplanation(
    "Break-even Bezettingsgraad",
    formatPercent(analysis.breakEvenBezetting),
    multiUnitMetricExplanations.breakEvenBezetting,
    beStatus
  );

  // Huurderretentie
  const retStatus = analysis.gemiddeldHuurderretentie >= 24 ? "good" : analysis.gemiddeldHuurderretentie >= 6 ? "warning" : "danger";
  addMetricWithExplanation(
    "Huurderretentie (Gemiddeld)",
    `${analysis.gemiddeldHuurderretentie.toFixed(0)} maanden`,
    multiUnitMetricExplanations.huurderretentie,
    retStatus
  );

  // IRR
  checkPageBreak(20);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 40, 40);
  pdf.text(`10-jarige IRR: ${formatPercent(analysis.irr10Jaar)}`, margin, yPos);
  yPos += 6;
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text("Internal Rate of Return over 10 jaar, inclusief geschatte waardestijging (3%/jaar).", margin + 5, yPos);
  yPos += 10;

  // ========== PORTFOLIO DIVERSITEIT ==========
  checkPageBreak(40);
  addSectionHeader("Portfolio Diversiteit");
  
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  const divText = pdf.splitTextToSize(multiUnitMetricExplanations.portfolioDiversiteit.waarom, pageWidth - 2 * margin);
  pdf.text(divText, margin, yPos);
  yPos += divText.length * 4 + 5;
  
  pdf.setTextColor(40, 40, 40);
  analysis.portfolioDiversiteit.forEach(item => {
    const typeLabel = item.type === "langdurig" ? "Langdurig" : item.type === "toerisme" ? "Toerisme/Airbnb" : "Student";
    addRow(typeLabel, `${item.count} units (${formatPercent(item.percentage)})`);
  });
  yPos += 10;

  // ========== UNIT DETAILS ==========
  pdf.addPage();
  yPos = margin;
  addSectionHeader("Unit-voor-Unit Analyse");

  analysis.units.forEach((unit, index) => {
    checkPageBreak(70);
    
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 65, "F");
    
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(40, 40, 40);
    pdf.text(`${unit.naam}`, margin, yPos);
    
    const status = unit.pureCashflow > 0 ? "✓ Winstgevend" : "✗ Verliesgevend";
    const statusColor = unit.pureCashflow > 0 ? [34, 139, 34] : [178, 34, 34];
    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.setFontSize(10);
    pdf.text(status, pageWidth - margin - pdf.getTextWidth(status), yPos);
    yPos += 8;
    
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    
    // Unit info grid
    const col1X = margin;
    const col2X = pageWidth / 2;
    
    pdf.text(`Oppervlakte: ${unit.oppervlakte_m2} m²`, col1X, yPos);
    pdf.text(`Energielabel: ${unit.energielabel}`, col2X, yPos);
    yPos += 5;
    
    pdf.text(`Bruto Huur/jaar: ${formatCurrency(unit.brutoHuur)}`, col1X, yPos);
    pdf.text(`Huurdertype: ${unit.huurdertype === "langdurig" ? "Langdurig" : unit.huurdertype === "toerisme" ? "Toerisme" : "Student"}`, col2X, yPos);
    yPos += 5;
    
    pdf.text(`NOI: ${formatCurrency(unit.noi)}`, col1X, yPos);
    pdf.text(`Rendement/m²: ${formatCurrency(unit.rendementPerM2)}/m²`, col2X, yPos);
    yPos += 5;
    
    pdf.text(`Pure Cashflow: ${formatCurrency(unit.pureCashflow)}`, col1X, yPos);
    pdf.text(`Cash-on-Cash: ${formatPercent(unit.cashOnCash)}`, col2X, yPos);
    yPos += 5;
    
    pdf.text(`Cashflow na belasting: ${formatCurrency(unit.cashflowNaBelasting)}`, col1X, yPos);
    pdf.text(`DSCR: ${unit.dscr.toFixed(2)}`, col2X, yPos);
    yPos += 5;
    
    pdf.text(`Bezettingsgraad: ${formatPercent(unit.bezettingsgraad)}`, col1X, yPos);
    pdf.text(`OPEX-ratio: ${formatPercent(unit.opexRatio)}`, col2X, yPos);
    yPos += 5;
    
    pdf.text(`Huurderretentie: ${unit.huurderretentie} maanden`, col1X, yPos);
    pdf.text(`Renovatiescore: ${unit.renovatiebehoeftescore}/10`, col2X, yPos);
    yPos += 5;
    
    pdf.text(`Hypotheekaandeel/jaar: ${formatCurrency(unit.hypotheekAandeel)}`, col1X, yPos);
    pdf.text(`Verdeelde kosten/jaar: ${formatCurrency(unit.verdeeldeKosten)}`, col2X, yPos);
    yPos += 15;
  });

  // ========== GEMEENSCHAPPELIJKE KOSTEN ==========
  checkPageBreak(60);
  addSectionHeader("Gemeenschappelijke Kosten");
  
  addRow("Gas (maandelijks)", formatCurrency(inputs.gemeenschappelijkeKosten.gas_maandelijks));
  addRow("Water (maandelijks)", formatCurrency(inputs.gemeenschappelijkeKosten.water_maandelijks));
  addRow("VvE/Condominium (maandelijks)", formatCurrency(inputs.gemeenschappelijkeKosten.vve_maandelijks));
  addRow("Onderhoud (jaarlijks)", formatCurrency(inputs.gemeenschappelijkeKosten.onderhoud_jaarlijks));
  addRow("Verzekering (jaarlijks)", formatCurrency(inputs.gemeenschappelijkeKosten.verzekering_jaarlijks));
  
  const totaalKostenJaar = 
    (inputs.gemeenschappelijkeKosten.gas_maandelijks + 
     inputs.gemeenschappelijkeKosten.water_maandelijks + 
     inputs.gemeenschappelijkeKosten.vve_maandelijks) * 12 +
    inputs.gemeenschappelijkeKosten.onderhoud_jaarlijks +
    inputs.gemeenschappelijkeKosten.verzekering_jaarlijks;
  
  yPos += 3;
  pdf.setDrawColor(150, 150, 150);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;
  addRow("Totaal Jaarlijks", formatCurrency(totaalKostenJaar));
  yPos += 10;

  // ========== RISICO INDICATOREN ==========
  checkPageBreak(40);
  addSectionHeader("Risico Indicatoren");
  
  addRow("Geschatte Renovatiekosten (3 jaar)", formatCurrency(analysis.geschatteRenovatiekosten3Jaar));
  
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  const renovText = pdf.splitTextToSize(multiUnitMetricExplanations.renovatiebehoeftescore.wat + " " + multiUnitMetricExplanations.renovatiebehoeftescore.waarom, pageWidth - 2 * margin);
  pdf.text(renovText, margin, yPos);
  yPos += renovText.length * 4 + 10;

  // ========== DISCLAIMER ==========
  checkPageBreak(30);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(120, 120, 120);
  const disclaimer = "Disclaimer: Deze analyse is een schatting op basis van de ingevoerde gegevens en is bedoeld voor informatieve doeleinden. Raadpleeg een financieel adviseur voor professioneel advies. Gegenereerd met de Multi-Unit Vastgoedanalyse tool.";
  const disclaimerText = pdf.splitTextToSize(disclaimer, pageWidth - 2 * margin);
  pdf.text(disclaimerText, margin, yPos);

  // Save PDF
  const filename = inputs.pandNaam 
    ? `MultiUnit-Analyse-${inputs.pandNaam.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
    : `MultiUnit-Analyse-${new Date().toISOString().split('T')[0]}.pdf`;
  
  pdf.save(filename);
}
