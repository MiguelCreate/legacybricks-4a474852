import { useState, useEffect } from "react";
import { 
  Target, Plus, TrendingUp, Sparkles, CheckCircle2, 
  Calendar, Building2, Percent, PiggyBank 
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { adjustForInflation } from "@/lib/financialCalculations";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Goal = Tables<"goals">;
type Property = Tables<"properties">;

const Doelen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<Partial<TablesInsert<"goals">>>({
    naam: "",
    doelbedrag: 0,
    huidig_bedrag: 0,
    bron_property_id: null,
  });
  const [editFormData, setEditFormData] = useState<Partial<TablesInsert<"goals">>>({
    naam: "",
    doelbedrag: 0,
    huidig_bedrag: 0,
    bron_property_id: null,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [goalsRes, propertiesRes] = await Promise.all([
        supabase.from("goals").select("*").order("created_at", { ascending: false }),
        supabase.from("properties").select("*").eq("gearchiveerd", false),
      ]);

      if (goalsRes.error) throw goalsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;

      setGoals(goalsRes.data || []);
      setProperties(propertiesRes.data || []);
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

    if (!user) return;

    try {
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        naam: formData.naam || "",
        doelbedrag: formData.doelbedrag || 0,
        huidig_bedrag: formData.huidig_bedrag || 0,
        bron_property_id: formData.bron_property_id || null,
      });

      if (error) throw error;

      toast({
        title: "Doel toegevoegd",
        description: `${formData.naam} is succesvol toegevoegd.`,
      });

      setIsDialogOpen(false);
      setFormData({
        naam: "",
        doelbedrag: 0,
        huidig_bedrag: 0,
        bron_property_id: null,
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

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setEditFormData({
      naam: goal.naam,
      doelbedrag: Number(goal.doelbedrag),
      huidig_bedrag: Number(goal.huidig_bedrag),
      bron_property_id: goal.bron_property_id,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    try {
      const bereikt = Number(editFormData.huidig_bedrag) >= Number(editFormData.doelbedrag);
      const { error } = await supabase
        .from("goals")
        .update({
          naam: editFormData.naam,
          doelbedrag: editFormData.doelbedrag,
          huidig_bedrag: editFormData.huidig_bedrag,
          bron_property_id: editFormData.bron_property_id,
          bereikt,
        })
        .eq("id", editingGoal.id);

      if (error) throw error;

      if (bereikt && !editingGoal.bereikt) {
        toast({
          title: "🎉 Doel Bereikt!",
          description: `Gefeliciteerd! Je hebt "${editFormData.naam}" bereikt!`,
        });
      } else {
        toast({
          title: "Doel bijgewerkt",
          description: "De wijzigingen zijn opgeslagen.",
        });
      }

      setIsEditDialogOpen(false);
      setEditingGoal(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPropertyName = (propertyId: string | null) => {
    if (!propertyId) return null;
    return properties.find((p) => p.id === propertyId)?.naam;
  };

  const getPropertyById = (propertyId: string | null) => {
    if (!propertyId) return null;
    return properties.find((p) => p.id === propertyId);
  };

  const calculateMonthlySurplus = (property: Property | null) => {
    if (!property) return null;
    
    const monthlyIncome = Number(property.maandelijkse_huur || 0);
    const monthlyVve = Number(property.vve_maandbijdrage || 0);
    const monthlyCondominium = Number(property.condominium_maandelijks || 0);
    const monthlyInsurance = Number(property.verzekering_jaarlijks || 0) / 12;
    const monthlyMaintenance = Number(property.onderhoud_jaarlijks || 0) / 12;
    const monthlyGas = Number(property.gas_maandelijks || 0);
    const monthlyElectric = Number(property.elektriciteit_maandelijks || 0);
    const monthlyWater = Number(property.water_maandelijks || 0);
    
    const totalCosts = monthlyVve + monthlyCondominium + monthlyInsurance + monthlyMaintenance + monthlyGas + monthlyElectric + monthlyWater;
    
    return monthlyIncome - totalCosts;
  };

  const calculateMonthsToGoal = (goal: Goal) => {
    const remaining = Number(goal.doelbedrag) - Number(goal.huidig_bedrag);
    if (remaining <= 0) return 0;

    const property = properties.find((p) => p.id === goal.bron_property_id);
    if (!property) return null;

    const surplus = calculateMonthlySurplus(property);
    if (!surplus || surplus <= 0) return null;

    // Assume 10% of surplus goes to goal
    const monthlyContribution = surplus * 0.1;
    if (monthlyContribution <= 0) return null;

    return Math.ceil(remaining / monthlyContribution);
  };

  const activeGoals = goals.filter((g) => !g.bereikt);
  const completedGoals = goals.filter((g) => g.bereikt);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Doelen & Spaarplan
                </h1>
                <InfoTooltip
                  title="Doelenbeheer"
                  content="Stel financiële doelen en koppel ze aan je vastgoedopbrengsten. De app berekent automatisch wanneer je je doel bereikt."
                />
              </div>
              <p className="text-muted-foreground mt-1">
                {activeGoals.length} actieve doelen • {completedGoals.length} bereikt
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="gradient-primary text-primary-foreground gap-2"
            >
              <Plus className="w-4 h-4" />
              Nieuw Doel
            </Button>
          </div>
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8 space-y-8">
          {/* Active Goals */}
          <section>
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Actieve Doelen
            </h2>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />
                ))}
              </div>
            ) : activeGoals.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border">
                <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Nog geen doelen</h3>
                <p className="text-muted-foreground mb-4">
                  Stel je eerste doel in om je voortgang te volgen
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Eerste doel maken
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {activeGoals.map((goal, index) => {
                  const progress = (Number(goal.huidig_bedrag) / Number(goal.doelbedrag)) * 100;
                  const monthsToGoal = calculateMonthsToGoal(goal);
                  const linkedProperty = getPropertyById(goal.bron_property_id);
                  const monthlySurplus = calculateMonthlySurplus(linkedProperty);
                  const inflationAdjusted = adjustForInflation(
                    Number(goal.doelbedrag),
                    monthsToGoal ? monthsToGoal / 12 : 1
                  );

                  return (
                    <div
                      key={goal.id}
                      className="p-5 bg-card rounded-xl border shadow-card animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{goal.naam}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            {Math.round(progress)}%
                          </p>
                        </div>
                      </div>

                      <Progress value={progress} className="h-3 mb-4" />

                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-muted-foreground">
                          €{Number(goal.huidig_bedrag).toLocaleString()}
                        </span>
                        <span className="font-medium text-foreground">
                          €{Number(goal.doelbedrag).toLocaleString()}
                        </span>
                      </div>

                      {/* Linked Property Info */}
                      <div className="p-3 bg-muted/50 rounded-lg mb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span className="text-muted-foreground">Bronpand:</span>
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {linkedProperty?.naam || "Geen gekoppeld"}
                          </span>
                        </div>
                        {linkedProperty && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <TrendingUp className="w-4 h-4 text-success" />
                              <span className="text-muted-foreground">Maandelijks overschot:</span>
                            </div>
                            <span className={`text-sm font-medium ${monthlySurplus && monthlySurplus >= 0 ? 'text-success' : 'text-destructive'}`}>
                              €{monthlySurplus?.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        {monthsToGoal !== null ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>~{monthsToGoal} maanden</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Percent className="w-4 h-4" />
                            <span>Koppel een bron voor schatting</span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(goal)}
                        >
                          Bewerken
                        </Button>
                      </div>

                      {monthsToGoal && monthsToGoal > 12 && (
                        <div className="mt-3 p-2 bg-accent/50 rounded-lg text-xs text-muted-foreground">
                          <InfoTooltip
                            title="Inflatie-aanpassing"
                            content="Bij doelen >1 jaar wordt rekening gehouden met 2,5% jaarlijkse inflatie."
                          />
                          <span className="ml-1">
                            Inflatie-aangepast doel: €{inflationAdjusted.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <section>
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-success" />
                Bereikte Doelen
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                {completedGoals.map((goal, index) => (
                  <div
                    key={goal.id}
                    className="p-4 bg-success/5 rounded-xl border border-success/20 animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{goal.naam}</h3>
                        <p className="text-sm text-success">
                          €{Number(goal.doelbedrag).toLocaleString()} bereikt!
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nieuw Doel Toevoegen</DialogTitle>
            <DialogDescription>
              Stel een financieel doel en koppel het optioneel aan een pand
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="naam">Doelnaam *</Label>
              <Input
                id="naam"
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                placeholder="bijv. Noodfonds, Nieuwe keuken"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doelbedrag">
                  Doelbedrag (€) *
                  <InfoTooltip
                    title="Doelbedrag"
                    content="Het totale bedrag dat je wilt sparen voor dit doel."
                  />
                </Label>
                <Input
                  id="doelbedrag"
                  type="number"
                  min="0"
                  value={formData.doelbedrag || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, doelbedrag: Number(e.target.value) })
                  }
                  placeholder="10000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="huidig_bedrag">Huidige stand (€)</Label>
                <Input
                  id="huidig_bedrag"
                  type="number"
                  min="0"
                  value={formData.huidig_bedrag || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, huidig_bedrag: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Bronpand (optioneel)
                <InfoTooltip
                  title="Bronpand"
                  content="Koppel dit doel aan een pand. De app gebruikt dan de huurinkomsten om te berekenen wanneer je je doel bereikt."
                />
              </Label>
              <Select
                value={formData.bron_property_id || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    bron_property_id: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een pand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen pand gekoppeld</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.naam}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Doel Bewerken</DialogTitle>
            <DialogDescription>
              Pas de gegevens van je doel aan
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-naam">Doelnaam *</Label>
              <Input
                id="edit-naam"
                value={editFormData.naam}
                onChange={(e) => setEditFormData({ ...editFormData, naam: e.target.value })}
                placeholder="bijv. Noodfonds, Nieuwe keuken"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-doelbedrag">
                  Doelbedrag (€) *
                </Label>
                <Input
                  id="edit-doelbedrag"
                  type="number"
                  min="0"
                  value={editFormData.doelbedrag || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, doelbedrag: Number(e.target.value) })
                  }
                  placeholder="10000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-huidig_bedrag">Huidige stand (€)</Label>
                <Input
                  id="edit-huidig_bedrag"
                  type="number"
                  min="0"
                  value={editFormData.huidig_bedrag || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, huidig_bedrag: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Bronpand (optioneel)
                <InfoTooltip
                  title="Bronpand"
                  content="Koppel dit doel aan een pand. De app gebruikt dan de huurinkomsten om te berekenen wanneer je je doel bereikt."
                />
              </Label>
              <Select
                value={editFormData.bron_property_id || "none"}
                onValueChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    bron_property_id: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een pand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen pand gekoppeld</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.naam}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button type="submit" className="flex-1 gradient-primary text-primary-foreground">
                Opslaan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Doelen;
