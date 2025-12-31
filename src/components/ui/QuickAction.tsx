import { ReactNode } from "react";

interface QuickActionProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "success";
}

export const QuickAction = ({
  icon,
  label,
  onClick,
  variant = "default",
}: QuickActionProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "gradient-primary text-primary-foreground hover:shadow-glow";
      case "success":
        return "bg-success/10 text-success hover:bg-success/20 border-success/20";
      default:
        return "bg-card text-foreground hover:bg-accent border-border";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border shadow-card transition-all duration-300 active:scale-95 ${getVariantStyles()}`}
    >
      <div className="w-10 h-10 rounded-xl bg-background/20 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </button>
  );
};
