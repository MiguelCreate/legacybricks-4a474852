import { useState, useEffect, useMemo } from "react";
import { 
  Target, CheckCircle2, Clock, FileText, Wrench, Calendar, 
  AlertTriangle, ExternalLink, Lightbulb, TrendingUp, DollarSign,
  Zap, Shield, Users, BarChart3, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "../ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays, format, differenceInMonths } from "date-fns";
import { nl } from "date-fns/locale";

interface SmartMission {
  id: string;
  title: string;
  description: string;
  type: "contract" | "maintenance" | "document" | "payment" | "optimization" | "risk" | "opportunity";
  priority: "high" | "medium" | "low";
  dueDate?: string;
  actionUrl?: string;
  completed: boolean;
  impact?: string;
  aiGenerated?: boolean;
}

interface PortfolioData {
  totalProperties: number;
  totalMonthlyRent: number;
  avgYield: number;
  propertiesWithIssues: number;
  underperformingProperties: string[];
  expiredDocuments: number;
  upcomingMaintenance: number;
}

export const SmartMissionsAdvanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<SmartMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (user) {
      generateAdvancedMissions();
    }
  }, [user]);

  const generateAdvancedMissions = async () => {
    try {
      const [contractsRes, propertiesRes, featuresRes, roomFeaturesRes, loansRes, tenantsRes] = await Promise.all([
        supabase.from("contracts").select("*, properties(naam, id)").order("einddatum"),
        supabase.from("properties").select("*").eq("gearchiveerd", false),
        supabase.from("property_features").select("*, properties!inner(naam, user_id)").neq("onderhoudsbehoefte", "geen"),
        supabase.from("room_features").select("*, rooms!inner(naam, properties!inner(naam, user_id))").neq("onderhoudsbehoefte", "geen"),
        supabase.from("loans").select("*"),
        supabase.from("tenants").select("*").eq("actief", true),
      ]);

      const generatedMissions: SmartMission[] = [];
      const today = new Date();
      const currentYear = today.getFullYear();
      const properties = propertiesRes.data || [];
      
      // Calculate portfolio metrics
      const totalMonthlyRent = properties.reduce((sum, p) => sum + Number(p.maandelijkse_huur || 0), 0);
      const avgYield = properties.length > 0 
        ? properties.reduce((sum, p) => {
            const rent = Number(p.maandelijkse_huur || 0) * 12;
            const price = Number(p.aankoopprijs || 1);
            return sum + (rent / price) * 100;
          }, 0) / properties.length
        : 0;
      
      setPortfolioData({
        totalProperties: properties.length,
        totalMonthlyRent,
        avgYield,
        propertiesWithIssues: 0,
        underperformingProperties: [],
        expiredDocuments: 0,
        upcomingMaintenance: (featuresRes.data?.length || 0) + (roomFeaturesRes.data?.length || 0),
      });

      // === STANDARD MISSIONS ===

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
            impact: "Risico op leegstand",
          });
        }
      });

      // Maintenance missions
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
            impact: isOverdue ? "Kan waarde beïnvloeden" : undefined,
          });
        }
      });

      // Document expiring missions
      properties.forEach((property: any) => {
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
              impact: "Vereist voor verhuur",
            });
          }
        }
        
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
              impact: "Risico onverzekerd",
            });
          }
        }
      });

      // === AI-POWERED OPTIMIZATION SUGGESTIONS ===

      // Underperforming properties (yield < 4%)
      properties.forEach((property: any) => {
        const rent = Number(property.maandelijkse_huur || 0) * 12;
        const price = Number(property.aankoopprijs || 1);
        const yield_pct = (rent / price) * 100;
        
        if (yield_pct < 4 && yield_pct > 0) {
          generatedMissions.push({
            id: `opt-yield-${property.id}`,
            title: `Rendement optimaliseren: ${property.naam}`,
            description: `Huidig rendement ${yield_pct.toFixed(1)}% ligt onder marktgemiddelde`,
            type: "optimization",
            priority: "medium",
            actionUrl: `/panden/${property.id}`,
            completed: false,
            impact: `+€${Math.round((rent * 0.2) / 12)}/maand potentieel`,
            aiGenerated: true,
          });
        }
      });

      // Properties with low health score
      properties.forEach((property: any) => {
        if (property.gezondheidsscore && property.gezondheidsscore < 5) {
          generatedMissions.push({
            id: `risk-health-${property.id}`,
            title: `Gezondheidsscore verbeteren: ${property.naam}`,
            description: `Score: ${property.gezondheidsscore}/10 - Actie aanbevolen`,
            type: "risk",
            priority: property.gezondheidsscore < 3 ? "high" : "medium",
            actionUrl: `/panden/${property.id}`,
            completed: false,
            impact: "Waardeverlies voorkomen",
            aiGenerated: true,
          });
        }
      });

      // Refinancing opportunity (high interest rates)
      const highRateLoans = (loansRes.data || []).filter(
        (loan: any) => Number(loan.rente_percentage || 0) > 5
      );
      if (highRateLoans.length > 0) {
        const potentialSavings = highRateLoans.reduce((sum: number, loan: any) => {
          const principal = Number(loan.hoofdsom || loan.restschuld || 0);
          const currentRate = Number(loan.rente_percentage || 0);
          const potentialRate = 3.5; // Assume market rate
          return sum + (principal * (currentRate - potentialRate) / 100 / 12);
        }, 0);
        
        generatedMissions.push({
          id: `opt-refinance`,
          title: `Herfinanciering overwegen`,
          description: `${highRateLoans.length} lening(en) met hoge rente gevonden`,
          type: "opportunity",
          priority: "medium",
          actionUrl: "/financien",
          completed: false,
          impact: `Potentieel €${Math.round(potentialSavings)}/maand besparen`,
          aiGenerated: true,
        });
      }

      // Portfolio diversification suggestion
      if (properties.length >= 3) {
        const locations = [...new Set(properties.map((p: any) => p.locatie))];
        if (locations.length === 1) {
          generatedMissions.push({
            id: `opt-diversify`,
            title: `Geografische spreiding overwegen`,
            description: `Alle ${properties.length} panden in dezelfde locatie`,
            type: "opportunity",
            priority: "low",
            actionUrl: "/analysator",
            completed: false,
            impact: "Risicospreiding verbeteren",
            aiGenerated: true,
          });
        }
      }

      // Rent increase opportunity (no increase in 12+ months)
      properties.forEach((property: any) => {
        const monthsSinceUpdate = differenceInMonths(today, new Date(property.updated_at));
        if (monthsSinceUpdate > 12 && Number(property.maandelijkse_huur || 0) > 0) {
          const currentRent = Number(property.maandelijkse_huur);
          const suggestedIncrease = currentRent * 0.03; // 3% increase
          
          generatedMissions.push({
            id: `opt-rent-${property.id}`,
            title: `Huurverhoging evalueren: ${property.naam}`,
            description: `Geen aanpassing in ${monthsSinceUpdate} maanden`,
            type: "opportunity",
            priority: "low",
            actionUrl: `/panden/${property.id}`,
            completed: false,
            impact: `+€${Math.round(suggestedIncrease)}/maand mogelijk`,
            aiGenerated: true,
          });
        }
      });

      // Sort by priority and type
      generatedMissions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const typeOrder = { contract: 0, document: 1, maintenance: 2, risk: 3, optimization: 4, opportunity: 5, payment: 6 };
        
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return typeOrder[a.type] - typeOrder[b.type];
      });

      setMissions(generatedMissions);
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
      case "optimization": return TrendingUp;
      case "risk": return Shield;
      case "opportunity": return Lightbulb;
      default: return Target;
    }
  };

  const getTypeColor = (type: SmartMission["type"]) => {
    switch (type) {
      case "contract": return "text-blue-500";
      case "maintenance": return "text-orange-500";
      case "document": return "text-purple-500";
      case "optimization": return "text-green-500";
      case "risk": return "text-red-500";
      case "opportunity": return "text-yellow-500";
      default: return "text-muted-foreground";
    }
  };

  const displayedMissions = useMemo(() => {
    const notCompleted = missions.filter(m => !completedIds.has(m.id));
    return showAll ? notCompleted : notCompleted.slice(0, 5);
  }, [missions, completedIds, showAll]);

  const completedCount = completedIds.size;
  const aiMissionsCount = missions.filter(m => m.aiGenerated).length;

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
          <h2 className="font-semibold text-foreground">Slimme Acties</h2>
          <InfoTooltip
            title="Slimme Acties"
            content="Acties worden automatisch gegenereerd op basis van deadlines, onderhoud, en AI-analyse van uw portfolio voor optimalisatie-kansen."
          />
          {aiMissionsCount > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Sparkles className="w-3 h-3" />
              {aiMissionsCount} AI
            </Badge>
          )}
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

      {/* Mission categories */}
      <div className="flex flex-wrap gap-1 mb-4">
        {['high', 'medium', 'low'].map((priority) => {
          const count = missions.filter(m => m.priority === priority && !completedIds.has(m.id)).length;
          if (count === 0) return null;
          return (
            <Badge 
              key={priority} 
              variant={priority === 'high' ? 'destructive' : priority === 'medium' ? 'warning' : 'secondary'}
              className="text-xs"
            >
              {count} {priority === 'high' ? 'urgent' : priority === 'medium' ? 'belangrijk' : 'optioneel'}
            </Badge>
          );
        })}
      </div>

      <div className="space-y-2">
        {displayedMissions.map((mission) => {
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
                  : mission.aiGenerated
                  ? "bg-primary/5 border border-primary/20 hover:bg-primary/10"
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
                <div className="flex items-center gap-2 flex-wrap">
                  <Icon className={`w-3 h-3 ${getTypeColor(mission.type)}`} />
                  <p
                    className={`font-medium text-sm ${
                      isCompleted
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {mission.title}
                  </p>
                  {mission.aiGenerated && (
                    <Sparkles className="w-3 h-3 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {mission.description}
                </p>
                {mission.impact && !isCompleted && (
                  <p className="text-xs text-primary mt-1 font-medium">
                    💡 {mission.impact}
                  </p>
                )}
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

      {missions.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Minder tonen' : `Alle ${missions.length - completedCount} acties tonen`}
        </Button>
      )}
    </div>
  );
};
