import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  MapPin, 
  Euro, 
  Calendar, 
  Trash2, 
  Download, 
  ChevronRight,
  Loader2,
  FolderOpen
} from "lucide-react";
import { AnalysisInputs } from "@/lib/rendementsCalculations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SavedProperty {
  id: string;
  naam: string;
  locatie: string;
  aankoopprijs: number;
  maandelijkse_huur: number | null;
  created_at: string;
  type_verhuur: string | null;
  st_bezetting_percentage: number | null;
  st_gemiddelde_dagprijs: number | null;
  beheerkosten_percentage: number | null;
  onderhoud_jaarlijks: number | null;
  verzekering_jaarlijks: number | null;
  condominium_maandelijks: number | null;
  imi_percentage: number | null;
  huurgroei_percentage: number | null;
  kostenstijging_percentage: number | null;
  waardegroei_percentage: number | null;
  notaris_kosten: number | null;
  imt_betaald: number | null;
  renovatie_kosten: number | null;
  inrichting_kosten: number | null;
  tijdsframe_analyse: string | null;
}

interface SavedPropertiesPanelProps {
  onLoadProperty: (inputs: Partial<AnalysisInputs>, name: string, location: string) => void;
}

export function SavedPropertiesPanel({ onLoadProperty }: SavedPropertiesPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedProperties = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .eq("analyse_status", "potentieel")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching saved properties:", error);
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSavedProperties();
  }, [user]);

  const handleLoadProperty = (property: SavedProperty) => {
    // Map rental type back from database
    const rentalTypeMap: Record<string, string> = {
      langdurig: "longterm",
      kortlopend: "shortterm",
      gemengd: "mixed",
    };

    const inputs: Partial<AnalysisInputs> = {
      purchasePrice: property.aankoopprijs,
      monthlyRentLT: property.maandelijkse_huur || 0,
      rentalType: (rentalTypeMap[property.type_verhuur || ""] || "longterm") as "longterm" | "shortterm" | "mixed",
      stOccupancy: property.st_bezetting_percentage || 70,
      stADR: property.st_gemiddelde_dagprijs || 120,
      managementPercent: property.beheerkosten_percentage || 10,
      maintenanceYearly: property.onderhoud_jaarlijks || 2000,
      insuranceYearly: property.verzekering_jaarlijks || 400,
      condoMonthly: property.condominium_maandelijks || 75,
      imiYearly: property.imi_percentage ? property.aankoopprijs * property.imi_percentage : 750,
      rentGrowth: property.huurgroei_percentage || 2,
      costGrowth: property.kostenstijging_percentage || 2,
      valueGrowth: property.waardegroei_percentage || 3,
      notaryFees: property.notaris_kosten || 3500,
      imt: property.imt_betaald || 12500,
      renovationCosts: property.renovatie_kosten || 0,
      furnishingCosts: property.inrichting_kosten || 0,
    };

    onLoadProperty(inputs, property.naam, property.locatie);
    
    toast({
      title: "Pand geladen",
      description: `"${property.naam}" is ingeladen in de analysator.`,
    });
  };

  const handleDeleteProperty = async (id: string, naam: string) => {
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pand verwijderd",
        description: `"${naam}" is verwijderd.`,
      });
      fetchSavedProperties();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          Opgeslagen Potentiële Panden
          {properties.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {properties.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nog geen opgeslagen panden</p>
            <p className="text-xs mt-1">Sla een analyse op om deze hier terug te vinden</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-2">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">{property.naam}</h4>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {property.type_verhuur === "langdurig" ? "LT" : 
                         property.type_verhuur === "kortlopend" ? "ST" : "Mix"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.locatie}
                      </span>
                      <span className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {formatCurrency(property.aankoopprijs)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(property.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLoadProperty(property)}
                      className="h-8 px-2 gap-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-xs">Laden</span>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Pand verwijderen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Weet je zeker dat je "{property.naam}" wilt verwijderen? 
                            Dit kan niet ongedaan worden gemaakt.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProperty(property.id, property.naam)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Verwijderen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
