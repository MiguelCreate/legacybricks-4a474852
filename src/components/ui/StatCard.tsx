import { ReactNode } from "react";
import { InfoTooltip } from "./InfoTooltip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  tooltip?: {
    title: string;
    content: string;
  };
  variant?: "default" | "primary" | "success" | "warning";
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  tooltip,
  variant = "default",
}: StatCardProps) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-success";
    if (trend.value < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "gradient-primary text-primary-foreground";
      case "success":
        return "bg-success/10 border-success/20";
      case "warning":
        return "bg-warning/10 border-warning/20";
      default:
        return "bg-card";
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "primary":
        return "bg-primary-foreground/20";
      case "success":
        return "bg-success/20";
      case "warning":
        return "bg-warning/20";
      default:
        return "bg-accent";
    }
  };

  return (
    <div
      className={`relative p-4 sm:p-5 rounded-xl border shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in ${getVariantStyles()}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2 sm:space-y-3 min-w-0 flex-1">
          <div className="flex items-center gap-1 sm:gap-2">
            <p className={`text-xs sm:text-sm font-medium truncate ${variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              {title}
            </p>
            {tooltip && (
              <InfoTooltip title={tooltip.title} content={tooltip.content} />
            )}
          </div>
          <div>
            <p className={`text-lg sm:text-2xl font-bold tracking-tight ${variant === "primary" ? "text-primary-foreground" : "text-foreground"}`}>
              {value}
            </p>
            {subtitle && (
              <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {subtitle}
              </p>
            )}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{trend.value > 0 ? "+" : ""}{trend.value}%</span>
              <span className="text-muted-foreground hidden sm:inline">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${getIconBg()}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
