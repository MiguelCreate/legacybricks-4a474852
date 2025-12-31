import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InvestmentAnalysis, AnalysisInputs, metricExplanations } from "@/lib/rendementsCalculations";
import { 
  FileDown, 
  Building2, 
  Euro, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Target,
  PieChart,
  BarChart3
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface PartnerOverviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: InvestmentAnalysis;
  inputs: AnalysisInputs;
  propertyName: string;
  propertyLocation: string;
  timeframe: string;
  riskAssessment: {
    level: 'good' | 'moderate' | 'risky';
    color: 'success' | 'warning' | 'destructive';
    reasons: string[];
  } | null;
  linkedGoal?: {
    id: string;
    naam: string;
    doelbedrag: number;
    huidig_bedrag: number;
  };
}

const COLORS = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function PartnerOverview({
  open,
  onOpenChange,
  analysis,
  inputs,
  propertyName,
  propertyLocation,
  timeframe,
  riskAssessment,
  linkedGoal,
}: PartnerOverviewProps) {
  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Prepare pie chart data for income vs expenses
  const year1 = analysis.yearlyCashflows[0];
  const incomeData = [
    { name: 'Huurinkomsten', value: year1?.grossRent || 0 },
  ];
  
  const expenseData = [
    { name: 'Hypotheek', value: year1?.debtService || 0 },
    { name: 'OPEX', value: year1?.opex || 0 },
  ];

  // Prepare bar chart data for cashflow over time
  const cashflowData = analysis.yearlyCashflows
    .filter((_, i) => i === 0 || (i + 1) % 5 === 0 || i === analysis.yearlyCashflows.length - 1)
    .map(cf => ({
      jaar: `Jaar ${cf.year}`,
      cashflow: Math.round(cf.netCashflow),
    }));

  const handleExportPDF = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Investeringsanalyse - ${propertyName}</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #4A6CF7; border-bottom: 2px solid #4A6CF7; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 30px; }
          .section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .metric { text-align: center; padding: 15px; background: white; border-radius: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #4A6CF7; }
          .metric-label { font-size: 12px; color: #666; }
          .status-good { color: #10B981; }
          .status-warning { color: #F59E0B; }
          .status-bad { color: #EF4444; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f1f5f9; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>📊 Investeringsanalyse</h1>
        
        <div class="section">
          <h2>🏠 Pandgegevens</h2>
          <p><strong>Naam:</strong> ${propertyName}</p>
          <p><strong>Locatie:</strong> ${propertyLocation}</p>
          <p><strong>Analyseperiode:</strong> ${timeframe}</p>
          <p><strong>Type verhuur:</strong> ${inputs.rentalType === 'longterm' ? 'Langdurig' : inputs.rentalType === 'shortterm' ? 'Korte termijn' : 'Gemengd'}</p>
        </div>

        <div class="section">
          <h2>💰 Investering</h2>
          <div class="grid">
            <div class="metric">
              <div class="metric-value">${formatCurrency(analysis.totalInvestment)}</div>
              <div class="metric-label">Totale Investering</div>
            </div>
            <div class="metric">
              <div class="metric-value">${formatCurrency(analysis.ownCapital)}</div>
              <div class="metric-label">Eigen Inleg</div>
            </div>
            <div class="metric">
              <div class="metric-value">${formatCurrency(analysis.loanAmount)}</div>
              <div class="metric-label">Hypotheek</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>📈 Rendement</h2>
          <div class="grid">
            <div class="metric">
              <div class="metric-value">${analysis.bar}%</div>
              <div class="metric-label">BAR (Bruto)</div>
            </div>
            <div class="metric">
              <div class="metric-value">${analysis.nar}%</div>
              <div class="metric-label">NAR (Netto)</div>
            </div>
            <div class="metric">
              <div class="metric-value ${analysis.irr >= 12 ? 'status-good' : analysis.irr >= 8 ? 'status-warning' : 'status-bad'}">${analysis.irr}%</div>
              <div class="metric-label">IRR</div>
            </div>
            <div class="metric">
              <div class="metric-value">${analysis.cashOnCash}%</div>
              <div class="metric-label">Cash-on-Cash</div>
            </div>
            <div class="metric">
              <div class="metric-value ${analysis.dscr >= 1.2 ? 'status-good' : analysis.dscr >= 1 ? 'status-warning' : 'status-bad'}">${analysis.dscr.toFixed(2)}</div>
              <div class="metric-label">DSCR</div>
            </div>
            <div class="metric">
              <div class="metric-value">${analysis.breakEvenOccupancy}%</div>
              <div class="metric-label">Break-even</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>🚪 Exit Analyse (na ${timeframe})</h2>
          <div class="grid">
            <div class="metric">
              <div class="metric-value">${formatCurrency(analysis.exitAnalysis.marketValue)}</div>
              <div class="metric-label">Geschatte Waarde</div>
            </div>
            <div class="metric">
              <div class="metric-value status-bad">-${formatCurrency(analysis.exitAnalysis.remainingDebt)}</div>
              <div class="metric-label">Resterende Schuld</div>
            </div>
            <div class="metric">
              <div class="metric-value status-good">${formatCurrency(analysis.exitAnalysis.totalReturn)}</div>
              <div class="metric-label">Totaal Rendement</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>✅ Beoordeling</h2>
          <p style="font-size: 18px; ${riskAssessment?.level === 'good' ? 'color: #10B981' : riskAssessment?.level === 'moderate' ? 'color: #F59E0B' : 'color: #EF4444'}">
            ${riskAssessment?.level === 'good' ? '🟢 Goed rendabel' : riskAssessment?.level === 'moderate' ? '🟡 Matig rendabel' : '🔴 Risicovol'}
          </p>
          <ul>
            ${riskAssessment?.reasons.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        ${linkedGoal ? `
        <div class="section">
          <h2>🎯 Koppeling met Doel</h2>
          <p>Dit pand levert gemiddeld <strong>${formatCurrency(Math.round((year1?.netCashflow || 0) / 12))}/maand</strong> netto op.</p>
          <p>Dat draagt bij aan je doel: <strong>"${linkedGoal.naam}"</strong></p>
        </div>
        ` : ''}

        <div class="footer">
          <p>Gegenereerd op ${new Date().toLocaleDateString('nl-NL')} | Disclaimer: Deze analyse is een indicatie en geen financieel advies.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportExcel = () => {
    // Create CSV content
    let csv = "Investeringsanalyse\n\n";
    csv += "Pandgegevens\n";
    csv += `Naam,${propertyName}\n`;
    csv += `Locatie,${propertyLocation}\n`;
    csv += `Periode,${timeframe}\n\n`;
    
    csv += "Investering\n";
    csv += `Totale Investering,${analysis.totalInvestment}\n`;
    csv += `Eigen Inleg,${analysis.ownCapital}\n`;
    csv += `Hypotheek,${analysis.loanAmount}\n\n`;
    
    csv += "Rendement\n";
    csv += `BAR,${analysis.bar}%\n`;
    csv += `NAR,${analysis.nar}%\n`;
    csv += `IRR,${analysis.irr}%\n`;
    csv += `Cash-on-Cash,${analysis.cashOnCash}%\n`;
    csv += `DSCR,${analysis.dscr}\n`;
    csv += `Break-even Bezetting,${analysis.breakEvenOccupancy}%\n\n`;
    
    csv += "Cashflow Projectie\n";
    csv += "Jaar,Bruto Huur,OPEX,NOI,Hypotheek,Netto Cashflow,Cumulatief\n";
    analysis.yearlyCashflows.forEach(cf => {
      csv += `${cf.year},${cf.grossRent},${cf.opex},${cf.noi},${cf.debtService},${cf.netCashflow},${cf.cumulativeCashflow}\n`;
    });
    
    csv += "\nExit Analyse\n";
    csv += `Geschatte Waarde,${analysis.exitAnalysis.marketValue}\n`;
    csv += `Resterende Schuld,${analysis.exitAnalysis.remainingDebt}\n`;
    csv += `Netto Exit,${analysis.exitAnalysis.netExit}\n`;
    csv += `Totaal Rendement,${analysis.exitAnalysis.totalReturn}\n`;

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analyse-${propertyName.replace(/\s+/g, '-').toLowerCase()}.csv`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Leg dit uit aan mijn partner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Property Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <Building2 className="h-10 w-10 text-primary p-2 bg-primary/10 rounded-lg" />
                <div>
                  <h3 className="font-semibold text-lg">{propertyName || "Nieuw Pand"}</h3>
                  <p className="text-sm text-muted-foreground">{propertyLocation || "Locatie onbekend"}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analyseperiode: {timeframe} | 
                    Type: {inputs.rentalType === 'longterm' ? 'Langdurige verhuur' : inputs.rentalType === 'shortterm' ? 'Korte termijn (Airbnb)' : 'Gemengd'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Numbers */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <Euro className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(analysis.totalInvestment)}</p>
                <p className="text-xs text-muted-foreground">Totale investering</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Waarvan {formatCurrency(analysis.ownCapital)} eigen geld
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4 text-center">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{formatCurrency(Math.round((year1?.netCashflow || 0) / 12))}/mnd</p>
                <p className="text-xs text-muted-foreground">Netto cashflow</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(year1?.netCashflow || 0)} per jaar
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4 text-center">
                <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{analysis.irr}%</p>
                <p className="text-xs text-muted-foreground">IRR (totaal rendement)</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Inclusief verkoop na {timeframe}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Income vs Expenses Chart */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Inkomsten vs. Uitgaven (Jaar 1)
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Inkomsten', bedrag: year1?.grossRent || 0 },
                      { name: 'OPEX', bedrag: -(year1?.opex || 0) },
                      { name: 'Hypotheek', bedrag: -(year1?.debtService || 0) },
                      { name: 'Netto', bedrag: year1?.netCashflow || 0 },
                    ]}
                    layout="vertical"
                    margin={{ left: 80 }}
                  >
                    <XAxis type="number" tickFormatter={(v) => `€${Math.abs(v).toLocaleString()}`} />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip formatter={(v: number) => `€${Math.abs(v).toLocaleString()}`} />
                    <Bar 
                      dataKey="bedrag" 
                      fill="#4A6CF7"
                      radius={[0, 4, 4, 0]}
                    >
                      {[
                        { name: 'Inkomsten', color: '#10B981' },
                        { name: 'OPEX', color: '#EF4444' },
                        { name: 'Hypotheek', color: '#F59E0B' },
                        { name: 'Netto', color: '#4A6CF7' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          {riskAssessment && (
            <Card className={`border-l-4 ${
              riskAssessment.color === 'success' ? 'border-l-green-500' :
              riskAssessment.color === 'warning' ? 'border-l-yellow-500' :
              'border-l-red-500'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {riskAssessment.color === 'success' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className={`h-6 w-6 mt-0.5 ${riskAssessment.color === 'warning' ? 'text-yellow-600' : 'text-red-600'}`} />
                  )}
                  <div>
                    <p className="font-semibold text-lg">
                      {riskAssessment.level === 'good' ? '✅ Beoordeling: Goed rendabel' :
                       riskAssessment.level === 'moderate' ? '⚠️ Beoordeling: Matig rendabel' :
                       '❌ Beoordeling: Risicovol'}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {riskAssessment.reasons.map((reason, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Potential Risks */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Potentiële Risico's
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {inputs.rentalType !== 'longterm' && (
                  <li>• Afhankelijk van Airbnb-beleid en toeristische regelgeving</li>
                )}
                <li>• IMI (onroerendgoedbelasting) kan jaarlijks stijgen</li>
                <li>• Rentestijgingen kunnen de hypotheeklasten verhogen (bij variabele rente)</li>
                <li>• Onverwacht onderhoud kan de cashflow beïnvloeden</li>
                {analysis.breakEvenOccupancy > 70 && (
                  <li>• Hoge break-even bezetting ({analysis.breakEvenOccupancy}%): weinig marge bij leegstand</li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Goal Linking */}
          {linkedGoal && (
            <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Koppeling met Doel: "{linkedGoal.naam}"
                </h4>
                <p className="text-sm text-muted-foreground">
                  Dit pand levert gemiddeld <strong>{formatCurrency(Math.round((year1?.netCashflow || 0) / 12))}/maand</strong> netto op.
                </p>
                {(() => {
                  const monthlyContribution = (year1?.netCashflow || 0) / 12;
                  const targetMonthly = linkedGoal.doelbedrag / 12;
                  const percentage = Math.round((monthlyContribution / targetMonthly) * 100);
                  return (
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      Dat dekt <strong>{percentage}%</strong> van je maandelijkse doelbijdrage.
                    </p>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Export Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleExportPDF} className="flex-1 gap-2">
              <FileDown className="h-4 w-4" />
              Download als PDF
            </Button>
            <Button onClick={handleExportExcel} variant="outline" className="flex-1 gap-2">
              <FileDown className="h-4 w-4" />
              Exporteer als Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
