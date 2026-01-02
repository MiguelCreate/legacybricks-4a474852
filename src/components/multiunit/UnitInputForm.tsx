import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Plus, Trash2, Home } from "lucide-react";
import { UnitInput } from "@/lib/multiUnitCalculations";

interface UnitInputFormProps {
  units: UnitInput[];
  onUnitsChange: (units: UnitInput[]) => void;
}

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

export const UnitInputForm = ({ units, onUnitsChange }: UnitInputFormProps) => {
  const addUnit = () => {
    const newUnits = [...units, { ...defaultUnit(), naam: `Unit ${units.length + 1}` }];
    // Recalculate distribution factors
    const factor = 100 / newUnits.length;
    newUnits.forEach(u => u.verdelingsfactor_pct = factor);
    onUnitsChange(newUnits);
  };

  const removeUnit = (id: string) => {
    if (units.length <= 1) return;
    const newUnits = units.filter(u => u.id !== id);
    // Recalculate distribution factors
    const factor = 100 / newUnits.length;
    newUnits.forEach(u => u.verdelingsfactor_pct = factor);
    onUnitsChange(newUnits);
  };

  const updateUnit = (id: string, field: keyof UnitInput, value: any) => {
    onUnitsChange(units.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          Units ({units.length})
        </h3>
        <Button onClick={addUnit} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Unit Toevoegen
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {units.map((unit, index) => (
          <Card key={unit.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <Input
                    value={unit.naam}
                    onChange={(e) => updateUnit(unit.id, "naam", e.target.value)}
                    placeholder={`Unit ${index + 1}`}
                    className="h-8 w-32"
                  />
                </CardTitle>
                {units.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUnit(unit.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Oppervlakte */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Oppervlakte</Label>
                  <InfoTooltip title="Oppervlakte" content="De totale vloeroppervlakte van deze unit in m²." />
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={unit.oppervlakte_m2}
                    onChange={(e) => updateUnit(unit.id, "oppervlakte_m2", parseFloat(e.target.value) || 0)}
                    className="h-9 pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m²</span>
                </div>
              </div>

              {/* Maandhuur */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Maandhuur</Label>
                  <InfoTooltip title="Maandhuur" content="De maandelijkse huur die je ontvangt voor deze unit." />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  <Input
                    type="number"
                    value={unit.maandhuur}
                    onChange={(e) => updateUnit(unit.id, "maandhuur", parseFloat(e.target.value) || 0)}
                    className="h-9 pl-7"
                  />
                </div>
              </div>

              {/* Verdelingsfactor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Kostenverdeling</Label>
                    <InfoTooltip title="Kostenverdeling" content="Het percentage van de gemeenschappelijke kosten dat aan deze unit wordt toegewezen." />
                  </div>
                  <span className="text-xs font-medium">{unit.verdelingsfactor_pct.toFixed(1)}%</span>
                </div>
                <Slider
                  value={[unit.verdelingsfactor_pct]}
                  onValueChange={([v]) => updateUnit(unit.id, "verdelingsfactor_pct", v)}
                  min={0}
                  max={100}
                  step={0.1}
                />
              </div>

              {/* Bezettingsgraad */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Bezettingsgraad</Label>
                    <InfoTooltip title="Bezettingsgraad" content="Het percentage van het jaar dat deze unit verhuurd is." />
                  </div>
                  <span className="text-xs font-medium">{unit.bezettingsgraad}%</span>
                </div>
                <Slider
                  value={[unit.bezettingsgraad]}
                  onValueChange={([v]) => updateUnit(unit.id, "bezettingsgraad", v)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              {/* Huurdertype */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Huurdertype</Label>
                  <InfoTooltip title="Huurdertype" content="Het type huurder: langdurig, toerisme (Airbnb), of student." />
                </div>
                <Select
                  value={unit.huurdertype}
                  onValueChange={(v) => updateUnit(unit.id, "huurdertype", v as UnitInput["huurdertype"])}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="langdurig">Langdurig</SelectItem>
                    <SelectItem value="toerisme">Toerisme (Airbnb)</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Energielabel */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Energielabel</Label>
                  <InfoTooltip title="Energielabel" content="De energie-efficiëntie van de unit (A = beste, F = slechtste)." />
                </div>
                <Select
                  value={unit.energielabel}
                  onValueChange={(v) => updateUnit(unit.id, "energielabel", v as UnitInput["energielabel"])}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Uitstekend</SelectItem>
                    <SelectItem value="B">B - Goed</SelectItem>
                    <SelectItem value="C">C - Gemiddeld</SelectItem>
                    <SelectItem value="D">D - Matig</SelectItem>
                    <SelectItem value="E">E - Slecht</SelectItem>
                    <SelectItem value="F">F - Zeer slecht</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Huurderretentie */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Huurderretentie (mnd)</Label>
                  <InfoTooltip title="Huurderretentie" content="Gemiddelde duur van huurcontracten in maanden." />
                </div>
                <Input
                  type="number"
                  value={unit.huurderretentie_maanden}
                  onChange={(e) => updateUnit(unit.id, "huurderretentie_maanden", parseInt(e.target.value) || 0)}
                  className="h-9"
                />
              </div>

              {/* Renovatiebehoeftescore */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Renovatiebehoefte</Label>
                    <InfoTooltip title="Renovatiebehoefte" content="Schatting van benodigde investering komende 3 jaar (1 = weinig, 10 = veel)." />
                  </div>
                  <span className="text-xs font-medium">{unit.renovatiebehoeftescore}/10</span>
                </div>
                <Slider
                  value={[unit.renovatiebehoeftescore]}
                  onValueChange={([v]) => updateUnit(unit.id, "renovatiebehoeftescore", v)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
