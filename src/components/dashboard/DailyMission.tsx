import { Target, CheckCircle2, Clock } from "lucide-react";
import { InfoTooltip } from "../ui/InfoTooltip";

interface Mission {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueTime?: string;
}

const missions: Mission[] = [
  {
    id: "1",
    title: "Controleer huurbetalingen",
    description: "Bekijk of alle huurders deze maand hebben betaald",
    completed: false,
    dueTime: "Voor 12:00",
  },
  {
    id: "2",
    title: "Bekijk documentverlopen",
    description: "2 documenten verlopen binnenkort",
    completed: false,
  },
  {
    id: "3",
    title: "Update pand-gegevens",
    description: "Casa Lisboa mist nog een energielabel",
    completed: true,
  },
];

export const DailyMission = () => {
  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="bg-card rounded-xl border shadow-card p-5 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg gradient-primary">
            <Target className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="font-semibold text-foreground">Dagelijkse Missies</h2>
          <InfoTooltip
            title="Waarom dagelijkse missies?"
            content="Dagelijkse missies helpen je om consistent je portefeuille te beheren. Kleine, regelmatige acties voorkomen grote problemen later."
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{missions.length} voltooid
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full mb-4 overflow-hidden">
        <div
          className="h-full gradient-primary rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / missions.length) * 100}%` }}
        />
      </div>

      <div className="space-y-3">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              mission.completed
                ? "bg-success/5 border border-success/20"
                : "bg-secondary/50 hover:bg-secondary"
            }`}
          >
            <button
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                mission.completed
                  ? "bg-success border-success text-success-foreground"
                  : "border-muted-foreground/30 hover:border-primary"
              }`}
            >
              {mission.completed && <CheckCircle2 className="w-3 h-3" />}
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium ${
                  mission.completed
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {mission.title}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {mission.description}
              </p>
            </div>
            {mission.dueTime && !mission.completed && (
              <div className="flex items-center gap-1 text-xs text-warning">
                <Clock className="w-3 h-3" />
                <span>{mission.dueTime}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
