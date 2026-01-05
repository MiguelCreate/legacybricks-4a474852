import { useState, useEffect } from "react";
import { Target, Plus, Sparkles, CheckCircle2, Trash2, Sliders } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

// New components
import { GoalCard } from "@/components/doelen/GoalCard";
import { GoalFormDialog } from "@/components/doelen/GoalFormDialog";
import { ImpactDashboard } from "@/components/doelen/ImpactDashboard";
import { SmartSuggestions } from "@/components/doelen/SmartSuggestions";
import { ScenarioComparison } from "@/components/doelen/ScenarioComparison";
import { GOAL_TYPES, type GoalType } from "@/components/doelen/goalTypes";
import { calculatePropertySurplus } from "@/components/doelen/useGoalCalculations";

type Goal = Tables<"goals">;
type Property = Tables<"properties">;
type Loan = Tables<"loans">;
type Profile = Tables<"profiles">;
type Tenant = Tables<"tenants">;

const Doelen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [scenarioGoal, setScenarioGoal] = useState<Goal | null>(null);
  const [suggestedType, setSuggestedType] = useState<GoalType | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [goalsRes, propertiesRes, loansRes, tenantsRes, profileRes] = await Promise.all([
        supabase.from("goals").select("*").order("prioriteit", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("properties").select("*").eq("gearchiveerd", false),
        supabase.from("loans").select("*"),
        supabase.from("tenants").select("*").eq("actief", true),
        supabase.from("profiles").select("*").maybeSingle(),
      ]);

      if (goalsRes.error) throw goalsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (loansRes.error) throw loansRes.error;
      if (tenantsRes.error) throw tenantsRes.error;

      setGoals(goalsRes.data || []);
      setProperties(propertiesRes.data || []);
      setLoans(loansRes.data || []);
      setTenants(tenantsRes.data || []);
      setProfile(profileRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Fout", description: "Kon gegevens niet laden", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Partial<TablesInsert<"goals">>) => {
    if (!user) return;

    try {
      if (formMode === "create") {
        const { error } = await supabase.from("goals").insert({
          user_id: user.id,
          naam: formData.naam || "",
          doelbedrag: formData.doelbedrag || 0,
          huidig_bedrag: formData.huidig_bedrag || 0,
          bron_property_id: formData.bron_property_id || null,
          doel_type: formData.doel_type || "overig",
          categorie: formData.categorie || "persoonlijk",
          prioriteit: formData.prioriteit || "middel",
          flexibiliteit: formData.flexibiliteit || "adaptief",
          maandelijkse_inleg: formData.maandelijkse_inleg || 0,
          start_datum: formData.start_datum || new Date().toISOString().split("T")[0],
          eind_datum: formData.eind_datum || null,
          notities: formData.notities || null,
          gepauzeerd: false,
        });
        if (error) throw error;
        toast({ title: "Doel toegevoegd", description: `${formData.naam} is succesvol toegevoegd.` });
      } else if (editingGoal) {
        const bereikt = Number(formData.huidig_bedrag) >= Number(formData.doelbedrag);
        const { error } = await supabase.from("goals").update({
          ...formData,
          bereikt,
        }).eq("id", editingGoal.id);
        if (error) throw error;
        
        if (bereikt && !editingGoal.bereikt) {
          toast({ title: "🎉 Doel Bereikt!", description: `Gefeliciteerd! Je hebt "${formData.naam}" bereikt!` });
        } else {
          toast({ title: "Doel bijgewerkt", description: "De wijzigingen zijn opgeslagen." });
        }
      }
      
      setIsFormOpen(false);
      setEditingGoal(null);
      setSuggestedType(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleDelete = async (goal: Goal) => {
    if (!confirm(`Weet je zeker dat je "${goal.naam}" wilt verwijderen?`)) return;
    try {
      const { error } = await supabase.from("goals").delete().eq("id", goal.id);
      if (error) throw error;
      toast({ title: "Doel verwijderd", description: `"${goal.naam}" is verwijderd.` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleTogglePause = async (goal: Goal) => {
    try {
      const { error } = await supabase.from("goals").update({ gepauzeerd: !goal.gepauzeerd }).eq("id", goal.id);
      if (error) throw error;
      toast({ title: goal.gepauzeerd ? "Doel hervat" : "Doel gepauzeerd" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleSuggestGoal = (type: GoalType) => {
    setSuggestedType(type);
    setFormMode("create");
    setEditingGoal(null);
    setIsFormOpen(true);
  };

  const handleScenarioApply = async (changes: Partial<Goal>) => {
    if (!scenarioGoal) return;
    try {
      const { error } = await supabase.from("goals").update(changes).eq("id", scenarioGoal.id);
      if (error) throw error;
      toast({ title: "Wijzigingen toegepast" });
      setScenarioGoal(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const calculateGoalMetrics = (goal: Goal) => {
    const property = properties.find(p => p.id === goal.bron_property_id);
    const surplus = property ? calculatePropertySurplus(property, loans, tenants) : null;
    const remaining = Number(goal.doelbedrag) - Number(goal.huidig_bedrag);
    const monthlyInleg = Number(goal.maandelijkse_inleg || 0);
    const propertySurplus = surplus && surplus > 0 ? surplus * 0.1 : 0;
    const totalContribution = monthlyInleg + propertySurplus;
    const monthsToGoal = totalContribution > 0 ? Math.ceil(remaining / totalContribution) : null;
    const estimatedEndDate = monthsToGoal ? new Date(Date.now() + monthsToGoal * 30 * 24 * 60 * 60 * 1000) : null;
    
    // Conflict detection
    const conflictWarnings: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";
    
    const activeGoalsExcludingCurrent = goals.filter(g => !g.bereikt && g.id !== goal.id && !g.gepauzeerd);
    
    // Calculate total property surplus (using consistent calculation with tenants)
    const totalPropertySurplus = properties.reduce((sum, p) => sum + calculatePropertySurplus(p, loans, tenants), 0);
    
    // Calculate total commitments
    const totalCommitments = activeGoalsExcludingCurrent.reduce((sum, g) => sum + Number(g.maandelijkse_inleg || 0), 0) + monthlyInleg;
    
    // Check commitment ratio
    if (totalPropertySurplus > 0 && totalCommitments > totalPropertySurplus * 0.5) {
      conflictWarnings.push("Je committeert meer dan 50% van je overschot aan doelen");
      riskLevel = "medium";
    }
    if (totalPropertySurplus > 0 && totalCommitments > totalPropertySurplus * 0.8) {
      conflictWarnings.push("Je committeert bijna al je overschot - let op je liquiditeit!");
      riskLevel = "high";
    }
    
    // Check for missing noodbuffer
    const hasNoodbuffer = goals.some(g => g.doel_type === "noodbuffer" && (g.bereikt || Number(g.huidig_bedrag) >= Number(g.doelbedrag) * 0.5));
    const isBuyingProperty = goal.doel_type === "eerste_pand" || goal.doel_type === "volgend_pand";
    if (isBuyingProperty && !hasNoodbuffer) {
      conflictWarnings.push("Tip: Zorg eerst voor een noodbuffer voordat je een pand koopt");
    }
    
    // Check deadline
    if (goal.eind_datum && estimatedEndDate) {
      const targetDate = new Date(goal.eind_datum);
      if (estimatedEndDate > targetDate) {
        conflictWarnings.push("Huidige inleg haalt de deadline niet - verhoog je inleg");
        riskLevel = "high";
      }
    }
    
    // Check for conflicting high-priority goals
    const highPriorityGoals = activeGoalsExcludingCurrent.filter(g => g.prioriteit === "hoog");
    if (goal.prioriteit === "hoog" && highPriorityGoals.length >= 2) {
      conflictWarnings.push("Veel doelen met hoge prioriteit - overweeg te focussen");
    }
    
    // Check for liquidity vs investment conflict
    const hasLiquidityGoal = goals.some(g => (g.doel_type === "noodbuffer" || g.doel_type === "leegstand_buffer") && !g.bereikt);
    const isInvestmentGoal = ["eerste_pand", "volgend_pand", "renovatie", "fire"].includes(goal.doel_type || "");
    if (isInvestmentGoal && !hasLiquidityGoal && properties.length > 0) {
      conflictWarnings.push("Overweeg eerst een buffer aan te leggen voor je investeert");
    }
    
    return { surplus, monthsToGoal, estimatedEndDate, conflictWarnings, riskLevel };
  };

  const activeGoals = goals.filter(g => !g.bereikt);
  const completedGoals = goals.filter(g => g.bereikt);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Doelen & Spaarplan</h1>
                <InfoTooltip title="Levens- & Vermogensplanner" content="Plan je financiële toekomst met doelen voor vastgoed, vermogen en persoonlijke wensen. De app berekent automatisch je voortgang en waarschuwt bij conflicten." />
              </div>
              <p className="text-muted-foreground mt-1">{activeGoals.length} actieve doelen • {completedGoals.length} bereikt</p>
            </div>
            <Button onClick={() => { setFormMode("create"); setEditingGoal(null); setSuggestedType(null); setIsFormOpen(true); }} className="gradient-primary text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />Nieuw Doel
            </Button>
          </div>
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8 space-y-8">
          {/* Impact Dashboard */}
          <ImpactDashboard goals={goals} properties={properties} loans={loans} tenants={tenants} />

          {/* Smart Suggestions */}
          <SmartSuggestions goals={goals} properties={properties} profile={profile} onSuggestGoal={handleSuggestGoal} />

          {/* Active Goals */}
          <section>
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />Actieve Doelen
            </h2>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />)}
              </div>
            ) : activeGoals.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border">
                <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Nog geen doelen</h3>
                <p className="text-muted-foreground mb-4">Stel je eerste doel in om je voortgang te volgen</p>
                <Button onClick={() => setIsFormOpen(true)}><Plus className="w-4 h-4 mr-2" />Eerste doel maken</Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {activeGoals.map(goal => {
                  const metrics = calculateGoalMetrics(goal);
                  return (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      properties={properties}
                      monthlySurplus={metrics.surplus}
                      monthsToGoal={metrics.monthsToGoal}
                      estimatedEndDate={metrics.estimatedEndDate}
                      conflictWarnings={metrics.conflictWarnings}
                      riskLevel={metrics.riskLevel}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTogglePause={handleTogglePause}
                      onScenario={setScenarioGoal}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <section>
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-success" />Bereikte Doelen
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {completedGoals.map(goal => (
                  <div key={goal.id} className="p-4 bg-success/5 rounded-xl border border-success/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{goal.naam}</h3>
                          <p className="text-sm text-success">€{Number(goal.doelbedrag).toLocaleString()} bereikt!</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(goal)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <GoalFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        properties={properties}
        editingGoal={editingGoal}
        onSubmit={handleSubmit}
        mode={formMode}
      />

      {/* Scenario Comparison */}
      {scenarioGoal && (
        <ScenarioComparison
          goal={scenarioGoal}
          properties={properties}
          open={!!scenarioGoal}
          onOpenChange={(open) => !open && setScenarioGoal(null)}
          onApplyChanges={handleScenarioApply}
        />
      )}
    </AppLayout>
  );
};

export default Doelen;
