import { useState, useEffect } from "react";
import { Target, CheckCircle2, Clock, FileText, Wrench, Calendar, AlertTriangle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InfoTooltip } from "../ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays, format } from "date-fns";
import { nl } from "date-fns/locale";

interface SmartMission {
  id: string;
  title: string;
  description: string;
  type: "contract" | "maintenance" | "document" | "payment" | "general";
  priority: "high" | "medium" | "low";
  dueDate?: string;
  actionUrl?: string;
  completed: boolean;
}

export const SmartMissions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<SmartMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      generateMissions();
    }
  }, [user]);

  const generateMissions = async () => {
    try {
      const [contractsRes, propertiesRes, featuresRes, roomFeaturesRes] = await Promise.all([
        supabase.from("contracts").select("*, properties(naam)").order("einddatum"),
        supabase.from("properties").select("*").eq("gearchiveerd", false),
        supabase.from("property_features").select("*, properties!inner(naam, user_id)").neq("onderhoudsbehoefte", "geen"),
        supabase.from("room_features").select("*, rooms!inner(naam, properties!inner(naam, user_id))").neq("onderhoudsbehoefte", "geen"),
      ]);

      const generatedMissions: SmartMission[] = [];
      const today = new Date();
      const currentYear = today.getFullYear();

      // Contract expiring missions
      (contractsRes.data || []).forEach((contract: any) => {
        const daysUntil = differenceInDays(new Date(contract.einddatum), today);
        if (daysUntil >= 0 && daysUntil <= 60) {
          generatedMissions.push({
            id: `contract-${contract.id}`,
            title: `Contract verloopt: ${contract.properties?.naam || "Pand"}`,
            description: `Nog ${daysUntil} dagen tot ${format(new Date(contract.einddatum), "d MMMM", { locale: nl })}`,
            type: "contract",
            priority: daysUntil <= 30 ? "high" : "medium",
            dueDate: contract.einddatum,
            actionUrl: "/contracten",
            completed: false,
          });
        }
      });

      // Maintenance missions - property level
      (featuresRes.data || []).forEach((feature: any) => {
        if (feature.gepland_onderhoudsjaar && feature.gepland_onderhoudsjaar <= currentYear) {
          const isOverdue = feature.gepland_onderhoudsjaar < currentYear;
          generatedMissions.push({
            id: `maint-prop-${feature.id}`,
            title: `${feature.onderhoudsbehoefte === "groot" ? "Groot" : "Licht"} onderhoud: ${feature.naam}`,
            description: `${feature.properties?.naam} - ${isOverdue ? "Achterstallig!" : `Gepland in ${feature.gepland_onderhoudsjaar}`}`,
            type: "maintenance",
            priority: isOverdue || feature.onderhoudsbehoefte === "groot" ? "high" : "medium",
            actionUrl: "/panden",
            completed: false,
          });
        }
      });

      // Maintenance missions - room level
      (roomFeaturesRes.data || []).forEach((feature: any) => {
        if (feature.gepland_onderhoudsjaar && feature.gepland_onderhoudsjaar <= currentYear) {
          const isOverdue = feature.gepland_onderhoudsjaar < currentYear;
          generatedMissions.push({
            id: `maint-room-${feature.id}`,
            title: `${feature.onderhoudsbehoefte === "groot" ? "Groot" : "Licht"} onderhoud: ${feature.naam}`,
            description: `${feature.rooms?.properties?.naam} - ${feature.rooms?.naam} - ${isOverdue ? "Achterstallig!" : `Gepland in ${feature.gepland_onderhoudsjaar}`}`,
            type: "maintenance",
            priority: isOverdue || feature.onderhoudsbehoefte === "groot" ? "high" : "medium",
            actionUrl: "/panden",
            completed: false,
          });
        }
      });

      // Document expiring missions
      (propertiesRes.data || []).forEach((property: any) => {
        // Energy certificate
        if (property.energie_vervaldatum) {
          const daysUntil = differenceInDays(new Date(property.energie_vervaldatum), today);
          if (daysUntil >= 0 && daysUntil <= 90) {
            generatedMissions.push({
              id: `doc-energy-${property.id}`,
              title: `Energielabel verloopt: ${property.naam}`,
              description: `Nog ${daysUntil} dagen geldig`,
              type: "document",
              priority: daysUntil <= 30 ? "high" : "medium",
              dueDate: property.energie_vervaldatum,
              actionUrl: `/panden/${property.id}`,
              completed: false,
            });
          }
        }
        
        // Insurance
        if (property.gebouw_verzekering_vervaldatum) {
          const daysUntil = differenceInDays(new Date(property.gebouw_verzekering_vervaldatum), today);
          if (daysUntil >= 0 && daysUntil <= 60) {
            generatedMissions.push({
              id: `doc-insurance-${property.id}`,
              title: `Verzekering verloopt: ${property.naam}`,
              description: `Nog ${daysUntil} dagen geldig`,
              type: "document",
              priority: daysUntil <= 30 ? "high" : "medium",
              dueDate: property.gebouw_verzekering_vervaldatum,
              actionUrl: `/panden/${property.id}`,
              completed: false,
            });
          }
        }
      });

      // Sort by priority and due date
      generatedMissions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      });

      setMissions(generatedMissions.slice(0, 5)); // Max 5 missions
    } catch (error) {
      console.error("Error generating missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = (id: string) => {
    setCompletedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getIcon = (type: SmartMission["type"]) => {
    switch (type) {
      case "contract": return FileText;
      case "maintenance": return Wrench;
      case "document": return Calendar;
      default: return Target;
    }
  };

  const completedCount = completedIds.size;

  if (loading) {
    return <div className="bg-card rounded-xl border shadow-card p-5 animate-pulse h-48" />;
  }

  if (missions.length === 0) {
    return (
      <div className="bg-card rounded-xl border shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-success/10">
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <h2 className="font-semibold text-foreground">Alles op orde!</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Er zijn geen urgente acties op dit moment. Goed bezig!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg gradient-primary">
            <Target className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="font-semibold text-foreground">Acties</h2>
          <InfoTooltip
            title="Slimme Acties"
            content="Deze acties worden automatisch gegenereerd op basis van verloopdatums, gepland onderhoud, en andere belangrijke deadlines."
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{missions.length} afgehandeld
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full mb-4 overflow-hidden">
        <div
          className="h-full gradient-primary rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / missions.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {missions.map((mission) => {
          const Icon = getIcon(mission.type);
          const isCompleted = completedIds.has(mission.id);

          return (
            <div
              key={mission.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                isCompleted
                  ? "bg-success/5 border border-success/20"
                  : mission.priority === "high"
                  ? "bg-destructive/5 border border-destructive/20 hover:bg-destructive/10"
                  : "bg-secondary/50 hover:bg-secondary border border-transparent"
              }`}
              onClick={() => mission.actionUrl && navigate(mission.actionUrl)}
            >
              <button
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  isCompleted
                    ? "bg-success border-success text-success-foreground"
                    : mission.priority === "high"
                    ? "border-destructive/50 hover:border-destructive"
                    : "border-muted-foreground/30 hover:border-primary"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleComplete(mission.id);
                }}
              >
                {isCompleted && <CheckCircle2 className="w-3 h-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3 h-3 ${mission.priority === "high" && !isCompleted ? "text-destructive" : "text-muted-foreground"}`} />
                  <p
                    className={`font-medium text-sm ${
                      isCompleted
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {mission.title}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {mission.description}
                </p>
              </div>
              {mission.priority === "high" && !isCompleted && (
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
              )}
              {mission.actionUrl && (
                <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
