import { Info, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTooltipVisibility } from "@/hooks/useTooltipVisibility";

interface TooltipToggleProps {
  sectionId: string;
  className?: string;
}

export const TooltipToggle = ({ sectionId, className = "" }: TooltipToggleProps) => {
  const { 
    globalTooltipsEnabled, 
    localOverrides, 
    setLocalOverride, 
    clearLocalOverride,
    shouldShowTooltips 
  } = useTooltipVisibility();

  const hasLocalOverride = sectionId in localOverrides;
  const isEnabled = shouldShowTooltips(sectionId);

  const handleToggle = () => {
    if (hasLocalOverride) {
      // If there's a local override, toggle between override values or clear it
      if (localOverrides[sectionId] === globalTooltipsEnabled) {
        // Override matches global, so flip it
        setLocalOverride(sectionId, !globalTooltipsEnabled);
      } else {
        // Override differs from global, clear it to use global
        clearLocalOverride(sectionId);
      }
    } else {
      // No local override, create one that's opposite of global
      setLocalOverride(sectionId, !globalTooltipsEnabled);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={`h-7 px-2 gap-1 text-xs ${className}`}
        >
          <Info className="w-3 h-3" />
          {isEnabled ? (
            <Eye className="w-3 h-3 text-primary" />
          ) : (
            <EyeOff className="w-3 h-3 text-muted-foreground" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">
          {isEnabled ? "Verberg uitleg in dit onderdeel" : "Toon uitleg in dit onderdeel"}
          {hasLocalOverride && (
            <span className="block text-muted-foreground mt-1">
              (Lokale instelling actief)
            </span>
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};
