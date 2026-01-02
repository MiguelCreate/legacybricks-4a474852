import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Target, TrendingUp } from "lucide-react";

interface AcademyProgressProps {
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

export const AcademyProgress = ({ progress, completedLessons, totalLessons }: AcademyProgressProps) => {
  const getProgressMessage = () => {
    if (progress === 0) return "Begin je reis naar vastgoedexpertise!";
    if (progress < 25) return "Je bent goed begonnen! Blijf doorgaan.";
    if (progress < 50) return "Bijna halverwege! Je maakt goede voortgang.";
    if (progress < 75) return "Meer dan de helft! Je bent op weg naar professional.";
    if (progress < 100) return "Bijna klaar! Nog even doorzetten.";
    return "Gefeliciteerd! Je hebt alle lessen voltooid! 🎉";
  };

  const getLevel = () => {
    if (progress < 33) return { name: "Beginner", color: "text-emerald-500", bg: "bg-emerald-500" };
    if (progress < 66) return { name: "Gevorderde", color: "text-blue-500", bg: "bg-blue-500" };
    return { name: "Professional", color: "text-purple-500", bg: "bg-purple-500" };
  };

  const level = getLevel();

  return (
    <Card className="mt-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${level.bg}/10 flex items-center justify-center`}>
                <Trophy className={`w-5 h-5 ${level.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jouw niveau</p>
                <p className={`font-semibold ${level.color}`}>{level.name}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{getProgressMessage()}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </div>

          <div className="flex gap-6 md:border-l md:pl-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <Target className="w-5 h-5 text-primary" />
                {completedLessons}
              </div>
              <p className="text-xs text-muted-foreground">Voltooid</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                {totalLessons - completedLessons}
              </div>
              <p className="text-xs text-muted-foreground">Te gaan</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
