import { useState, useEffect } from "react";
import { Plus, Wrench, Calendar, Euro, AlertTriangle, Info, Trash2, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, addYears } from "date-fns";
import { nl } from "date-fns/locale";

interface OnderhoudItem {
  id: string;
  property_id: string;
  element_naam: string;
  laatste_onderhoud: string | null;
  volgend_onderhoud: string | null;
  frequentie_jaren: number | null;
  geschatte_kosten: number | null;
  notities: string | null;
}

interface VvEOnderhoudsplannerProps {
  propertyId: string;
  propertyName: string;
}

const STANDAARD_ELEMENTEN = [
  "Dak",
  "Gevel",
  "Lift",
  "Trappenhuis",
  "Afvalruimte",
  "Elektriciteitskast",
  "Waterleiding",
  "Riolering",
];

export const VvEOnderhoudsplanner = ({ propertyId, propertyName }: VvEOnderhoudsplannerProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<OnderhoudItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OnderhoudItem | null>(null);
  const [formData, setFormData] = useState({
    element_naam: "",
    laatste_onderhoud: "",
    volgend_onderhoud: "",
    frequentie_jaren: 1,
    geschatte_kosten: 0,
    notities: "",
  });

  useEffect(() => {
    fetchItems();
  }, [propertyId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("gemeenschappelijk_onderhoud")
        .select("*")
        .eq("property_id", propertyId)
        .order("volgend_onderhoud", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching onderhoud items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.element_naam.trim()) {
      toast({
        title: "Fout",
        description: "Vul een elementnaam in",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("gemeenschappelijk_onderhoud")
          .update({
            element_naam: formData.element_naam,
            laatste_onderhoud: formData.laatste_onderhoud || null,
            volgend_onderhoud: formData.volgend_onderhoud || null,
            frequentie_jaren: formData.frequentie_jaren,
            geschatte_kosten: formData.geschatte_kosten,
            notities: formData.notities || null,
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Onderhoudspunt bijgewerkt" });
      } else {
        const { error } = await supabase
          .from("gemeenschappelijk_onderhoud")
          .insert({
            property_id: propertyId,
            element_naam: formData.element_naam,
            laatste_onderhoud: formData.laatste_onderhoud || null,
            volgend_onderhoud: formData.volgend_onderhoud || null,
            frequentie_jaren: formData.frequentie_jaren,
            geschatte_kosten: formData.geschatte_kosten,
            notities: formData.notities || null,
          });

        if (error) throw error;
        toast({ title: "Onderhoudspunt toegevoegd" });
      }

      setDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("gemeenschappelijk_onderhoud")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Onderhoudspunt verwijderd" });
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      element_naam: "",
      laatste_onderhoud: "",
      volgend_onderhoud: "",
      frequentie_jaren: 1,
      geschatte_kosten: 0,
      notities: "",
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: OnderhoudItem) => {
    setEditingItem(item);
    setFormData({
      element_naam: item.element_naam,
      laatste_onderhoud: item.laatste_onderhoud || "",
      volgend_onderhoud: item.volgend_onderhoud || "",
      frequentie_jaren: item.frequentie_jaren || 1,
      geschatte_kosten: item.geschatte_kosten || 0,
      notities: item.notities || "",
    });
    setDialogOpen(true);
  };

  const getUrgencyBadge = (volgendOnderhoud: string | null) => {
    if (!volgendOnderhoud) return null;
    
    const dagenTot = differenceInDays(new Date(volgendOnderhoud), new Date());
    
    if (dagenTot < 0) {
      return <Badge variant="destructive">Verlopen</Badge>;
    } else if (dagenTot <= 30) {
      return <Badge variant="destructive">Binnen 30 dagen</Badge>;
    } else if (dagenTot <= 60) {
      return <Badge variant="warning">Binnen 60 dagen</Badge>;
    } else if (dagenTot <= 90) {
      return <Badge variant="secondary">Binnen 90 dagen</Badge>;
    }
    return null;
  };

  const totalKosten = items.reduce((sum, item) => sum + (item.geschatte_kosten || 0), 0);
  const urgentItems = items.filter(item => {
    if (!item.volgend_onderhoud) return false;
    const dagenTot = differenceInDays(new Date(item.volgend_onderhoud), new Date());
    return dagenTot <= 60;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Gemeenschappelijke Onderhoudsplanner
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Zonder VvE loop je risico op grote onverwachte kosten. Een onderhoudsplanner houdt je voorbereid.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Onderhoudspunt bewerken" : "Nieuw onderhoudspunt"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Element</Label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {STANDAARD_ELEMENTEN.map((elem) => (
                      <Button
                        key={elem}
                        type="button"
                        variant={formData.element_naam === elem ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ ...formData, element_naam: elem })}
                      >
                        {elem}
                      </Button>
                    ))}
                  </div>
                  <Input
                    value={formData.element_naam}
                    onChange={(e) => setFormData({ ...formData, element_naam: e.target.value })}
                    placeholder="Of typ een eigen naam..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Laatste onderhoud</Label>
                    <Input
                      type="date"
                      value={formData.laatste_onderhoud}
                      onChange={(e) => setFormData({ ...formData, laatste_onderhoud: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Volgend onderhoud</Label>
                    <Input
                      type="date"
                      value={formData.volgend_onderhoud}
                      onChange={(e) => setFormData({ ...formData, volgend_onderhoud: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Frequentie (jaren)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.frequentie_jaren}
                      onChange={(e) => setFormData({ ...formData, frequentie_jaren: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label>Geschatte kosten (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.geschatte_kosten}
                      onChange={(e) => setFormData({ ...formData, geschatte_kosten: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notities</Label>
                  <Input
                    value={formData.notities}
                    onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
                    placeholder="Extra informatie..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleSubmit}>
                  {editingItem ? "Opslaan" : "Toevoegen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Totaal elementen</p>
              <p className="text-xl font-bold">{items.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Geschatte kosten</p>
              <p className="text-xl font-bold">€{totalKosten.toLocaleString("nl-NL")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Urgent</p>
              <p className="text-xl font-bold text-warning">{urgentItems.length}</p>
            </div>
          </div>
        )}

        {/* Items List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Laden...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nog geen onderhoudselementen toegevoegd</p>
            <p className="text-sm">Voeg elementen toe zoals dak, gevel, lift, etc.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.element_naam}</span>
                    {getUrgencyBadge(item.volgend_onderhoud)}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                    {item.laatste_onderhoud && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Laatst: {format(new Date(item.laatste_onderhoud), "d MMM yyyy", { locale: nl })}
                      </span>
                    )}
                    {item.volgend_onderhoud && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Volgend: {format(new Date(item.volgend_onderhoud), "d MMM yyyy", { locale: nl })}
                      </span>
                    )}
                    {item.geschatte_kosten && item.geschatte_kosten > 0 && (
                      <span className="flex items-center gap-1">
                        <Euro className="w-3 h-3" />
                        €{item.geschatte_kosten.toLocaleString("nl-NL")}
                      </span>
                    )}
                    {item.frequentie_jaren && (
                      <span>Elke {item.frequentie_jaren} jaar</span>
                    )}
                  </div>
                  {item.notities && (
                    <p className="text-sm text-muted-foreground mt-1">{item.notities}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
