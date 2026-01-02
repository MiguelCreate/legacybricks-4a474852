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
  MultiUnitAnalysis
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
    imt: 15000,
    notarisKosten: 4000,
    renovatieKosten: 20000,
    eigenInleg: 85000,
    hypotheekBedrag: 215000,
    rentePercentage: 3.5,
    looptijdJaren: 30,
    marktwaarde: 320000,
    units: [
      { ...defaultUnit(), naam: "Unit 1", verdelingsfactor_pct: 33.33 },
      { ...defaultUnit(), id: crypto.randomUUID(), naam: "Unit 2", verdelingsfactor_pct: 33.33 },
      { ...defaultUnit(), id: crypto.randomUUID(), naam: "Unit 3", verdelingsfactor_pct: 33.34 },
    ],
    gemeenschappelijkeKosten: defaultKosten,
    irsPercentage: 28,
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
  
  const updateInput = <K extends keyof MultiUnitInputs>(key: K, value: MultiUnitInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const updateKosten = (key: keyof GemeenschappelijkeKosten, value: number) => {
    setInputs(prev => ({
      ...prev,
      gemeenschappelijkeKosten: { ...prev.gemeenschappelijkeKosten, [key]: value }
    }));
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
  }: { 
    label: string; 
    value: number; 
    onChange: (val: number) => void;
    tooltip?: string;
    prefix?: string;
    suffix?: string;
  }) => (
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
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`h-10 ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

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
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField
                        label="Aankoopprijs"
                        value={inputs.aankoopprijs}
                        onChange={(v) => updateInput("aankoopprijs", v)}
                        prefix="€"
                        tooltip="De totale aankoopprijs van het pand"
                      />
                      <InputField
                        label="IMT"
                        value={inputs.imt}
                        onChange={(v) => updateInput("imt", v)}
                        prefix="€"
                        tooltip="Imposto Municipal sobre Transmissões Onerosas de Imóveis"
                      />
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
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField
                        label="Eigen Inleg"
                        value={inputs.eigenInleg}
                        onChange={(v) => updateInput("eigenInleg", v)}
                        prefix="€"
                        tooltip="Je eigen kapitaal dat je inlegt"
                      />
                      <InputField
                        label="Hypotheekbedrag"
                        value={inputs.hypotheekBedrag}
                        onChange={(v) => updateInput("hypotheekBedrag", v)}
                        prefix="€"
                        tooltip="Het bedrag dat je leent"
                      />
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
                      <InputField
                        label="IRS Belasting"
                        value={inputs.irsPercentage}
                        onChange={(v) => updateInput("irsPercentage", v)}
                        suffix="%"
                        tooltip="Belastingpercentage op huurinkomsten"
                      />
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
