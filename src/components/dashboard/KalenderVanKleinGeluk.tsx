import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarHeart,
  PartyPopper,
  Trophy,
  Star,
  Clock,
  Building2,
  Check,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import type { Tables } from "@/integrations/supabase/types";

type Milestone = Tables<"milestones">;

interface KalenderVanKleinGelukProps {
  properties?: Array<{
    id: string;
    naam: string;
    aankoopdatum?: string | null;
  }>;
  payments?: Array<{
    property_id: string;
    datum: string;
    bedrag: number;
  }>;
}

export const KalenderVanKleinGeluk = ({
  properties = [],
  payments = [],
}: KalenderVanKleinGelukProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMilestones();
      checkAndCreateMilestones();
    }
  }, [user, properties, payments]);

  const fetchMilestones = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("milestones")
      .select("*")
      .eq("user_id", user.id)
      .order("datum", { ascending: false })
      .limit(10);

    if (!error && data) {
      setMilestones(data);
    }
    setLoading(false);
  };

  const checkAndCreateMilestones = async () => {
    if (!user) return;

    const today = new Date();
    const newMilestones: Omit<Milestone, "id" | "created_at">[] = [];

    // Check property anniversaries
    for (const property of properties) {
      if (property.aankoopdatum) {
        const purchaseDate = new Date(property.aankoopdatum);
        const yearsSincePurchase = today.getFullYear() - purchaseDate.getFullYear();
        
        // Check if today is the anniversary
        if (
          purchaseDate.getMonth() === today.getMonth() &&
          purchaseDate.getDate() === today.getDate() &&
          yearsSincePurchase > 0
        ) {
          // Check if we already have this milestone
          const existingMilestone = milestones.find(
            (m) =>
              m.property_id === property.id &&
              m.type === "anniversary" &&
              new Date(m.datum).getFullYear() === today.getFullYear()
          );

          if (!existingMilestone) {
            newMilestones.push({
              user_id: user.id,
              property_id: property.id,
              type: "anniversary",
              titel: `${yearsSincePurchase} jaar ${property.naam}`,
              beschrijving: `Vandaag ${yearsSincePurchase} jaar geleden kocht je ${property.naam}!`,
              datum: today.toISOString().split("T")[0],
              celebrated: false,
            });
          }
        }
      }
    }

    // Check payment streaks
    for (const property of properties) {
      const propertyPayments = payments.filter(
        (p) => p.property_id === property.id
      );
      
      // Count consecutive on-time payments (simplified logic)
      const paymentCount = propertyPayments.length;
      const milestoneNumbers = [10, 25, 50, 100, 200];
      
      for (const milestone of milestoneNumbers) {
        if (paymentCount >= milestone) {
          const existingMilestone = milestones.find(
            (m) =>
              m.property_id === property.id &&
              m.type === "payment_streak" &&
              m.titel.includes(`${milestone}e`)
          );

          if (!existingMilestone) {
            newMilestones.push({
              user_id: user.id,
              property_id: property.id,
              type: "payment_streak",
              titel: `${milestone}e huurbetaling ${property.naam}`,
              beschrijving: `Je hebt ${milestone} huurbetalingen ontvangen van ${property.naam}!`,
              datum: today.toISOString().split("T")[0],
              celebrated: false,
            });
          }
        }
      }
    }

    // Insert new milestones
    if (newMilestones.length > 0) {
      const { error } = await supabase.from("milestones").insert(newMilestones);

      if (!error) {
        fetchMilestones();
      }
    }
  };

  const handleCelebrate = async (milestone: Milestone) => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#4A6CF7", "#22c55e", "#f59e0b"],
    });

    // Mark as celebrated
    await supabase
      .from("milestones")
      .update({ celebrated: true })
      .eq("id", milestone.id);

    // Update local state
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestone.id ? { ...m, celebrated: true } : m))
    );

    toast({
      title: "🎉 Gefeliciteerd!",
      description: milestone.titel,
    });
  };

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case "anniversary":
        return <CalendarHeart className="w-5 h-5" />;
      case "payment_streak":
        return <Star className="w-5 h-5" />;
      case "goal_reached":
        return <Trophy className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getMilestoneColor = (type: string, celebrated: boolean) => {
    if (celebrated) return "bg-muted text-muted-foreground";
    switch (type) {
      case "anniversary":
        return "bg-primary/10 text-primary";
      case "payment_streak":
        return "bg-success/10 text-success";
      case "goal_reached":
        return "bg-warning/10 text-warning";
      default:
        return "bg-secondary text-foreground";
    }
  };

  const uncelebratedMilestones = milestones.filter((m) => !m.celebrated);
  const recentMilestones = milestones.slice(0, 5);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarHeart className="w-5 h-5 text-primary" />
          Kalender van Klein Geluk
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Uncelebrated Milestones */}
        {uncelebratedMilestones.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Te vieren 🎉
            </h4>
            {uncelebratedMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`p-4 rounded-lg ${getMilestoneColor(
                  milestone.type,
                  false
                )} animate-pulse`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center">
                      {getMilestoneIcon(milestone.type)}
                    </div>
                    <div>
                      <h5 className="font-semibold">{milestone.titel}</h5>
                      <p className="text-sm opacity-80">
                        {milestone.beschrijving}
                      </p>
                      <p className="text-xs opacity-60 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(milestone.datum).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCelebrate(milestone)}
                    className="gap-1 shrink-0"
                  >
                    <PartyPopper className="w-4 h-4" />
                    Vier!
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Milestones */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Recente mijlpalen
          </h4>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : recentMilestones.length > 0 ? (
            <div className="space-y-2">
              {recentMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`p-3 rounded-lg flex items-center gap-3 ${getMilestoneColor(
                    milestone.type,
                    milestone.celebrated || false
                  )}`}
                >
                  <div className="w-8 h-8 rounded-full bg-background/30 flex items-center justify-center">
                    {milestone.celebrated ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      getMilestoneIcon(milestone.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {milestone.titel}
                    </p>
                    <p className="text-xs opacity-70">
                      {new Date(milestone.datum).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nog geen mijlpalen</p>
              <p className="text-xs">
                Koop je eerste pand om mijlpalen te ontvangen!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
