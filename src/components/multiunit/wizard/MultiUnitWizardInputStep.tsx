import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { ChevronRight, ChevronLeft, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { MultiUnitInputs, UnitInput, GemeenschappelijkeKosten } from "@/lib/multiUnitCalculations";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MultiUnitWizardInputStepProps {
  step: number;
  inputs: MultiUnitInputs;
  updateInput: <K extends keyof MultiUnitInputs>(key: K, value: MultiUnitInputs[K]) => void;
  updateKosten: (key: keyof GemeenschappelijkeKosten, value: number) => void;
  berekendeMaandlast: number;
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
  disabled,
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  tooltip?: string;
  disabled?: boolean;
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
        disabled={disabled}
        className={`h-9 text-sm ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''} ${disabled ? 'bg-muted' : ''}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

const defaultUnit = (): UnitInput => ({
  id: crypto.randomUUID(),
  naam: "",
  oppervlakte_m2: 50,
  maandhuur: 500,
  verdelingsfactor_pct: 33.33,
  energielabel: "C",
  huurderretentie_maanden: 12,
  renovatiebehoeftescore: 3,
  bezettingsgraad: 95,
  huurdertype: "langdurig",
});

export function MultiUnitWizardInputStep({ 
  step, 
  inputs, 
  updateInput, 
  updateKosten,
  berekendeMaandlast,
  onNext, 
  onPrev, 
  isFirst, 
  isLast 
}: MultiUnitWizardInputStepProps) {
  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);

  const toggleUnitExpanded = (id: string) => {
    setExpandedUnits(prev => 
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const addUnit = () => {
    const newUnit = { ...defaultUnit(), naam: `Unit ${inputs.units.length + 1}` };
    const newUnits = [...inputs.units, newUnit];
    const factor = 100 / newUnits.length;
    newUnits.forEach(u => u.verdelingsfactor_pct = parseFloat(factor.toFixed(2)));
    updateInput("units", newUnits);
  };

  const removeUnit = (id: string) => {
    if (inputs.units.length <= 1) return;
    const newUnits = inputs.units.filter(u => u.id !== id);
    const factor = 100 / newUnits.length;
    newUnits.forEach(u => u.verdelingsfactor_pct = parseFloat(factor.toFixed(2)));
    updateInput("units", newUnits);
  };

  const updateUnit = (id: string, field: keyof UnitInput, value: any) => {
    const newUnits = inputs.units.map(u => u.id === id ? { ...u, [field]: value } : u);
    updateInput("units", newUnits);
  };

  const addQuickUnits = (count: number) => {
    const currentCount = inputs.units.length;
    const newUnits = [...inputs.units];
    for (let i = 0; i < count; i++) {
      newUnits.push({ 
        ...defaultUnit(), 
        id: crypto.randomUUID(),
        naam: `Unit ${currentCount + i + 1}` 
      });
    }
    const factor = 100 / newUnits.length;
    newUnits.forEach(u => u.verdelingsfactor_pct = parseFloat(factor.toFixed(2)));
    updateInput("units", newUnits);
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <CardTitle className="text-lg mb-1">🏢 Pandinformatie</CardTitle>
              <CardDescription>Basis gegevens van het pand</CardDescription>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs text-muted-foreground">Pandnaam</Label>
                <Input
                  value={inputs.pandNaam}
                  onChange={(e) => updateInput("pandNaam", e.target.value)}
                  placeholder="Bijv. Apartementencomplex Lissabon"
                  className="h-9"
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Type pand</Label>
                  <InfoTooltip 
                    title="Type pand" 
                    content="Woning = eigen bewoning (progressief tarief). Niet-woning = investeerders (vast 6,5%)." 
                  />
                </div>
                <Select
                  value={inputs.pandType}
                  onValueChange={(v) => updateInput("pandType", v as 'woning' | 'niet-woning')}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="woning">🏠 Woning (progressief)</SelectItem>
                    <SelectItem value="niet-woning">🏢 Niet-woning (6,5%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <CompactInput
                label="Aankoopprijs"
                value={inputs.aankoopprijs}
                onChange={(v) => updateInput("aankoopprijs", v)}
                prefix="€"
                tooltip="De totale aankoopprijs van het pand"
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">IMT</Label>
                    <InfoTooltip title="IMT" content={inputs.pandType === 'woning' ? "Progressief tarief: 0% tot €106.346, daarna 2%→5%→7%→8%" : "Vast tarief 6,5% voor investeerders"} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Auto</span>
                    <Switch
                      checked={inputs.imtAutomatisch}
                      onCheckedChange={(v) => updateInput("imtAutomatisch", v)}
                    />
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={inputs.imt}
                    onChange={(e) => {
                      if (!inputs.imtAutomatisch) {
                        const rawValue = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                        const numValue = rawValue === '' ? 0 : parseFloat(rawValue);
                        updateInput("imt", isNaN(numValue) ? 0 : numValue);
                      }
                    }}
                    disabled={inputs.imtAutomatisch}
                    className={`h-9 text-sm pl-7 ${inputs.imtAutomatisch ? 'bg-muted' : ''}`}
                  />
                </div>
              </div>
              
              <CompactInput
                label="Notariskosten"
                value={inputs.notarisKosten}
                onChange={(v) => updateInput("notarisKosten", v)}
                prefix="€"
              />
              <CompactInput
                label="Renovatiekosten"
                value={inputs.renovatieKosten}
                onChange={(v) => updateInput("renovatieKosten", v)}
                prefix="€"
              />
              <CompactInput
                label="Marktwaarde"
                value={inputs.marktwaarde}
                onChange={(v) => updateInput("marktwaarde", v)}
                prefix="€"
                tooltip="Huidige geschatte marktwaarde"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <CardTitle className="text-lg mb-1">🏦 Financiering</CardTitle>
              <CardDescription>Hoe financier je de aankoop?</CardDescription>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <CompactInput
                label="Eigen Inleg"
                value={inputs.eigenInleg}
                onChange={(v) => updateInput("eigenInleg", v)}
                prefix="€"
                tooltip="Je eigen kapitaal. Hypotheekbedrag = totale kosten - eigen inleg."
              />
              
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Hypotheekbedrag</Label>
                  <InfoTooltip title="Hypotheekbedrag" content="Automatisch berekend: totale kosten - eigen inleg" />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  <Input
                    type="text"
                    value={inputs.hypotheekBedrag.toLocaleString('nl-NL')}
                    disabled
                    className="h-9 text-sm pl-7 bg-muted"
                  />
                </div>
              </div>

              <CompactInput
                label="Rentepercentage"
                value={inputs.rentePercentage}
                onChange={(v) => updateInput("rentePercentage", v)}
                suffix="%"
              />
              <CompactInput
                label="Looptijd"
                value={inputs.looptijdJaren}
                onChange={(v) => updateInput("looptijdJaren", v)}
                suffix="jaar"
              />
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Maandlast</Label>
                  <InfoTooltip title="Maandlast" content="Automatisch berekend of handmatig invoeren" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Handmatig</span>
                  <Switch
                    checked={inputs.maandlastHandmatig}
                    onCheckedChange={(v) => updateInput("maandlastHandmatig", v)}
                  />
                </div>
              </div>
              
              {inputs.maandlastHandmatig ? (
                <CompactInput
                  label=""
                  value={inputs.hypotheekMaandlast}
                  onChange={(v) => updateInput("hypotheekMaandlast", v)}
                  prefix="€"
                />
              ) : (
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Berekende maandlast:</span>
                    <span className="text-lg font-semibold">€{berekendeMaandlast.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        const totaalHuur = inputs.units.reduce((sum, u) => sum + u.maandhuur, 0);
        
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg mb-1">🏠 Units configureren</CardTitle>
                <CardDescription>{inputs.units.length} units • €{totaalHuur.toLocaleString('nl-NL')}/maand totaal</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addQuickUnits(3)} className="text-xs">
                  +3 units
                </Button>
                <Button size="sm" onClick={addUnit} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Unit
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {inputs.units.map((unit, index) => {
                const isExpanded = expandedUnits.includes(unit.id);
                
                return (
                  <Collapsible key={unit.id} open={isExpanded} onOpenChange={() => toggleUnitExpanded(unit.id)}>
                    <div className="border rounded-lg bg-card">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-sm">{unit.naam || `Unit ${index + 1}`}</p>
                              <p className="text-xs text-muted-foreground">
                                €{unit.maandhuur}/m • {unit.bezettingsgraad}% bezet • {unit.huurdertype}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {inputs.units.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); removeUnit(unit.id); }}
                                className="h-7 w-7 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-3 pb-3 pt-0 border-t space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2 pt-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Naam</Label>
                              <Input
                                value={unit.naam}
                                onChange={(e) => updateUnit(unit.id, "naam", e.target.value)}
                                placeholder={`Unit ${index + 1}`}
                                className="h-8"
                              />
                            </div>
                            <CompactInput
                              label="Maandhuur"
                              value={unit.maandhuur}
                              onChange={(v) => updateUnit(unit.id, "maandhuur", v)}
                              prefix="€"
                            />
                            <CompactInput
                              label="Oppervlakte"
                              value={unit.oppervlakte_m2}
                              onChange={(v) => updateUnit(unit.id, "oppervlakte_m2", v)}
                              suffix="m²"
                            />
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Huurdertype</Label>
                              <Select
                                value={unit.huurdertype}
                                onValueChange={(v) => updateUnit(unit.id, "huurdertype", v)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="langdurig">Langdurig</SelectItem>
                                  <SelectItem value="toerisme">Toerisme</SelectItem>
                                  <SelectItem value="student">Student</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Bezettingsgraad</Label>
                                <span className="text-xs font-medium">{unit.bezettingsgraad}%</span>
                              </div>
                              <Slider
                                value={[unit.bezettingsgraad]}
                                onValueChange={([v]) => updateUnit(unit.id, "bezettingsgraad", v)}
                                min={0}
                                max={100}
                                step={5}
                              />
                            </div>
                            
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Energielabel</Label>
                                <Select
                                  value={unit.energielabel}
                                  onValueChange={(v) => updateUnit(unit.id, "energielabel", v)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {["A", "B", "C", "D", "E", "F"].map(l => (
                                      <SelectItem key={l} value={l}>{l}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <CompactInput
                                label="Retentie (mnd)"
                                value={unit.huurderretentie_maanden}
                                onChange={(v) => updateUnit(unit.id, "huurderretentie_maanden", v)}
                              />
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <CardTitle className="text-lg mb-1">💰 Kosten & Belasting</CardTitle>
              <CardDescription>Gemeenschappelijke kosten en IRS instellingen</CardDescription>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CompactInput
                label="Gas (maand)"
                value={inputs.gemeenschappelijkeKosten.gas_maandelijks}
                onChange={(v) => updateKosten("gas_maandelijks", v)}
                prefix="€"
              />
              <CompactInput
                label="Water (maand)"
                value={inputs.gemeenschappelijkeKosten.water_maandelijks}
                onChange={(v) => updateKosten("water_maandelijks", v)}
                prefix="€"
              />
              <CompactInput
                label="VvE (maand)"
                value={inputs.gemeenschappelijkeKosten.vve_maandelijks}
                onChange={(v) => updateKosten("vve_maandelijks", v)}
                prefix="€"
              />
              <CompactInput
                label="Onderhoud (jaar)"
                value={inputs.gemeenschappelijkeKosten.onderhoud_jaarlijks}
                onChange={(v) => updateKosten("onderhoud_jaarlijks", v)}
                prefix="€"
              />
              <CompactInput
                label="Verzekering (jaar)"
                value={inputs.gemeenschappelijkeKosten.verzekering_jaarlijks}
                onChange={(v) => updateKosten("verzekering_jaarlijks", v)}
                prefix="€"
              />
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center gap-1">
                <Label className="text-sm font-medium">IRS Belasting</Label>
                <InfoTooltip title="IRS" content="Portugese inkomstenbelasting op huurinkomsten" />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Belastingjaar</Label>
                  <Select
                    value={inputs.irsJaar.toString()}
                    onValueChange={(v) => updateInput("irsJaar", parseInt(v))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Contractduur</Label>
                  <Select
                    value={inputs.contractduurJaren.toString()}
                    onValueChange={(v) => updateInput("contractduurJaren", parseInt(v))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 jaar (28%)</SelectItem>
                      <SelectItem value="3">3 jaar (25%)</SelectItem>
                      <SelectItem value="5">5 jaar (15%)</SelectItem>
                      <SelectItem value="10">10 jaar (10%)</SelectItem>
                      <SelectItem value="20">20+ jaar (5%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
