import { Building2, MapPin, Users, TrendingUp, MoreVertical, Star } from "lucide-react";
import { Badge } from "./badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface PropertyCardProps {
  id: string;
  name: string;
  location: string;
  status: "aankoop" | "renovatie" | "verhuur" | "te_koop";
  healthScore: number;
  monthlyIncome?: number;
  tenant?: string;
  isPinned?: boolean;
  onClick?: () => void;
}

const statusConfig = {
  aankoop: { label: "Aankoop", variant: "secondary" as const },
  renovatie: { label: "Renovatie", variant: "warning" as const },
  verhuur: { label: "Verhuurd", variant: "success" as const },
  te_koop: { label: "Te Koop", variant: "destructive" as const },
};

const getHealthColor = (score: number) => {
  if (score >= 8) return "text-success bg-success/10";
  if (score >= 5) return "text-warning bg-warning/10";
  return "text-destructive bg-destructive/10";
};

export const PropertyCard = ({
  name,
  location,
  status,
  healthScore,
  monthlyIncome,
  tenant,
  isPinned,
  onClick,
}: PropertyCardProps) => {
  const statusInfo = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className="group relative p-5 bg-card rounded-xl border shadow-card hover:shadow-glow hover:border-primary/30 transition-all duration-300 cursor-pointer animate-slide-up"
    >
      {isPinned && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-glow">
          <Star className="w-3 h-3 text-primary-foreground fill-current" />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{location}</span>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-strong">
            <DropdownMenuItem>Bewerken</DropdownMenuItem>
            <DropdownMenuItem>Pinnen</DropdownMenuItem>
            <DropdownMenuItem>Documenten</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Archiveren</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Badge variant={statusInfo.variant === "success" ? "default" : "secondary"} className={statusInfo.variant === "success" ? "bg-success text-success-foreground" : statusInfo.variant === "warning" ? "bg-warning text-warning-foreground" : ""}>
          {statusInfo.label}
        </Badge>
        <div className={`px-2 py-1 rounded-md text-xs font-semibold ${getHealthColor(healthScore)}`}>
          Score: {healthScore}/10
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        {monthlyIncome !== undefined && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Maandhuur</p>
              <p className="font-semibold text-foreground">€{monthlyIncome.toLocaleString()}</p>
            </div>
          </div>
        )}
        {tenant && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Huurder</p>
              <p className="font-semibold text-foreground truncate">{tenant}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
