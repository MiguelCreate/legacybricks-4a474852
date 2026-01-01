import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, LineChart } from "lucide-react";
import { BeginnerModeKPIs } from "./BeginnerModeKPIs";
import { AdvancedModeKPIs } from "./AdvancedModeKPIs";
import { analyzeInvestment, AnalysisInputs, InvestmentAnalysis } from "@/lib/rendementsCalculations";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Loan = Tables<"loans">;

interface FinancieelDashboardProps {
  property: Property;
  loans: Loan[];
}

export const FinancieelDashboard = ({ property, loans }: FinancieelDashboardProps) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<"beginner" | "gevorderd">("beginner");
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<InvestmentAnalysis | null>(null);

  useEffect(() => {
    fetchModePreference();
    calculateAnalysis();
  }, [user, property, loans]);

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
    } finally {
      setLoading(false);
    }
  };

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

  const calculateAnalysis = () => {
    // Get loan data
    const primaryLoan = loans.find(l => l.property_id === property.id);
    
    // Calculate LTV from loan and property data
    const loanAmount = primaryLoan?.hoofdsom || primaryLoan?.restschuld || 0;
    const ltv = property.aankoopprijs > 0 ? (loanAmount / property.aankoopprijs) * 100 : 0;
    
    // Build analysis inputs from property data
    const inputs: AnalysisInputs = {
      purchasePrice: Number(property.aankoopprijs) || 0,
      imt: Number(property.imt_betaald) || 0,
      notaryFees: Number(property.notaris_kosten) || 0,
      renovationCosts: Number(property.renovatie_kosten) || 0,
      furnishingCosts: Number(property.inrichting_kosten) || 0,
      ltv: ltv,
      interestRate: primaryLoan?.rente_percentage ? Number(primaryLoan.rente_percentage) : 3.5,
      loanTermYears: primaryLoan?.looptijd_jaren || 30,
      monthlyRentLT: Number(property.maandelijkse_huur) || 0,
      stOccupancy: Number(property.st_bezetting_percentage) || 70,
      stADR: Number(property.st_gemiddelde_dagprijs) || 0,
      rentalType: (property.type_verhuur === "shortterm" || property.type_verhuur === "mixed") 
        ? property.type_verhuur as "shortterm" | "mixed" 
        : "longterm",
      managementPercent: Number(property.beheerkosten_percentage) || 0,
      maintenanceYearly: Number(property.onderhoud_jaarlijks) || 0,
      imiYearly: Number(property.aankoopprijs) * Number(property.imi_percentage || 0.003),
      insuranceYearly: Number(property.verzekering_jaarlijks) || 0,
      condoMonthly: Number(property.condominium_maandelijks) || 0,
      utilitiesMonthly: (Number(property.water_maandelijks) || 0) + 
                        (Number(property.gas_maandelijks) || 0) + 
                        (Number(property.elektriciteit_maandelijks) || 0),
      rentGrowth: Number(property.huurgroei_percentage) || 2,
      costGrowth: Number(property.kostenstijging_percentage) || 2,
      valueGrowth: Number(property.waardegroei_percentage) || 3,
      years: property.tijdsframe_analyse === "5j" ? 5 : 
             property.tijdsframe_analyse === "15j" ? 15 : 
             property.tijdsframe_analyse === "30j" ? 30 : 10,
    };

    const result = analyzeInvestment(inputs);
    setAnalysis(result);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-pulse">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Weergave:</Label>
              <Tabs value={mode} onValueChange={(v) => handleModeChange(v as "beginner" | "gevorderd")}>
                <TabsList>
                  <TabsTrigger value="beginner" className="gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Beginners
                  </TabsTrigger>
                  <TabsTrigger value="gevorderd" className="gap-2">
                    <LineChart className="w-4 h-4" />
                    Gevorderden
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Badge variant="outline" className="text-xs">
              {mode === "beginner" ? "Educatief met uitleg" : "Volledige dataset"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Content based on mode */}
      {analysis && (
        mode === "beginner" ? (
          <BeginnerModeKPIs analysis={analysis} property={property} />
        ) : (
          <AdvancedModeKPIs analysis={analysis} property={property} loans={loans} />
        )
      )}
    </div>
  );
};
