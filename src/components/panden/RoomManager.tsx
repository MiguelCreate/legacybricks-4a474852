import { useState, useEffect } from "react";
import { DoorOpen, Plus, Pencil, Trash2, User, Euro, Ruler, Wrench, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RoomFeaturesManager } from "./RoomFeaturesManager";

interface Room {
  id: string;
  property_id: string;
  naam: string;
  oppervlakte_m2: number | null;
  huurprijs: number;
  actieve_huurder_id: string | null;
}

interface Tenant {
  id: string;
  naam: string;
  huurbedrag: number;
}

interface RoomManagerProps {
  propertyId: string;
  propertyName: string;
}

export const RoomManager = ({ propertyId, propertyName }: RoomManagerProps) => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    naam: "",
    oppervlakte_m2: "",
    huurprijs: "",
    actieve_huurder_id: "",
  });

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    try {
      const [roomsRes, tenantsRes] = await Promise.all([
        supabase.from("rooms").select("*").eq("property_id", propertyId).order("naam"),
        supabase.from("tenants").select("id, naam, huurbedrag").eq("property_id", propertyId),
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (tenantsRes.error) throw tenantsRes.error;

      setRooms(roomsRes.data || []);
      setTenants(tenantsRes.data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const roomData = {
        property_id: propertyId,
        naam: formData.naam,
        oppervlakte_m2: formData.oppervlakte_m2 ? parseFloat(formData.oppervlakte_m2) : null,
        huurprijs: parseFloat(formData.huurprijs) || 0,
        actieve_huurder_id: formData.actieve_huurder_id || null,
      };

      if (editingRoom) {
        const { error } = await supabase
          .from("rooms")
          .update(roomData)
          .eq("id", editingRoom.id);
        if (error) throw error;
        toast({ title: "Kamer bijgewerkt" });
      } else {
        const { error } = await supabase.from("rooms").insert(roomData);
        if (error) throw error;
        toast({ title: "Kamer toegevoegd" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`Weet je zeker dat je "${room.naam}" wilt verwijderen?`)) return;

    try {
      const { error } = await supabase.from("rooms").delete().eq("id", room.id);
      if (error) throw error;
      toast({ title: "Kamer verwijderd" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      naam: room.naam,
      oppervlakte_m2: room.oppervlakte_m2?.toString() || "",
      huurprijs: room.huurprijs.toString(),
      actieve_huurder_id: room.actieve_huurder_id || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRoom(null);
    setFormData({
      naam: "",
      oppervlakte_m2: "",
      huurprijs: "",
      actieve_huurder_id: "",
    });
  };

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return null;
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant?.naam || null;
  };

  const totalM2 = rooms.reduce((sum, r) => sum + (r.oppervlakte_m2 || 0), 0);
  const totalRent = rooms.reduce((sum, r) => sum + r.huurprijs, 0);
  const occupiedRooms = rooms.filter((r) => r.actieve_huurder_id).length;

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <DoorOpen className="w-4 h-4" />
            {rooms.length} {rooms.length === 1 ? "kamer" : "kamers"}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Ruler className="w-4 h-4" />
            {totalM2} m²
          </span>
          <span className="flex items-center gap-1 text-success">
            <Euro className="w-4 h-4" />
            €{totalRent.toLocaleString()}/mnd
          </span>
          <Badge variant={occupiedRooms === rooms.length && rooms.length > 0 ? "success" : "secondary"}>
            {occupiedRooms}/{rooms.length} verhuurd
          </Badge>
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
          Kamer
        </Button>
      </div>

      {/* Room List */}
      {rooms.length === 0 ? (
        <div className="text-center py-8 border rounded-lg border-dashed">
          <DoorOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nog geen kamers toegevoegd</p>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Eerste kamer toevoegen
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          {rooms.map((room) => {
            const tenantName = getTenantName(room.actieve_huurder_id);
            const [isOpen, setIsOpen] = useState(false);
            
            return (
              <Collapsible key={room.id} open={isOpen} onOpenChange={setIsOpen}>
                <div className="rounded-lg border bg-card">
                  <div className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DoorOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{room.naam}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {room.oppervlakte_m2 && <span>{room.oppervlakte_m2} m²</span>}
                          <span>•</span>
                          <span className="text-success">€{room.huurprijs}/mnd</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {tenantName ? (
                        <Badge variant="success" className="gap-1">
                          <User className="w-3 h-3" />
                          {tenantName}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Leeg
                        </Badge>
                      )}
                      <CollapsibleTrigger asChild>
                        <Button size="icon" variant="ghost">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(room)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(room)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-1 border-t">
                      <RoomFeaturesManager roomId={room.id} roomName={room.naam} />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Kamer Bewerken" : "Nieuwe Kamer"}</DialogTitle>
            <DialogDescription>{propertyName}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="naam">Kamernaam / nummer *</Label>
              <Input
                id="naam"
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                placeholder="bijv. Kamer 1, Suite A"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="m2">Oppervlakte (m²)</Label>
                <Input
                  id="m2"
                  type="number"
                  step="0.1"
                  value={formData.oppervlakte_m2}
                  onChange={(e) => setFormData({ ...formData, oppervlakte_m2: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="huurprijs">Huurprijs (€) *</Label>
                <Input
                  id="huurprijs"
                  type="number"
                  value={formData.huurprijs}
                  onChange={(e) => setFormData({ ...formData, huurprijs: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Actieve huurder</Label>
              <Select
                value={formData.actieve_huurder_id}
                onValueChange={(v) => setFormData({ ...formData, actieve_huurder_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer huurder (optioneel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geen huurder</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.naam}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Annuleren
              </Button>
              <Button type="submit" className="flex-1 gradient-primary">
                {editingRoom ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
