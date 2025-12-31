import { useState, useEffect } from "react";
import { Building2, Plus, Search, Filter, MapPin, Euro, Users, MoreVertical, Star, Pencil, Trash2, Archive, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Tenant = Tables<"tenants">;
type PropertyInsert = TablesInsert<"properties">;

const statusConfig = {
  aankoop: { label: "Aankoop", color: "secondary" as const },
  renovatie: { label: "Renovatie", color: "warning" as const },
  verhuur: { label: "Verhuurd", color: "success" as const },
  te_koop: { label: "Te Koop", color: "destructive" as const },
};

const energyLabels = ["A_plus", "A", "B", "C", "D", "E", "F"] as const;

const getHealthColor = (score: number | null) => {
  if (!score) return "text-muted-foreground bg-muted";
  if (score >= 8) return "text-success bg-success/10";
  if (score >= 5) return "text-warning bg-warning/10";
  return "text-destructive bg-destructive/10";
};

const Panden = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<Partial<PropertyInsert>>({
    naam: "",
    locatie: "",
    status: "aankoop",
    aankoopprijs: 0,
    oppervlakte_m2: null,
    energielabel: null,
    waardering: null,
    waarom_gekocht: "",
    google_drive_link: "",
  });

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchTenants();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("gearchiveerd", false)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Fout",
        description: "Kon panden niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("actief", true);

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      if (editingProperty) {
        const { error } = await supabase
          .from("properties")
          .update({
            naam: formData.naam,
            locatie: formData.locatie,
            status: formData.status,
            aankoopprijs: formData.aankoopprijs,
            oppervlakte_m2: formData.oppervlakte_m2,
            energielabel: formData.energielabel,
            waardering: formData.waardering,
            waarom_gekocht: formData.waarom_gekocht,
            google_drive_link: formData.google_drive_link,
          })
          .eq("id", editingProperty.id);

        if (error) throw error;

        toast({
          title: "Pand bijgewerkt",
          description: `${formData.naam} is succesvol bijgewerkt.`,
        });
      } else {
        const { error } = await supabase.from("properties").insert({
          user_id: user.id,
          naam: formData.naam || "",
          locatie: formData.locatie || "",
          status: formData.status || "aankoop",
          aankoopprijs: formData.aankoopprijs || 0,
          oppervlakte_m2: formData.oppervlakte_m2,
          energielabel: formData.energielabel,
          waardering: formData.waardering,
          waarom_gekocht: formData.waarom_gekocht,
          google_drive_link: formData.google_drive_link,
        });

        if (error) throw error;

        toast({
          title: "Pand toegevoegd",
          description: `${formData.naam} is succesvol toegevoegd aan je portefeuille.`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProperties();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Er is iets misgegaan",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      naam: property.naam,
      locatie: property.locatie,
      status: property.status,
      aankoopprijs: Number(property.aankoopprijs),
      oppervlakte_m2: property.oppervlakte_m2 ? Number(property.oppervlakte_m2) : null,
      energielabel: property.energielabel,
      waardering: property.waardering ? Number(property.waardering) : null,
      waarom_gekocht: property.waarom_gekocht || "",
      google_drive_link: property.google_drive_link || "",
    });
    setIsDialogOpen(true);
  };

  const handleTogglePin = async (property: Property) => {
    try {
      const { error } = await supabase
        .from("properties")
        .update({ is_pinned: !property.is_pinned })
        .eq("id", property.id);

      if (error) throw error;

      toast({
        title: property.is_pinned ? "Pin verwijderd" : "Pand gepind",
        description: property.is_pinned
          ? `${property.naam} is niet meer vastgepind.`
          : `${property.naam} wordt nu bovenaan getoond.`,
      });

      fetchProperties();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (property: Property) => {
    try {
      const { error } = await supabase
        .from("properties")
        .update({ gearchiveerd: true })
        .eq("id", property.id);

      if (error) throw error;

      toast({
        title: "Pand gearchiveerd",
        description: `${property.naam} is gearchiveerd.`,
      });

      fetchProperties();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (property: Property) => {
    if (!confirm(`Weet je zeker dat je "${property.naam}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", property.id);

      if (error) throw error;

      toast({
        title: "Pand verwijderd",
        description: `${property.naam} is permanent verwijderd.`,
      });

      fetchProperties();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingProperty(null);
    setFormData({
      naam: "",
      locatie: "",
      status: "aankoop",
      aankoopprijs: 0,
      oppervlakte_m2: null,
      energielabel: null,
      waardering: null,
      waarom_gekocht: "",
      google_drive_link: "",
    });
  };

  const getTenantForProperty = (propertyId: string) => {
    return tenants.find((t) => t.property_id === propertyId);
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.naam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.locatie.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Mijn Panden
                </h1>
                <InfoTooltip
                  title="Pandenbeheer"
                  content="Hier beheer je al je vastgoed. Voeg nieuwe panden toe, bewerk gegevens, en houd de status bij."
                />
              </div>
              <p className="text-muted-foreground mt-1">
                {properties.length} {properties.length === 1 ? "pand" : "panden"} in je portefeuille
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
              Nieuw Pand
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op naam of locatie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter op status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="aankoop">Aankoop</SelectItem>
                <SelectItem value="renovatie">Renovatie</SelectItem>
                <SelectItem value="verhuur">Verhuurd</SelectItem>
                <SelectItem value="te_koop">Te Koop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Properties Grid */}
        <div className="px-4 md:px-6 lg:px-8 pb-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-card rounded-xl border animate-pulse"
                />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || statusFilter !== "all"
                  ? "Geen panden gevonden"
                  : "Nog geen panden"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Probeer andere zoektermen of filters"
                  : "Voeg je eerste pand toe om te beginnen"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="gradient-primary text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Eerste pand toevoegen
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map((property, index) => {
                const tenant = getTenantForProperty(property.id);
                const statusInfo = statusConfig[property.status];

                return (
                  <div
                    key={property.id}
                    className="group relative p-5 bg-card rounded-xl border shadow-card hover:shadow-glow hover:border-primary/30 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {property.is_pinned && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-glow">
                        <Star className="w-3 h-3 text-primary-foreground fill-current" />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                          <Building2 className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {property.naam}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{property.locatie}</span>
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
                          <DropdownMenuItem onClick={() => handleEdit(property)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Bewerken
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePin(property)}>
                            <Star className="w-4 h-4 mr-2" />
                            {property.is_pinned ? "Pin verwijderen" : "Pinnen"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(property)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archiveren
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(property)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Badge
                        variant={statusInfo.color === "success" ? "success" : statusInfo.color === "warning" ? "warning" : "secondary"}
                      >
                        {statusInfo.label}
                      </Badge>
                      <div
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${getHealthColor(property.gezondheidsscore)}`}
                      >
                        Score: {property.gezondheidsscore || "-"}/10
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Aankoopprijs</span>
                        <span className="font-medium text-foreground">
                          €{Number(property.aankoopprijs).toLocaleString()}
                        </span>
                      </div>
                      {property.oppervlakte_m2 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Oppervlakte</span>
                          <span className="font-medium text-foreground">
                            {Number(property.oppervlakte_m2)} m²
                          </span>
                        </div>
                      )}
                      {tenant && (
                        <div className="flex items-center gap-2 pt-2">
                          <Users className="w-4 h-4 text-primary" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Huurder</p>
                            <p className="font-medium text-sm text-foreground">
                              {tenant.naam} • €{Number(tenant.huurbedrag).toLocaleString()}/mnd
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProperty ? "Pand Bewerken" : "Nieuw Pand Toevoegen"}
            </DialogTitle>
            <DialogDescription>
              {editingProperty
                ? "Wijzig de gegevens van je pand"
                : "Voeg een nieuw pand toe aan je portefeuille"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="naam">
                  Naam *
                  <InfoTooltip
                    title="Pandnaam"
                    content="Geef je pand een herkenbare naam, zoals 'Casa Lisboa' of 'Appartement Porto'."
                  />
                </Label>
                <Input
                  id="naam"
                  value={formData.naam}
                  onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                  placeholder="bijv. Casa Lisboa"
                  required
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="locatie">
                  Locatie *
                  <InfoTooltip
                    title="Locatie"
                    content="De stad of regio waar het pand zich bevindt."
                  />
                </Label>
                <Input
                  id="locatie"
                  value={formData.locatie}
                  onChange={(e) => setFormData({ ...formData, locatie: e.target.value })}
                  placeholder="bijv. Lissabon, Portugal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Property["status"]) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aankoop">Aankoop</SelectItem>
                    <SelectItem value="renovatie">Renovatie</SelectItem>
                    <SelectItem value="verhuur">Verhuurd</SelectItem>
                    <SelectItem value="te_koop">Te Koop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="energielabel">Energielabel</Label>
                <Select
                  value={formData.energielabel || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      energielabel: value === "none" ? null : value as Property["energielabel"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Niet bekend</SelectItem>
                    {energyLabels.map((label) => (
                      <SelectItem key={label} value={label}>
                        {label.replace("_plus", "+")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aankoopprijs">
                  Aankoopprijs (€) *
                  <InfoTooltip
                    title="Aankoopprijs"
                    content="De oorspronkelijke aankoopprijs van het pand. Wordt gebruikt voor rendementsberekeningen."
                  />
                </Label>
                <Input
                  id="aankoopprijs"
                  type="number"
                  min="0"
                  value={formData.aankoopprijs || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, aankoopprijs: Number(e.target.value) })
                  }
                  placeholder="150000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waardering">Huidige Waarde (€)</Label>
                <Input
                  id="waardering"
                  type="number"
                  min="0"
                  value={formData.waardering || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      waardering: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="175000"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="oppervlakte_m2">Oppervlakte (m²)</Label>
                <Input
                  id="oppervlakte_m2"
                  type="number"
                  min="0"
                  value={formData.oppervlakte_m2 || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      oppervlakte_m2: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="85"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="google_drive_link">Google Drive Link</Label>
                <Input
                  id="google_drive_link"
                  type="url"
                  value={formData.google_drive_link || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, google_drive_link: e.target.value })
                  }
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="waarom_gekocht">
                  Waarom heb je dit pand gekocht?
                  <InfoTooltip
                    title="Legacy Notitie"
                    content="Leg vast waarom je dit pand hebt gekocht. Handig voor jezelf en voor toekomstige overdracht aan familie."
                  />
                </Label>
                <Textarea
                  id="waarom_gekocht"
                  value={formData.waarom_gekocht || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, waarom_gekocht: e.target.value })
                  }
                  placeholder="Strategische ligging nabij het centrum, goed huurrendement..."
                  rows={3}
                />
              </div>
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
                {editingProperty ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Panden;
