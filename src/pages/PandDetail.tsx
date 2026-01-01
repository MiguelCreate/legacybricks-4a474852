import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Euro, Pencil, TrendingUp, Home, DoorOpen, BarChart3, Palette, Users, Calculator } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComparablePropertiesManager } from "@/components/panden/ComparablePropertiesManager";
import { ExitStrategyAdvisor } from "@/components/panden/ExitStrategyAdvisor";
import { RoomManager } from "@/components/panden/RoomManager";
import { PropertyFeaturesManager } from "@/components/panden/PropertyFeaturesManager";
import { RisicoKaart } from "@/components/panden/RisicoKaart";
import { PandAlsKunstwerk } from "@/components/panden/PandAlsKunstwerk";
import { VvEModule } from "@/components/vve/VvEModule";
import { FinancieelDashboard } from "@/components/financieel/FinancieelDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Loan = Tables<"loans">;

const statusConfig = {
  aankoop: { label: "Aankoop", color: "secondary" as const },
  renovatie: { label: "Renovatie", color: "warning" as const },
  verhuur: { label: "Verhuurd", color: "success" as const },
  te_koop: { label: "Te Koop", color: "destructive" as const },
};

const PandDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchProperty();
      fetchLoans();
    }
  }, [user, id]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (error) {
      console.error("Error fetching property:", error);
      toast({
        title: "Fout",
        description: "Kon pand niet laden",
        variant: "destructive",
      });
      navigate("/panden");
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .eq("property_id", id!);

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  const handleMarketValueUpdate = async (newValue: number) => {
    if (!property) return;

    try {
      const { error } = await supabase
        .from("properties")
        .update({ waardering: newValue })
        .eq("id", property.id);

      if (error) throw error;

      setProperty({ ...property, waardering: newValue });
      toast({
        title: "Marktwaarde bijgewerkt",
        description: `Nieuwe waarde: €${newValue.toLocaleString("nl-NL")}`,
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!property) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 text-center">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Pand niet gevonden</h2>
          <Button onClick={() => navigate("/panden")} className="mt-4">
            Terug naar overzicht
          </Button>
        </div>
      </AppLayout>
    );
  }

  const statusInfo = statusConfig[property.status];
  const totalLoanDebt = loans.reduce((sum, loan) => sum + Number(loan.restschuld || loan.maandlast * 12 * (loan.looptijd_jaren || 20)), 0);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="p-4 md:p-6 lg:p-8 border-b">
          <Button
            variant="ghost"
            onClick={() => navigate("/panden")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar overzicht
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Building2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {property.naam}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{property.locatie}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={statusInfo.color === "success" ? "success" : statusInfo.color === "warning" ? "warning" : "secondary"}
              >
                {statusInfo.label}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/panden?edit=${property.id}`)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                Bewerken
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-card/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Euro className="w-4 h-4" />
                  Aankoopprijs
                </div>
                <p className="text-xl font-bold">
                  €{Number(property.aankoopprijs).toLocaleString("nl-NL")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Huidige Waarde
                </div>
                <p className="text-xl font-bold text-primary">
                  €{Number(property.waardering || property.aankoopprijs).toLocaleString("nl-NL")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Home className="w-4 h-4" />
                  Oppervlakte
                </div>
                <p className="text-xl font-bold">
                  {property.oppervlakte_m2 ? `${Number(property.oppervlakte_m2)} m²` : "-"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <BarChart3 className="w-4 h-4" />
                  Maandelijkse Huur
                </div>
                <p className="text-xl font-bold text-success">
                  €{Number(property.maandelijkse_huur || 0).toLocaleString("nl-NL")}
                </p>
              </CardContent>
            </Card>
          </div>
        </header>

        {/* Main Content - Tabs */}
        <div className="p-4 md:p-6 lg:p-8">
          <Tabs defaultValue="financieel" className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="financieel" className="gap-2">
                <Calculator className="w-4 h-4" />
                Financieel
              </TabsTrigger>
              <TabsTrigger value="marktwaarde" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Marktwaarde
              </TabsTrigger>
              <TabsTrigger value="exit" className="gap-2">
                <DoorOpen className="w-4 h-4" />
                Exit Strategie
              </TabsTrigger>
              <TabsTrigger value="kamers" className="gap-2">
                <Home className="w-4 h-4" />
                Kamers/Units
              </TabsTrigger>
              <TabsTrigger value="kenmerken" className="gap-2">
                <Building2 className="w-4 h-4" />
                Kenmerken
              </TabsTrigger>
              <TabsTrigger value="risico" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Risicoprofiel
              </TabsTrigger>
              <TabsTrigger value="vve" className="gap-2">
                <Users className="w-4 h-4" />
                Mini-VvE
              </TabsTrigger>
              <TabsTrigger value="kunstwerk" className="gap-2">
                <Palette className="w-4 h-4" />
                Kunstwerk
              </TabsTrigger>
            </TabsList>

            <TabsContent value="financieel" className="mt-0">
              <FinancieelDashboard property={property} loans={loans} />
            </TabsContent>

            <TabsContent value="marktwaarde" className="mt-0">
              <ComparablePropertiesManager
                propertyId={property.id}
                propertyM2={property.oppervlakte_m2 ? Number(property.oppervlakte_m2) : null}
                currentMarketValue={property.waardering ? Number(property.waardering) : null}
                onMarketValueUpdate={handleMarketValueUpdate}
              />
            </TabsContent>

            <TabsContent value="exit" className="mt-0">
              <ExitStrategyAdvisor
                propertyId={property.id}
                propertyName={property.naam}
                purchasePrice={Number(property.aankoopprijs)}
                currentMarketValue={Number(property.waardering || property.aankoopprijs)}
                monthlyRent={Number(property.maandelijkse_huur || 0)}
                monthlyMortgage={loans.length > 0 ? loans.reduce((sum, l) => sum + Number(l.maandlast), 0) : 0}
                remainingDebt={totalLoanDebt}
                yearlyOpex={Number(property.onderhoud_jaarlijks || 0) + Number(property.verzekering_jaarlijks || 0)}
                valueGrowth={Number(property.waardegroei_percentage || 3)}
                costGrowth={Number(property.kostenstijging_percentage || 2)}
                rentGrowth={Number(property.huurgroei_percentage || 2)}
              />
            </TabsContent>

            <TabsContent value="kamers" className="mt-0">
              <RoomManager propertyId={property.id} propertyName={property.naam} />
            </TabsContent>

            <TabsContent value="kenmerken" className="mt-0">
              <PropertyFeaturesManager propertyId={property.id} propertyName={property.naam} />
            </TabsContent>

            <TabsContent value="risico" className="mt-0">
              <RisicoKaart
                juridisch={property.risico_juridisch || 1}
                markt={property.risico_markt || 1}
                fiscaal={property.risico_fiscaal || 1}
                fysiek={property.risico_fysiek || 1}
                operationeel={property.risico_operationeel || 1}
                readonly
                vveReservePercentage={
                  Number(property.vve_reserve_streef || 0) > 0
                    ? (Number(property.vve_reserve_huidig || 0) / Number(property.vve_reserve_streef)) * 100
                    : undefined
                }
              />
            </TabsContent>

            <TabsContent value="vve" className="mt-0">
              <VvEModule
                propertyId={property.id}
                propertyName={property.naam}
                vveReserveStreef={Number((property as any).vve_reserve_streef || 0)}
                vveReserveHuidig={Number((property as any).vve_reserve_huidig || 0)}
                vveMaandbijdrage={Number((property as any).vve_maandbijdrage || 0)}
                gebouwVerzekeringPolisnummer={(property as any).gebouw_verzekering_polisnummer || null}
                gebouwVerzekeringVervaldatum={(property as any).gebouw_verzekering_vervaldatum || null}
                gebouwVerzekeringLink={(property as any).gebouw_verzekering_link || null}
                bouwkundigRapportLink={(property as any).bouwkundig_rapport_link || null}
                energieCertificaatGebouwVervaldatum={(property as any).energie_certificaat_gebouw_vervaldatum || null}
                onPropertyUpdate={fetchProperty}
              />
            </TabsContent>

            <TabsContent value="kunstwerk" className="mt-0">
              <PandAlsKunstwerk
                propertyId={property.id}
                propertyName={property.naam}
                locatie={property.locatie}
                aankoopprijs={Number(property.aankoopprijs)}
                huidigeWaarde={Number(property.waardering || property.aankoopprijs)}
                maandelijksHuur={Number(property.maandelijkse_huur || 0)}
                rendement={property.maandelijkse_huur && property.aankoopprijs 
                  ? (Number(property.maandelijkse_huur) * 12 / Number(property.aankoopprijs)) * 100 
                  : undefined}
                persoonlijkeQuote={property.persoonlijke_quote || undefined}
                fotoUrl={property.foto_url || undefined}
                onUpdate={fetchProperty}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default PandDetail;
