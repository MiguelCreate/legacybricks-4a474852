import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { AnalysisInputs } from "@/lib/rendementsCalculations";

const calcPMT = (principal: number, annualRate: number, years: number) => {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate <= 0) return principal / (years * 12);
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  return (
    principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
};

interface WizardInputStepProps {
  step: number;
  inputs: AnalysisInputs;
  updateInput: (key: keyof AnalysisInputs, value: number | string) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const CompactInput = ({ 
  label, 
  value, 
  onChange, 
  prefix,
  suffix,
  tooltip,
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  tooltip?: string;
}) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {tooltip && <InfoTooltip title={label} content={tooltip} />}
    </div>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {prefix}
        </span>
      )}
      <Input
        type="text"
        inputMode="decimal"
        value={String(value)}
        onChange={(e) => {
          const rawValue = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
          const numValue = rawValue === '' ? 0 : parseFloat(rawValue);
          onChange(isNaN(numValue) ? 0 : numValue);
        }}
        className={`h-9 text-sm ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

export function WizardInputStep({ step, inputs, updateInput, onNext, onPrev, isFirst, isLast }: WizardInputStepProps) {
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <CardTitle className="text-lg mb-1">💰 Aankoopgegevens</CardTitle>
              <CardDescription>De basis van je investering</CardDescription>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <CompactInput
                label="Aankoopprijs"
                value={inputs.purchasePrice}
                onChange={(v) => updateInput("purchasePrice", v)}
                prefix="€"
                tooltip="De vraagprijs of jouw bod op het pand"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Type pand</Label>
                  <InfoTooltip 
                    title="Type pand" 
                    content="Woning = eigen bewoning of secundaire woning (progressief tarief). Niet-woning = investeerders, toeristische verhuur (vast 6,5%)." 
                  />
                </div>
                <Select
                  value={inputs.pandType || 'niet-woning'}
                  onValueChange={(v) => updateInput("pandType", v as 'woning' | 'niet-woning')}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="woning">🏠 Woning (eigen bewoning)</SelectItem>
                    <SelectItem value="niet-woning">🏢 Niet-woning (investeerder)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CompactInput
                label="IMT (overdrachtsbelasting)"
                value={inputs.imt}
                onChange={(v) => updateInput("imt", v)}
                prefix="€"
                tooltip={inputs.pandType === 'woning' 
                  ? "Progressief tarief: 0% tot €106.346, daarna 2%→5%→7%→8%" 
                  : "Vast tarief 6,5% voor investeerders"
                }
              />
              <CompactInput
                label="Notariskosten"
                value={inputs.notaryFees}
                onChange={(v) => updateInput("notaryFees", v)}
                prefix="€"
              />
              <CompactInput
                label="Renovatiekosten"
                value={inputs.renovationCosts}
                onChange={(v) => updateInput("renovationCosts", v)}
                prefix="€"
              />
              <CompactInput
                label="Inrichtingskosten"
                value={inputs.furnishingCosts}
                onChange={(v) => updateInput("furnishingCosts", v)}
                prefix="€"
              />
            </div>
          </div>
        );
      case 1: {
        const mortgageType = inputs.mortgageInputType || "ltv";
        const loanAmount =
          mortgageType === "downpayment"
            ? Math.max(0, inputs.purchasePrice - Number(inputs.downpayment ?? 0))
            : inputs.purchasePrice * (inputs.ltv / 100);
        const calculatedMonthlyMortgage = calcPMT(loanAmount, inputs.interestRate, inputs.loanTermYears);
        const monthlyMortgage = inputs.monthlyMortgageOverride ?? calculatedMonthlyMortgage;

        return (
          <div className="space-y-6">
            <div>
              <CardTitle className="text-lg mb-1">🏦 Financiering</CardTitle>
              <CardDescription>Hoe financier je de aankoop?</CardDescription>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Financieringswijze</Label>
                <Select
                  value={inputs.mortgageInputType || "ltv"}
                  onValueChange={(v) => updateInput("mortgageInputType", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ltv">LTV percentage (%)</SelectItem>
                    <SelectItem value="downpayment">Eigen inleg bedrag (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mortgageType === "ltv" ? (
                <CompactInput
                  label="LTV (Loan-to-Value)"
                  value={inputs.ltv}
                  onChange={(v) => updateInput("ltv", v)}
                  suffix="%"
                  tooltip="75% LTV = je leent 75%, betaalt 25% zelf"
                />
              ) : (
                <CompactInput
                  label="Eigen inleg"
                  value={inputs.downpayment || 0}
                  onChange={(v) => {
                    updateInput("downpayment", v);
                    const newLoanAmount = inputs.purchasePrice - v;
                    const ltv = inputs.purchasePrice > 0 ? (newLoanAmount / inputs.purchasePrice) * 100 : 0;
                    updateInput("ltv", Math.max(0, Math.min(100, ltv)));
                  }}
                  prefix="€"
                />
              )}

              <CompactInput
                label="Rente"
                value={inputs.interestRate}
                onChange={(v) => updateInput("interestRate", v)}
                suffix="%"
              />
              <CompactInput
                label="Looptijd"
                value={inputs.loanTermYears}
                onChange={(v) => updateInput("loanTermYears", v)}
                suffix="jaar"
              />

              <CompactInput
                label="Maandlast hypotheek"
                value={monthlyMortgage}
                onChange={(v) => updateInput("monthlyMortgageOverride", v)}
                prefix="€"
                tooltip="Standaard berekend op basis van rente + looptijd. Pas aan als je een afwijkende maandlast verwacht."
              />

              <div className="rounded-lg bg-secondary/30 p-3 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Hypotheek (berekend)</p>
                <p className="text-lg font-semibold">€{Math.round(loanAmount).toLocaleString("nl-NL")}</p>
              </div>
            </div>
          </div>
        );
      }
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <CardTitle className="text-lg mb-1">🏠 Verhuurinkomsten</CardTitle>
              <CardDescription>Wat verwacht je te verdienen?</CardDescription>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Type verhuur</Label>
                <Select 
                  value={inputs.rentalType} 
                  onValueChange={(v) => updateInput("rentalType", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="longterm">Langdurig (vaste huurder)</SelectItem>
                    <SelectItem value="shortterm">Korte termijn (Airbnb)</SelectItem>
                    <SelectItem value="mixed">Gemengd (beiden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(inputs.rentalType === "longterm" || inputs.rentalType === "mixed") && (
                <CompactInput
                  label="Maandelijkse huur (LT)"
                  value={inputs.monthlyRentLT}
                  onChange={(v) => updateInput("monthlyRentLT", v)}
                  prefix="€"
                />
              )}
              {(inputs.rentalType === "shortterm" || inputs.rentalType === "mixed") && (
                <>
                  <CompactInput
                    label="Bezettingsgraad (ST)"
                    value={inputs.stOccupancy}
                    onChange={(v) => updateInput("stOccupancy", v)}
                    suffix="%"
                    tooltip="Percentage van het jaar dat verhuurd is"
                  />
                  <CompactInput
                    label="ADR (dagprijs)"
                    value={inputs.stADR}
                    onChange={(v) => updateInput("stADR", v)}
                    prefix="€"
                    tooltip="Gemiddelde prijs per nacht"
                  />
                </>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <CardTitle className="text-lg mb-1">📊 Kosten & Aannames</CardTitle>
              <CardDescription>Exploitatiekosten en toekomstverwachtingen</CardDescription>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CompactInput
                label="Beheerkosten"
                value={inputs.managementPercent}
                onChange={(v) => updateInput("managementPercent", v)}
                suffix="%"
                tooltip="Percentage van huur voor management"
              />
              <CompactInput
                label="Onderhoud (jaar)"
                value={inputs.maintenanceYearly}
                onChange={(v) => updateInput("maintenanceYearly", v)}
                prefix="€"
              />
              <CompactInput
                label="IMI (jaar)"
                value={inputs.imiYearly}
                onChange={(v) => updateInput("imiYearly", v)}
                prefix="€"
                tooltip="Jaarlijkse onroerendgoedbelasting"
              />
              <CompactInput
                label="Verzekering (jaar)"
                value={inputs.insuranceYearly}
                onChange={(v) => updateInput("insuranceYearly", v)}
                prefix="€"
              />
              <CompactInput
                label="VvE/maand"
                value={inputs.condoMonthly}
                onChange={(v) => updateInput("condoMonthly", v)}
                prefix="€"
              />
              <CompactInput
                label="Utilities/maand"
                value={inputs.utilitiesMonthly}
                onChange={(v) => updateInput("utilitiesMonthly", v)}
                prefix="€"
              />
              <CompactInput
                label="Huurgroei/jaar"
                value={inputs.rentGrowth}
                onChange={(v) => updateInput("rentGrowth", v)}
                suffix="%"
              />
              <CompactInput
                label="Kostenstijging/jaar"
                value={inputs.costGrowth}
                onChange={(v) => updateInput("costGrowth", v)}
                suffix="%"
              />
              <CompactInput
                label="Waardegroei/jaar"
                value={inputs.valueGrowth}
                onChange={(v) => updateInput("valueGrowth", v)}
                suffix="%"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-card">
      <CardContent className="pt-6">
        {renderStepContent()}
         <div className="flex justify-between mt-6 pt-4 border-t">
           <Button
             type="button"
             variant="outline"
             onClick={onPrev}
             disabled={isFirst}
             className="gap-2"
           >
             <ChevronLeft className="w-4 h-4" />
             Vorige
           </Button>
           <Button
             type="button"
             onClick={onNext}
             className="gap-2"
           >
             {isLast ? "Bekijk Resultaten" : "Volgende"}
             <ChevronRight className="w-4 h-4" />
           </Button>
         </div>
      </CardContent>
    </Card>
  );
}
