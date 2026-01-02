import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Lock, Star, Trophy, Sparkles, Target, Snowflake, Sunset } from "lucide-react";
import { lessons } from "./academyData";

interface AcademyBadgesProps {
  earnedBadges: string[];
  completedLessons: string[];
}

const allBadges = [
  { id: "eerste-huurberekening", name: "Eerste Huurberekening!", icon: "💰", description: "Bruto vs Netto begrepen" },
  { id: "bar-meester", name: "BAR Meester", icon: "📊", description: "BAR berekening onder de knie" },
  { id: "dscr-meester", name: "DSCR Meester!", icon: "🎯", description: "Cash-on-Cash berekend" },
  { id: "sneeuwbal-strateeg", name: "Sneeuwbal Strateeg", icon: "❄️", description: "Sneeuwbalstrategie geleerd" },
  { id: "pensioengat-gesloten", name: "Pensioengat Gesloten!", icon: "🌅", description: "Pensioenplanning gemaakt" },
  { id: "level_beginner_complete", name: "Beginner Voltooid", icon: "🌱", description: "Alle beginner lessen afgerond" },
  { id: "level_gevorderd_complete", name: "Gevorderd Voltooid", icon: "🚀", description: "Alle gevorderde lessen afgerond" },
  { id: "level_professional_complete", name: "Professional Voltooid", icon: "👑", description: "Alle professional lessen afgerond" },
];

export const AcademyBadges = ({ earnedBadges, completedLessons }: AcademyBadgesProps) => {
  const earned = allBadges.filter(b => earnedBadges.includes(b.id));
  const locked = allBadges.filter(b => !earnedBadges.includes(b.id));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-amber-500" />
          Jouw Badges
          <Badge variant="secondary" className="ml-2">
            {earned.length}/{allBadges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* Earned badges */}
          {earned.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-2 p-2 pr-3 bg-amber-500/10 rounded-full border border-amber-500/30 animate-fade-in"
              title={badge.description}
            >
              <span className="text-xl">{badge.icon}</span>
              <span className="text-sm font-medium">{badge.name}</span>
            </div>
          ))}
          
          {/* Locked badges */}
          {locked.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-2 p-2 pr-3 bg-muted/50 rounded-full border border-border opacity-50"
              title={badge.description}
            >
              <span className="text-xl grayscale">{badge.icon}</span>
              <span className="text-sm text-muted-foreground">{badge.name}</span>
              <Lock className="w-3 h-3 text-muted-foreground" />
            </div>
          ))}

          {earned.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              Voltooi lessen om badges te verdienen!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
