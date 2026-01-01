import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, PiggyBank, Wrench, FileText, AlertTriangle, Calendar, ChevronRight, Info } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays, format } from "date-fns";
import { nl } from "date-fns/locale";

interface PropertyVvEData {
  id: string;
  naam: string;
  locatie: string;
  vve_reserve_streef: number;
  vve_reserve_huidig: number;
  vve_maandbijdrage: number;
  gebouw_verzekering_vervaldatum: string | null;
  energie_certificaat_gebouw_vervaldatum: string | null;
}

interface OnderhoudItem {
  id: string;
  property_id: string;
  element_naam: string;
  volgend_onderhoud: string | null;
  geschatte_kosten: number | null;
}

interface VvETask {
  type: "onderhoud" | "verzekering" | "reservepot" | "energie";
  message: string;
  propertyId: string;
  propertyName: string;
  urgency: "high" | "medium" | "low";
  dueDate?: string;
}

const VvEOverzicht = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyVvEData[]>([]);
  const [onderhoud, setOnderhoud] = useState<OnderhoudItem[]>([]);
  const [tasks, setTasks] = useState<VvETask[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [propRes, onderhoudRes] = await Promise.all([
        supabase
          .from("properties")
          .select("id, naam, locatie, vve_reserve_streef, vve_reserve_huidig, vve_maandbijdrage, gebouw_verzekering_vervaldatum, energie_certificaat_gebouw_vervaldatum")
          .eq("gearchiveerd", false),
        supabase
          .from("gemeenschappelijk_onderhoud")
          .select("*")
          .order("volgend_onderhoud", { ascending: true }),
      ]);

      if (propRes.error) throw propRes.error;
      if (onderhoudRes.error) throw onderhoudRes.error;

      const propsData = (propRes.data || []) as PropertyVvEData[];
      const onderhoudData = onderhoudRes.data || [];

      setProperties(propsData);
      setOnderhoud(onderhoudData);

      // Generate tasks
      const newTasks: VvETask[] = [];

      for (const property of propsData) {
        // Check reservepot
        const streef = Number(property.vve_reserve_streef) || 0;
        const huidig = Number(property.vve_reserve_huidig) || 0;
        if (streef > 0 && huidig < streef * 0.5) {
          newTasks.push({
            type: "reservepot",
            message: `Reservepot < 50%: €${huidig.toLocaleString("nl-NL")} / €${streef.toLocaleString("nl-NL")}`,
            propertyId: property.id,
            propertyName: property.naam,
            urgency: huidig < streef * 0.25 ? "high" : "medium",
          });
        }

        // Check verzekering
        if (property.gebouw_verzekering_vervaldatum) {
          const dagenTot = differenceInDays(new Date(property.gebouw_verzekering_vervaldatum), new Date());
          if (dagenTot <= 60 && dagenTot >= -30) {
            newTasks.push({
              type: "verzekering",
              message: dagenTot < 0 
                ? `Gebouwverzekering is verlopen!` 
                : `Gebouwverzekering vervalt over ${dagenTot} dagen`,
              propertyId: property.id,
              propertyName: property.naam,
              urgency: dagenTot <= 0 ? "high" : dagenTot <= 30 ? "medium" : "low",
              dueDate: property.gebouw_verzekering_vervaldatum,
            });
          }
        }

        // Check energie certificaat
        if (property.energie_certificaat_gebouw_vervaldatum) {
          const dagenTot = differenceInDays(new Date(property.energie_certificaat_gebouw_vervaldatum), new Date());
          if (dagenTot <= 90 && dagenTot >= -30) {
            newTasks.push({
              type: "energie",
              message: dagenTot < 0 
                ? `Energiecertificaat is verlopen!` 
                : `Energiecertificaat vervalt over ${dagenTot} dagen`,
              propertyId: property.id,
              propertyName: property.naam,
              urgency: dagenTot <= 0 ? "high" : dagenTot <= 30 ? "medium" : "low",
              dueDate: property.energie_certificaat_gebouw_vervaldatum,
            });
          }
        }
      }

      // Check onderhoud items
      for (const item of onderhoudData) {
        if (item.volgend_onderhoud) {
          const dagenTot = differenceInDays(new Date(item.volgend_onderhoud), new Date());
          const property = propsData.find(p => p.id === item.property_id);
          if (dagenTot <= 90 && property) {
            newTasks.push({
              type: "onderhoud",
              message: `${item.element_naam}: ${dagenTot <= 0 ? "Verlopen!" : `over ${dagenTot} dagen`}`,
              propertyId: property.id,
              propertyName: property.naam,
              urgency: dagenTot <= 0 ? "high" : dagenTot <= 30 ? "medium" : "low",
              dueDate: item.volgend_onderhoud,
            });
          }
        }
      }

      // Sort by urgency
      newTasks.sort((a, b) => {
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });

      setTasks(newTasks);
    } catch (error) {
      console.error("Error fetching VvE data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: VvETask["urgency"]) => {
    switch (urgency) {
      case "high": return "destructive";
      case "medium": return "warning";
      case "low": return "secondary";
    }
  };

  const getTypeIcon = (type: VvETask["type"]) => {
    switch (type) {
      case "onderhoud": return <Wrench className="w-4 h-4" />;
      case "verzekering": return <FileText className="w-4 h-4" />;
      case "reservepot": return <PiggyBank className="w-4 h-4" />;
      case "energie": return <FileText className="w-4 h-4" />;
    }
  };

  // Calculate totals
  const totalReserveStreef = properties.reduce((sum, p) => sum + (Number(p.vve_reserve_streef) || 0), 0);
  const totalReserveHuidig = properties.reduce((sum, p) => sum + (Number(p.vve_reserve_huidig) || 0), 0);
  const totalMaandbijdrage = properties.reduce((sum, p) => sum + (Number(p.vve_maandbijdrage) || 0), 0);
  const overallPercentage = totalReserveStreef > 0 ? (totalReserveHuidig / totalReserveStreef) * 100 : 0;

  const highPriorityTasks = tasks.filter(t => t.urgency === "high").length;
  const mediumPriorityTasks = tasks.filter(t => t.urgency === "medium").length;

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              VvE Overzicht
            </h1>
            <p className="text-muted-foreground mt-1">
              Beheer gemeenschappelijke verantwoordelijkheden voor al je panden
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Mini-VvE Module</strong> — Dit overzicht toont alle VvE-gerelateerde taken en reservepotten 
            van je panden. Klik op een pand om naar de gedetailleerde VvE-module te gaan.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Panden</p>
                  <p className="text-2xl font-bold">{properties.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Open taken</p>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                  {highPriorityTasks > 0 && (
                    <p className="text-xs text-destructive">{highPriorityTasks} urgent</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <PiggyBank className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totale reserve</p>
                  <p className="text-2xl font-bold">€{totalReserveHuidig.toLocaleString("nl-NL")}</p>
                  <p className="text-xs text-muted-foreground">/ €{totalReserveStreef.toLocaleString("nl-NL")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Maandelijkse bijdrage</p>
                  <p className="text-2xl font-bold">€{totalMaandbijdrage.toLocaleString("nl-NL")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        {totalReserveStreef > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Totale Reservepot Voortgang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Alle panden gecombineerd</span>
                  <span className="font-medium">{overallPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(overallPercentage, 100)} className="h-3" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="taken" className="w-full">
          <TabsList>
            <TabsTrigger value="taken" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Openstaande Taken ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="panden" className="gap-2">
              <Building2 className="w-4 h-4" />
              Per Pand ({properties.length})
            </TabsTrigger>
            <TabsTrigger value="onderhoud" className="gap-2">
              <Wrench className="w-4 h-4" />
              Onderhoudsplanning ({onderhoud.length})
            </TabsTrigger>
          </TabsList>

          {/* Taken Tab */}
          <TabsContent value="taken" className="mt-6">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Geen openstaande VvE-taken</p>
                  <p className="text-sm text-muted-foreground mt-1">Alles is onder controle!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/panden/${task.propertyId}`)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            task.urgency === "high" ? "bg-destructive/10 text-destructive" :
                            task.urgency === "medium" ? "bg-warning/10 text-warning" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {getTypeIcon(task.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{task.propertyName}</span>
                              <Badge variant={getUrgencyColor(task.urgency)}>
                                {task.urgency === "high" ? "Urgent" : task.urgency === "medium" ? "Aandacht" : "Info"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{task.message}</p>
                            {task.dueDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Deadline: {format(new Date(task.dueDate), "d MMMM yyyy", { locale: nl })}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Per Pand Tab */}
          <TabsContent value="panden" className="mt-6">
            {properties.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nog geen panden</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {properties.map((property) => {
                  const streef = Number(property.vve_reserve_streef) || 0;
                  const huidig = Number(property.vve_reserve_huidig) || 0;
                  const percentage = streef > 0 ? (huidig / streef) * 100 : 0;
                  const propertyTasks = tasks.filter(t => t.propertyId === property.id);
                  const propertyOnderhoud = onderhoud.filter(o => o.property_id === property.id);

                  return (
                    <Card 
                      key={property.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/panden/${property.id}`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{property.naam}</CardTitle>
                          {propertyTasks.length > 0 && (
                            <Badge variant={propertyTasks.some(t => t.urgency === "high") ? "destructive" : "warning"}>
                              {propertyTasks.length} {propertyTasks.length === 1 ? "taak" : "taken"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{property.locatie}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Reserve Progress */}
                          {streef > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <PiggyBank className="w-3 h-3" />
                                  Reservepot
                                </span>
                                <span className="font-medium">{percentage.toFixed(0)}%</span>
                              </div>
                              <Progress 
                                value={Math.min(percentage, 100)} 
                                className={`h-2 ${percentage < 50 ? "[&>div]:bg-warning" : ""}`}
                              />
                              <p className="text-xs text-muted-foreground">
                                €{huidig.toLocaleString("nl-NL")} / €{streef.toLocaleString("nl-NL")}
                              </p>
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Wrench className="w-3 h-3" />
                              {propertyOnderhoud.length} onderhoudspunten
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              €{(Number(property.vve_maandbijdrage) || 0).toLocaleString("nl-NL")}/mnd
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Onderhoud Tab */}
          <TabsContent value="onderhoud" className="mt-6">
            {onderhoud.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wrench className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nog geen onderhoudspunten gepland</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Voeg onderhoudspunten toe via de VvE-module per pand
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {onderhoud.map((item) => {
                  const property = properties.find(p => p.id === item.property_id);
                  const dagenTot = item.volgend_onderhoud 
                    ? differenceInDays(new Date(item.volgend_onderhoud), new Date())
                    : null;

                  return (
                    <Card 
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/panden/${item.property_id}`)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                              dagenTot !== null && dagenTot <= 0 ? "bg-destructive/10 text-destructive" :
                              dagenTot !== null && dagenTot <= 30 ? "bg-warning/10 text-warning" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              <Wrench className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.element_naam}</span>
                                {dagenTot !== null && dagenTot <= 60 && (
                                  <Badge variant={dagenTot <= 0 ? "destructive" : dagenTot <= 30 ? "warning" : "secondary"}>
                                    {dagenTot <= 0 ? "Verlopen" : `${dagenTot} dagen`}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{property?.naam}</p>
                              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                {item.volgend_onderhoud && (
                                  <span>Gepland: {format(new Date(item.volgend_onderhoud), "d MMM yyyy", { locale: nl })}</span>
                                )}
                                {item.geschatte_kosten && item.geschatte_kosten > 0 && (
                                  <span>Kosten: €{item.geschatte_kosten.toLocaleString("nl-NL")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default VvEOverzicht;
