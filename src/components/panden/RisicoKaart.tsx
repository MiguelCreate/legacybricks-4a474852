import { AlertTriangle, Scale, TrendingDown, Landmark, Wrench, Users } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

interface RisicoKaartProps {
  juridisch: number;
  markt: number;
  fiscaal: number;
  fysiek: number;
  operationeel: number;
  onChange?: (field: string, value: number) => void;
  readonly?: boolean;
}

const risicoConfig = {
  juridisch: {
    label: "Juridisch",
    icon: Scale,
    tooltip: "Risico op juridische problemen: Airbnb-beperkingen, huurwetgeving, vergunningen.",
  },
  markt: {
    label: "Markt",
    icon: TrendingDown,
    tooltip: "Marktrisico: vraag/aanbod, oververhitting, economische omstandigheden.",
  },
  fiscaal: {
    label: "Fiscaal",
    icon: Landmark,
    tooltip: "Fiscaal risico: belastingverhogingen, nieuwe regelgeving, IMI/IRS wijzigingen.",
  },
  fysiek: {
    label: "Fysiek",
    icon: Wrench,
    tooltip: "Fysiek risico: aardbevingsgebied, overstromingsgevaar, onderhoudsstaat.",
  },
  operationeel: {
    label: "Operationeel",
    icon: Users,
    tooltip: "Operationeel risico: beheerderskwaliteit, huurdersproblematiek, afstand.",
  },
};

const getScoreColor = (score: number) => {
  if (score <= 2) return "bg-success text-success-foreground";
  if (score <= 3) return "bg-warning text-warning-foreground";
  return "bg-destructive text-destructive-foreground";
};

const getTotalScoreColor = (total: number) => {
  if (total < 10) return "text-success";
  if (total <= 15) return "text-warning";
  return "text-destructive";
};

const getTotalScoreLabel = (total: number) => {
  if (total < 10) return "Laag risico";
  if (total <= 15) return "Gemiddeld risico";
  return "Hoog risico";
};

export const RisicoKaart = ({
  juridisch,
  markt,
  fiscaal,
  fysiek,
  operationeel,
  onChange,
  readonly = false,
}: RisicoKaartProps) => {
  const scores = { juridisch, markt, fiscaal, fysiek, operationeel };
  const totalScore = juridisch + markt + fiscaal + fysiek + operationeel;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Risicokaart</h3>
          <InfoTooltip
            title="Risicokaart"
            content="Score per categorie van 1 (laag) tot 5 (hoog). Totaalscore: <10 groen, 10-15 geel, >15 rood."
          />
        </div>
        <div className={`px-3 py-1 rounded-lg font-semibold ${getTotalScoreColor(totalScore)}`}>
          {totalScore}/25 - {getTotalScoreLabel(totalScore)}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {(Object.keys(risicoConfig) as Array<keyof typeof risicoConfig>).map((key) => {
          const config = risicoConfig[key];
          const Icon = config.icon;
          const score = scores[key];

          return (
            <div key={key} className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                  {config.label}
                </span>
              </div>
              
              {readonly ? (
                <div
                  className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center font-bold ${getScoreColor(score)}`}
                >
                  {score}
                </div>
              ) : (
                <select
                  value={score}
                  onChange={(e) => onChange?.(key, parseInt(e.target.value))}
                  className={`w-full h-10 rounded-lg text-center font-bold border-0 cursor-pointer ${getScoreColor(score)}`}
                >
                  {[1, 2, 3, 4, 5].map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              )}

              <p className="text-[10px] text-muted-foreground leading-tight hidden md:block">
                {config.tooltip.split(":")[0]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
