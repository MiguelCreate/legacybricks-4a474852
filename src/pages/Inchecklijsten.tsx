import { useState, useEffect, useRef } from "react";
import { ClipboardCheck, Plus, Search, Building2, Camera, Check, Trash2, MoreVertical, Pencil } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type Checklist = Tables<"checklists">;
type Property = Tables<"properties">;

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const defaultIncheckItems: ChecklistItem[] = [
  { id: "1", label: "Sleutels overhandigd", checked: false },
  { id: "2", label: "Meterstanden genoteerd (water, gas, elektra)", checked: false },
  { id: "3", label: "Huurcontract ondertekend", checked: false },
  { id: "4", label: "Borgsom ontvangen", checked: false },
  { id: "5", label: "Huisregels doorgenomen", checked: false },
  { id: "6", label: "Noodcontactnummers gedeeld", checked: false },
  { id: "7", label: "Staat van de woning gefotografeerd", checked: false },
  { id: "8", label: "Inventarislijst ondertekend", checked: false },
];

const defaultRetourItems: ChecklistItem[] = [
  { id: "1", label: "Sleutels terugontvangen", checked: false },
  { id: "2", label: "Eindmeterstanden genoteerd", checked: false },
  { id: "3", label: "Eindcontrole woning uitgevoerd", checked: false },
  { id: "4", label: "Schade geïnspecteerd", checked: false },
  { id: "5", label: "Schoonmaak gecontroleerd", checked: false },
  { id: "6", label: "Borg teruggestort of verrekend", checked: false },
  { id: "7", label: "Foto's eindstaat gemaakt", checked: false },
  { id: "8", label: "Contract beëindigd", checked: false },
];

const Inchecklijsten = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [formData, setFormData] = useState({
    property_id: "",
    huurder_naam: "",
    type: "incheck" as Checklist["type"],
    datum: new Date().toISOString().split("T")[0],
    items: defaultIncheckItems,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [checklistsRes, propertiesRes] = await Promise.all([
        supabase.from("checklists").select("*").order("datum", { ascending: false }),
        supabase.from("properties").select("*").eq("gearchiveerd", false),
      ]);

      if (checklistsRes.error) throw checklistsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;

      setChecklists(checklistsRes.data || []);
      setProperties(propertiesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Fout",
        description: "Kon inchecklijsten niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("checklist-files")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("checklist-files")
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let photoUrl = null;
      let signatureUrl = null;

      // Upload photo if selected
      if (photoFile) {
        const photoPath = `${user.id}/${Date.now()}_photo.jpg`;
        photoUrl = await uploadFile(photoFile, photoPath);
      }

      // Upload signature if drawn
      if (signatureData) {
        const signatureBlob = await fetch(signatureData).then(r => r.blob());
        const signaturePath = `${user.id}/${Date.now()}_signature.png`;
        const signatureFile = new File([signatureBlob], "signature.png", { type: "image/png" });
        signatureUrl = await uploadFile(signatureFile, signaturePath);
      }

      const checklistData = {
        property_id: formData.property_id,
        huurder_naam: formData.huurder_naam,
        type: formData.type,
        datum: formData.datum,
        items: JSON.parse(JSON.stringify(formData.items)),
        voltooid: formData.items.every(item => item.checked),
        foto_link: photoUrl,
        handtekening: signatureUrl,
      };

      if (editingChecklist) {
        const { error } = await supabase
          .from("checklists")
          .update(checklistData)
          .eq("id", editingChecklist.id);

        if (error) throw error;

        toast({
          title: "Checklist bijgewerkt",
          description: "De checklist is succesvol opgeslagen.",
        });
      } else {
        const { error } = await supabase.from("checklists").insert(checklistData);

        if (error) throw error;

        toast({
          title: "Checklist aangemaakt",
          description: "De inchecklijst is succesvol aangemaakt.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Er is iets misgegaan",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (checklist: Checklist) => {
    setEditingChecklist(checklist);
    setFormData({
      property_id: checklist.property_id,
      huurder_naam: checklist.huurder_naam,
      type: checklist.type,
      datum: checklist.datum,
      items: (checklist.items as unknown as ChecklistItem[]) || 
        (checklist.type === "incheck" ? defaultIncheckItems : defaultRetourItems),
    });
    setPhotoPreview(checklist.foto_link);
    setSignatureData(checklist.handtekening);
    setIsDialogOpen(true);
  };

  const handleDelete = async (checklist: Checklist) => {
    if (!confirm("Weet je zeker dat je deze checklist wilt verwijderen?")) return;

    try {
      const { error } = await supabase.from("checklists").delete().eq("id", checklist.id);
      if (error) throw error;

      toast({
        title: "Checklist verwijderd",
        description: "De checklist is succesvol verwijderd.",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingChecklist(null);
    setFormData({
      property_id: "",
      huurder_naam: "",
      type: "incheck",
      datum: new Date().toISOString().split("T")[0],
      items: defaultIncheckItems,
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setSignatureData(null);
    clearCanvas();
  };

  const handleTypeChange = (type: Checklist["type"]) => {
    setFormData({
      ...formData,
      type,
      items: type === "incheck" ? defaultIncheckItems : defaultRetourItems,
    });
  };

  const toggleItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
      }
    }
    setSignatureData(null);
  };

  useEffect(() => {
    if (isDialogOpen && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
      }
    }
  }, [isDialogOpen]);

  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.naam || "Onbekend";
  };

  const filteredChecklists = checklists.filter(checklist => {
    const propertyName = getPropertyName(checklist.property_id).toLowerCase();
    const tenantName = checklist.huurder_naam.toLowerCase();
    return propertyName.includes(searchQuery.toLowerCase()) || 
           tenantName.includes(searchQuery.toLowerCase());
  });

  const completedCount = (items: unknown): number => {
    if (!Array.isArray(items)) return 0;
    return (items as ChecklistItem[]).filter(i => i.checked).length;
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Inchecklijsten
                </h1>
                <InfoTooltip
                  title="Inchecklijsten"
                  content="Maak incheck- en retourchecklist voor huurders. Voeg foto's toe van de woningsstaat en laat de huurder digitaal tekenen."
                />
              </div>
              <p className="text-muted-foreground mt-1">
                {checklists.length} {checklists.length === 1 ? "checklist" : "checklists"} totaal
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="gradient-primary text-primary-foreground gap-2"
            >
              <Plus className="w-4 h-4" />
              Nieuwe Checklist
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op pand of huurder..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </header>

        {/* Checklists Grid */}
        <div className="px-4 md:px-6 lg:px-8 pb-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />
              ))}
            </div>
          ) : filteredChecklists.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardCheck className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "Geen checklists gevonden" : "Nog geen checklists"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "Probeer andere zoektermen" : "Maak je eerste inchecklijst"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="gradient-primary text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Eerste checklist maken
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChecklists.map((checklist, index) => {
                const itemsArray = checklist.items as unknown as ChecklistItem[];
                const completed = completedCount(itemsArray);
                const total = Array.isArray(itemsArray) ? itemsArray.length : 0;

                return (
                  <div
                    key={checklist.id}
                    className="p-5 bg-card rounded-xl border shadow-card hover:shadow-glow hover:border-primary/30 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          checklist.voltooid 
                            ? "bg-success/10 text-success" 
                            : "gradient-primary text-primary-foreground"
                        }`}>
                          {checklist.voltooid ? (
                            <Check className="w-6 h-6" />
                          ) : (
                            <ClipboardCheck className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {checklist.huurder_naam}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            <span>{getPropertyName(checklist.property_id)}</span>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-strong">
                          <DropdownMenuItem onClick={() => handleEdit(checklist)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Bewerken
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(checklist)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={checklist.type === "incheck" ? "success" : "secondary"}>
                          {checklist.type === "incheck" ? "Incheck" : "Retour"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(checklist.datum), "d MMMM yyyy", { locale: nl })}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Voortgang</span>
                          <span className="font-medium text-foreground">{completed}/{total}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              checklist.voltooid ? "bg-success" : "bg-primary"
                            }`}
                            style={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {checklist.foto_link && (
                          <Badge variant="secondary" className="gap-1">
                            <Camera className="w-3 h-3" />
                            Foto
                          </Badge>
                        )}
                        {checklist.handtekening && (
                          <Badge variant="secondary" className="gap-1">
                            <Pencil className="w-3 h-3" />
                            Getekend
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingChecklist ? "Checklist Bewerken" : "Nieuwe Checklist"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pand *</Label>
                  <Select
                    value={formData.property_id}
                    onValueChange={value => setFormData({ ...formData, property_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer pand" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.naam}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={formData.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incheck">Incheck</SelectItem>
                      <SelectItem value="retour">Retour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Huurder Naam *</Label>
                  <Input
                    value={formData.huurder_naam}
                    onChange={e => setFormData({ ...formData, huurder_naam: e.target.value })}
                    placeholder="Naam van de huurder"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Datum *</Label>
                  <Input
                    type="date"
                    value={formData.datum}
                    onChange={e => setFormData({ ...formData, datum: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                <Label>Checklist Items</Label>
                <div className="grid gap-2 p-4 bg-accent/30 rounded-xl">
                  {formData.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => toggleItem(item.id)}
                    >
                      <Checkbox checked={item.checked} />
                      <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Foto Woningsstaat
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="flex-1"
                  />
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  )}
                </div>
              </div>

              {/* Signature Canvas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    Handtekening Huurder
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
                    Wissen
                  </Button>
                </div>
                <div className="border rounded-xl overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Laat de huurder hier tekenen met muis of vinger
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-primary-foreground"
                  disabled={!formData.property_id || !formData.huurder_naam}
                >
                  {editingChecklist ? "Opslaan" : "Aanmaken"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Inchecklijsten;
