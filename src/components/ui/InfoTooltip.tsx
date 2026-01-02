import { useState } from "react";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTooltipVisibility } from "@/hooks/useTooltipVisibility";

interface InfoTooltipProps {
  title: string;
  content: string;
  className?: string;
  sectionId?: string; // Optional section ID for local override
}

export const InfoTooltip = ({ title, content, className = "", sectionId }: InfoTooltipProps) => {
  const { shouldShowTooltips } = useTooltipVisibility();
  const [open, setOpen] = useState(false);

  // Don't render if tooltips are disabled for this section
  if (!shouldShowTooltips(sectionId)) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-200 touch-manipulation ${className}`}
          aria-label={`Info: ${title}`}
        >
          <Info className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        className="max-w-xs p-4 z-50"
        onPointerDownOutside={() => setOpen(false)}
      >
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
