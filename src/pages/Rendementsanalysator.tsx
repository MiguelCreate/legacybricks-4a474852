import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calculator, Users, HelpCircle } from "lucide-react";
import { 
  analyzeInvestment, 
  AnalysisInputs, 
  InvestmentAnalysis,
  getRiskAssessment,
} from "@/lib/rendementsCalculations";
import { PartnerOverview } from "@/components/analysator/PartnerOverview";
import { GuidedTour } from "@/components/analysator/GuidedTour";
import { AnalysatorModeToggle } from "@/components/analysator/AnalysatorModeToggle";
import { BeginnerWizardView } from "@/components/analysator/BeginnerWizardView";
import { AdvancedSplitView } from "@/components/analysator/AdvancedSplitView";

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

export default function Rendementsanalysator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [activeTimeframe, setActiveTimeframe] = useState<TimeFrame>("10j");
  const [showPartnerOverview, setShowPartnerOverview] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [mode, setMode] = useState<"beginner" | "gevorderd">("beginner");
  
  // Form inputs
  const [inputs, setInputs] = useState<AnalysisInputs>({
    purchasePrice: 250000,
    imt: 12500,
    notaryFees: 3500,
    renovationCosts: 15000,
    furnishingCosts: 5000,
    mortgageInputType: "ltv",
    ltv: 75,
    downpayment: 62500,
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

  // Load data from Academy quick start
  useEffect(() => {
    const priceParam = searchParams.get("price");
    const rentParam = searchParams.get("rent");
    const locationParam = searchParams.get("location");
    const fromParam = searchParams.get("from");
    const lessonParam = searchParams.get("lesson");
    
    if (fromParam === "academy" && (priceParam || rentParam)) {
      setInputs(prev => {
        const newInputs = { ...prev };
        
        if (priceParam) {
          const price = parseInt(priceParam);
          newInputs.purchasePrice = price;
          // IMT for investors (niet-woning) = 6.5% flat rate
          newInputs.imt = Math.round(price * 0.065);
          newInputs.downpayment = Math.round(price * 0.25);
        }
        
        if (rentParam) {
          newInputs.monthlyRentLT = parseInt(rentParam);
        }
        
        return newInputs;
      });
      
      if (locationParam) {
        setPropertyLocation(locationParam);
        setPropertyName(`${locationParam} - Academy voorbeeld`);
      }
      
      if (lessonParam) {
        toast({
          title: "📚 Academy voorbeelddata geladen",
          description: `Data uit les "${lessonParam}" is ingevuld. Pas de waardes aan om je eigen scenario te analyseren.`,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setInputs((prev) => {
      const next = { ...prev, [key]: value } as AnalysisInputs;

      // Auto-calc IMT + IMI whenever purchase price changes
      // IMT for investors (niet-woning) = 6.5% flat rate
      if (key === "purchasePrice") {
        const price = typeof value === "number" ? value : Number(value);
        next.imt = Math.round(price * 0.065);
        next.imiYearly = Math.round(price * 0.003);

        // Keep LTV in sync when user is in downpayment mode
        if ((next.mortgageInputType || "ltv") === "downpayment") {
          const down = Number(next.downpayment ?? 0);
          next.ltv = price > 0 ? Math.max(0, Math.min(100, ((price - down) / price) * 100)) : 0;
        }
      }

      return next;
    });
  };

  const handleLoadProperty = (loadedInputs: Partial<AnalysisInputs>, name: string, location: string) => {
    setInputs(prev => ({ ...prev, ...loadedInputs }));
    setPropertyName(name);
    setPropertyLocation(location);
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
    
    const rentalTypeMap: Record<string, string> = {
      longterm: "langdurig",
      shortterm: "kortlopend",
      mixed: "gemengd",
    };
    
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
      type_verhuur: rentalTypeMap[inputs.rentalType] || "langdurig",
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

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Rendementsanalysator
            </h1>
            <p className="text-sm text-muted-foreground">
              Analyseer potentiële investeringen
            </p>
          </div>
          
          <div className="flex gap-2">
            {mode === "gevorderd" && (
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
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPartnerOverview(true)}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Partner
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

        {/* Main Content */}
        {mode === "beginner" ? (
          <BeginnerWizardView
            inputs={inputs}
            updateInput={updateInput}
            analysis={analysis}
            propertyName={propertyName}
            setPropertyName={setPropertyName}
            propertyLocation={propertyLocation}
            setPropertyLocation={setPropertyLocation}
            onSave={handleSaveAsProperty}
            onSwitchToAdvanced={() => handleModeChange("gevorderd")}
          />
        ) : (
          <AdvancedSplitView
            inputs={inputs}
            updateInput={updateInput}
            analysis={analysis}
            activeTimeframe={activeTimeframe}
            setActiveTimeframe={setActiveTimeframe}
            propertyName={propertyName}
            setPropertyName={setPropertyName}
            propertyLocation={propertyLocation}
            setPropertyLocation={setPropertyLocation}
            onSave={handleSaveAsProperty}
            onLoadProperty={handleLoadProperty}
          />
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
