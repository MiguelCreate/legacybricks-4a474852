import { useState, useEffect } from "react";
import { Users, Plus, Search, Phone, Mail, Star, Euro, Calendar, Building2, Layers, ExternalLink, DoorOpen, Send, Shield, Pencil, MoreVertical, Trash2, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Tenant = Tables<"tenants">;
type Property = Tables<"properties">;
type Room = Tables<"rooms">;

const Huurders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"actief" | "gearchiveerd" | "alle">("actief");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<Partial<TablesInsert<"tenants">> & { unit_nummer?: number; borg?: number }>({
    naam: "",
    email: "",
    telefoon: "",
    huurbedrag: 0,
    betaaldag: 1,
    property_id: "",
    notities: "",
    beoordeling_betrouwbaarheid: null,
    unit_nummer: 1,
    borg: 0,
    actief: true,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [tenantsRes, propertiesRes, roomsRes] = await Promise.all([
        supabase.from("tenants").select("*").order("created_at", { ascending: false }),
        supabase.from("properties").select("*").eq("gearchiveerd", false),
        supabase.from("rooms").select("*"),
      ]);

      if (tenantsRes.error) throw tenantsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (roomsRes.error) throw roomsRes.error;

      setTenants(tenantsRes.data || []);
      setProperties(propertiesRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Fout",
        description: "Kon gegevens niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.property_id) {
      toast({
        title: "Selecteer een pand",
        description: "Kies een pand voor deze huurder",
        variant: "destructive",
      });
      return;
    }

    try {
      const tenantData = {
        property_id: formData.property_id,
        naam: formData.naam || "",
        email: formData.email,
        telefoon: formData.telefoon,
        huurbedrag: formData.huurbedrag || 0,
        betaaldag: formData.betaaldag || 1,
        notities: formData.notities,
        beoordeling_betrouwbaarheid: formData.beoordeling_betrouwbaarheid,
        unit_nummer: formData.unit_nummer || 1,
        borg: formData.borg || 0,
        actief: formData.actief !== false,
      };

      if (editingTenant) {
        const { error } = await supabase
          .from("tenants")
          .update(tenantData as any)
          .eq("id", editingTenant.id);

        if (error) throw error;

        toast({
          title: "Huurder bijgewerkt",
          description: `${formData.naam} is succesvol bijgewerkt.`,
        });
      } else {
        const { error } = await supabase.from("tenants").insert(tenantData as any);

        if (error) throw error;

        toast({
          title: "Huurder toegevoegd",
          description: `${formData.naam} is succesvol toegevoegd.`,
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

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      naam: tenant.naam,
      email: tenant.email || "",
      telefoon: tenant.telefoon || "",
      huurbedrag: Number(tenant.huurbedrag),
      betaaldag: tenant.betaaldag,
      property_id: tenant.property_id,
      notities: tenant.notities || "",
      beoordeling_betrouwbaarheid: tenant.beoordeling_betrouwbaarheid,
      unit_nummer: tenant.unit_nummer,
      borg: Number((tenant as any).borg) || 0,
      actief: tenant.actief,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (tenant: Tenant) => {
    if (!confirm(`Weet je zeker dat je "${tenant.naam}" wilt verwijderen?`)) return;

    try {
      const { error } = await supabase.from("tenants").delete().eq("id", tenant.id);
      if (error) throw error;
      toast({ title: "Huurder verwijderd" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleArchive = async (tenant: Tenant) => {
    if (!confirm(`Weet je zeker dat je "${tenant.naam}" wilt archiveren?`)) return;

    try {
      const { error } = await supabase
        .from("tenants")
        .update({ actief: false })
        .eq("id", tenant.id);
      if (error) throw error;
      toast({ title: "Huurder gearchiveerd", description: `${tenant.naam} is nu inactief.` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingTenant(null);
    setFormData({
      naam: "",
      email: "",
      telefoon: "",
      huurbedrag: 0,
      betaaldag: 1,
      property_id: "",
      notities: "",
      beoordeling_betrouwbaarheid: null,
      unit_nummer: 1,
      borg: 0,
      actief: true,
    });
  };

  const getPropertyName = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId)?.naam || "Onbekend";
  };

  const getPropertyUnits = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property?.aantal_units || 1;
  };

  const getPropertyRooms = (propertyId: string) => {
    return rooms.filter((r) => r.property_id === propertyId);
  };

  const getRoomName = (roomId: string | null) => {
    if (!roomId) return null;
    return rooms.find((r) => r.id === roomId)?.naam || null;
  };

  const getProperty = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId);
  };

  const handleEmailTenant = (tenant: Tenant) => {
    if (!tenant.email) {
      toast({
        title: "Geen e-mailadres",
        description: "Deze huurder heeft geen e-mailadres opgegeven.",
        variant: "destructive",
      });
      return;
    }
    const property = getProperty(tenant.property_id);
    const subject = encodeURIComponent(`Betreft: ${property?.naam || 'Uw woning'}`);
    window.open(`mailto:${tenant.email}?subject=${subject}`, '_blank');
  };

  const selectedPropertyUnits = formData.property_id ? getPropertyUnits(formData.property_id) : 1;

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = tenant.naam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "alle" 
      ? true 
      : statusFilter === "actief" 
        ? tenant.actief 
        : !tenant.actief;
    return matchesSearch && matchesStatus;
  });

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? "text-warning fill-warning"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
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
                  Huurders
                </h1>
                <InfoTooltip
                  title="Huurderbeheer"
                  content="Beheer hier al je huurders. Registreer betalingen, houd beoordelingen bij, en zie in één oogopslag wie waar woont."
                />
              </div>
              <p className="text-muted-foreground mt-1">
                {tenants.filter((t) => t.actief).length} actieve huurders
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="gradient-primary text-primary-foreground gap-2"
            >
              <Plus className="w-4 h-4" />
              Nieuwe Huurder
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op naam of e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "actief" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("actief")}
              >
                Actief ({tenants.filter(t => t.actief).length})
              </Button>
              <Button
                variant={statusFilter === "gearchiveerd" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("gearchiveerd")}
              >
                Gearchiveerd ({tenants.filter(t => !t.actief).length})
              </Button>
              <Button
                variant={statusFilter === "alle" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("alle")}
              >
                Alle ({tenants.length})
              </Button>
            </div>
          </div>
        </header>

        {/* Tenants List */}
        <div className="px-4 md:px-6 lg:px-8 pb-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />
              ))}
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "Geen huurders gevonden" : "Nog geen huurders"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Probeer andere zoektermen"
                  : "Voeg je eerste huurder toe"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="gradient-primary text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Eerste huurder toevoegen
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredTenants.map((tenant, index) => {
                const property = getProperty(tenant.property_id);
                const roomName = getRoomName(tenant.room_id);
                const propertyRooms = getPropertyRooms(tenant.property_id);

                return (
                <div
                  key={tenant.id}
                  className="p-4 sm:p-5 bg-card rounded-xl border shadow-card hover:shadow-glow transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                        <Users className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {tenant.naam}
                        </h3>
                        {renderStars(tenant.beoordeling_betrouwbaarheid)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={tenant.actief ? "success" : "secondary"}>
                        {tenant.actief ? "Actief" : "Inactief"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-lg hover:bg-accent">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Bewerken
                          </DropdownMenuItem>
                          {tenant.actief && (
                            <DropdownMenuItem onClick={() => handleArchive(tenant)}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archiveren
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(tenant)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {/* Property link */}
                    <button
                      onClick={() => navigate('/panden')}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group w-full text-left"
                    >
                      <Building2 className="w-4 h-4" />
                      <span className="flex-1 truncate">
                        {getPropertyName(tenant.property_id)}
                      </span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    
                    {/* Room info */}
                    {roomName && (
                      <div className="flex items-center gap-2 text-muted-foreground pl-6">
                        <DoorOpen className="w-3 h-3" />
                        <span>{roomName}</span>
                      </div>
                    )}
                    
                    {/* Unit info for multi-unit properties without rooms */}
                    {!roomName && getPropertyUnits(tenant.property_id) > 1 && (
                      <div className="flex items-center gap-2 text-muted-foreground pl-6">
                        <Layers className="w-3 h-3" />
                        <span>Unit {tenant.unit_nummer || 1}</span>
                      </div>
                    )}
                    
                    {tenant.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{tenant.email}</span>
                      </div>
                    )}
                    {tenant.telefoon && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{tenant.telefoon}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-success" />
                        <span className="font-semibold text-foreground">
                          €{Number(tenant.huurbedrag).toLocaleString()}/mnd
                        </span>
                      </div>
                      {(tenant as any).borg > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Shield className="w-3 h-3" />
                          <span>Borg: €{Number((tenant as any).borg).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Calendar className="w-3 h-3" />
                        <span>Dag {tenant.betaaldag}</span>
                      </div>
                      {tenant.email && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-primary"
                          onClick={() => handleEmailTenant(tenant)}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Mail
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Tenant Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTenant ? "Huurder Bewerken" : "Nieuwe Huurder Toevoegen"}</DialogTitle>
            <DialogDescription>
              {editingTenant ? "Pas de gegevens van deze huurder aan" : "Registreer een nieuwe huurder voor een van je panden"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="property_id">Pand *</Label>
              <Select
                value={formData.property_id}
                onValueChange={(value) => setFormData({ ...formData, property_id: value, unit_nummer: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een pand" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.naam} - {property.locatie}
                      {property.aantal_units > 1 && ` (${property.aantal_units} units)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room selection for kamerverhuur */}
            {formData.property_id && getPropertyRooms(formData.property_id).length > 0 && (
              <div className="space-y-2">
                <Label>
                  Kamer
                  <InfoTooltip
                    title="Kamerselectie"
                    content="Selecteer de specifieke kamer binnen dit pand waar deze huurder woont."
                  />
                </Label>
                <Select
                  value={(formData as any).room_id || ""}
                  onValueChange={(value) => setFormData({ ...formData, room_id: value || null } as any)}
                >
                  <SelectTrigger>
                    <DoorOpen className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Selecteer kamer (optioneel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Geen specifieke kamer</SelectItem>
                    {getPropertyRooms(formData.property_id).map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.naam} {room.oppervlakte_m2 ? `(${room.oppervlakte_m2}m²)` : ''} - €{room.huurprijs}/mnd
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Unit selection for multi-unit properties without rooms */}
            {selectedPropertyUnits > 1 && formData.property_id && getPropertyRooms(formData.property_id).length === 0 && (
              <div className="space-y-2">
                <Label htmlFor="unit_nummer">
                  Unit Nummer *
                  <InfoTooltip
                    title="Unit Nummer"
                    content="Selecteer de specifieke unit binnen dit pand waar deze huurder woont."
                  />
                </Label>
                <Select
                  value={formData.unit_nummer?.toString() || "1"}
                  onValueChange={(value) => setFormData({ ...formData, unit_nummer: Number(value) })}
                >
                  <SelectTrigger>
                    <Layers className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Selecteer unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: selectedPropertyUnits }, (_, i) => i + 1).map((unitNum) => (
                      <SelectItem key={unitNum} value={unitNum.toString()}>
                        Unit {unitNum}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="naam">Naam *</Label>
              <Input
                id="naam"
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                placeholder="Volledige naam"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@voorbeeld.nl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefoon">Telefoon</Label>
                <Input
                  id="telefoon"
                  type="tel"
                  value={formData.telefoon || ""}
                  onChange={(e) => setFormData({ ...formData, telefoon: e.target.value })}
                  placeholder="+351 123 456 789"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="huurbedrag">
                  Huurbedrag (€/mnd) *
                  <InfoTooltip
                    title="Huurbedrag"
                    content="Het maandelijkse huurbedrag. Dit wordt gebruikt voor cashflow-berekeningen."
                  />
                </Label>
                <Input
                  id="huurbedrag"
                  type="number"
                  min="0"
                  value={formData.huurbedrag || ""}
                  onChange={(e) => setFormData({ ...formData, huurbedrag: Number(e.target.value) })}
                  placeholder="850"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="borg">
                  Borg (€)
                  <InfoTooltip
                    title="Borg / Waarborgsom"
                    content="Het bedrag dat de huurder als borg heeft betaald. Dit wordt meestal terugbetaald bij vertrek."
                  />
                </Label>
                <Input
                  id="borg"
                  type="number"
                  min="0"
                  value={formData.borg || ""}
                  onChange={(e) => setFormData({ ...formData, borg: Number(e.target.value) })}
                  placeholder="1700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="betaaldag">
                Betaaldag *
                <InfoTooltip
                  title="Betaaldag"
                  content="De dag van de maand waarop de huur betaald moet worden. Maximum 28 om problemen met korte maanden te voorkomen."
                />
              </Label>
              <Input
                id="betaaldag"
                type="number"
                min="1"
                max="28"
                value={formData.betaaldag || ""}
                onChange={(e) => setFormData({ ...formData, betaaldag: Number(e.target.value) })}
                placeholder="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beoordeling">
                Betrouwbaarheidsscore
                <InfoTooltip
                  title="Betrouwbaarheidsscore"
                  content="Je persoonlijke beoordeling van deze huurder. Dit is privé en alleen voor jou zichtbaar."
                />
              </Label>
              <Select
                value={formData.beoordeling_betrouwbaarheid?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    beoordeling_betrouwbaarheid: value === "none" ? null : Number(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nog niet beoordeeld</SelectItem>
                  <SelectItem value="1">⭐ 1 - Problematisch</SelectItem>
                  <SelectItem value="2">⭐⭐ 2 - Matig</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3 - Voldoende</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4 - Goed</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Uitstekend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notities">Notities</Label>
              <Textarea
                id="notities"
                value={formData.notities || ""}
                onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
                placeholder="Privé notities over deze huurder..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button type="submit" className="flex-1 gradient-primary text-primary-foreground">
                Toevoegen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Huurders;
