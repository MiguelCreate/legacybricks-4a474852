import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  TrendingUp, 
  Wallet, 
  PiggyBank,
  ArrowRight,
  CheckCircle2,
  Clock
} from "lucide-react";
import type { SnowballResult } from "@/lib/financialCalculations";

interface SnowballImpactVisualizationProps {
  baseResults: SnowballResult[];
  totalDebt: number;
  totalSurplus: number;
  onExtraPaymentChange: (amount: number) => void;
}

export const SnowballImpactVisualization = ({
  baseResults,
  totalDebt,
  totalSurplus,
  onExtraPaymentChange,
}: SnowballImpactVisualizationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [salarisInleg, setSalarisInleg] = useState(0);
  const [overigeInleg, setOverigeInleg] = useState(0);
  const [saving, setSaving] = useState(false);

  // Fetch profile settings
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("salaris_inleg_sneeuwbal, overige_pot_sneeuwbal")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setSalarisInleg(Number(data.salaris_inleg_sneeuwbal || 0));
        setOverigeInleg(Number(data.overige_pot_sneeuwbal || 0));
      }
    };

    fetchProfile();
  }, [user]);

  // Update parent when extra payments change
  useEffect(() => {
    onExtraPaymentChange(salarisInleg + overigeInleg);
  }, [salarisInleg, overigeInleg, onExtraPaymentChange]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        salaris_inleg_sneeuwbal: salarisInleg,
        overige_pot_sneeuwbal: overigeInleg,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Opgeslagen",
        description: "Je extra inleg instellingen zijn opgeslagen.",
      });
    }
    setSaving(false);
  };

  const totalExtraInleg = salarisInleg + overigeInleg;
  const totalMonthlyPayment = totalSurplus + totalExtraInleg;

  // Calculate impact
  const baseMonthsToFree = totalDebt > 0 && totalSurplus > 0
    ? Math.ceil(totalDebt / totalSurplus)
    : 0;
  
  const acceleratedMonthsToFree = totalDebt > 0 && totalMonthlyPayment > 0
    ? Math.ceil(totalDebt / totalMonthlyPayment)
    : 0;
  
  const monthsSaved = baseMonthsToFree - acceleratedMonthsToFree;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Extra Inleg voor Sneeuwbal
          <InfoTooltip
            title="Extra Inleg"
            content="Naast het huuroverschot kun je extra geld uit je salaris of andere bronnen (beleggingen, spaargeld) inzetten om sneller schuldenvrij te worden."
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Fields */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Wallet className="w-4 h-4" />
              Maandelijkse inleg uit salaris
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                type="number"
                min="0"
                value={salarisInleg || ""}
                onChange={(e) => setSalarisInleg(Number(e.target.value))}
                placeholder="0"
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Bijvoorbeeld een vast bedrag dat je maandelijks apart zet
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <PiggyBank className="w-4 h-4" />
              Overige pot (beleggingen, spaargeld)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                type="number"
                min="0"
                value={overigeInleg || ""}
                onChange={(e) => setOverigeInleg(Number(e.target.value))}
                placeholder="0"
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Maandelijks equivalent uit andere bronnen
            </p>
          </div>
        </div>

        <Button
          onClick={handleSaveProfile}
          variant="outline"
          size="sm"
          disabled={saving}
        >
          {saving ? "Opslaan..." : "Instellingen opslaan"}
        </Button>

        {/* Impact Visualization */}
        {totalExtraInleg > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Impact van Extra Inleg
            </h4>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Huuroverschot</p>
                <p className="text-xl font-bold text-foreground">
                  €{totalSurplus.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">+ Extra Inleg</p>
                <p className="text-xl font-bold text-primary">
                  €{totalExtraInleg.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-success/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">= Totaal per maand</p>
                <p className="text-xl font-bold text-success">
                  €{totalMonthlyPayment.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Time Saved */}
            {monthsSaved > 0 && (
              <div className="p-4 gradient-primary rounded-lg text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Je bespaart</p>
                    <p className="text-2xl font-bold">
                      {monthsSaved} maanden
                    </p>
                    <p className="text-sm opacity-80">eerder schuldenvrij!</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm opacity-80">
                      <Clock className="w-4 h-4" />
                      <span>Zonder extra: {Math.floor(baseMonthsToFree / 12)}j {baseMonthsToFree % 12}m</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-semibold">
                        Met extra: {Math.floor(acceleratedMonthsToFree / 12)}j {acceleratedMonthsToFree % 12}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gantt-style Timeline */}
            {baseResults.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">
                  Aflossingstijdlijn (versneld)
                </h5>
                <div className="space-y-2">
                  {baseResults.slice(0, 5).map((result, index) => {
                    const accelerationFactor = totalMonthlyPayment / Math.max(totalSurplus, 1);
                    const acceleratedMonths = Math.ceil(result.monthsToPayoff / accelerationFactor);
                    const maxMonths = Math.max(...baseResults.map(r => r.monthsToPayoff));
                    const originalWidth = (result.monthsToPayoff / maxMonths) * 100;
                    const acceleratedWidth = (acceleratedMonths / maxMonths) * 100;

                    return (
                      <div key={result.propertyId} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{result.propertyName}</span>
                          <span className="text-muted-foreground">
                            {acceleratedMonths} maanden
                            {acceleratedMonths < result.monthsToPayoff && (
                              <span className="text-success ml-1">
                                (-{result.monthsToPayoff - acceleratedMonths}m)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-4 bg-secondary rounded-full overflow-hidden relative">
                          {/* Original timeline (faded) */}
                          <div
                            className="absolute h-full bg-muted-foreground/20 rounded-full"
                            style={{ width: `${originalWidth}%` }}
                          />
                          {/* Accelerated timeline */}
                          <div
                            className="absolute h-full gradient-primary rounded-full transition-all duration-500"
                            style={{ width: `${acceleratedWidth}%` }}
                          />
                          {/* Acceleration arrow */}
                          {acceleratedWidth < originalWidth && (
                            <ArrowRight 
                              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-success"
                              style={{ right: `${100 - originalWidth + 2}%` }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
