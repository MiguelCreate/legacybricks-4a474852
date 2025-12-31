import { Flame, Trophy, TrendingUp } from "lucide-react";

export const StreakBanner = () => {
  const streakDays = 12;
  const vacancyFreeDays = 45;
  const portfolioLevel = 2;

  return (
    <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: "0.15s" }}>
      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20 p-4 text-center">
        <div className="flex justify-center mb-2">
          <Flame className="w-6 h-6 text-orange-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{streakDays}</p>
        <p className="text-xs text-muted-foreground">Dagen actief</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/20 p-4 text-center">
        <div className="flex justify-center mb-2">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{vacancyFreeDays}</p>
        <p className="text-xs text-muted-foreground">Dagen zonder leegstand</p>
      </div>

      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 p-4 text-center">
        <div className="flex justify-center mb-2">
          <Trophy className="w-6 h-6 text-purple-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">Level {portfolioLevel}</p>
        <p className="text-xs text-muted-foreground">Portefeuille</p>
      </div>
    </div>
  );
};
