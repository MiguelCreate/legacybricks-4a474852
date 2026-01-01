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
    let pandenZonderHuur = 0;

    const propertyTaxes = properties.map(property => {
      const aankoopprijs = Number(property.aankoopprijs) || 0;
      const maandHuur = Number(property.maandelijkse_huur) || 0;
      const vptWaarde = estimateVPT(aankoopprijs, 60); // Estimate VPT at 60% of purchase price
      const imiTarief = Number(property.imi_percentage) || 0.5;

      // Track properties without rent
      if (maandHuur === 0) {
        pandenZonderHuur++;
      }

      // Calculate IMT (one-time at purchase)
      const imtResult = calculateIMT2025(aankoopprijs, 'niet-woning');
      
      // Calculate IMI (annual)
      const imiResult = calculateIMI(vptWaarde, 'standaard', imiTarief * 100);
      
      // Calculate IRS (rental income tax)
      // Use 2026 for new regime (10% for rent ≤€2.300/month)
      const jaarHuurinkomst = 2026; // Use new regime for tax planning
      const irsResult = calculateIRS({
        jaarHuurinkomst,
        maandHuur,
        contractduurJaren: 5, // Default assumption for old regime
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
        irs: irsResult,
        heeftHuur: maandHuur > 0
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
      totalMaandelijksBelasting: (totalIMI + totalIRS) / 12,
      pandenZonderHuur
    };
  }, [properties]);

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
          Geschatte belastingdruk voor je portefeuille (nieuwe regeling 2026-2029: 10% voor huur ≤ €2.300/maand)
          {taxSummary.pandenZonderHuur > 0 && (
            <span className="text-warning ml-2">
              ({taxSummary.pandenZonderHuur} pand(en) zonder huurprijs ingevuld)
            </span>
          )}
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
            {taxSummary.propertyTaxes.map(({ property, imt, imi, irs, heeftHuur }) => (
              <div 
                key={property.id}
                className="flex flex-wrap items-center justify-between p-3 bg-muted/30 rounded-lg gap-2"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{property.naam}</span>
                  {!heeftHuur && (
                    <Badge variant="outline" className="text-xs bg-warning/10 text-warning">
                      Geen huur
                    </Badge>
                  )}
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
                    className={`gap-1 ${!heeftHuur ? 'bg-muted' : irs.tarief <= 10 ? 'bg-success/10' : 'bg-destructive/10'}`}
                  >
                    IRS: {heeftHuur ? `${irs.tarief}% = ${formatCurrency(irs.jaarlijksBedrag)}/jr` : 'n.v.t.'}
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
            <strong> IMI:</strong> Jaarlijks op basis van fiscale waarde (VPT ≈ 60% van aankoopprijs). 
            <strong> IRS:</strong> Nieuwe regeling 2026-2029: 10% als huur ≤ €2.300/maand, anders 25%.
            {taxSummary.pandenZonderHuur > 0 && (
              <span className="block mt-1 text-warning">
                ⚠️ Vul de maandelijkse huur in bij je panden om de IRS correct te berekenen.
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
