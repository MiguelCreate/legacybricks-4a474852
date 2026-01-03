import { useState } from "react";
import { Building2, PiggyBank, Home, Wallet, BarChart3 } from "lucide-react";
import { MultiUnitWizardSteps } from "./wizard/MultiUnitWizardSteps";
import { MultiUnitWizardInputStep } from "./wizard/MultiUnitWizardInputStep";
import { MultiUnitWizardResultStep } from "./wizard/MultiUnitWizardResultStep";
import { MultiUnitInputs, MultiUnitAnalysis, GemeenschappelijkeKosten } from "@/lib/multiUnitCalculations";

const steps = [
  { label: "Pand", icon: <Building2 className="w-5 h-5" /> },
  { label: "Financiering", icon: <PiggyBank className="w-5 h-5" /> },
  { label: "Units", icon: <Home className="w-5 h-5" /> },
  { label: "Kosten", icon: <Wallet className="w-5 h-5" /> },
  { label: "Resultaat", icon: <BarChart3 className="w-5 h-5" /> },
];

interface MultiUnitBeginnerWizardViewProps {
  inputs: MultiUnitInputs;
  analysis: MultiUnitAnalysis | null;
  updateInput: <K extends keyof MultiUnitInputs>(key: K, value: MultiUnitInputs[K]) => void;
  updateKosten: (key: keyof GemeenschappelijkeKosten, value: number) => void;
  berekendeMaandlast: number;
  onSwitchToAdvanced: () => void;
  onExportPDF?: () => void;
}

export function MultiUnitBeginnerWizardView({
  inputs,
  analysis,
  updateInput,
  updateKosten,
  berekendeMaandlast,
  onSwitchToAdvanced,
  onExportPDF,
}: MultiUnitBeginnerWizardViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [propertyName, setPropertyName] = useState(inputs.pandNaam);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Allow clicking on completed steps and next step
    if (step <= currentStep + 1 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  const isResultStep = currentStep === steps.length - 1;

  return (
    <div className="space-y-6">
      <MultiUnitWizardSteps
        currentStep={currentStep}
        steps={steps}
        onStepClick={handleStepClick}
      />

      {isResultStep && analysis ? (
        <MultiUnitWizardResultStep
          analysis={analysis}
          inputs={inputs}
          onPrev={handlePrev}
          onExportPDF={onExportPDF}
          onSwitchToAdvanced={onSwitchToAdvanced}
          propertyName={propertyName}
          setPropertyName={(name) => {
            setPropertyName(name);
            updateInput("pandNaam", name);
          }}
        />
      ) : (
        <MultiUnitWizardInputStep
          step={currentStep}
          inputs={inputs}
          updateInput={updateInput}
          updateKosten={updateKosten}
          berekendeMaandlast={berekendeMaandlast}
          onNext={handleNext}
          onPrev={handlePrev}
          isFirst={currentStep === 0}
          isLast={currentStep === steps.length - 2}
        />
      )}
    </div>
  );
}
