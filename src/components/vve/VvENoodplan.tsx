import { useState, useEffect } from "react";
import { Plus, AlertTriangle, Phone, Mail, Info, Trash2, Pencil, Zap, Droplets, Flame, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NoodContact {
  id: string;
  property_id: string;
  situatie: string;
  actie: string;
  contact_naam: string | null;
  contact_telefoon: string | null;
  contact_email: string | null;
  extra_info: string | null;
}

interface VvENoodplanProps {
  propertyId: string;
  propertyName: string;
}

const STANDAARD_SITUATIES = [
  { naam: "Lekkage (dak/waterleiding)", icon: Droplets },
  { naam: "Stroomuitval", icon: Zap },
  { naam: "Brand/rookontwikkeling", icon: Flame },
  { naam: "Lift defect", icon: Building2 },
  { naam: "Inbraak/vandalisme", icon: AlertTriangle },
];

export const VvENoodplan = ({ propertyId, propertyName }: VvENoodplanProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<NoodContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NoodContact | null>(null);
  const [formData, setFormData] = useState({
    situatie: "",
    actie: "",
    contact_naam: "",
    contact_telefoon: "",
    contact_email: "",
    extra_info: "",
  });

  useEffect(() => {
    fetchItems();
  }, [propertyId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("noodgevallen_contacten")
        .select("*")
        .eq("property_id", propertyId)
        .order("situatie", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching noodcontacten:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.situatie.trim() || !formData.actie.trim()) {
      toast({
        title: "Fout",
        description: "Vul minstens de situatie en actie in",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("noodgevallen_contacten")
          .update({
            situatie: formData.situatie,
            actie: formData.actie,
            contact_naam: formData.contact_naam || null,
            contact_telefoon: formData.contact_telefoon || null,
            contact_email: formData.contact_email || null,
            extra_info: formData.extra_info || null,
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Noodcontact bijgewerkt" });
      } else {
        const { error } = await supabase
          .from("noodgevallen_contacten")
          .insert({
            property_id: propertyId,
            situatie: formData.situatie,
            actie: formData.actie,
            contact_naam: formData.contact_naam || null,
            contact_telefoon: formData.contact_telefoon || null,
            contact_email: formData.contact_email || null,
            extra_info: formData.extra_info || null,
          });

        if (error) throw error;
        toast({ title: "Noodcontact toegevoegd" });
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
        .from("noodgevallen_contacten")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Noodcontact verwijderd" });
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
      situatie: "",
      actie: "",
      contact_naam: "",
      contact_telefoon: "",
      contact_email: "",
      extra_info: "",
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: NoodContact) => {
    setEditingItem(item);
    setFormData({
      situatie: item.situatie,
      actie: item.actie,
      contact_naam: item.contact_naam || "",
      contact_telefoon: item.contact_telefoon || "",
      contact_email: item.contact_email || "",
      extra_info: item.extra_info || "",
    });
    setDialogOpen(true);
  };

  const getIconForSituatie = (situatie: string) => {
    if (situatie.toLowerCase().includes("lek") || situatie.toLowerCase().includes("water")) {
      return Droplets;
    }
    if (situatie.toLowerCase().includes("stroom") || situatie.toLowerCase().includes("elektr")) {
      return Zap;
    }
    if (situatie.toLowerCase().includes("brand") || situatie.toLowerCase().includes("vuur")) {
      return Flame;
    }
    if (situatie.toLowerCase().includes("lift")) {
      return Building2;
    }
    return AlertTriangle;
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader className="bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Noodgevallenplan – Gemeenschappelijk
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Een snelle checklist bij noodgevallen. Voeg contactgegevens toe van loodgieters, elektriciens, beheerders, etc.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive" className="gap-2">
                <Plus className="w-4 h-4" />
                Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Noodcontact bewerken" : "Nieuw noodcontact"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Situatie</Label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {STANDAARD_SITUATIES.map((sit) => (
                      <Button
                        key={sit.naam}
                        type="button"
                        variant={formData.situatie === sit.naam ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ ...formData, situatie: sit.naam })}
                        className="gap-1"
                      >
                        <sit.icon className="w-3 h-3" />
                        {sit.naam}
                      </Button>
                    ))}
                  </div>
                  <Input
                    value={formData.situatie}
                    onChange={(e) => setFormData({ ...formData, situatie: e.target.value })}
                    placeholder="Of typ een eigen situatie..."
                  />
                </div>
                <div>
                  <Label>Actie / Instructies</Label>
                  <Textarea
                    value={formData.actie}
                    onChange={(e) => setFormData({ ...formData, actie: e.target.value })}
                    placeholder="Wat moet er gebeuren? bijv. 'Bel de loodgieter' of 'Schakel hoofdkraan uit'"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Contactpersoon</Label>
                    <Input
                      value={formData.contact_naam}
                      onChange={(e) => setFormData({ ...formData, contact_naam: e.target.value })}
                      placeholder="Naam"
                    />
                  </div>
                  <div>
                    <Label>Telefoon</Label>
                    <Input
                      value={formData.contact_telefoon}
                      onChange={(e) => setFormData({ ...formData, contact_telefoon: e.target.value })}
                      placeholder="+351 912 345 678"
                    />
                  </div>
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="email@voorbeeld.com"
                  />
                </div>
                <div>
                  <Label>Extra info</Label>
                  <Input
                    value={formData.extra_info}
                    onChange={(e) => setFormData({ ...formData, extra_info: e.target.value })}
                    placeholder="bijv. 'Hoofdkraan zit in de kelder links'"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleSubmit} variant="destructive">
                  {editingItem ? "Opslaan" : "Toevoegen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Items List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Laden...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nog geen noodcontacten toegevoegd</p>
            <p className="text-sm">Voeg contacten toe voor noodsituaties zoals lekkages, stroomuitval, etc.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const SituatieIcon = getIconForSituatie(item.situatie);
              return (
                <div
                  key={item.id}
                  className="p-4 border border-destructive/20 rounded-lg bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                        <SituatieIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-destructive">{item.situatie}</p>
                        <p className="text-sm mt-1">{item.actie}</p>
                        
                        {/* Contact info */}
                        <div className="flex flex-wrap gap-4 mt-3">
                          {item.contact_naam && (
                            <span className="text-sm font-medium">{item.contact_naam}</span>
                          )}
                          {item.contact_telefoon && (
                            <a
                              href={`tel:${item.contact_telefoon}`}
                              className="text-sm flex items-center gap-1 text-primary hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              {item.contact_telefoon}
                            </a>
                          )}
                          {item.contact_email && (
                            <a
                              href={`mailto:${item.contact_email}`}
                              className="text-sm flex items-center gap-1 text-primary hover:underline"
                            >
                              <Mail className="w-3 h-3" />
                              {item.contact_email}
                            </a>
                          )}
                        </div>
                        
                        {item.extra_info && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            ℹ️ {item.extra_info}
                          </p>
                        )}
                      </div>
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
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
