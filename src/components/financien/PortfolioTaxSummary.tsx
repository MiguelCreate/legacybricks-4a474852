import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  Building2, 
  CalendarDays, 
  Euro, 
  Receipt,
  Info,
  TrendingDown
} from "lucide-react";
import {
  calculateIMT2025,
  calculateIMI,
  calculateIRS,
  estimateVPT
} from "@/lib/portugueseTaxCalculations";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;

interface PortfolioTaxSummaryProps {
  properties: Property[];
}

export const PortfolioTaxSummary = ({ properties }: PortfolioTaxSummaryProps) => {
  const currentYear = new Date().getFullYear();

  // Calculate aggregated tax data for all properties
  const taxSummary = useMemo(() => {
    let totalIMT = 0;
    let totalIMI = 0;
    let totalIRS = 0;
    let totalBrutoHuur = 0;
    let totalNettoHuur = 0;

    const propertyTaxes = properties.map(property => {
      const aankoopprijs = Number(property.aankoopprijs) || 0;
      const maandHuur = Number(property.maandelijkse_huur) || 0;
      const vptWaarde = estimateVPT(aankoopprijs, 60); // Estimate VPT at 60% of purchase price
      const imiTarief = Number(property.imi_percentage) || 0.5;

      // Calculate IMT (one-time at purchase)
      const imtResult = calculateIMT2025(aankoopprijs, 'niet-woning');
      
      // Calculate IMI (annual)
      const imiResult = calculateIMI(vptWaarde, 'standaard', imiTarief * 100);
      
      // Calculate IRS (rental income tax)
      // Determine year based on current year for new regime
      const jaarHuurinkomst = currentYear >= 2026 && currentYear <= 2029 ? currentYear : currentYear;
      const irsResult = calculateIRS({
        jaarHuurinkomst,
        maandHuur,
        contractduurJaren: 5, // Default assumption
        englobamento: false
      });

      totalIMT += imtResult.bedrag;
      totalIMI += imiResult.jaarlijksBedrag;
      totalIRS += irsResult.jaarlijksBedrag;
      totalBrutoHuur += irsResult.brutoJaarHuur;
      totalNettoHuur += irsResult.nettoJaarHuur;

      return {
        property,
        imt: imtResult,
        imi: imiResult,
        irs: irsResult
      };
    });

    return {
      propertyTaxes,
      totalIMT,
      totalIMI,
      totalIRS,
      totalBrutoHuur,
      totalNettoHuur,
      totalJaarlijksBelasting: totalIMI + totalIRS,
      totalMaandelijksBelasting: (totalIMI + totalIRS) / 12
    };
  }, [properties, currentYear]);

  const formatCurrency = (value: number) => 
    `€${value.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;

  if (properties.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Portugese Belastingen
          <InfoTooltip
            title="Belastingoverzicht"
            content="Automatische berekening van IMT, IMI en IRS voor al je panden. IMT is eenmalig bij aankoop, IMI en IRS zijn jaarlijks."
          />
        </CardTitle>
        <CardDescription>
          Geschatte belastingdruk voor je portefeuille ({currentYear >= 2026 && currentYear <= 2029 ? 'nieuwe regeling' : 'huidige regeling'})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">IMT (eenmalig)</span>
            </div>
            <p className="text-xl font-bold text-primary">{formatCurrency(taxSummary.totalIMT)}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">IMI (jaarlijks)</span>
            </div>
            <p className="text-xl font-bold text-warning">{formatCurrency(taxSummary.totalIMI)}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">IRS (jaarlijks)</span>
            </div>
            <p className="text-xl font-bold text-destructive">{formatCurrency(taxSummary.totalIRS)}</p>
          </div>
          <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Totaal/maand</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(taxSummary.totalMaandelijksBelasting)}</p>
          </div>
        </div>

        {/* Per Property Breakdown */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Per pand</h3>
          <div className="space-y-2">
            {taxSummary.propertyTaxes.map(({ property, imt, imi, irs }) => (
              <div 
                key={property.id}
                className="flex flex-wrap items-center justify-between p-3 bg-muted/30 rounded-lg gap-2"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{property.naam}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="gap-1">
                    IMT: {formatCurrency(imt.bedrag)}
                  </Badge>
                  <Badge variant="outline" className="gap-1 bg-warning/10">
                    IMI: {formatCurrency(imi.jaarlijksBedrag)}/jr
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`gap-1 ${irs.tarief <= 10 ? 'bg-success/10' : 'bg-destructive/10'}`}
                  >
                    IRS: {irs.tarief}% = {formatCurrency(irs.jaarlijksBedrag)}/jr
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Netto Huur Summary */}
        <div className="p-4 bg-success/5 rounded-lg border border-success/20">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-success mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Netto huurinkomen na belasting</p>
              <p className="text-muted-foreground">
                Bruto: {formatCurrency(taxSummary.totalBrutoHuur)}/jaar → 
                Netto: <span className="text-success font-medium">{formatCurrency(taxSummary.totalNettoHuur)}/jaar</span>
                {" "}({formatCurrency(taxSummary.totalNettoHuur / 12)}/maand)
              </p>
            </div>
          </div>
        </div>

        {/* Beginner Tip */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-muted-foreground">
            <strong>IMT:</strong> Eenmalig bij aankoop (6,5% voor investeerders). 
            <strong> IMI:</strong> Jaarlijks op basis van fiscale waarde. 
            <strong> IRS:</strong> {currentYear >= 2026 ? '10% als huur ≤ €2.300/maand, anders 25%' : 'Afhankelijk van contractduur'}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
