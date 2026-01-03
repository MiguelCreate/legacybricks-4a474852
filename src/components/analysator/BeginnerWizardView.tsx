import { useState } from "react";
import { Building2, PiggyBank, Euro, Settings, BarChart3 } from "lucide-react";
import { WizardSteps } from "./wizard/WizardSteps";
import { WizardInputStep } from "./wizard/WizardInputStep";
import { WizardResultStep } from "./wizard/WizardResultStep";
import { AnalysisInputs, InvestmentAnalysis } from "@/lib/rendementsCalculations";

interface BeginnerWizardViewProps {
  inputs: AnalysisInputs;
  updateInput: (key: keyof AnalysisInputs, value: number | string) => void;
  analysis: InvestmentAnalysis | null;
  propertyName: string;
  setPropertyName: (name: string) => void;
  propertyLocation: string;
  setPropertyLocation: (location: string) => void;
  onSave: () => void;
  onSwitchToAdvanced: () => void;
}

const steps = [
  { label: "Aankoop", icon: <Building2 className="w-5 h-5" /> },
  { label: "Financiering", icon: <PiggyBank className="w-5 h-5" /> },
  { label: "Verhuur", icon: <Euro className="w-5 h-5" /> },
  { label: "Kosten", icon: <Settings className="w-5 h-5" /> },
  { label: "Resultaat", icon: <BarChart3 className="w-5 h-5" /> },
];

export function BeginnerWizardView({
  inputs,
  updateInput,
  analysis,
  propertyName,
  setPropertyName,
  propertyLocation,
  setPropertyLocation,
  onSave,
  onSwitchToAdvanced,
}: BeginnerWizardViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const isResultStep = currentStep === 4;

  const handleNext = () => {
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  return (
    <div className="space-y-6">
      <WizardSteps 
        currentStep={currentStep} 
        steps={steps} 
        onStepClick={setCurrentStep} 
      />

      {isResultStep ? (
        analysis ? (
          <WizardResultStep
            analysis={analysis}
            inputs={inputs}
            onPrev={handlePrev}
            propertyName={propertyName}
            setPropertyName={setPropertyName}
            propertyLocation={propertyLocation}
            setPropertyLocation={setPropertyLocation}
            onSave={onSave}
            onSwitchToAdvanced={onSwitchToAdvanced}
          />
        ) : (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            Berekening laden...
          </div>
        )
      ) : (
        <WizardInputStep
          step={currentStep}
          inputs={inputs}
          updateInput={updateInput}
          onNext={handleNext}
          onPrev={handlePrev}
          isFirst={currentStep === 0}
          isLast={currentStep === 3}
        />
      )}
    </div>
  );
}
