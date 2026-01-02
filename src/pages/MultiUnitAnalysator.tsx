import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calculator, 
  Building2, 
  PiggyBank, 
  Wallet,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { 
  MultiUnitInputs, 
  UnitInput, 
  GemeenschappelijkeKosten,
  analyzeMultiUnit,
  MultiUnitAnalysis,
  calculateIMTForMultiUnit
} from "@/lib/multiUnitCalculations";
import { MultiUnitModeToggle } from "@/components/multiunit/MultiUnitModeToggle";
import { UnitInputForm } from "@/components/multiunit/UnitInputForm";
import { MultiUnitBeginnerView } from "@/components/multiunit/MultiUnitBeginnerView";
import { MultiUnitAdvancedView } from "@/components/multiunit/MultiUnitAdvancedView";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const defaultUnit = (): UnitInput => ({
  id: crypto.randomUUID(),
  naam: "Unit 1",
  oppervlakte_m2: 50,
  maandhuur: 500,
  verdelingsfactor_pct: 33.33,
  energielabel: "C",
  huurderretentie_maanden: 12,
  renovatiebehoeftescore: 3,
  bezettingsgraad: 95,
  huurdertype: "langdurig",
});

const defaultKosten: GemeenschappelijkeKosten = {
  gas_maandelijks: 50,
  water_maandelijks: 30,
  vve_maandelijks: 100,
  onderhoud_jaarlijks: 2000,
  verzekering_jaarlijks: 500,
};

// Helper to calculate PMT for display
function calculatePMT(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || annualRate <= 0 || years <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

export default function MultiUnitAnalysator() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<"beginner" | "gevorderd">("beginner");
  const [expandedSections, setExpandedSections] = useState({
    pand: true,
    hypotheek: false,
    kosten: false,
  });
  
  // Form inputs
  const [inputs, setInputs] = useState<MultiUnitInputs>({
    pandNaam: "",
    aankoopprijs: 300000,
    imt: 19500, // 6.5% of 300000 for niet-woning
    imtAutomatisch: true,
    notarisKosten: 4000,
    renovatieKosten: 20000,
    eigenInleg: 85000,
    hypotheekBedrag: 215000,
    hypotheekMaandlast: 0,
    maandlastHandmatig: false,
    rentePercentage: 3.5,
    looptijdJaren: 30,
    marktwaarde: 320000,
    pandType: 'niet-woning',
    units: [
      { ...defaultUnit(), naam: "Unit 1", verdelingsfactor_pct: 33.33 },
      { ...defaultUnit(), id: crypto.randomUUID(), naam: "Unit 2", verdelingsfactor_pct: 33.33 },
      { ...defaultUnit(), id: crypto.randomUUID(), naam: "Unit 3", verdelingsfactor_pct: 33.34 },
    ],
    gemeenschappelijkeKosten: defaultKosten,
    irsJaar: new Date().getFullYear(),
    contractduurJaren: 1,
  });
  
  const [analysis, setAnalysis] = useState<MultiUnitAnalysis | null>(null);
  
  // Fetch mode preference
  useEffect(() => {
    const fetchModePreference = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from("profiles")
          .select("voorkeur_kpi_modus")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data?.voorkeur_kpi_modus) {
          setMode(data.voorkeur_kpi_modus as "beginner" | "gevorderd");
        }
      } catch (error) {
        console.error("Error fetching mode preference:", error);
      }
    };
    
    fetchModePreference();
  }, [user]);

  const handleModeChange = async (newMode: "beginner" | "gevorderd") => {
    setMode(newMode);
    
    if (!user) return;
    
    try {
      await supabase
        .from("profiles")
        .update({ voorkeur_kpi_modus: newMode })
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Error saving mode preference:", error);
    }
  };
  
  // Auto-run analysis on input changes
  useEffect(() => {
    const result = analyzeMultiUnit(inputs);
    setAnalysis(result);
  }, [inputs]);

  // Auto-calculate IMT when aankoopprijs or pandType changes
  useEffect(() => {
    if (inputs.imtAutomatisch) {
      const calculatedIMT = calculateIMTForMultiUnit(inputs.aankoopprijs, inputs.pandType);
      setInputs(prev => ({ ...prev, imt: calculatedIMT }));
    }
  }, [inputs.aankoopprijs, inputs.pandType, inputs.imtAutomatisch]);

  // Auto-calculate hypotheekBedrag when eigenInleg changes
  useEffect(() => {
    const totaalKosten = inputs.aankoopprijs + inputs.notarisKosten + inputs.renovatieKosten + (inputs.imtAutomatisch ? inputs.imt : inputs.imt);
    const berekendHypotheek = Math.max(0, totaalKosten - inputs.eigenInleg);
    setInputs(prev => ({ ...prev, hypotheekBedrag: berekendHypotheek }));
  }, [inputs.eigenInleg, inputs.aankoopprijs, inputs.notarisKosten, inputs.renovatieKosten, inputs.imt, inputs.imtAutomatisch]);

  // Calculate maandlast when not manual
  const berekendeMaandlast = calculatePMT(inputs.hypotheekBedrag, inputs.rentePercentage, inputs.looptijdJaren);
  
  const updateInput = <K extends keyof MultiUnitInputs>(key: K, value: MultiUnitInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const updateKosten = (key: keyof GemeenschappelijkeKosten, value: number) => {
    setInputs(prev => ({
      ...prev,
      gemeenschappelijkeKosten: { ...prev.gemeenschappelijkeKosten, [key]: value }
    }));
  };

  const handleNumberInput = (
    value: string,
    onChange: (val: number) => void
  ) => {
    // Allow empty string for clearing the field
    if (value === '' || value === '-') {
      onChange(0);
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const InputField = ({ 
    label, 
    value, 
    onChange, 
    tooltip,
    prefix,
    suffix,
    disabled,
  }: { 
    label: string; 
    value: number; 
    onChange: (val: number) => void;
    tooltip?: string;
    prefix?: string;
    suffix?: string;
    disabled?: boolean;
  }) => {
    const [localValue, setLocalValue] = useState(value.toString());

    // Sync localValue when external value changes
    useEffect(() => {
      setLocalValue(value.toString());
    }, [value]);

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          <Label className="text-sm text-muted-foreground">{label}</Label>
          {tooltip && <InfoTooltip title={label} content={tooltip} />}
        </div>
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {prefix}
            </span>
          )}
          <Input
            type="text"
            inputMode="decimal"
            value={localValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setLocalValue(newValue);
              handleNumberInput(newValue, onChange);
            }}
            onBlur={() => {
              // On blur, format to proper number
              const parsed = parseFloat(localValue);
              if (!isNaN(parsed)) {
                setLocalValue(parsed.toString());
              } else {
                setLocalValue('0');
                onChange(0);
              }
            }}
            disabled={disabled}
            className={`h-10 ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-12' : ''} ${disabled ? 'bg-muted' : ''}`}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Multi-Unit Vastgoedanalyse
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analyseer panden met meerdere units - 15+ metrics per unit en totaal
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <MultiUnitModeToggle mode={mode} onModeChange={handleModeChange} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Input Column */}
          <div className="space-y-4 lg:col-span-1">
            {/* Property Section */}
            <Collapsible open={expandedSections.pand} onOpenChange={() => toggleSection("pand")}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          expandedSections.pand ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>1</div>
                        <Building2 className="h-4 w-4" />
                        <CardTitle className="text-sm">Pandinformatie</CardTitle>
                      </div>
                      {expandedSections.pand ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Pandnaam</Label>
                      <Input
                        value={inputs.pandNaam}
                        onChange={(e) => updateInput("pandNaam", e.target.value)}
                        placeholder="Bijv. Apartementencomplex Lissabon"
                        className="h-10"
                      />
                    </div>
                    
                    {/* Pand Type Selection */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <Label className="text-sm text-muted-foreground">Type Pand</Label>
                        <InfoTooltip title="Type Pand" content="Selecteer het type pand voor IMT berekening. Niet-woning = 6.5% vast tarief." />
                      </div>
                      <Select
                        value={inputs.pandType}
                        onValueChange={(v) => updateInput("pandType", v as 'woning' | 'niet-woning')}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="niet-woning">Niet-woning (investering) - 6.5%</SelectItem>
                          <SelectItem value="woning">Woning - progressief tarief</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField
                        label="Aankoopprijs"
                        value={inputs.aankoopprijs}
                        onChange={(v) => updateInput("aankoopprijs", v)}
                        prefix="€"
                        tooltip="De totale aankoopprijs van het pand"
                      />
                      
                      {/* IMT with auto-calculate toggle */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Label className="text-sm text-muted-foreground">IMT</Label>
                            <InfoTooltip title="IMT" content="Imposto Municipal sobre Transmissões - overdrachtsbelasting bij aankoop. Automatisch berekend volgens Portugese 2025 tarieven." />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Auto</span>
                            <Switch
                              checked={inputs.imtAutomatisch}
                              onCheckedChange={(v) => updateInput("imtAutomatisch", v)}
                            />
                          </div>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={inputs.imt}
                            onChange={(e) => {
                              if (!inputs.imtAutomatisch) {
                                handleNumberInput(e.target.value, (v) => updateInput("imt", v));
                              }
                            }}
                            disabled={inputs.imtAutomatisch}
                            className={`h-10 pl-7 ${inputs.imtAutomatisch ? 'bg-muted' : ''}`}
                          />
                        </div>
                      </div>

                      <InputField
                        label="Notariskosten"
                        value={inputs.notarisKosten}
                        onChange={(v) => updateInput("notarisKosten", v)}
                        prefix="€"
                        tooltip="Kosten voor notaris en registratie"
                      />
                      <InputField
                        label="Renovatiekosten"
                        value={inputs.renovatieKosten}
                        onChange={(v) => updateInput("renovatieKosten", v)}
                        prefix="€"
                        tooltip="Geschatte kosten voor renovatie"
                      />
                      <InputField
                        label="Marktwaarde"
                        value={inputs.marktwaarde}
                        onChange={(v) => updateInput("marktwaarde", v)}
                        prefix="€"
                        tooltip="Huidige geschatte marktwaarde"
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Mortgage Section */}
            <Collapsible open={expandedSections.hypotheek} onOpenChange={() => toggleSection("hypotheek")}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          expandedSections.hypotheek ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>2</div>
                        <PiggyBank className="h-4 w-4" />
                        <CardTitle className="text-sm">Financiering</CardTitle>
                      </div>
                      {expandedSections.hypotheek ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <p className="text-xs text-muted-foreground">
                      Voer je eigen inleg in - het hypotheekbedrag wordt automatisch berekend (totale kosten - eigen inleg).
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField
                        label="Eigen Inleg"
                        value={inputs.eigenInleg}
                        onChange={(v) => updateInput("eigenInleg", v)}
                        prefix="€"
                        tooltip="Je eigen kapitaal dat je inlegt. Hypotheekbedrag = totale kosten - eigen inleg."
                      />
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <Label className="text-sm text-muted-foreground">Hypotheekbedrag</Label>
                          <InfoTooltip title="Hypotheekbedrag" content="Automatisch berekend: aankoopprijs + kosten - eigen inleg" />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                          <Input
                            type="text"
                            value={inputs.hypotheekBedrag.toLocaleString('nl-NL')}
                            disabled
                            className="h-10 pl-7 bg-muted"
                          />
                        </div>
                      </div>
                      <InputField
                        label="Rentepercentage"
                        value={inputs.rentePercentage}
                        onChange={(v) => updateInput("rentePercentage", v)}
                        suffix="%"
                        tooltip="Jaarlijkse rente op de hypotheek"
                      />
                      <InputField
                        label="Looptijd"
                        value={inputs.looptijdJaren}
                        onChange={(v) => updateInput("looptijdJaren", v)}
                        suffix="jaar"
                        tooltip="Looptijd van de hypotheek in jaren"
                      />
                    </div>

                    {/* Maandlast section */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <Label className="text-sm text-muted-foreground">Hypotheek Maandlast</Label>
                          <InfoTooltip title="Maandlast" content="Kies of je de maandlast automatisch wilt laten berekenen of handmatig wilt invoeren." />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Handmatig</span>
                          <Switch
                            checked={inputs.maandlastHandmatig}
                            onCheckedChange={(v) => updateInput("maandlastHandmatig", v)}
                          />
                        </div>
                      </div>
                      
                      {inputs.maandlastHandmatig ? (
                        <InputField
                          label=""
                          value={inputs.hypotheekMaandlast}
                          onChange={(v) => updateInput("hypotheekMaandlast", v)}
                          prefix="€"
                          tooltip="Voer je maandelijkse hypotheeklast in"
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
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Shared Costs Section */}
            <Collapsible open={expandedSections.kosten} onOpenChange={() => toggleSection("kosten")}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          expandedSections.kosten ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>3</div>
                        <Wallet className="h-4 w-4" />
                        <CardTitle className="text-sm">Gemeenschappelijke Kosten</CardTitle>
                      </div>
                      {expandedSections.kosten ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <p className="text-xs text-muted-foreground">
                      Deze kosten worden automatisch verdeeld over de units op basis van hun verdelingsfactor.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField
                        label="Gas (maand)"
                        value={inputs.gemeenschappelijkeKosten.gas_maandelijks}
                        onChange={(v) => updateKosten("gas_maandelijks", v)}
                        prefix="€"
                        tooltip="Maandelijkse gaskosten voor het hele pand"
                      />
                      <InputField
                        label="Water (maand)"
                        value={inputs.gemeenschappelijkeKosten.water_maandelijks}
                        onChange={(v) => updateKosten("water_maandelijks", v)}
                        prefix="€"
                        tooltip="Maandelijkse waterkosten"
                      />
                      <InputField
                        label="VvE (maand)"
                        value={inputs.gemeenschappelijkeKosten.vve_maandelijks}
                        onChange={(v) => updateKosten("vve_maandelijks", v)}
                        prefix="€"
                        tooltip="Maandelijkse VvE/condominium bijdrage"
                      />
                      <InputField
                        label="Onderhoud (jaar)"
                        value={inputs.gemeenschappelijkeKosten.onderhoud_jaarlijks}
                        onChange={(v) => updateKosten("onderhoud_jaarlijks", v)}
                        prefix="€"
                        tooltip="Jaarlijkse onderhoudskosten"
                      />
                      <InputField
                        label="Verzekering (jaar)"
                        value={inputs.gemeenschappelijkeKosten.verzekering_jaarlijks}
                        onChange={(v) => updateKosten("verzekering_jaarlijks", v)}
                        prefix="€"
                        tooltip="Jaarlijkse verzekeringspremie"
                      />
                    </div>

                    {/* IRS Belasting sectie */}
                    <div className="pt-3 border-t space-y-3">
                      <div className="flex items-center gap-1">
                        <Label className="text-sm font-medium">IRS Belasting (Portugese regels)</Label>
                        <InfoTooltip title="IRS Belasting" content="De IRS wordt automatisch berekend op basis van het jaar en contractduur. 2026-2029: 10% bij huur ≤€2.300/maand, anders 25%. Vóór 2026: progressief op basis van contractduur." />
                      </div>
                      
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">IRS Jaar</Label>
                          <Select
                            value={inputs.irsJaar.toString()}
                            onValueChange={(v) => updateInput("irsJaar", parseInt(v))}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year} {year >= 2026 && year <= 2029 ? '(nieuw regime)' : year <= 2025 ? '(oud regime)' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Contractduur (jaren)</Label>
                          <Select
                            value={inputs.contractduurJaren.toString()}
                            onValueChange={(v) => updateInput("contractduurJaren", parseInt(v))}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 jaar (28%)</SelectItem>
                              <SelectItem value="2">2-4 jaar (25%)</SelectItem>
                              <SelectItem value="5">5-9 jaar (15%)</SelectItem>
                              <SelectItem value="10">10-19 jaar (10%)</SelectItem>
                              <SelectItem value="20">20+ jaar (5%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-xs text-muted-foreground">
                          {inputs.irsJaar >= 2026 && inputs.irsJaar <= 2029 
                            ? `Nieuw regime (2026-2029): ${inputs.units.reduce((sum, u) => sum + u.maandhuur, 0) / Math.max(1, inputs.units.length) <= 2300 ? '10%' : '25%'} belasting`
                            : `Oud regime: Tarief op basis van contractduur (${inputs.contractduurJaren < 2 ? '28%' : inputs.contractduurJaren < 5 ? '25%' : inputs.contractduurJaren < 10 ? '15%' : inputs.contractduurJaren < 20 ? '10%' : '5%'})`
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Unit Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Units Configuratie
                </CardTitle>
                <CardDescription>
                  Voeg units toe en configureer hun eigenschappen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UnitInputForm 
                  units={inputs.units} 
                  onUnitsChange={(units) => updateInput("units", units)} 
                />
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysis && (
              mode === "beginner" ? (
                <MultiUnitBeginnerView analysis={analysis} />
              ) : (
                <MultiUnitAdvancedView 
                  analysis={analysis} 
                  pandNaam={inputs.pandNaam || "Multi-Unit Analyse"} 
                />
              )
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
