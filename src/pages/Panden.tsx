import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Plus, Search, Filter, MapPin, Euro, Users, MoreVertical, Star, Pencil, Trash2, Archive, AlertTriangle, Droplets, Flame, Zap, Home, Layers, ExternalLink, Calendar, Clock, DoorOpen, BedDouble, Percent, Sparkles, Map, Wrench, Eye, ArrowLeft, Shield, FileText, Gauge } from "lucide-react";
import { PropertyMap } from "@/components/panden/PropertyMap";
import { RoomManager } from "@/components/panden/RoomManager";
import { PropertyFeaturesManager } from "@/components/panden/PropertyFeaturesManager";
import { MaintenanceOverview } from "@/components/panden/MaintenanceOverview";
import { ComparablePropertiesManager } from "@/components/panden/ComparablePropertiesManager";
import { ExitStrategyAdvisor } from "@/components/panden/ExitStrategyAdvisor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { RisicoKaart } from "@/components/panden/RisicoKaart";
import { PropertyAdviceDialog } from "@/components/panden/PropertyAdviceDialog";
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

const verhuurTypeConfig = {
  langdurig: { label: "Langdurig", icon: Clock, description: "Traditionele huurcontracten (6+ maanden)" },
  korte_termijn: { label: "Short-term", icon: Calendar, description: "Airbnb, Booking.com, vakantieverhuur" },
  kamerverhuur: { label: "Kamerverhuur", icon: DoorOpen, description: "Verhuur per kamer binnen een woning" },
};

const energyLabels = ["A_plus", "A", "B", "C", "D", "E", "F"] as const;

const getHealthColor = (score: number | null) => {
  if (!score) return "text-muted-foreground bg-muted";
  if (score >= 8) return "text-success bg-success/10";
  if (score >= 5) return "text-warning bg-warning/10";
  return "text-destructive bg-destructive/10";
};

const Panden = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [adviceProperty, setAdviceProperty] = useState<Property | null>(null);
  const [isAdviceDialogOpen, setIsAdviceDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PropertyInsert> & { 
    water_maandelijks?: number; 
    gas_maandelijks?: number; 
    elektriciteit_maandelijks?: number; 
    condominium_maandelijks?: number; 
    aantal_units?: number;
    type_verhuur?: string;
    st_gemiddelde_dagprijs?: number;
    st_bezetting_percentage?: number;
    // Nutsbedrijven info
    gas_leverancier?: string;
    gas_contractnummer?: string;
    gas_meternummer?: string;
    water_leverancier?: string;
    water_contractnummer?: string;
    water_meternummer?: string;
    elektriciteit_leverancier?: string;
    elektriciteit_contractnummer?: string;
    elektriciteit_meternummer?: string;
    verzekering_maatschappij?: string;
    verzekering_polisnummer?: string;
    verzekering_dekking?: string;
  }>({
    naam: "",
    locatie: "",
    status: "aankoop",
    aankoopprijs: 0,
    oppervlakte_m2: null,
    energielabel: null,
    waardering: null,
    waarom_gekocht: "",
    google_drive_link: "",
    maandelijkse_huur: 0,
    risico_juridisch: 1,
    risico_markt: 1,
    risico_fiscaal: 1,
    risico_fysiek: 1,
    risico_operationeel: 1,
    water_maandelijks: 0,
    gas_maandelijks: 0,
    elektriciteit_maandelijks: 0,
    condominium_maandelijks: 0,
    aantal_units: undefined,
    type_verhuur: "langdurig",
    st_gemiddelde_dagprijs: 0,
    st_bezetting_percentage: 0,
    // Nutsbedrijven info
    gas_leverancier: "",
    gas_contractnummer: "",
    gas_meternummer: "",
    water_leverancier: "",
    water_contractnummer: "",
    water_meternummer: "",
    elektriciteit_leverancier: "",
    elektriciteit_contractnummer: "",
    elektriciteit_meternummer: "",
    verzekering_maatschappij: "",
    verzekering_polisnummer: "",
    verzekering_dekking: "",
  });

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchTenants();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      // Haal alle panden op (inclusief gearchiveerde)
      const { data, error } = await supabase
        .from("properties")
        .select("*")
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
              maandelijkse_huur: formData.maandelijkse_huur,
              risico_juridisch: formData.risico_juridisch,
              risico_markt: formData.risico_markt,
              risico_fiscaal: formData.risico_fiscaal,
              risico_fysiek: formData.risico_fysiek,
              risico_operationeel: formData.risico_operationeel,
              water_maandelijks: formData.water_maandelijks,
              gas_maandelijks: formData.gas_maandelijks,
              elektriciteit_maandelijks: formData.elektriciteit_maandelijks,
              condominium_maandelijks: formData.condominium_maandelijks,
              aantal_units: formData.aantal_units || 1,
              type_verhuur: formData.type_verhuur || "langdurig",
              st_gemiddelde_dagprijs: formData.st_gemiddelde_dagprijs || 0,
              st_bezetting_percentage: formData.st_bezetting_percentage || 0,
              // Nutsbedrijven info
              gas_leverancier: formData.gas_leverancier || null,
              gas_contractnummer: formData.gas_contractnummer || null,
              gas_meternummer: formData.gas_meternummer || null,
              water_leverancier: formData.water_leverancier || null,
              water_contractnummer: formData.water_contractnummer || null,
              water_meternummer: formData.water_meternummer || null,
              elektriciteit_leverancier: formData.elektriciteit_leverancier || null,
              elektriciteit_contractnummer: formData.elektriciteit_contractnummer || null,
              elektriciteit_meternummer: formData.elektriciteit_meternummer || null,
              verzekering_maatschappij: formData.verzekering_maatschappij || null,
              verzekering_polisnummer: formData.verzekering_polisnummer || null,
              verzekering_dekking: formData.verzekering_dekking || null,
            } as any)
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
          maandelijkse_huur: formData.maandelijkse_huur || 0,
          risico_juridisch: formData.risico_juridisch || 1,
          risico_markt: formData.risico_markt || 1,
          risico_fiscaal: formData.risico_fiscaal || 1,
          risico_fysiek: formData.risico_fysiek || 1,
          risico_operationeel: formData.risico_operationeel || 1,
          water_maandelijks: formData.water_maandelijks || 0,
          gas_maandelijks: formData.gas_maandelijks || 0,
          elektriciteit_maandelijks: formData.elektriciteit_maandelijks || 0,
          condominium_maandelijks: formData.condominium_maandelijks || 0,
          aantal_units: formData.aantal_units || 1,
          type_verhuur: formData.type_verhuur || "langdurig",
          st_gemiddelde_dagprijs: formData.st_gemiddelde_dagprijs || 0,
          st_bezetting_percentage: formData.st_bezetting_percentage || 0,
          // Nutsbedrijven info
          gas_leverancier: formData.gas_leverancier || null,
          gas_contractnummer: formData.gas_contractnummer || null,
          gas_meternummer: formData.gas_meternummer || null,
          water_leverancier: formData.water_leverancier || null,
          water_contractnummer: formData.water_contractnummer || null,
          water_meternummer: formData.water_meternummer || null,
          elektriciteit_leverancier: formData.elektriciteit_leverancier || null,
          elektriciteit_contractnummer: formData.elektriciteit_contractnummer || null,
          elektriciteit_meternummer: formData.elektriciteit_meternummer || null,
          verzekering_maatschappij: formData.verzekering_maatschappij || null,
          verzekering_polisnummer: formData.verzekering_polisnummer || null,
          verzekering_dekking: formData.verzekering_dekking || null,
        } as any);

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
      maandelijkse_huur: Number(property.maandelijkse_huur) || 0,
      risico_juridisch: property.risico_juridisch || 1,
      risico_markt: property.risico_markt || 1,
      risico_fiscaal: property.risico_fiscaal || 1,
      risico_fysiek: property.risico_fysiek || 1,
      risico_operationeel: property.risico_operationeel || 1,
      water_maandelijks: (property as any).water_maandelijks || 0,
      gas_maandelijks: (property as any).gas_maandelijks || 0,
      elektriciteit_maandelijks: (property as any).elektriciteit_maandelijks || 0,
      condominium_maandelijks: (property as any).condominium_maandelijks || 0,
      aantal_units: (property as any).aantal_units ?? undefined,
      type_verhuur: property.type_verhuur || "langdurig",
      st_gemiddelde_dagprijs: Number(property.st_gemiddelde_dagprijs) || 0,
      st_bezetting_percentage: Number(property.st_bezetting_percentage) || 0,
      // Nutsbedrijven info
      gas_leverancier: (property as any).gas_leverancier || "",
      gas_contractnummer: (property as any).gas_contractnummer || "",
      gas_meternummer: (property as any).gas_meternummer || "",
      water_leverancier: (property as any).water_leverancier || "",
      water_contractnummer: (property as any).water_contractnummer || "",
      water_meternummer: (property as any).water_meternummer || "",
      elektriciteit_leverancier: (property as any).elektriciteit_leverancier || "",
      elektriciteit_contractnummer: (property as any).elektriciteit_contractnummer || "",
      elektriciteit_meternummer: (property as any).elektriciteit_meternummer || "",
      verzekering_maatschappij: (property as any).verzekering_maatschappij || "",
      verzekering_polisnummer: (property as any).verzekering_polisnummer || "",
      verzekering_dekking: (property as any).verzekering_dekking || "",
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
      maandelijkse_huur: 0,
      risico_juridisch: 1,
      risico_markt: 1,
      risico_fiscaal: 1,
      risico_fysiek: 1,
      risico_operationeel: 1,
      water_maandelijks: 0,
      gas_maandelijks: 0,
      elektriciteit_maandelijks: 0,
      condominium_maandelijks: 0,
      aantal_units: undefined,
      type_verhuur: "langdurig",
      st_gemiddelde_dagprijs: 0,
      st_bezetting_percentage: 0,
      // Nutsbedrijven info
      gas_leverancier: "",
      gas_contractnummer: "",
      gas_meternummer: "",
      water_leverancier: "",
      water_contractnummer: "",
      water_meternummer: "",
      elektriciteit_leverancier: "",
      elektriciteit_contractnummer: "",
      elektriciteit_meternummer: "",
      verzekering_maatschappij: "",
      verzekering_polisnummer: "",
      verzekering_dekking: "",
    });
  };

  const getTenantsForProperty = (propertyId: string) => {
    return tenants.filter((t) => t.property_id === propertyId);
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.naam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.locatie.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter op gearchiveerd status
    if (statusFilter === "gearchiveerd") {
      return matchesSearch && property.gearchiveerd === true;
    }
    
    // Bij alle andere filters: toon alleen niet-gearchiveerde panden
    const isNotArchived = property.gearchiveerd !== true;
    const matchesStatus =
      statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus && isNotArchived;
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
                <SelectItem value="gearchiveerd">Gearchiveerd</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Map & Properties Grid */}
        <div className="px-4 md:px-6 lg:px-8 pb-8">
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="grid" className="gap-2">
                <Building2 className="w-4 h-4" />
                Overzicht
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <Map className="w-4 h-4" />
                Kaart
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="gap-2">
                <Wrench className="w-4 h-4" />
                Onderhoud
              </TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="mt-0">
              <div className="h-[500px] rounded-xl overflow-hidden border shadow-card">
                <PropertyMap
                  properties={filteredProperties}
                  onPropertyClick={(p) => {
                    const fullProperty = properties.find(prop => prop.id === p.id);
                    if (fullProperty) handleEdit(fullProperty);
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="grid" className="mt-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                  className="gradient-primary text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Eerste pand toevoegen
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredProperties.map((property, index) => {
                const propertyTenants = getTenantsForProperty(property.id);
                const statusInfo = statusConfig[property.status];

                return (
                  <div
                    key={property.id}
                    className="group relative p-4 sm:p-5 bg-card rounded-xl border shadow-card hover:shadow-glow hover:border-primary/30 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {property.is_pinned && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center shadow-glow">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground fill-current" />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
                          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {property.naam}
                          </h3>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.locatie)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{property.locatie}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </a>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-strong">
                          <DropdownMenuItem 
                            onClick={() => {
                              setAdviceProperty(property);
                              setIsAdviceDialogOpen(true);
                            }}
                            className="text-primary"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI Advies
                          </DropdownMenuItem>
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

                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <Badge
                        variant={statusInfo.color === "success" ? "success" : statusInfo.color === "warning" ? "warning" : "secondary"}
                      >
                        {statusInfo.label}
                      </Badge>
                      {/* Verhuurtype badge */}
                      {property.type_verhuur && verhuurTypeConfig[property.type_verhuur as keyof typeof verhuurTypeConfig] && (
                        <Badge variant="outline" className="gap-1">
                          {(() => {
                            const Icon = verhuurTypeConfig[property.type_verhuur as keyof typeof verhuurTypeConfig].icon;
                            return <Icon className="w-3 h-3" />;
                          })()}
                          {verhuurTypeConfig[property.type_verhuur as keyof typeof verhuurTypeConfig].label}
                        </Badge>
                      )}
                      {property.aantal_units > 1 && (
                        <Badge variant="outline" className="gap-1">
                          <Layers className="w-3 h-3" />
                          {property.aantal_units} units
                        </Badge>
                      )}
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
                      {/* Short-term rental info */}
                      {property.type_verhuur === 'korte_termijn' && (
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className="text-xs text-muted-foreground">Short-term verhuur</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <BedDouble className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">€{Number(property.st_gemiddelde_dagprijs || 0)}/nacht</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Percent className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{Number(property.st_bezetting_percentage || 0)}% bezet</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-success/10">
                            <span className="text-xs text-muted-foreground">Est. maandelijks</span>
                            <span className="font-semibold text-success">
                              €{Math.round(Number(property.st_gemiddelde_dagprijs || 0) * 30 * (Number(property.st_bezetting_percentage || 0) / 100)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Langdurige/kamerverhuur huurders info */}
                      {property.type_verhuur !== 'korte_termijn' && propertyTenants.length > 0 && (
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary" />
                              <span className="text-xs text-muted-foreground">
                                {propertyTenants.length} {propertyTenants.length === 1 ? 'huurder' : 'huurders'}
                                {property.type_verhuur === 'kamerverhuur' && ' (kamers)'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Euro className="w-4 h-4 text-success" />
                              <span className="font-semibold text-success">
                                €{propertyTenants.reduce((sum, t) => sum + Number(t.huurbedrag), 0).toLocaleString()}/mnd
                              </span>
                            </div>
                          </div>
                          {propertyTenants.slice(0, 2).map((tenant) => (
                            <div key={tenant.id} className="flex items-center justify-between text-sm pl-6">
                              <span className="text-foreground truncate">
                                {tenant.naam}
                                {property.aantal_units > 1 && (
                                  <span className="text-muted-foreground ml-1">
                                    ({property.type_verhuur === 'kamerverhuur' ? 'Kamer' : 'Unit'} {tenant.unit_nummer || 1})
                                  </span>
                                )}
                              </span>
                              <span className="text-muted-foreground">
                                €{Number(tenant.huurbedrag).toLocaleString()}
                              </span>
                            </div>
                          ))}
                          {propertyTenants.length > 2 && (
                            <p className="text-xs text-muted-foreground pl-6">
                              +{propertyTenants.length - 2} meer
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Detail Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4 gap-2"
                      onClick={() => navigate(`/panden/${property.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                      Bekijk details
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
            </TabsContent>

            <TabsContent value="maintenance" className="mt-0">
              <MaintenanceOverview />
            </TabsContent>
          </Tabs>
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
                <Label htmlFor="aantal_units">
                  Aantal Units/Woningen
                  <InfoTooltip
                    title="Aantal Units"
                    content="Hoeveel aparte woningen of verhuurbare eenheden heeft dit pand? Bijv. een flat met 3 appartementen = 3 units."
                  />
                </Label>
                <Input
                  id="aantal_units"
                  type="number"
                  min="1"
                  value={formData.aantal_units ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const next = raw === "" ? undefined : Number.parseInt(raw, 10);
                    setFormData({
                      ...formData,
                      aantal_units: Number.isFinite(next as number) ? (next as number) : undefined,
                    });
                  }}
                  placeholder="Bijv. 2"
                />
              </div>

              {/* Verhuurtype Sectie */}
              <div className="col-span-2 pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-foreground">Type Verhuur</h3>
                  <InfoTooltip
                    title="Verhuurtype"
                    content="Kies het type verhuur dat van toepassing is. Dit bepaalt welke velden je invult en hoe inkomsten worden berekend."
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(verhuurTypeConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = formData.type_verhuur === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, type_verhuur: key })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50 hover:bg-accent'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Short-term rental velden */}
              {formData.type_verhuur === 'korte_termijn' && (
                <div className="col-span-2 space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-foreground">Short-Term Rental Gegevens</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="st_gemiddelde_dagprijs" className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-success" />
                        Gemiddelde Dagprijs (€)
                      </Label>
                      <Input
                        id="st_gemiddelde_dagprijs"
                        type="number"
                        min="0"
                        value={formData.st_gemiddelde_dagprijs || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, st_gemiddelde_dagprijs: Number(e.target.value) })
                        }
                        placeholder="85"
                      />
                      <p className="text-xs text-muted-foreground">Gemiddelde prijs per nacht over het jaar</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="st_bezetting_percentage" className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-warning" />
                        Bezettingsgraad (%)
                      </Label>
                      <Input
                        id="st_bezetting_percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.st_bezetting_percentage || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, st_bezetting_percentage: Number(e.target.value) })
                        }
                        placeholder="70"
                      />
                      <p className="text-xs text-muted-foreground">% van de tijd dat het pand verhuurd is</p>
                    </div>
                  </div>
                  {/* Geschatte maandelijkse inkomsten */}
                  {formData.st_gemiddelde_dagprijs && formData.st_bezetting_percentage ? (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Geschatte maandelijkse inkomsten:</span>
                        <span className="font-bold text-success">
                          €{Math.round(formData.st_gemiddelde_dagprijs * 30 * (formData.st_bezetting_percentage / 100)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Kamerverhuur info */}
              {formData.type_verhuur === 'kamerverhuur' && (
                <div className="col-span-2 p-4 rounded-lg bg-accent/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <DoorOpen className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-foreground">Kamerverhuur</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bij kamerverhuur kun je meerdere huurders toevoegen aan dezelfde woning. 
                    Gebruik "Aantal Units" om aan te geven hoeveel kamers je verhuurt.
                    Elke kamer kan aan een aparte huurder worden toegewezen via de Huurders pagina.
                  </p>
                </div>
              )}

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

              <div className="space-y-2">
                <Label htmlFor="maandelijkse_huur">
                  Maandelijkse Huur (€)
                  <InfoTooltip
                    title="Maandelijkse Huur"
                    content="De maandelijkse huurinkomsten van dit pand. Wordt gebruikt voor cashflow en rendementsberekeningen."
                  />
                </Label>
                <Input
                  id="maandelijkse_huur"
                  type="number"
                  min="0"
                  value={formData.maandelijkse_huur || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, maandelijkse_huur: Number(e.target.value) })
                  }
                  placeholder="1200"
                />
              </div>

              {/* Nutsvoorzieningen Section */}
              <div className="col-span-2 pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-foreground">Maandelijkse Kosten</h3>
                  <InfoTooltip
                    title="Nutsvoorzieningen"
                    content="Voer de maandelijkse kosten voor water, gas, elektriciteit en VvE/condominium in. Dit helpt bij het berekenen van je netto cashflow."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="water_maandelijks" className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      Water (€/maand)
                    </Label>
                    <Input
                      id="water_maandelijks"
                      type="number"
                      min="0"
                      value={formData.water_maandelijks || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, water_maandelijks: Number(e.target.value) })
                      }
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gas_maandelijks" className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      Gas (€/maand)
                    </Label>
                    <Input
                      id="gas_maandelijks"
                      type="number"
                      min="0"
                      value={formData.gas_maandelijks || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, gas_maandelijks: Number(e.target.value) })
                      }
                      placeholder="40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="elektriciteit_maandelijks" className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Elektriciteit (€/maand)
                    </Label>
                    <Input
                      id="elektriciteit_maandelijks"
                      type="number"
                      min="0"
                      value={formData.elektriciteit_maandelijks || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, elektriciteit_maandelijks: Number(e.target.value) })
                      }
                      placeholder="60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condominium_maandelijks" className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-purple-500" />
                      VvE/Condominium (€/maand)
                    </Label>
                    <Input
                      id="condominium_maandelijks"
                      type="number"
                      min="0"
                      value={formData.condominium_maandelijks || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, condominium_maandelijks: Number(e.target.value) })
                      }
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              {/* Nutsbedrijven Informatie Sectie */}
              <div className="col-span-2 pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-foreground">Nutsbedrijven & Verzekering</h3>
                  <InfoTooltip
                    title="Leveranciers Info"
                    content="Bewaar hier de gegevens van je leveranciers, contractnummers en meternummers. Handig voor administratie en bij problemen."
                  />
                </div>

                {/* Verzekering */}
                <div className="p-4 rounded-lg bg-accent/50 border mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-foreground">Verzekering</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="verzekering_maatschappij" className="text-sm">Maatschappij</Label>
                      <Input
                        id="verzekering_maatschappij"
                        value={formData.verzekering_maatschappij || ""}
                        onChange={(e) => setFormData({ ...formData, verzekering_maatschappij: e.target.value })}
                        placeholder="bijv. Allianz"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="verzekering_polisnummer" className="text-sm">Polisnummer</Label>
                      <Input
                        id="verzekering_polisnummer"
                        value={formData.verzekering_polisnummer || ""}
                        onChange={(e) => setFormData({ ...formData, verzekering_polisnummer: e.target.value })}
                        placeholder="bijv. POL-123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="verzekering_dekking" className="text-sm">Dekking</Label>
                      <Input
                        id="verzekering_dekking"
                        value={formData.verzekering_dekking || ""}
                        onChange={(e) => setFormData({ ...formData, verzekering_dekking: e.target.value })}
                        placeholder="bijv. Opstal + Inboedel"
                      />
                    </div>
                  </div>
                </div>

                {/* Gas */}
                <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <h4 className="font-medium text-foreground">Gas</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="gas_leverancier" className="text-sm">Leverancier</Label>
                      <Input
                        id="gas_leverancier"
                        value={formData.gas_leverancier || ""}
                        onChange={(e) => setFormData({ ...formData, gas_leverancier: e.target.value })}
                        placeholder="bijv. Vattenfall"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gas_contractnummer" className="text-sm flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Contractnummer
                      </Label>
                      <Input
                        id="gas_contractnummer"
                        value={formData.gas_contractnummer || ""}
                        onChange={(e) => setFormData({ ...formData, gas_contractnummer: e.target.value })}
                        placeholder="bijv. GAS-789012"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gas_meternummer" className="text-sm flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        Meternummer
                      </Label>
                      <Input
                        id="gas_meternummer"
                        value={formData.gas_meternummer || ""}
                        onChange={(e) => setFormData({ ...formData, gas_meternummer: e.target.value })}
                        placeholder="bijv. G001234567"
                      />
                    </div>
                  </div>
                </div>

                {/* Elektriciteit */}
                <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <h4 className="font-medium text-foreground">Elektriciteit</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="elektriciteit_leverancier" className="text-sm">Leverancier</Label>
                      <Input
                        id="elektriciteit_leverancier"
                        value={formData.elektriciteit_leverancier || ""}
                        onChange={(e) => setFormData({ ...formData, elektriciteit_leverancier: e.target.value })}
                        placeholder="bijv. Eneco"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="elektriciteit_contractnummer" className="text-sm flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Contractnummer
                      </Label>
                      <Input
                        id="elektriciteit_contractnummer"
                        value={formData.elektriciteit_contractnummer || ""}
                        onChange={(e) => setFormData({ ...formData, elektriciteit_contractnummer: e.target.value })}
                        placeholder="bijv. ELK-345678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="elektriciteit_meternummer" className="text-sm flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        Meternummer
                      </Label>
                      <Input
                        id="elektriciteit_meternummer"
                        value={formData.elektriciteit_meternummer || ""}
                        onChange={(e) => setFormData({ ...formData, elektriciteit_meternummer: e.target.value })}
                        placeholder="bijv. E001234567"
                      />
                    </div>
                  </div>
                </div>

                {/* Water */}
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <h4 className="font-medium text-foreground">Water</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="water_leverancier" className="text-sm">Leverancier</Label>
                      <Input
                        id="water_leverancier"
                        value={formData.water_leverancier || ""}
                        onChange={(e) => setFormData({ ...formData, water_leverancier: e.target.value })}
                        placeholder="bijv. Vitens"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="water_contractnummer" className="text-sm flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Contractnummer
                      </Label>
                      <Input
                        id="water_contractnummer"
                        value={formData.water_contractnummer || ""}
                        onChange={(e) => setFormData({ ...formData, water_contractnummer: e.target.value })}
                        placeholder="bijv. WAT-901234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="water_meternummer" className="text-sm flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        Meternummer
                      </Label>
                      <Input
                        id="water_meternummer"
                        value={formData.water_meternummer || ""}
                        onChange={(e) => setFormData({ ...formData, water_meternummer: e.target.value })}
                        placeholder="bijv. W001234567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="google_drive_link">
                  Documentenkluis (Google Drive/OneDrive Link)
                  <InfoTooltip
                    title="Documentenkluis"
                    content="Link naar een externe map met al je documenten voor dit pand: contracten, facturen, foto's, etc."
                  />
                </Label>
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

              {/* Risicokaart */}
              <div className="col-span-2 pt-4 border-t">
                <RisicoKaart
                  juridisch={formData.risico_juridisch || 1}
                  markt={formData.risico_markt || 1}
                  fiscaal={formData.risico_fiscaal || 1}
                  fysiek={formData.risico_fysiek || 1}
                  operationeel={formData.risico_operationeel || 1}
                  onChange={(field, value) => setFormData({ ...formData, [`risico_${field}`]: value })}
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

      {/* Property Advice Dialog */}
      <PropertyAdviceDialog
        property={adviceProperty}
        open={isAdviceDialogOpen}
        onOpenChange={setIsAdviceDialogOpen}
      />
    </AppLayout>
  );
};

export default Panden;
