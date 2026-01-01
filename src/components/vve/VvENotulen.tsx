import { useState, useEffect } from "react";
import { Plus, FileText, Calendar, Euro, Info, Trash2, Pencil, Mail, CheckCircle, Clock, Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Notulen {
  id: string;
  property_id: string;
  datum: string;
  beslissing: string;
  kostenverdeling_percentage: number | null;
  jouw_aandeel_euro: number | null;
  status: "afgerond" | "open" | "uitgesteld";
}

interface VvENotulenProps {
  propertyId: string;
  propertyName: string;
}

const statusConfig = {
  afgerond: { label: "Afgerond", icon: CheckCircle, color: "success" as const },
  open: { label: "In behandeling", icon: Clock, color: "warning" as const },
  uitgesteld: { label: "Uitgesteld", icon: Pause, color: "secondary" as const },
};

export const VvENotulen = ({ propertyId, propertyName }: VvENotulenProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Notulen[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Notulen | null>(null);
  const [formData, setFormData] = useState({
    datum: new Date().toISOString().split("T")[0],
    beslissing: "",
    kostenverdeling_percentage: 50,
    jouw_aandeel_euro: 0,
    status: "open" as "afgerond" | "open" | "uitgesteld",
  });

  useEffect(() => {
    fetchItems();
  }, [propertyId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("gemeenschappelijke_notulen")
        .select("*")
        .eq("property_id", propertyId)
        .order("datum", { ascending: false });

      if (error) throw error;
      setItems((data || []) as Notulen[]);
    } catch (error) {
      console.error("Error fetching notulen:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.beslissing.trim()) {
      toast({
        title: "Fout",
        description: "Vul een beslissing in",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("gemeenschappelijke_notulen")
          .update({
            datum: formData.datum,
            beslissing: formData.beslissing,
            kostenverdeling_percentage: formData.kostenverdeling_percentage,
            jouw_aandeel_euro: formData.jouw_aandeel_euro,
            status: formData.status,
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Besluit bijgewerkt" });
      } else {
        const { error } = await supabase
          .from("gemeenschappelijke_notulen")
          .insert({
            property_id: propertyId,
            datum: formData.datum,
            beslissing: formData.beslissing,
            kostenverdeling_percentage: formData.kostenverdeling_percentage,
            jouw_aandeel_euro: formData.jouw_aandeel_euro,
            status: formData.status,
          });

        if (error) throw error;
        toast({ title: "Besluit toegevoegd" });
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
        .from("gemeenschappelijke_notulen")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Besluit verwijderd" });
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
      datum: new Date().toISOString().split("T")[0],
      beslissing: "",
      kostenverdeling_percentage: 50,
      jouw_aandeel_euro: 0,
      status: "open",
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: Notulen) => {
    setEditingItem(item);
    setFormData({
      datum: item.datum,
      beslissing: item.beslissing,
      kostenverdeling_percentage: item.kostenverdeling_percentage || 50,
      jouw_aandeel_euro: item.jouw_aandeel_euro || 0,
      status: item.status,
    });
    setDialogOpen(true);
  };

  const generateEmailContent = () => {
    const openItems = items.filter(i => i.status !== "afgerond");
    const afgerondItems = items.filter(i => i.status === "afgerond");
    
    let content = `Samenvatting VvE-besluiten: ${propertyName}\n\n`;
    content += `Datum: ${format(new Date(), "d MMMM yyyy", { locale: nl })}\n\n`;
    
    if (openItems.length > 0) {
      content += `OPENSTAANDE BESLUITEN (${openItems.length}):\n`;
      content += "─".repeat(40) + "\n";
      openItems.forEach((item, i) => {
        content += `\n${i + 1}. ${item.beslissing}\n`;
        content += `   Datum: ${format(new Date(item.datum), "d MMM yyyy", { locale: nl })}\n`;
        if (item.jouw_aandeel_euro && item.jouw_aandeel_euro > 0) {
          content += `   Jouw aandeel: €${item.jouw_aandeel_euro}\n`;
        }
        content += `   Status: ${statusConfig[item.status].label}\n`;
      });
    }
    
    if (afgerondItems.length > 0) {
      content += `\n\nAFGERONDE BESLUITEN (${afgerondItems.length}):\n`;
      content += "─".repeat(40) + "\n";
      afgerondItems.slice(0, 5).forEach((item, i) => {
        content += `\n${i + 1}. ${item.beslissing}\n`;
        content += `   Datum: ${format(new Date(item.datum), "d MMM yyyy", { locale: nl })}\n`;
      });
    }
    
    return content;
  };

  const handleShareEmail = () => {
    const content = generateEmailContent();
    const subject = `VvE Samenvatting: ${propertyName}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
    window.open(mailtoUrl);
  };

  const totalAandeel = items
    .filter(i => i.status !== "afgerond")
    .reduce((sum, item) => sum + (item.jouw_aandeel_euro || 0), 0);
  const openItems = items.filter(i => i.status === "open").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notulen & Besluittracker
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Zelfs met 2 eigenaren zijn schriftelijke afspraken essentieel voor juridische zekerheid.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            {items.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleShareEmail} className="gap-2">
                <Mail className="w-4 h-4" />
                Deel per e-mail
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nieuw besluit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Besluit bewerken" : "Nieuw besluit vastleggen"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Vergaderdatum</Label>
                    <Input
                      type="date"
                      value={formData.datum}
                      onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Beslissing</Label>
                    <Textarea
                      value={formData.beslissing}
                      onChange={(e) => setFormData({ ...formData, beslissing: e.target.value })}
                      placeholder="Beschrijf het besluit of de afspraak..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Jouw kostenaandeel (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.kostenverdeling_percentage}
                        onChange={(e) => setFormData({ ...formData, kostenverdeling_percentage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Jouw aandeel (€)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.jouw_aandeel_euro}
                        onChange={(e) => setFormData({ ...formData, jouw_aandeel_euro: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "afgerond" | "open" | "uitgesteld") => 
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">In behandeling</SelectItem>
                        <SelectItem value="afgerond">Afgerond</SelectItem>
                        <SelectItem value="uitgesteld">Uitgesteld</SelectItem>
                      </SelectContent>
                    </Select>
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
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Totaal besluiten</p>
              <p className="text-xl font-bold">{items.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-xl font-bold text-warning">{openItems}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Openstaand bedrag</p>
              <p className="text-xl font-bold">€{totalAandeel.toLocaleString("nl-NL")}</p>
            </div>
          </div>
        )}

        {/* Items List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Laden...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nog geen besluiten vastgelegd</p>
            <p className="text-sm">Leg afspraken met mede-eigenaren hier vast</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const StatusIcon = statusConfig[item.status].icon;
              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusConfig[item.status].color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[item.status].label}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(item.datum), "d MMMM yyyy", { locale: nl })}
                      </span>
                    </div>
                    <p className="font-medium">{item.beslissing}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      {item.kostenverdeling_percentage !== null && (
                        <span>Jouw aandeel: {item.kostenverdeling_percentage}%</span>
                      )}
                      {item.jouw_aandeel_euro !== null && item.jouw_aandeel_euro > 0 && (
                        <span className="flex items-center gap-1">
                          <Euro className="w-3 h-3" />
                          €{item.jouw_aandeel_euro.toLocaleString("nl-NL")}
                        </span>
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
