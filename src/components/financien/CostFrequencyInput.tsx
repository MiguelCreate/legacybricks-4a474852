import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Euro } from "lucide-react";

interface CostFrequencyInputProps {
  label: string;
  tooltip?: string;
  monthlyValue: number;
  onMonthlyChange: (value: number) => void;
  yearlyValue?: number;
  onYearlyChange?: (value: number) => void;
  defaultFrequency?: 'monthly' | 'yearly';
  disabled?: boolean;
  className?: string;
}

export const CostFrequencyInput = ({
  label,
  tooltip,
  monthlyValue,
  onMonthlyChange,
  yearlyValue,
  onYearlyChange,
  defaultFrequency = 'yearly',
  disabled = false,
  className = ""
}: CostFrequencyInputProps) => {
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>(defaultFrequency);
  const [displayValue, setDisplayValue] = useState<string>("");

  // Calculate the derived value
  const derivedMonthly = yearlyValue !== undefined ? yearlyValue / 12 : monthlyValue;
  const derivedYearly = yearlyValue !== undefined ? yearlyValue : monthlyValue * 12;

  // Initialize display value
  useEffect(() => {
    if (frequency === 'monthly') {
      setDisplayValue(derivedMonthly > 0 ? String(Math.round(derivedMonthly * 100) / 100) : "");
    } else {
      setDisplayValue(derivedYearly > 0 ? String(Math.round(derivedYearly * 100) / 100) : "");
    }
  }, [frequency]);

  const handleValueChange = (value: string) => {
    setDisplayValue(value);
    const numValue = parseFloat(value) || 0;
    
    if (frequency === 'monthly') {
      onMonthlyChange(numValue);
      if (onYearlyChange) {
        onYearlyChange(numValue * 12);
      }
    } else {
      if (onYearlyChange) {
        onYearlyChange(numValue);
      }
      onMonthlyChange(numValue / 12);
    }
  };

  const handleFrequencyChange = (newFrequency: 'monthly' | 'yearly') => {
    setFrequency(newFrequency);
    // Recalculate display value
    if (newFrequency === 'monthly') {
      setDisplayValue(derivedMonthly > 0 ? String(Math.round(derivedMonthly * 100) / 100) : "");
    } else {
      setDisplayValue(derivedYearly > 0 ? String(Math.round(derivedYearly * 100) / 100) : "");
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1">
          {label}
          {tooltip && (
            <InfoTooltip title={label} content={tooltip} />
          )}
        </Label>
        <Tabs
          value={frequency}
          onValueChange={(v) => handleFrequencyChange(v as 'monthly' | 'yearly')}
          className="h-7"
        >
          <TabsList className="h-7 p-0.5">
            <TabsTrigger value="monthly" className="h-6 px-2 text-xs">
              /maand
            </TabsTrigger>
            <TabsTrigger value="yearly" className="h-6 px-2 text-xs">
              /jaar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="relative">
        <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="number"
          step="0.01"
          min="0"
          value={displayValue}
          onChange={(e) => handleValueChange(e.target.value)}
          disabled={disabled}
          className="pl-10"
          placeholder={frequency === 'monthly' ? 'Maandelijks bedrag' : 'Jaarlijks bedrag'}
        />
      </div>
      
      {/* Show derived value */}
      <p className="text-xs text-muted-foreground">
        {frequency === 'monthly' 
          ? `= €${Math.round(derivedYearly).toLocaleString('nl-NL')} per jaar`
          : `= €${Math.round(derivedMonthly * 100) / 100} per maand`
        }
      </p>
    </div>
  );
};
