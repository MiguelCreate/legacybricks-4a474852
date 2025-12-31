import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Wrench, Calendar, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PropertyFeature {
  id: string;
  property_id: string;
  naam: string;
  aanwezig: boolean;
  merk_type: string | null;
  onderhoudsbehoefte: string;
  onderhoudsstatus: string | null;
  gepland_onderhoudsjaar: number | null;
  notities: string | null;
}

interface PropertyFeaturesManagerProps {
  propertyId: string;
  propertyName: string;
}

const SUGGESTED_FEATURES = [
  "Intercom",
  "Lift",
  "Verwarmingssysteem",
  "Airconditioning",
  "Ventilatiesysteem",
  "Zonnepanelen",
  "Boiler",
  "Alarm",
  "Camera's",
  "Brandmelder",
];

const onderhoudLabels: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  geen: { label: "Geen onderhoud", color: "text-success", icon: CheckCircle },
  licht: { label: "Licht onderhoud", color: "text-warning", icon: AlertTriangle },
  groot: { label: "Groot onderhoud", color: "text-destructive", icon: AlertCircle },
};

export const PropertyFeaturesManager = ({ propertyId, propertyName }: PropertyFeaturesManagerProps) => {
  const { toast } = useToast();
  const [features, setFeatures] = useState<PropertyFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PropertyFeature | null>(null);
  const [formData, setFormData] = useState({
    naam: "",
    aanwezig: true,
    merk_type: "",
    onderhoudsbehoefte: "geen",
    onderhoudsstatus: "",
    gepland_onderhoudsjaar: "",
    notities: "",
  });

  useEffect(() => {
    fetchFeatures();
  }, [propertyId]);

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from("property_features")
        .select("*")
        .eq("property_id", propertyId)
        .order("naam");

      if (error) throw error;
      setFeatures((data as PropertyFeature[]) || []);
    } catch (error) {
      console.error("Error fetching features:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const featureData = {
        property_id: propertyId,
        naam: formData.naam,
        aanwezig: formData.aanwezig,
        merk_type: formData.merk_type || null,
        onderhoudsbehoefte: formData.onderhoudsbehoefte,
        onderhoudsstatus: formData.onderhoudsstatus || null,
        gepland_onderhoudsjaar: formData.gepland_onderhoudsjaar ? parseInt(formData.gepland_onderhoudsjaar) : null,
        notities: formData.notities || null,
      };

      if (editingFeature) {
        const { error } = await supabase
          .from("property_features")
          .update(featureData)
          .eq("id", editingFeature.id);
        if (error) throw error;
        toast({ title: "Kenmerk bijgewerkt" });
      } else {
        const { error } = await supabase.from("property_features").insert(featureData);
        if (error) throw error;
        toast({ title: "Kenmerk toegevoegd" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchFeatures();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (feature: PropertyFeature) => {
    if (!confirm(`Weet je zeker dat je "${feature.naam}" wilt verwijderen?`)) return;

    try {
      const { error } = await supabase.from("property_features").delete().eq("id", feature.id);
      if (error) throw error;
      toast({ title: "Kenmerk verwijderd" });
      fetchFeatures();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (feature: PropertyFeature) => {
    setEditingFeature(feature);
    setFormData({
      naam: feature.naam,
      aanwezig: feature.aanwezig,
      merk_type: feature.merk_type || "",
      onderhoudsbehoefte: feature.onderhoudsbehoefte,
      onderhoudsstatus: feature.onderhoudsstatus || "",
      gepland_onderhoudsjaar: feature.gepland_onderhoudsjaar?.toString() || "",
      notities: feature.notities || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingFeature(null);
    setFormData({
      naam: "",
      aanwezig: true,
      merk_type: "",
      onderhoudsbehoefte: "geen",
      onderhoudsstatus: "",
      gepland_onderhoudsjaar: "",
      notities: "",
    });
  };

  const featuresNeedingMaintenance = features.filter(f => f.onderhoudsbehoefte !== "geen");
  const currentYear = new Date().getFullYear();

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Wrench className="w-4 h-4" />
            {features.length} kenmerken
          </span>
          {featuresNeedingMaintenance.length > 0 && (
            <Badge variant="warning" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {featuresNeedingMaintenance.length} onderhoud nodig
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Kenmerk
        </Button>
      </div>

      {/* Feature List */}
      {features.length === 0 ? (
        <div className="text-center py-8 border rounded-lg border-dashed">
          <Wrench className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nog geen kenmerken toegevoegd</p>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Eerste kenmerk toevoegen
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          {features.map((feature) => {
            const onderhoudInfo = onderhoudLabels[feature.onderhoudsbehoefte] || onderhoudLabels.geen;
            const OnderhoudIcon = onderhoudInfo.icon;
            const needsAttentionThisYear = feature.gepland_onderhoudsjaar === currentYear;
            
            return (
              <div
                key={feature.id}
                className={`flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
                  needsAttentionThisYear ? "border-warning/50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    feature.aanwezig ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Wrench className={`w-4 h-4 ${feature.aanwezig ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{feature.naam}</p>
                      {!feature.aanwezig && (
                        <Badge variant="secondary" className="text-xs">Niet aanwezig</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {feature.merk_type && <span>{feature.merk_type}</span>}
                      {feature.merk_type && feature.onderhoudsbehoefte !== "geen" && <span>•</span>}
                      {feature.onderhoudsbehoefte !== "geen" && (
                        <span className={`flex items-center gap-1 ${onderhoudInfo.color}`}>
                          <OnderhoudIcon className="w-3 h-3" />
                          {onderhoudInfo.label}
                        </span>
                      )}
                      {feature.gepland_onderhoudsjaar && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {feature.gepland_onderhoudsjaar}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(feature)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(feature)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFeature ? "Kenmerk Bewerken" : "Nieuw Kenmerk"}</DialogTitle>
            <DialogDescription>{propertyName}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="naam">Kenmerk naam *</Label>
              <div className="flex gap-2">
                <Input
                  id="naam"
                  value={formData.naam}
                  onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                  placeholder="bijv. Airconditioning"
                  list="suggested-features"
                  required
                />
              </div>
              <datalist id="suggested-features">
                {SUGGESTED_FEATURES.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="aanwezig">Aanwezig</Label>
              <Switch
                id="aanwezig"
                checked={formData.aanwezig}
                onCheckedChange={(checked) => setFormData({ ...formData, aanwezig: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="merk_type">Merk / Type</Label>
              <Input
                id="merk_type"
                value={formData.merk_type}
                onChange={(e) => setFormData({ ...formData, merk_type: e.target.value })}
                placeholder="bijv. Daikin, Bosch"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Onderhoudsbehoefte</Label>
                <Select
                  value={formData.onderhoudsbehoefte}
                  onValueChange={(v) => setFormData({ ...formData, onderhoudsbehoefte: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geen">Geen</SelectItem>
                    <SelectItem value="licht">Licht</SelectItem>
                    <SelectItem value="groot">Groot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gepland_onderhoudsjaar">Gepland jaar</Label>
                <Input
                  id="gepland_onderhoudsjaar"
                  type="number"
                  min={currentYear}
                  max={currentYear + 30}
                  value={formData.gepland_onderhoudsjaar}
                  onChange={(e) => setFormData({ ...formData, gepland_onderhoudsjaar: e.target.value })}
                  placeholder={currentYear.toString()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onderhoudsstatus">Onderhoudsstatus</Label>
              <Input
                id="onderhoudsstatus"
                value={formData.onderhoudsstatus}
                onChange={(e) => setFormData({ ...formData, onderhoudsstatus: e.target.value })}
                placeholder="bijv. Gepland, Offerte aangevraagd"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notities">Notities</Label>
              <Textarea
                id="notities"
                value={formData.notities}
                onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
                placeholder="Extra informatie..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Annuleren
              </Button>
              <Button type="submit" className="flex-1 gradient-primary">
                {editingFeature ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
