import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, PieChart, Euro, TrendingUp, AlertCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface Owner {
  id: string;
  naam: string;
  eigendomPercentage: number;
  eigenInbreng: number;
  hypotheekAandeel: number;
  maandBijdrage: number;
}

interface CoOwnershipModuleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  owners: Owner[];
  onOwnersChange: (owners: Owner[]) => void;
  totalPropertyValue: number;
  totalMortgage: number;
  monthlyRent: number;
  monthlyMortgagePayment: number;
  monthlyCosts: number;
  irsPercentage: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

export const CoOwnershipModule = ({
  enabled,
  onToggle,
  owners,
  onOwnersChange,
  totalPropertyValue,
  totalMortgage,
  monthlyRent,
  monthlyMortgagePayment,
  monthlyCosts,
  irsPercentage
}: CoOwnershipModuleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const addOwner = () => {
    const remainingPercentage = 100 - owners.reduce((sum, o) => sum + o.eigendomPercentage, 0);
    const newOwner: Owner = {
      id: crypto.randomUUID(),
      naam: `Eigenaar ${owners.length + 1}`,
      eigendomPercentage: Math.max(0, remainingPercentage),
      eigenInbreng: 0,
      hypotheekAandeel: 0,
      maandBijdrage: 0,
    };
    onOwnersChange([...owners, newOwner]);
  };

  const updateOwner = (id: string, updates: Partial<Owner>) => {
    onOwnersChange(owners.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const removeOwner = (id: string) => {
    if (owners.length > 1) {
      onOwnersChange(owners.filter(o => o.id !== id));
    }
  };

  const totalPercentage = owners.reduce((sum, o) => sum + o.eigendomPercentage, 0);
  const isValidDistribution = Math.abs(totalPercentage - 100) < 0.01;

  // Calculate per-owner metrics
  const calculateOwnerMetrics = (owner: Owner) => {
    const pct = owner.eigendomPercentage / 100;
    const rentShare = monthlyRent * pct;
    const mortgageShare = monthlyMortgagePayment * pct;
    const costsShare = monthlyCosts * pct;
    const irsShare = (monthlyRent * 12 * pct * irsPercentage / 100) / 12;
    const netCashflow = rentShare - mortgageShare - costsShare - irsShare;
    const equityShare = (totalPropertyValue - totalMortgage) * pct;
    
    return { rentShare, mortgageShare, costsShare, irsShare, netCashflow, equityShare };
  };

  // Total metrics for comparison
  const totalNetCashflow = monthlyRent - monthlyMortgagePayment - monthlyCosts - (monthlyRent * 12 * irsPercentage / 100 / 12);

  if (!enabled) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Mede-eigenaarschap</h3>
                <p className="text-sm text-muted-foreground">Bereken verdeling bij 2+ eigenaren</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => onToggle(true)}>
              Activeren
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Mede-eigenaarschap
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isValidDistribution ? "default" : "destructive"}>
              {totalPercentage}% verdeeld
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => onToggle(false)}>
              Uitschakelen
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isValidDistribution && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>De eigendomspercentages moeten optellen tot 100%</span>
          </div>
        )}

        {/* Owners List */}
        <div className="space-y-3">
          {owners.map((owner, index) => {
            const metrics = calculateOwnerMetrics(owner);
            return (
              <Collapsible key={owner.id}>
                <div className="p-4 rounded-xl border bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="col-span-2 sm:col-span-1">
                        <Label className="text-xs text-muted-foreground">Naam</Label>
                        <Input
                          value={owner.naam}
                          onChange={(e) => updateOwner(owner.id, { naam: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Eigendom %</Label>
                        <Input
                          type="number"
                          value={owner.eigendomPercentage}
                          onChange={(e) => updateOwner(owner.id, { eigendomPercentage: Number(e.target.value) })}
                          className="h-9"
                          min={0}
                          max={100}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Eigen inbreng</Label>
                        <Input
                          type="number"
                          value={owner.eigenInbreng}
                          onChange={(e) => updateOwner(owner.id, { eigenInbreng: Number(e.target.value) })}
                          className="h-9"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Netto cashflow</Label>
                          <div className={`h-9 flex items-center font-semibold ${metrics.netCashflow >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(metrics.netCashflow)}/mnd
                          </div>
                        </div>
                        {owners.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            onClick={() => removeOwner(owner.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground">
                      Details bekijken
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Huurinkomsten</span>
                        <p className="font-medium text-success">{formatCurrency(metrics.rentShare)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hypotheek</span>
                        <p className="font-medium text-destructive">-{formatCurrency(metrics.mortgageShare)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Kosten</span>
                        <p className="font-medium text-destructive">-{formatCurrency(metrics.costsShare)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IRS belasting</span>
                        <p className="font-medium text-destructive">-{formatCurrency(metrics.irsShare)}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Vermogen (overwaarde)</span>
                        <p className="font-medium text-primary">{formatCurrency(metrics.equityShare)}</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        <Button variant="outline" onClick={addOwner} className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Eigenaar toevoegen
        </Button>

        {/* Summary */}
        {isValidDistribution && owners.length > 1 && (
          <div className="p-4 rounded-xl bg-muted/50 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Samenvatting verdeling
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {owners.map(owner => {
                const metrics = calculateOwnerMetrics(owner);
                return (
                  <div key={owner.id} className="p-3 bg-background rounded-lg border">
                    <div className="font-medium text-sm">{owner.naam}</div>
                    <div className="text-xs text-muted-foreground">{owner.eigendomPercentage}% eigendom</div>
                    <div className={`font-semibold mt-1 ${metrics.netCashflow >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(metrics.netCashflow)}/mnd
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vermogen: {formatCurrency(metrics.equityShare)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
