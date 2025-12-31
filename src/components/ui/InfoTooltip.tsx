import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTooltipVisibility } from "@/hooks/useTooltipVisibility";

interface InfoTooltipProps {
  title: string;
  content: string;
  className?: string;
  sectionId?: string; // Optional section ID for local override
}

export const InfoTooltip = ({ title, content, className = "", sectionId }: InfoTooltipProps) => {
  const { shouldShowTooltips } = useTooltipVisibility();

  // Don't render if tooltips are disabled for this section
  if (!shouldShowTooltips(sectionId)) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          type="button"
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-200 ${className}`}
          aria-label={`Info: ${title}`}
        >
          <Info className="w-3 h-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-xs p-4 glass-strong animate-scale-in"
      >
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
