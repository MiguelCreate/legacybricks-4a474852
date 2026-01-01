import { useState, useEffect } from "react";
import { DoorOpen, Plus, Pencil, Trash2, User, Euro, Ruler, Wrench, ChevronDown, ChevronUp, Home, Receipt } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  recibo_verde: boolean;
}

interface Tenant {
  id: string;
  naam: string;
  huurbedrag: number;
  room_id: string | null;
  unit_nummer: number;
  unit_naam: string | null;
  betaaldag: number;
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
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingUnit, setEditingUnit] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    naam: "",
    oppervlakte_m2: "",
    huurprijs: "",
    actieve_huurder_id: "",
    recibo_verde: false,
  });
  const [unitFormData, setUnitFormData] = useState({
    naam: "",
    unit_naam: "",
    huurbedrag: "",
    unit_nummer: "",
    betaaldag: "1",
  });

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    try {
      // Fetch rooms with their linked tenant info via actieve_huurder_id
      const [roomsRes, tenantsRes] = await Promise.all([
        supabase
          .from("rooms")
          .select("*")
          .eq("property_id", propertyId)
          .order("naam"),
        supabase
          .from("tenants")
          .select("id, naam, huurbedrag, room_id, unit_nummer, unit_naam, betaaldag")
          .eq("property_id", propertyId)
          .eq("actief", true),
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
        recibo_verde: formData.recibo_verde,
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
      recibo_verde: room.recibo_verde || false,
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
      recibo_verde: false,
    });
  };

  const resetUnitForm = () => {
    setEditingUnit(null);
    setUnitFormData({
      naam: "",
      unit_naam: "",
      huurbedrag: "",
      unit_nummer: "",
      betaaldag: "1",
    });
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const unitData = {
        property_id: propertyId,
        naam: unitFormData.naam,
        unit_naam: unitFormData.unit_naam || null,
        huurbedrag: parseFloat(unitFormData.huurbedrag) || 0,
        unit_nummer: parseInt(unitFormData.unit_nummer) || 1,
        betaaldag: parseInt(unitFormData.betaaldag) || 1,
        actief: true,
        room_id: null,
      };

      if (editingUnit) {
        const { error } = await supabase
          .from("tenants")
          .update(unitData)
          .eq("id", editingUnit.id);
        if (error) throw error;
        toast({ title: "Unit bijgewerkt" });
      } else {
        const { error } = await supabase.from("tenants").insert(unitData);
        if (error) throw error;
        toast({ title: "Unit toegevoegd" });
      }

      setIsUnitDialogOpen(false);
      resetUnitForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleEditUnit = (tenant: Tenant) => {
    setEditingUnit(tenant);
    setUnitFormData({
      naam: tenant.naam,
      unit_naam: tenant.unit_naam || "",
      huurbedrag: tenant.huurbedrag.toString(),
      unit_nummer: tenant.unit_nummer.toString(),
      betaaldag: tenant.betaaldag.toString(),
    });
    setIsUnitDialogOpen(true);
  };

  const handleDeleteUnit = async (tenant: Tenant) => {
    if (!confirm(`Weet je zeker dat je "${tenant.naam}" wilt verwijderen?`)) return;

    try {
      const { error } = await supabase.from("tenants").delete().eq("id", tenant.id);
      if (error) throw error;
      toast({ title: "Unit verwijderd" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const getTenantName = (room: Room) => {
    // Check actieve_huurder_id on room first
    if (room.actieve_huurder_id) {
      const tenant = tenants.find((t) => t.id === room.actieve_huurder_id);
      return tenant?.naam || null;
    }
    // Also check if any tenant has this room_id
    const tenantByRoom = tenants.find((t) => t.room_id === room.id);
    return tenantByRoom?.naam || null;
  };
  
  const isRoomOccupied = (room: Room) => {
    return room.actieve_huurder_id || tenants.some((t) => t.room_id === room.id);
  };

  // Huurders zonder kamer (standalone units)
  const standaloneUnits = tenants.filter((t) => !t.room_id && !rooms.some((r) => r.actieve_huurder_id === t.id));

  const totalM2 = rooms.reduce((sum, r) => sum + (r.oppervlakte_m2 || 0), 0);
  const totalRent = rooms.reduce((sum, r) => sum + r.huurprijs, 0) + standaloneUnits.reduce((sum, t) => sum + Number(t.huurbedrag), 0);
  const occupiedRooms = rooms.filter((r) => isRoomOccupied(r)).length;
  const totalUnits = rooms.length + standaloneUnits.length;
  const totalOccupied = occupiedRooms + standaloneUnits.length;

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="flex items-center gap-1 text-muted-foreground">
            <DoorOpen className="w-4 h-4" />
            {rooms.length} {rooms.length === 1 ? "kamer" : "kamers"}
          </span>
          {standaloneUnits.length > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <User className="w-4 h-4" />
              {standaloneUnits.length} {standaloneUnits.length === 1 ? "unit" : "units"}
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <Ruler className="w-4 h-4" />
            {totalM2} m²
          </span>
          <span className="flex items-center gap-1 text-success">
            <Euro className="w-4 h-4" />
            €{totalRent.toLocaleString()}/mnd
          </span>
          <Badge variant={totalOccupied === totalUnits && totalUnits > 0 ? "success" : "secondary"}>
            {totalOccupied}/{totalUnits} verhuurd
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Toevoegen
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <DoorOpen className="w-4 h-4 mr-2" />
              Kamer toevoegen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { resetUnitForm(); setIsUnitDialogOpen(true); }}>
              <Home className="w-4 h-4 mr-2" />
              Unit toevoegen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            const tenantName = getTenantName(room);
            const occupied = isRoomOccupied(room);
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
                      {room.recibo_verde && (
                        <Badge variant="outline" className="gap-1 text-success border-success/30 bg-success/10">
                          <Receipt className="w-3 h-3" />
                          RV
                        </Badge>
                      )}
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

      {/* Standalone Units (huurders zonder kamer) */}
      {standaloneUnits.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Home className="w-4 h-4" />
            Units (niet aan kamer gekoppeld)
          </h3>
          <div className="grid gap-2">
            {standaloneUnits.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <Home className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tenant.unit_naam || `Unit ${tenant.unit_nummer}`}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tenant.naam}</span>
                      <span>•</span>
                      <span className="text-success">€{Number(tenant.huurbedrag).toLocaleString()}/mnd</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="gap-1">
                    <User className="w-3 h-3" />
                    Actief
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => handleEditUnit(tenant)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDeleteUnit(tenant)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Room Dialog */}
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

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-success" />
                <div>
                  <Label htmlFor="recibo_verde" className="cursor-pointer">Recibo Verde</Label>
                  <p className="text-xs text-muted-foreground">Geef je een groene kwitantie uit voor deze kamer?</p>
                </div>
              </div>
              <input
                type="checkbox"
                id="recibo_verde"
                checked={formData.recibo_verde}
                onChange={(e) => setFormData({ ...formData, recibo_verde: e.target.checked })}
                className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary"
              />
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

      {/* Add/Edit Unit Dialog */}
      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingUnit ? "Unit Bewerken" : "Nieuwe Unit"}</DialogTitle>
            <DialogDescription>{propertyName}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUnitSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="unit_naam_field">Unit naam *</Label>
              <Input
                id="unit_naam_field"
                value={unitFormData.unit_naam}
                onChange={(e) => setUnitFormData({ ...unitFormData, unit_naam: e.target.value })}
                placeholder="bijv. Appartement 1A, Studio West"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="huurder_naam">Naam huurder *</Label>
              <Input
                id="huurder_naam"
                value={unitFormData.naam}
                onChange={(e) => setUnitFormData({ ...unitFormData, naam: e.target.value })}
                placeholder="bijv. Jan Jansen"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_nummer">Unit nummer</Label>
                <Input
                  id="unit_nummer"
                  type="number"
                  value={unitFormData.unit_nummer}
                  onChange={(e) => setUnitFormData({ ...unitFormData, unit_nummer: e.target.value })}
                  placeholder="bijv. 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_huur">Huurprijs (€) *</Label>
                <Input
                  id="unit_huur"
                  type="number"
                  value={unitFormData.huurbedrag}
                  onChange={(e) => setUnitFormData({ ...unitFormData, huurbedrag: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="betaaldag">Betaaldag (dag van de maand)</Label>
              <Input
                id="betaaldag"
                type="number"
                min="1"
                max="31"
                value={unitFormData.betaaldag}
                onChange={(e) => setUnitFormData({ ...unitFormData, betaaldag: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsUnitDialogOpen(false)} className="flex-1">
                Annuleren
              </Button>
              <Button type="submit" className="flex-1 gradient-primary">
                {editingUnit ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
