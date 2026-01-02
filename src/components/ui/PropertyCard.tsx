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
  onEdit?: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onViewDocuments?: () => void;
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
  onEdit,
  onPin,
  onArchive,
  onViewDocuments,
}: PropertyCardProps) => {
  const statusInfo = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className="group relative p-4 sm:p-5 bg-card rounded-xl border shadow-card hover:shadow-glow hover:border-primary/30 transition-all duration-300 cursor-pointer animate-slide-up"
    >
      {isPinned && (
        <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center shadow-glow">
          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground fill-current" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
              {name}
            </h3>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-1.5 sm:p-2 rounded-lg hover:bg-accent transition-colors shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-strong">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>Bewerken</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin?.(); }}>{isPinned ? "Losmaken" : "Pinnen"}</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDocuments?.(); }}>Documenten</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive?.(); }} className="text-destructive">Archiveren</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        <Badge variant={statusInfo.variant === "success" ? "default" : "secondary"} className={`text-xs ${statusInfo.variant === "success" ? "bg-success text-success-foreground" : statusInfo.variant === "warning" ? "bg-warning text-warning-foreground" : ""}`}>
          {statusInfo.label}
        </Badge>
        <div className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-semibold ${getHealthColor(healthScore)}`}>
          Score: {healthScore}/10
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
        {monthlyIncome !== undefined && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Maandhuur</p>
              <p className="font-semibold text-sm sm:text-base text-foreground">€{monthlyIncome.toLocaleString()}</p>
            </div>
          </div>
        )}
        {tenant && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Huurder</p>
              <p className="font-semibold text-sm sm:text-base text-foreground truncate">{tenant}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
