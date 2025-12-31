import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  Home, 
  MapPin, 
  Euro, 
  Ruler, 
  TrendingUp,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface ComparableProperty {
  id: string;
  property_id: string;
  adres: string;
  vraagprijs: number;
  oppervlakte_m2: number;
  afstand_meter: number | null;
  status: string | null;
  prijs_per_m2: number | null;
  notities: string | null;
}

interface ComparablePropertiesManagerProps {
  propertyId: string;
  propertyM2: number | null;
  currentMarketValue: number | null;
  onMarketValueUpdate: (newValue: number) => void;
}

export function ComparablePropertiesManager({
  propertyId,
  propertyM2,
  currentMarketValue,
  onMarketValueUpdate,
}: ComparablePropertiesManagerProps) {
  const { toast } = useToast();
  const [comps, setComps] = useState<ComparableProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newComp, setNewComp] = useState({
    adres: "",
    vraagprijs: 0,
    oppervlakte_m2: 0,
    afstand_meter: 0,
    status: "te koop",
    notities: "",
  });

  useEffect(() => {
    fetchComps();
  }, [propertyId]);

  const fetchComps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comparable_properties")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comps:", error);
    } else {
      setComps(data || []);
    }
    setLoading(false);
  };

  const handleAddComp = async () => {
    if (!newComp.adres || !newComp.vraagprijs || !newComp.oppervlakte_m2) {
      toast({
        title: "Vul alle verplichte velden in",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("comparable_properties").insert({
      property_id: propertyId,
      adres: newComp.adres,
      vraagprijs: newComp.vraagprijs,
      oppervlakte_m2: newComp.oppervlakte_m2,
      afstand_meter: newComp.afstand_meter || null,
      status: newComp.status,
      notities: newComp.notities || null,
    });

    if (error) {
      toast({
        title: "Fout bij toevoegen",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Vergelijkbaar pand toegevoegd" });
      setDialogOpen(false);
      setNewComp({
        adres: "",
        vraagprijs: 0,
        oppervlakte_m2: 0,
        afstand_meter: 0,
        status: "te koop",
        notities: "",
      });
      fetchComps();
    }
  };

  const handleDeleteComp = async (id: string) => {
    const { error } = await supabase
      .from("comparable_properties")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Vergelijkbaar pand verwijderd" });
      fetchComps();
    }
  };

  // Calculate average price per m2
  const avgPricePerM2 = comps.length > 0
    ? comps.reduce((sum, c) => sum + (c.prijs_per_m2 || 0), 0) / comps.length
    : 0;

  // Calculate estimated market value based on comps
  const estimatedValue = propertyM2 && avgPricePerM2 > 0
    ? Math.round(avgPricePerM2 * propertyM2)
    : null;

  const handleUpdateMarketValue = () => {
    if (estimatedValue) {
      onMarketValueUpdate(estimatedValue);
      toast({
        title: "Marktwaarde bijgewerkt",
        description: `Nieuwe geschatte waarde: €${estimatedValue.toLocaleString("nl-NL")}`,
      });
    }
  };

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString("nl-NL", { minimumFractionDigits: 0 })}`;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              Marktwaarde & Vergelijkbare Panden
              <InfoTooltip 
                title="Marktwaarde bepalen" 
                content="Voeg vergelijkbare panden in de buurt toe om een realistische marktwaarde te bepalen. Panden binnen 500 meter met soortgelijke grootte zijn het meest betrouwbaar."
              />
            </CardTitle>
            <CardDescription>
              Vergelijk met panden in de omgeving om je marktwaarde bij te werken
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vergelijkbaar Pand Toevoegen</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Adres *</Label>
                  <Input
                    value={newComp.adres}
                    onChange={(e) => setNewComp({ ...newComp, adres: e.target.value })}
                    placeholder="Straatnaam 123, Stad"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vraagprijs (€) *</Label>
                    <Input
                      type="number"
                      value={newComp.vraagprijs || ""}
                      onChange={(e) => setNewComp({ ...newComp, vraagprijs: parseFloat(e.target.value) || 0 })}
                      placeholder="250000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Oppervlakte (m²) *</Label>
                    <Input
                      type="number"
                      value={newComp.oppervlakte_m2 || ""}
                      onChange={(e) => setNewComp({ ...newComp, oppervlakte_m2: parseFloat(e.target.value) || 0 })}
                      placeholder="85"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Afstand (meter)</Label>
                    <Input
                      type="number"
                      value={newComp.afstand_meter || ""}
                      onChange={(e) => setNewComp({ ...newComp, afstand_meter: parseInt(e.target.value) || 0 })}
                      placeholder="200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Input
                      value={newComp.status}
                      onChange={(e) => setNewComp({ ...newComp, status: e.target.value })}
                      placeholder="te koop / verkocht"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notities</Label>
                  <Input
                    value={newComp.notities}
                    onChange={(e) => setNewComp({ ...newComp, notities: e.target.value })}
                    placeholder="Vergelijkbare staat, gerenoveerd, etc."
                  />
                </div>
                <Button onClick={handleAddComp} className="w-full">
                  Toevoegen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Card */}
        {comps.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-accent/50">
              <CardContent className="pt-4 text-center">
                <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-bold">{formatCurrency(Math.round(avgPricePerM2))}</p>
                <p className="text-xs text-muted-foreground">Gem. prijs/m² in buurt</p>
              </CardContent>
            </Card>
            
            <Card className="bg-accent/50">
              <CardContent className="pt-4 text-center">
                <Ruler className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-bold">{propertyM2 || "?"} m²</p>
                <p className="text-xs text-muted-foreground">Jouw pand</p>
              </CardContent>
            </Card>
            
            <Card className={`${estimatedValue ? 'bg-green-50 dark:bg-green-950/20' : 'bg-accent/50'}`}>
              <CardContent className="pt-4 text-center">
                <Euro className="h-5 w-5 text-green-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-green-600">
                  {estimatedValue ? formatCurrency(estimatedValue) : "Voeg comps toe"}
                </p>
                <p className="text-xs text-muted-foreground">Geschatte waarde</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Update Market Value Button */}
        {estimatedValue && estimatedValue !== currentMarketValue && (
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Geschatte waarde ({formatCurrency(estimatedValue)}) verschilt van huidige marktwaarde
                {currentMarketValue ? ` (${formatCurrency(currentMarketValue)})` : ""}
              </span>
            </div>
            <Button size="sm" onClick={handleUpdateMarketValue} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Bijwerken
            </Button>
          </div>
        )}

        {/* Comparable Properties Table */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Laden...</div>
        ) : comps.length === 0 ? (
          <div className="text-center py-8">
            <Home className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nog geen vergelijkbare panden toegevoegd</p>
            <p className="text-xs text-muted-foreground mt-1">
              Voeg panden toe die recent te koop stonden of verkocht zijn in de buurt
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adres</TableHead>
                  <TableHead className="text-right">Vraagprijs</TableHead>
                  <TableHead className="text-right">m²</TableHead>
                  <TableHead className="text-right">€/m²</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comps.map((comp) => (
                  <TableRow key={comp.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-sm">{comp.adres}</span>
                        {comp.afstand_meter && (
                          <Badge variant="outline" className="text-xs">
                            {comp.afstand_meter}m
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(comp.vraagprijs)}
                    </TableCell>
                    <TableCell className="text-right">{comp.oppervlakte_m2}</TableCell>
                    <TableCell className="text-right text-primary font-medium">
                      {comp.prijs_per_m2 ? formatCurrency(Math.round(comp.prijs_per_m2)) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={comp.status === "verkocht" ? "default" : "secondary"}>
                        {comp.status || "te koop"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteComp(comp.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tip */}
        <p className="text-xs text-muted-foreground text-center">
          💡 Tip: Panden binnen 500 meter en met soortgelijke grootte zijn het meest betrouwbaar voor waardering
        </p>
      </CardContent>
    </Card>
  );
}
