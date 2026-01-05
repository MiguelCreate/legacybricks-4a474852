import jsPDF from 'jspdf';
import { SellOrKeepAnalysis, translations, Language } from './sellOrKeepCalculations';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function exportSellOrKeepPdf(analysis: SellOrKeepAnalysis, language: Language): void {
  const t = translations[language];
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addTitle = (text: string, size: number = 16) => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text, margin, y);
    y += size * 0.5;
  };

  const addSubtitle = (text: string) => {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text, margin, y);
    y += 6;
  };

  const addText = (text: string, indent: number = 0) => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(text, contentWidth - indent);
    pdf.text(lines, margin + indent, y);
    y += lines.length * 5;
  };

  const addKeyValue = (key: string, value: string) => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${key}: ${value}`, margin + 5, y);
    y += 5;
  };

  const checkNewPage = (needed: number) => {
    if (y + needed > 280) {
      pdf.addPage();
      y = margin;
    }
  };

  // Header
  addTitle(t.title);
  addText(t.subtitle);
  y += 5;
  addText(`${language === 'nl' ? 'Gegenereerd op' : 'Gerado em'}: ${new Date().toLocaleDateString(language === 'nl' ? 'nl-NL' : 'pt-PT')}`);
  y += 10;

  // Input Summary
  addSubtitle(t.sections.basics);
  addKeyValue(t.fields.currentMarketValue, formatCurrency(analysis.inputs.currentMarketValue));
  addKeyValue(t.fields.originalPurchasePrice, formatCurrency(analysis.inputs.originalPurchasePrice));
  addKeyValue(t.fields.cadastralValue, formatCurrency(analysis.inputs.cadastralValue));
  y += 5;

  addSubtitle(t.sections.financing);
  addKeyValue(t.fields.remainingDebt, formatCurrency(analysis.inputs.remainingDebt));
  addKeyValue(t.fields.mortgageRate, formatPercent(analysis.inputs.mortgageRate));
  addKeyValue(t.fields.remainingYears, `${analysis.inputs.remainingYears} ${language === 'nl' ? 'jaar' : 'anos'}`);
  y += 5;

  addSubtitle(t.sections.rental);
  addKeyValue(t.fields.grossMonthlyRent, formatCurrency(analysis.inputs.grossMonthlyRent));
  addKeyValue(t.fields.vacancyPercent, formatPercent(analysis.inputs.vacancyPercent));
  y += 5;

  checkNewPage(60);

  // Scenario Results
  addSubtitle(language === 'nl' ? 'Scenario Resultaten' : 'Resultados dos Cenários');
  y += 5;

  const scenarios = [
    { id: 'A', result: analysis.scenarioA },
    { id: 'B', result: analysis.scenarioB },
    { id: 'C', result: analysis.scenarioC },
  ];

  scenarios.forEach(({ id, result }) => {
    checkNewPage(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Scenario ${id}: ${result.name}`, margin, y);
    y += 6;
    pdf.setFont('helvetica', 'normal');
    addKeyValue(t.results.monthlyIncome, formatCurrency(result.monthlyIncome));
    addKeyValue(t.results.finalNetWorth, formatCurrency(result.finalNetWorth));
    addKeyValue(t.results.irr, formatPercent(result.irr));
    y += 5;
  });

  checkNewPage(50);

  // Recommendation
  addSubtitle(t.advice.title);
  y += 3;
  addText(analysis.recommendation.summary);
  y += 5;

  addText(`${t.advice.tradeoffs}:`);
  analysis.recommendation.tradeoffs.forEach(tradeoff => {
    addText(`• ${tradeoff}`, 5);
  });
  y += 5;

  if (analysis.recommendation.risks.length > 0) {
    addText(`${t.advice.risks}:`);
    analysis.recommendation.risks.forEach(risk => {
      addText(`• ${risk}`, 5);
    });
  }

  checkNewPage(30);

  // Disclaimer
  y += 10;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  const disclaimer = pdf.splitTextToSize(t.advice.disclaimer, contentWidth);
  pdf.text(disclaimer, margin, y);

  // Save
  const filename = `${language === 'nl' ? 'verkopen-of-behouden' : 'vender-ou-manter'}-analyse-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}
