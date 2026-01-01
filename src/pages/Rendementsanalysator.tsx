import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calculator, 
  TrendingUp, 
  Building2, 
  PiggyBank, 
  Target, 
  FileDown,
  Save,
  Users,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Euro,
  Percent,
  HelpCircle,
  Sparkles,
  GraduationCap,
  LineChart
} from "lucide-react";
import { 
  analyzeInvestment, 
  AnalysisInputs, 
  InvestmentAnalysis,
  getRiskAssessment,
  metricExplanations
} from "@/lib/rendementsCalculations";
import { KPIDashboard } from "@/components/analysator/KPIDashboard";
import { CashflowTable } from "@/components/analysator/CashflowTable";
import { ExitAnalysisCard } from "@/components/analysator/ExitAnalysisCard";
import { PartnerOverview } from "@/components/analysator/PartnerOverview";
import { SnowballImpact } from "@/components/analysator/SnowballImpact";
import { GuidedTour, getStepForSection } from "@/components/analysator/GuidedTour";
import { VisualCharts } from "@/components/analysator/VisualCharts";
import { AnalysatorModeToggle } from "@/components/analysator/AnalysatorModeToggle";
import { BeginnerAnalysatorView } from "@/components/analysator/BeginnerAnalysatorView";

type TimeFrame = "5j" | "10j" | "15j" | "30j";

const timeframeYears: Record<TimeFrame, number> = {
  "5j": 5,
  "10j": 10,
  "15j": 15,
  "30j": 30,
};

interface Goal {
  id: string;
  naam: string;
  doelbedrag: number;
  huidig_bedrag: number;
}

// Section explanations for inline help
const sectionExplanations: Record<string, { title: string; description: string }> = {
  purchase: {
    title: "💰 Aankoopkosten",
    description: "Alle eenmalige kosten bij de aankoop van je pand. Deze bepalen je totale investering.",
  },
  mortgage: {
    title: "🏦 Hypotheek",
    description: "Hoeveel je leent en tegen welke voorwaarden. Dit bepaalt je maandlasten en hefboomwerking.",
  },
  rental: {
    title: "🏠 Verhuurinkomsten",
    description: "Je verwachte huurinkomsten. Wees realistisch - dit is de basis van je rendement!",
  },
  opex: {
    title: "📊 Exploitatiekosten",
    description: "Alle terugkerende kosten voor beheer en onderhoud. Onderschat deze niet!",
  },
  assumptions: {
    title: "📈 Toekomstaannames",
    description: "Hoe je verwacht dat huren, kosten en waarde ontwikkelen. Wees conservatief.",
  },
};

// InputField component - defined outside to prevent re-creation on each render
const InputField = ({ 
  label, 
  value, 
  onChange, 
  tooltip,
  prefix,
  suffix,
  hint,
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
  tooltip?: string;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) => (
  <div className="space-y-1.5 sm:space-y-1">
    <div className="flex items-center gap-1">
      <Label className="text-sm sm:text-xs text-muted-foreground">{label}</Label>
      {tooltip && <InfoTooltip title={label} content={tooltip} />}
    </div>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm sm:text-xs text-muted-foreground">
          {prefix}
        </span>
      )}
      <Input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`h-12 sm:h-9 text-base sm:text-sm ${prefix ? 'pl-8 sm:pl-7' : ''} ${suffix ? 'pr-14 sm:pr-12' : ''}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm sm:text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
    {hint && <p className="text-xs sm:text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

// InputSection component - defined outside to prevent re-creation on each render
const InputSection = ({ 
  title, 
  sectionKey, 
  icon: Icon,
  children,
  stepNumber,
  expandedSections,
  toggleSection,
}: { 
  title: string; 
  sectionKey: string;
  icon: React.ElementType;
  children: React.ReactNode;
  stepNumber: number;
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
}) => {
  const explanation = sectionExplanations[sectionKey];
  const isActive = expandedSections[sectionKey];
  
  return (
    <Card className={`shadow-card transition-all ${isActive ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader 
        className="cursor-pointer py-4 sm:py-3 px-4 sm:px-6"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2">
            <div className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-sm sm:text-xs font-bold ${
              isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {stepNumber}
            </div>
            <Icon className={`h-5 w-5 sm:h-4 sm:w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <CardTitle className="text-base sm:text-sm font-medium">{title}</CardTitle>
          </div>
          {isActive ? (
            <ChevronUp className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
          )}
        </div>
        {!isActive && explanation && (
          <p className="text-sm sm:text-xs text-muted-foreground mt-2 sm:mt-1 ml-10 sm:ml-8">{explanation.description}</p>
        )}
      </CardHeader>
      {isActive && (
        <CardContent className="pt-0 pb-4 px-4 sm:px-6">
          {explanation && (
            <div className="bg-accent/50 rounded-lg p-4 sm:p-3 mb-4">
              <p className="text-base sm:text-sm text-foreground font-medium">{explanation.title}</p>
              <p className="text-sm sm:text-xs text-muted-foreground mt-1">{explanation.description}</p>
            </div>
          )}
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export default function Rendementsanalysator() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTimeframe, setActiveTimeframe] = useState<TimeFrame>("10j");
  const [showPartnerOverview, setShowPartnerOverview] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(true);
  const [tourStep, setTourStep] = useState(1);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [mode, setMode] = useState<"beginner" | "gevorderd">("beginner");
  const [expandedSections, setExpandedSections] = useState({
    purchase: true,
    mortgage: false,
    rental: false,
    opex: false,
    assumptions: false,
  });
  const [activeResultTab, setActiveResultTab] = useState<"kpis" | "charts" | "table">("kpis");
  
  // Form inputs
  const [inputs, setInputs] = useState<AnalysisInputs>({
    purchasePrice: 250000,
    imt: 12500,
    notaryFees: 3500,
    renovationCosts: 15000,
    furnishingCosts: 5000,
    ltv: 75,
    interestRate: 3.5,
    loanTermYears: 30,
    monthlyRentLT: 1200,
    stOccupancy: 70,
    stADR: 120,
    rentalType: "longterm",
    managementPercent: 10,
    maintenanceYearly: 2000,
    imiYearly: 750,
    insuranceYearly: 400,
    condoMonthly: 75,
    utilitiesMonthly: 50,
    rentGrowth: 2,
    costGrowth: 2,
    valueGrowth: 3,
    years: timeframeYears[activeTimeframe],
  });
  
  const [analysis, setAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [propertyName, setPropertyName] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  
  // Fetch goals and mode preference
  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("goals")
        .select("id, naam, doelbedrag, huidig_bedrag")
        .eq("user_id", user.id)
        .eq("bereikt", false);
      
      if (!error && data) {
        setGoals(data);
      }
    };
    
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
    
    fetchGoals();
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
  
  // Update analysis when inputs or timeframe changes
  useEffect(() => {
    const updatedInputs = { ...inputs, years: timeframeYears[activeTimeframe] };
    setInputs(updatedInputs);
    const result = analyzeInvestment(updatedInputs);
    setAnalysis(result);
  }, [activeTimeframe]);
  
  // Auto-run analysis on input changes
  useEffect(() => {
    const result = analyzeInvestment(inputs);
    setAnalysis(result);
  }, [inputs]);
  
  const updateInput = (key: keyof AnalysisInputs, value: number | string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    // Update tour step when expanding a section
    const step = getStepForSection(section);
    if (step > 1) setTourStep(step);
  };
  
  const handleSaveAsProperty = async () => {
    if (!user || !propertyName || !propertyLocation) {
      toast({
        title: "Vul alle velden in",
        description: "Naam en locatie zijn verplicht om op te slaan.",
        variant: "destructive",
      });
      return;
    }
    
    const { error } = await supabase.from("properties").insert({
      user_id: user.id,
      naam: propertyName,
      locatie: propertyLocation,
      aankoopprijs: inputs.purchasePrice,
      notaris_kosten: inputs.notaryFees,
      imt_betaald: inputs.imt,
      renovatie_kosten: inputs.renovationCosts,
      inrichting_kosten: inputs.furnishingCosts,
      maandelijkse_huur: inputs.monthlyRentLT,
      st_bezetting_percentage: inputs.stOccupancy,
      st_gemiddelde_dagprijs: inputs.stADR,
      type_verhuur: inputs.rentalType,
      beheerkosten_percentage: inputs.managementPercent,
      onderhoud_jaarlijks: inputs.maintenanceYearly,
      verzekering_jaarlijks: inputs.insuranceYearly,
      condominium_maandelijks: inputs.condoMonthly,
      imi_percentage: inputs.imiYearly / inputs.purchasePrice,
      huurgroei_percentage: inputs.rentGrowth,
      kostenstijging_percentage: inputs.costGrowth,
      waardegroei_percentage: inputs.valueGrowth,
      analyse_status: "potentieel",
      gerelateerd_doel_id: selectedGoalId || null,
      tijdsframe_analyse: activeTimeframe,
      status: "aankoop",
    });
    
    if (error) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pand opgeslagen",
        description: `"${propertyName}" is opgeslagen als potentiële investering.`,
      });
      setPropertyName("");
      setPropertyLocation("");
    }
  };
  
  const riskAssessment = analysis ? getRiskAssessment(analysis) : null;
  
  // InputSection and InputField are now defined outside the component

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              Pand Rendementsanalysator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analyseer potentiële investeringen met simulaties voor 5, 10, 15 of 30 jaar
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setShowGuidedTour(true);
                setTourStep(1);
              }}
              className="gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Guide
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPartnerOverview(true)}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Partner Overzicht
            </Button>
          </div>
        </div>
        
        {/* Guided Tour */}
        {showGuidedTour && mode === "gevorderd" && (
          <GuidedTour 
            currentStep={tourStep}
            onStepChange={setTourStep}
            onClose={() => setShowGuidedTour(false)}
          />
        )}

        {/* Mode Toggle */}
        <AnalysatorModeToggle mode={mode} onModeChange={handleModeChange} />

        {mode === "beginner" ? (
          /* Beginner Mode - Simple View */
          analysis && <BeginnerAnalysatorView analysis={analysis} />
        ) : (
          /* Advanced Mode - Full View */
          <>
            {/* Timeframe Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Tabs value={activeTimeframe} onValueChange={(v) => setActiveTimeframe(v as TimeFrame)}>
                <TabsList className="grid w-full max-w-md grid-cols-4">
                  <TabsTrigger value="5j">5 Jaar</TabsTrigger>
                  <TabsTrigger value="10j">10 Jaar</TabsTrigger>
                  <TabsTrigger value="15j">15 Jaar</TabsTrigger>
                  <TabsTrigger value="30j">30 Jaar</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {analysis && (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Live berekening actief
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Input Column */}
              <div className="space-y-4 lg:col-span-1">
                {/* Purchase Section */}
                <InputSection title="Aankoop" sectionKey="purchase" icon={Building2} stepNumber={1} expandedSections={expandedSections} toggleSection={toggleSection}>
              <div className="grid gap-3">
                <InputField
                  label="Aankoopprijs"
                  value={inputs.purchasePrice}
                  onChange={(v) => updateInput("purchasePrice", v)}
                  prefix="€"
                  hint="De vraagprijs of jouw bod"
                />
                <InputField
                  label="IMT (overdrachtsbelasting)"
                  value={inputs.imt}
                  onChange={(v) => updateInput("imt", v)}
                  tooltip="Imposto Municipal sobre Transmissões: eenmalige belasting bij aankoop (0-8%)"
                  prefix="€"
                  hint="Meestal 6-8% voor tweede woning"
                />
                <InputField
                  label="Notariskosten"
                  value={inputs.notaryFees}
                  onChange={(v) => updateInput("notaryFees", v)}
                  prefix="€"
                  hint="Inclusief registratie en juridische kosten"
                />
                <InputField
                  label="Renovatiekosten"
                  value={inputs.renovationCosts}
                  onChange={(v) => updateInput("renovationCosts", v)}
                  prefix="€"
                  hint="Eventuele verbouwingen voor verhuur"
                />
                <InputField
                  label="Inrichtingskosten"
                  value={inputs.furnishingCosts}
                  onChange={(v) => updateInput("furnishingCosts", v)}
                  prefix="€"
                  hint="Meubels, keukenapparatuur, etc."
                />
              </div>
            </InputSection>
            
            {/* Mortgage Section */}
            <InputSection title="Hypotheek" sectionKey="mortgage" icon={PiggyBank} stepNumber={2} expandedSections={expandedSections} toggleSection={toggleSection}>
              <div className="grid gap-3">
                <InputField
                  label="LTV (Loan-to-Value)"
                  value={inputs.ltv}
                  onChange={(v) => updateInput("ltv", v)}
                  tooltip="Hoeveel % je leent van de aankoopprijs. 75% LTV = je betaalt 25% zelf."
                  suffix="%"
                  hint="Banken geven vaak max 70-80%"
                />
                <InputField
                  label="Rente"
                  value={inputs.interestRate}
                  onChange={(v) => updateInput("interestRate", v)}
                  suffix="%"
                  hint="Huidige marktrente in Portugal"
                />
                <InputField
                  label="Looptijd"
                  value={inputs.loanTermYears}
                  onChange={(v) => updateInput("loanTermYears", v)}
                  suffix="jaar"
                  hint="Standaard 25-30 jaar"
                />
              </div>
            </InputSection>
            
            {/* Rental Section */}
            <InputSection title="Verhuur" sectionKey="rental" icon={Euro} stepNumber={3} expandedSections={expandedSections} toggleSection={toggleSection}>
              <div className="grid gap-3">
                <div className="space-y-1.5">
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
                  <p className="text-[10px] text-muted-foreground">
                    Langdurig = stabiel, korte termijn = hoger rendement maar meer werk
                  </p>
                </div>
                
                {(inputs.rentalType === "longterm" || inputs.rentalType === "mixed") && (
                  <InputField
                    label="Maandelijkse huur (LT)"
                    value={inputs.monthlyRentLT}
                    onChange={(v) => updateInput("monthlyRentLT", v)}
                    prefix="€"
                    hint="Check Idealista voor marktprijzen"
                  />
                )}
                
                {(inputs.rentalType === "shortterm" || inputs.rentalType === "mixed") && (
                  <>
                    <InputField
                      label="Bezettingsgraad (ST)"
                      value={inputs.stOccupancy}
                      onChange={(v) => updateInput("stOccupancy", v)}
                      tooltip="Percentage van het jaar dat het pand verhuurd is"
                      suffix="%"
                      hint="60-70% is realistisch voor Airbnb"
                    />
                    <InputField
                      label="ADR (gemiddelde dagprijs)"
                      value={inputs.stADR}
                      onChange={(v) => updateInput("stADR", v)}
                      tooltip="Average Daily Rate: gemiddelde prijs per nacht"
                      prefix="€"
                      hint="Check AirDNA voor marktdata"
                    />
                  </>
                )}
              </div>
            </InputSection>
            
            {/* OPEX Section */}
            <InputSection title="Exploitatiekosten" sectionKey="opex" icon={Percent} stepNumber={4} expandedSections={expandedSections} toggleSection={toggleSection}>
              <div className="grid gap-3">
                <InputField
                  label="Beheerkosten"
                  value={inputs.managementPercent}
                  onChange={(v) => updateInput("managementPercent", v)}
                  tooltip="Percentage van huurinkomsten voor property management"
                  suffix="%"
                  hint="8-15% is gebruikelijk"
                />
                <InputField
                  label="Onderhoud (jaarlijks)"
                  value={inputs.maintenanceYearly}
                  onChange={(v) => updateInput("maintenanceYearly", v)}
                  prefix="€"
                  hint="1-2% van woningwaarde per jaar"
                />
                <InputField
                  label="IMI (jaarlijks)"
                  value={inputs.imiYearly}
                  onChange={(v) => updateInput("imiYearly", v)}
                  tooltip="Imposto Municipal sobre Imóveis: jaarlijkse onroerendgoedbelasting"
                  prefix="€"
                  hint="0.3-0.5% van kadastrale waarde"
                />
                <InputField
                  label="Verzekering (jaarlijks)"
                  value={inputs.insuranceYearly}
                  onChange={(v) => updateInput("insuranceYearly", v)}
                  prefix="€"
                />
                <InputField
                  label="VvE/Condominium"
                  value={inputs.condoMonthly}
                  onChange={(v) => updateInput("condoMonthly", v)}
                  prefix="€"
                  suffix="/mnd"
                  hint="Vraag dit op bij de verkoper"
                />
                <InputField
                  label="Utilities"
                  value={inputs.utilitiesMonthly}
                  onChange={(v) => updateInput("utilitiesMonthly", v)}
                  prefix="€"
                  suffix="/mnd"
                  hint="Alleen als jij betaalt (korte termijn verhuur)"
                />
              </div>
            </InputSection>
            
            {/* Assumptions Section */}
            <InputSection title="Aannames" sectionKey="assumptions" icon={TrendingUp} stepNumber={5} expandedSections={expandedSections} toggleSection={toggleSection}>
              <div className="grid gap-3">
                <InputField
                  label="Huurgroei"
                  value={inputs.rentGrowth}
                  onChange={(v) => updateInput("rentGrowth", v)}
                  tooltip="Verwachte jaarlijkse stijging van de huurprijs"
                  suffix="%/jaar"
                  hint="2% is conservatief"
                />
                <InputField
                  label="Kostenstijging"
                  value={inputs.costGrowth}
                  onChange={(v) => updateInput("costGrowth", v)}
                  tooltip="Verwachte jaarlijkse stijging van exploitatiekosten"
                  suffix="%/jaar"
                  hint="Volgt meestal inflatie"
                />
                <InputField
                  label="Waardegroei"
                  value={inputs.valueGrowth}
                  onChange={(v) => updateInput("valueGrowth", v)}
                  tooltip="Verwachte jaarlijkse stijging van de woningwaarde"
                  suffix="%/jaar"
                  hint="2-3% is realistisch langetermijn"
                />
              </div>
            </InputSection>
          </div>
          
          {/* Results Column */}
          <div className="space-y-6 lg:col-span-2">
            {analysis && (
              <>
                {/* Risk Assessment Banner */}
                {riskAssessment && (
                  <Card className={`border-l-4 ${
                    riskAssessment.color === 'success' ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20' :
                    riskAssessment.color === 'warning' ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20' :
                    'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
                  }`}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        {riskAssessment.color === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : riskAssessment.color === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {riskAssessment.level === 'good' ? '🟢 Goed rendabel' :
                             riskAssessment.level === 'moderate' ? '🟡 Matig rendabel' :
                             '🔴 Risicovol'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {riskAssessment.reasons[0]}
                          </p>
                        </div>
                        <InfoTooltip 
                          title="Beoordeling"
                          content={riskAssessment.reasons.join(' | ')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Results Tabs */}
                <Tabs value={activeResultTab} onValueChange={(v) => setActiveResultTab(v as typeof activeResultTab)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="kpis" className="gap-2">
                      <Target className="h-4 w-4" />
                      KPI's
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Grafieken
                    </TabsTrigger>
                    <TabsTrigger value="table" className="gap-2">
                      <Calculator className="h-4 w-4" />
                      Tabel
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="kpis" className="mt-4 space-y-4">
                    <KPIDashboard analysis={analysis} />
                    <ExitAnalysisCard 
                      exitAnalysis={analysis.exitAnalysis}
                      years={timeframeYears[activeTimeframe]}
                      ownCapital={analysis.ownCapital}
                    />
                  </TabsContent>
                  
                  <TabsContent value="charts" className="mt-4">
                    <VisualCharts analysis={analysis} />
                  </TabsContent>
                  
                  <TabsContent value="table" className="mt-4">
                    <CashflowTable 
                      cashflows={analysis.yearlyCashflows} 
                      timeframe={activeTimeframe}
                    />
                  </TabsContent>
                </Tabs>
                
                {/* Snowball Effect */}
                <SnowballImpact
                  newPropertyDebt={analysis.loanAmount}
                  newPropertyMonthlyPayment={analysis.yearlyCashflows[0]?.debtService / 12 || 0}
                  newPropertyNetCashflow={analysis.yearlyCashflows[0]?.netCashflow / 12 || 0}
                  newPropertyInterestRate={inputs.interestRate}
                  newPropertyName={propertyName || "Nieuw Pand"}
                />
                
                {/* Goal Linking */}
                {goals.length > 0 && (
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Koppel aan Doel
                        <InfoTooltip 
                          title="Doelkoppeling"
                          content="Koppel dit pand aan een van je financiële doelen om te zien hoeveel het bijdraagt."
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een doel..." />
                        </SelectTrigger>
                        <SelectContent>
                          {goals.map((goal) => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.naam} (€{goal.doelbedrag.toLocaleString("nl-NL")})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedGoalId && analysis && (
                        <div className="mt-3 p-3 bg-accent/50 rounded-lg">
                          <p className="text-sm text-foreground">
                            💡 Met dit pand genereer je gemiddeld{" "}
                            <strong>
                              €{Math.round(analysis.yearlyCashflows[0]?.netCashflow / 12 || 0).toLocaleString("nl-NL")}
                            </strong>
                            /maand netto cashflow.
                          </p>
                          {(() => {
                            const goal = goals.find(g => g.id === selectedGoalId);
                            if (goal) {
                              const monthlyContribution = analysis.yearlyCashflows[0]?.netCashflow / 12 || 0;
                              const remaining = goal.doelbedrag - goal.huidig_bedrag;
                              const monthsToGoal = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : Infinity;
                              return (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Dat dekt{" "}
                                  <strong>{Math.round((monthlyContribution / (goal.doelbedrag / 12)) * 100)}%</strong> van je maandelijkse doelbijdrage voor "{goal.naam}".
                                  {monthsToGoal < Infinity && monthsToGoal > 0 && (
                                    <> Je bereikt dit doel in ongeveer <strong>{monthsToGoal} maanden</strong>.</>
                                  )}
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* Save as Property */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Save className="h-4 w-4 text-primary" />
                      Opslaan als Potentiële Investering
                    </CardTitle>
                    <CardDescription>
                      Sla deze analyse op om later te vergelijken of te activeren bij aankoop
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Pandnaam</Label>
                        <Input
                          value={propertyName}
                          onChange={(e) => setPropertyName(e.target.value)}
                          placeholder="Bijv. Appartement Lissabon"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Locatie</Label>
                        <Input
                          value={propertyLocation}
                          onChange={(e) => setPropertyLocation(e.target.value)}
                          placeholder="Bijv. Lissabon, Portugal"
                        />
                      </div>
                    </div>
                    <Button onClick={handleSaveAsProperty} className="w-full gap-2">
                      <Save className="h-4 w-4" />
                      Opslaan als Nieuw Pand
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
          </>
        )}
      </div>
      
      {/* Partner Overview Dialog */}
      {showPartnerOverview && analysis && (
        <PartnerOverview
          open={showPartnerOverview}
          onOpenChange={setShowPartnerOverview}
          analysis={analysis}
          inputs={inputs}
          propertyName={propertyName || "Nieuw Pand"}
          propertyLocation={propertyLocation || "Onbekend"}
          timeframe={activeTimeframe}
          riskAssessment={riskAssessment}
          linkedGoal={goals.find(g => g.id === selectedGoalId)}
        />
      )}
    </AppLayout>
  );
}
