import { useState } from "react";
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2, Loader2, MapPin, Target, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;

interface PropertyAdvice {
  score: number;
  kernpunten: string[];
  advies: {
    prioriteit_1?: {
      titel: string;
      beschrijving: string;
      verwachte_impact?: string;
      geschatte_kosten?: string;
    };
    prioriteit_2?: {
      titel: string;
      beschrijving: string;
      verwachte_impact?: string;
    };
    prioriteit_3?: {
      titel: string;
      beschrijving: string;
    };
  };
  markt_context?: string;
  extra_tips?: string[];
}

interface PropertyAdviceDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 8) return "text-success";
  if (score >= 6) return "text-warning";
  if (score >= 4) return "text-orange-500";
  return "text-destructive";
};

const getScoreBgColor = (score: number) => {
  if (score >= 8) return "bg-success/10 border-success/20";
  if (score >= 6) return "bg-warning/10 border-warning/20";
  if (score >= 4) return "bg-orange-500/10 border-orange-500/20";
  return "bg-destructive/10 border-destructive/20";
};

const getScoreLabel = (score: number) => {
  if (score >= 8) return "Uitstekend";
  if (score >= 6) return "Goed";
  if (score >= 4) return "Matig";
  return "Verbetering nodig";
};

export const PropertyAdviceDialog = ({ property, open, onOpenChange }: PropertyAdviceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<PropertyAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateAdvice = async () => {
    if (!property) return;

    setLoading(true);
    setError(null);
    setAdvice(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-property-advice', {
        body: { property },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.advice) {
        setAdvice(data.advice);
      } else {
        throw new Error(data?.error || 'Kon advies niet genereren');
      }
    } catch (err: any) {
      console.error('Error generating advice:', err);
      setError(err.message || 'Er ging iets mis bij het genereren van advies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAdvice(null);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Vastgoedadvies: {property.naam}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {property.locatie}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!advice && !loading && !error && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Vastgoedadvies</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Ontvang een gepersonaliseerde score en verbeteringsadvies op basis van je pandgegevens 
                en kennis van de Portugese vastgoedmarkt.
              </p>
              <Button onClick={generateAdvice} className="gradient-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Genereer Advies
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Advies wordt gegenereerd...</p>
              <p className="text-xs text-muted-foreground mt-1">Dit kan enkele seconden duren</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={generateAdvice} variant="outline">
                Opnieuw proberen
              </Button>
            </div>
          )}

          {advice && (
            <div className="space-y-6">
              {/* Score Section */}
              <div className={`p-6 rounded-xl border ${getScoreBgColor(advice.score)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Huidige Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-bold ${getScoreColor(advice.score)}`}>
                        {advice.score}
                      </span>
                      <span className="text-lg text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {getScoreLabel(advice.score)}
                  </Badge>
                </div>
                
                {advice.kernpunten && advice.kernpunten.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Kernpunten
                    </p>
                    <ul className="space-y-1">
                      {advice.kernpunten.map((punt, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{punt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Advice Priorities */}
              {advice.advies && (
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Verbeteringsplan
                  </h4>

                  {advice.advies.prioriteit_1 && (
                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-primary text-primary-foreground shrink-0">1</Badge>
                        <div className="space-y-2">
                          <h5 className="font-medium">{advice.advies.prioriteit_1.titel}</h5>
                          <p className="text-sm text-muted-foreground">
                            {advice.advies.prioriteit_1.beschrijving}
                          </p>
                          {advice.advies.prioriteit_1.verwachte_impact && (
                            <p className="text-xs flex items-center gap-1 text-success">
                              <TrendingUp className="w-3 h-3" />
                              {advice.advies.prioriteit_1.verwachte_impact}
                            </p>
                          )}
                          {advice.advies.prioriteit_1.geschatte_kosten && (
                            <p className="text-xs text-muted-foreground">
                              💰 {advice.advies.prioriteit_1.geschatte_kosten}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {advice.advies.prioriteit_2 && (
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary" className="shrink-0">2</Badge>
                        <div className="space-y-2">
                          <h5 className="font-medium">{advice.advies.prioriteit_2.titel}</h5>
                          <p className="text-sm text-muted-foreground">
                            {advice.advies.prioriteit_2.beschrijving}
                          </p>
                          {advice.advies.prioriteit_2.verwachte_impact && (
                            <p className="text-xs flex items-center gap-1 text-success">
                              <TrendingUp className="w-3 h-3" />
                              {advice.advies.prioriteit_2.verwachte_impact}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {advice.advies.prioriteit_3 && (
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="shrink-0">3</Badge>
                        <div className="space-y-1">
                          <h5 className="font-medium text-sm">{advice.advies.prioriteit_3.titel}</h5>
                          <p className="text-sm text-muted-foreground">
                            {advice.advies.prioriteit_3.beschrijving}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Market Context */}
              {advice.markt_context && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Marktcontext
                  </h4>
                  <p className="text-sm text-muted-foreground">{advice.markt_context}</p>
                </div>
              )}

              {/* Extra Tips */}
              {advice.extra_tips && advice.extra_tips.length > 0 && (
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    Extra Tips
                  </h4>
                  <ul className="space-y-1">
                    {advice.extra_tips.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regenerate Button */}
              <div className="flex justify-center pt-4">
                <Button onClick={generateAdvice} variant="outline" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Nieuw advies genereren
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Dit advies is vrijblijvend en gebaseerd op de beschikbare pandgegevens. 
                Raadpleeg altijd een professional voor belangrijke beslissingen.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
