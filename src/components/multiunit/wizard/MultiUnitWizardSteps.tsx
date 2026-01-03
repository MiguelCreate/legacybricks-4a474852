import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiUnitWizardStepsProps {
  currentStep: number;
  steps: { label: string; icon: React.ReactNode }[];
  onStepClick: (step: number) => void;
}

export function MultiUnitWizardSteps({ currentStep, steps, onStepClick }: MultiUnitWizardStepsProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto mb-6">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <div key={index} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => onStepClick(index)}
              className={cn(
                "flex flex-col items-center gap-2 relative z-10 cursor-pointer group transition-all",
                !isCompleted && !isCurrent && "opacity-50 hover:opacity-70"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground group-hover:bg-muted/80"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.icon}
              </div>
              <span className={cn(
                "text-xs font-medium text-center hidden sm:block max-w-[80px]",
                isCurrent && "text-primary",
                !isCurrent && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
