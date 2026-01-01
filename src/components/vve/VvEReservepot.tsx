import { useState, useEffect } from "react";
import { PiggyBank, Euro, AlertTriangle, Info, TrendingUp, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VvEReservepotProps {
  propertyId: string;
  propertyName: string;
  streefbedrag: number;
  huidigBedrag: number;
  maandbijdrage: number;
  onUpdate: () => void;
}

export const VvEReservepot = ({
  propertyId,
  propertyName,
  streefbedrag,
  huidigBedrag,
  maandbijdrage,
  onUpdate,
}: VvEReservepotProps) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    streefbedrag,
    huidigBedrag,
    maandbijdrage,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      streefbedrag,
      huidigBedrag,
      maandbijdrage,
    });
  }, [streefbedrag, huidigBedrag, maandbijdrage]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          vve_reserve_streef: formData.streefbedrag,
          vve_reserve_huidig: formData.huidigBedrag,
          vve_maandbijdrage: formData.maandbijdrage,
        })
        .eq("id", propertyId);

      if (error) throw error;

      toast({ title: "Reservepot bijgewerkt" });
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const percentage = streefbedrag > 0 ? Math.min((huidigBedrag / streefbedrag) * 100, 100) : 0;
  const isLaag = percentage < 50;
  const maandenNodig = maandbijdrage > 0 && streefbedrag > huidigBedrag
    ? Math.ceil((streefbedrag - huidigBedrag) / maandbijdrage)
    : 0;

  // Bereken aanbevolen maandbijdrage voor 2 jaar
  const aanbevolenBijdrage = streefbedrag > huidigBedrag
    ? Math.ceil((streefbedrag - huidigBedrag) / 24)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5" />
              Virtuele VvE-Reservepot
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Deze pot voorkomt dat een lekkend dak jouw cashflow verwoest. Bouw een buffer op voor onverwachte gemeenschappelijke kosten.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (editing) {
                handleSave();
              } else {
                setEditing(true);
              }
            }}
            disabled={saving}
          >
            {editing ? "Opslaan" : "Bewerken"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Streefbedrag (€)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.streefbedrag}
                  onChange={(e) => setFormData({ ...formData, streefbedrag: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Huidig gespaard (€)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.huidigBedrag}
                  onChange={(e) => setFormData({ ...formData, huidigBedrag: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Maandelijkse bijdrage (€)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.maandbijdrage}
                  onChange={(e) => setFormData({ ...formData, maandbijdrage: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Annuleren
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Voortgang</span>
                <span className="font-medium">{percentage.toFixed(0)}%</span>
              </div>
              <Progress value={percentage} className="h-4" />
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-lg">
                  €{huidigBedrag.toLocaleString("nl-NL")}
                </span>
                <span className="text-muted-foreground">
                  / €{streefbedrag.toLocaleString("nl-NL")}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Euro className="w-3 h-3" />
                  Maandelijkse bijdrage
                </p>
                <p className="text-xl font-bold">€{maandbijdrage.toLocaleString("nl-NL")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Nog nodig
                </p>
                <p className="text-xl font-bold">
                  €{Math.max(0, streefbedrag - huidigBedrag).toLocaleString("nl-NL")}
                </p>
              </div>
              {maandenNodig > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calculator className="w-3 h-3" />
                    Maanden tot doel
                  </p>
                  <p className="text-xl font-bold">{maandenNodig}</p>
                </div>
              )}
            </div>

            {/* Waarschuwingen */}
            {isLaag && streefbedrag > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Reservepot &lt; 50%</strong> — Verhoog je maandelijkse bijdrage om voorbereid te zijn op onverwachte kosten.
                  {aanbevolenBijdrage > 0 && (
                    <span className="block mt-1">
                      Aanbevolen bijdrage voor doelbereik in 2 jaar: <strong>€{aanbevolenBijdrage}/maand</strong>
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {percentage >= 100 && (
              <Alert className="border-success bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  <strong>Doel bereikt!</strong> — Je reservepot is volledig gevuld. Overweeg het streefbedrag te verhogen voor extra zekerheid.
                </AlertDescription>
              </Alert>
            )}

            {streefbedrag === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Stel een streefbedrag in om je reservepot te activeren. Een vuistregel: minimaal 2-3% van de gebouwwaarde voor onverwachte kosten.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
