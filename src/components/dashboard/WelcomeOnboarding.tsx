import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Euro,
  FileText,
  Target,
  Shield,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    title: "Welkom bij VastgoedApp!",
    description:
      "Je persoonlijke assistent voor het beheren van je Portugese vastgoedportefeuille. Laten we je een korte rondleiding geven.",
  },
  {
    icon: <Building2 className="w-12 h-12 text-primary" />,
    title: "Beheer je Panden",
    description:
      "Voeg al je panden toe met alle details: aankoopprijs, huurinkomsten, kosten en meer. Houd de gezondheid van elk pand bij met onze gezondheidsscore.",
  },
  {
    icon: <Users className="w-12 h-12 text-primary" />,
    title: "Huurders & Contracten",
    description:
      "Koppel huurders aan je panden, beheer contracten en ontvang herinneringen wanneer contracten verlopen.",
  },
  {
    icon: <Euro className="w-12 h-12 text-success" />,
    title: "Financieel Overzicht",
    description:
      "Krijg inzicht in je cashflow, bruto rendement en alle kosten. Zie direct hoeveel je overhoudt per maand.",
  },
  {
    icon: <FileText className="w-12 h-12 text-primary" />,
    title: "Inchecklijsten",
    description:
      "Maak professionele check-in en check-out lijsten voor je huurders. Documenteer de staat van je pand met foto's en handtekeningen.",
  },
  {
    icon: <Target className="w-12 h-12 text-warning" />,
    title: "Doelen & Pensioen",
    description:
      "Stel financiële doelen in en plan je pensioen op basis van je vastgoedportefeuille. Zie wanneer je financieel vrij kunt zijn.",
  },
  {
    icon: <Shield className="w-12 h-12 text-primary" />,
    title: "Legacy Planning",
    description:
      "Plan de overdracht van je vastgoed aan de volgende generatie. Documenteer je strategie en familierollen.",
  },
];

export function WelcomeOnboarding({ onComplete }: WelcomeOnboardingProps) {
  const [open, setOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("vastgoedapp_onboarding_complete", "true");
    setOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">{step.icon}</div>
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-3">
            {step.title}
          </h2>

          <p className="text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-primary"
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button variant="ghost" size="sm" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Vorige
              </Button>
            )}

            {isFirstStep && (
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Overslaan
              </Button>
            )}

            <Button size="sm" onClick={handleNext}>
              {isLastStep ? (
                "Aan de slag!"
              ) : (
                <>
                  Volgende
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
