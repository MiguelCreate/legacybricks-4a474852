import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Calendar, TrendingUp, Percent, Euro, BedDouble, Users } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;

interface ShortTermRentalOverviewProps {
  properties: Property[];
}

export const ShortTermRentalOverview = ({ properties }: ShortTermRentalOverviewProps) => {
  // Filter alleen short-term verhuur panden
  const stProperties = properties.filter(p => p.type_verhuur === 'korte_termijn');
  
  if (stProperties.length === 0) {
    return null;
  }

  // Bereken totalen
  const totalDailyRate = stProperties.reduce((sum, p) => sum + Number(p.st_gemiddelde_dagprijs || 0), 0);
  const avgDailyRate = stProperties.length > 0 ? totalDailyRate / stProperties.length : 0;
  
  const avgOccupancy = stProperties.length > 0 
    ? stProperties.reduce((sum, p) => sum + Number(p.st_bezetting_percentage || 0), 0) / stProperties.length
    : 0;

  // Geschatte maandelijkse inkomsten per pand
  const estimatedMonthlyIncome = stProperties.reduce((sum, p) => {
    const dagprijs = Number(p.st_gemiddelde_dagprijs || 0);
    const bezetting = Number(p.st_bezetting_percentage || 0) / 100;
    return sum + (dagprijs * 30 * bezetting);
  }, 0);

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-base">Short-Term Rentals</CardTitle>
            <InfoTooltip 
              title="Short-Term Rentals"
              content="Overzicht van je korte termijn verhuur zoals Airbnb, Booking.com, etc. Toont geschatte inkomsten op basis van gemiddelde dagprijs en bezettingsgraad."
            />
          </div>
          <Badge variant="outline" className="gap-1">
            <BedDouble className="w-3 h-3" />
            {stProperties.length} {stProperties.length === 1 ? 'pand' : 'panden'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI's Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Euro className="w-3 h-3" />
              <span className="text-xs">Gem. Dagprijs</span>
            </div>
            <p className="text-lg font-bold text-foreground">€{avgDailyRate.toFixed(0)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Percent className="w-3 h-3" />
              <span className="text-xs">Bezetting</span>
            </div>
            <p className="text-lg font-bold text-foreground">{avgOccupancy.toFixed(0)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-success/10 text-center">
            <div className="flex items-center justify-center gap-1 text-success mb-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">Est. /maand</span>
            </div>
            <p className="text-lg font-bold text-success">€{estimatedMonthlyIncome.toFixed(0)}</p>
          </div>
        </div>

        {/* Per Property Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Per Pand</p>
          <div className="space-y-2">
            {stProperties.map((property) => {
              const dagprijs = Number(property.st_gemiddelde_dagprijs || 0);
              const bezetting = Number(property.st_bezetting_percentage || 0);
              const estMonthly = dagprijs * 30 * (bezetting / 100);
              
              return (
                <div 
                  key={property.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BedDouble className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{property.naam}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>€{dagprijs}/nacht</span>
                        <span>•</span>
                        <span>{bezetting}% bezet</span>
                        {property.aantal_units > 1 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {property.aantal_units} units
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">€{estMonthly.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">/maand</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
