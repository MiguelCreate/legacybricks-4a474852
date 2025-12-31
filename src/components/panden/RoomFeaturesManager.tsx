import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Wrench, Calendar, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface RoomFeature {
  id: string;
  room_id: string;
  naam: string;
  merk_type: string | null;
  onderhoudsbehoefte: string;
  onderhoudsstatus: string | null;
  gepland_onderhoudsjaar: number | null;
  notities: string | null;
}

interface RoomFeaturesManagerProps {
  roomId: string;
  roomName: string;
}

const SUGGESTED_ROOM_FEATURES = [
  "Airconditioning",
  "Boiler",
  "Ventilatie",
  "Radiator",
  "Vloerverwarming",
  "Elektrische kachel",
  "Rookmelder",
  "CO-melder",
];

const onderhoudLabels: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  geen: { label: "Geen", color: "text-success", icon: CheckCircle },
  licht: { label: "Licht", color: "text-warning", icon: AlertTriangle },
  groot: { label: "Groot", color: "text-destructive", icon: AlertCircle },
};

export const RoomFeaturesManager = ({ roomId, roomName }: RoomFeaturesManagerProps) => {
  const { toast } = useToast();
  const [features, setFeatures] = useState<RoomFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<RoomFeature | null>(null);
  const [formData, setFormData] = useState({
    naam: "",
    merk_type: "",
    onderhoudsbehoefte: "geen",
    onderhoudsstatus: "",
    gepland_onderhoudsjaar: "",
    notities: "",
  });

  useEffect(() => {
    fetchFeatures();
  }, [roomId]);

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from("room_features")
        .select("*")
        .eq("room_id", roomId)
        .order("naam");

      if (error) throw error;
      setFeatures((data as RoomFeature[]) || []);
    } catch (error) {
      console.error("Error fetching room features:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const featureData = {
        room_id: roomId,
        naam: formData.naam,
        merk_type: formData.merk_type || null,
        onderhoudsbehoefte: formData.onderhoudsbehoefte,
        onderhoudsstatus: formData.onderhoudsstatus || null,
        gepland_onderhoudsjaar: formData.gepland_onderhoudsjaar ? parseInt(formData.gepland_onderhoudsjaar) : null,
        notities: formData.notities || null,
      };

      if (editingFeature) {
        const { error } = await supabase
          .from("room_features")
          .update(featureData)
          .eq("id", editingFeature.id);
        if (error) throw error;
        toast({ title: "Kenmerk bijgewerkt" });
      } else {
        const { error } = await supabase.from("room_features").insert(featureData);
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

  const handleDelete = async (feature: RoomFeature) => {
    if (!confirm(`Weet je zeker dat je "${feature.naam}" wilt verwijderen?`)) return;

    try {
      const { error } = await supabase.from("room_features").delete().eq("id", feature.id);
      if (error) throw error;
      toast({ title: "Kenmerk verwijderd" });
      fetchFeatures();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (feature: RoomFeature) => {
    setEditingFeature(feature);
    setFormData({
      naam: feature.naam,
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
      merk_type: "",
      onderhoudsbehoefte: "geen",
      onderhoudsstatus: "",
      gepland_onderhoudsjaar: "",
      notities: "",
    });
  };

  const currentYear = new Date().getFullYear();

  if (loading) {
    return <div className="animate-pulse h-16 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">Kamer installaties</p>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Toevoegen
        </Button>
      </div>

      {/* Feature List */}
      {features.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Geen installaties</p>
      ) : (
        <div className="space-y-1">
          {features.map((feature) => {
            const onderhoudInfo = onderhoudLabels[feature.onderhoudsbehoefte] || onderhoudLabels.geen;
            const OnderhoudIcon = onderhoudInfo.icon;
            
            return (
              <div
                key={feature.id}
                className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/50 text-xs group"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{feature.naam}</span>
                  {feature.merk_type && (
                    <span className="text-muted-foreground">({feature.merk_type})</span>
                  )}
                  {feature.onderhoudsbehoefte !== "geen" && (
                    <Badge variant="outline" className={`text-xs py-0 h-5 ${onderhoudInfo.color}`}>
                      <OnderhoudIcon className="w-2.5 h-2.5 mr-1" />
                      {feature.gepland_onderhoudsjaar || onderhoudInfo.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(feature)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => handleDelete(feature)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingFeature ? "Installatie Bewerken" : "Nieuwe Installatie"}</DialogTitle>
            <DialogDescription>{roomName}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="naam">Naam *</Label>
              <Input
                id="naam"
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                placeholder="bijv. Airconditioning"
                list="suggested-room-features"
                required
              />
              <datalist id="suggested-room-features">
                {SUGGESTED_ROOM_FEATURES.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="merk_type">Merk / Type</Label>
              <Input
                id="merk_type"
                value={formData.merk_type}
                onChange={(e) => setFormData({ ...formData, merk_type: e.target.value })}
                placeholder="bijv. Hyundai, Daikin"
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notities">Notities</Label>
              <Textarea
                id="notities"
                value={formData.notities}
                onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
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
