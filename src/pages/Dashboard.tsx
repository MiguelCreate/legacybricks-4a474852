import { useState, useEffect } from "react";
import { Building2, Users, Euro, TrendingUp, Plus, Receipt, AlertTriangle, FileText, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { QuickAction } from "@/components/ui/QuickAction";
import { DailyMission } from "@/components/dashboard/DailyMission";
import { StreakBanner } from "@/components/dashboard/StreakBanner";
import { LegacyMantra } from "@/components/dashboard/LegacyMantra";
import { CoPiloot } from "@/components/dashboard/CoPiloot";
import { WelcomeOnboarding } from "@/components/dashboard/WelcomeOnboarding";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calculateGrossYield, calculatePropertyCashflow } from "@/lib/financialCalculations";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Tenant = Tables<"tenants">;
type Loan = Tables<"loans">;
type Contract = Tables<"contracts">;
type Profile = Tables<"profiles">;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [useCoPilot, setUseCoPilot] = useState<boolean | null>(null);
  const [showCoPilot, setShowCoPilot] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("vastgoedapp_onboarding_complete");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchCoPilotPreference();
    }
  }, [user]);

  const fetchCoPilotPreference = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("co_pilot_standaard")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (data) {
        const preference = (data as any).co_pilot_standaard;
        setUseCoPilot(preference !== false);
        setShowCoPilot(preference !== false);
      }
    } catch (error) {
      console.error("Error fetching co-pilot preference:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [propertiesRes, tenantsRes, loansRes, contractsRes] = await Promise.all([
        supabase.from("properties").select("*").eq("gearchiveerd", false),
        supabase.from("tenants").select("*").eq("actief", true),
        supabase.from("loans").select("*"),
        supabase.from("contracts").select("*"),
      ]);

      if (propertiesRes.error) throw propertiesRes.error;
      if (tenantsRes.error) throw tenantsRes.error;
      if (loansRes.error) throw loansRes.error;
      if (contractsRes.error) throw contractsRes.error;

      setProperties(propertiesRes.data || []);
      setTenants(tenantsRes.data || []);
      setLoans(loansRes.data || []);
      setContracts(contractsRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalPortfolioValue = properties.reduce((sum, p) => sum + Number(p.waardering || p.aankoopprijs), 0);
  
  const calculateMonthlyCashflow = () => {
    return properties.reduce((sum, property) => {
      const loan = loans.find((l) => l.property_id === property.id);
      const cashflowResult = calculatePropertyCashflow(
        Number(property.maandelijkse_huur) || 0,
        Number(property.subsidie_bedrag) || 0,
        loan ? Number(loan.maandlast) : 0,
        Number(property.aankoopprijs),
        Number(property.imi_percentage) || 0.003,
        Number(property.verzekering_jaarlijks) || 0,
        Number(property.onderhoud_jaarlijks) || 0,
        Number(property.leegstand_buffer_percentage) || 5,
        Number(property.beheerkosten_percentage) || 0
      );
      return sum + cashflowResult.netCashflow;
    }, 0);
  };

  const monthlyCashflow = calculateMonthlyCashflow();

  const verhuurdeProperties = properties.filter((p) => p.status === "verhuur");
  const bezettingsgraad = properties.length > 0 
    ? Math.round((verhuurdeProperties.length / properties.filter(p => p.status !== "te_koop" && p.status !== "aankoop").length) * 100) || 0
    : 0;

  const gemiddeldRendement = properties.length > 0
    ? properties.reduce((sum, p) => {
        const jaarHuur = (Number(p.maandelijkse_huur) || 0) * 12;
        return sum + calculateGrossYield(jaarHuur, Number(p.aankoopprijs));
      }, 0) / properties.length
    : 0;

  const expiringContracts = contracts.filter((c) => {
    const daysUntilEnd = Math.ceil((new Date(c.einddatum).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilEnd <= 90 && daysUntilEnd >= 0;
  });

  const stats = [
    {
      title: "Totale Portefeuille",
      value: `€${totalPortfolioValue.toLocaleString("nl-NL")}`,
      subtitle: `${properties.length} ${properties.length === 1 ? "pand" : "panden"}`,
      icon: <Building2 className="w-5 h-5 text-primary" />,
      tooltip: {
        title: "Totale Portefeuillewaarde",
        content: "Dit is de geschatte waarde van al je panden samen. Gebaseerd op je handmatig ingevoerde waarderingen of aankoopprijzen.",
      },
    },
    {
      title: "Maandelijkse Cashflow",
      value: `€${monthlyCashflow.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`,
      subtitle: "Netto na kosten",
      icon: <Euro className="w-5 h-5 text-success" />,
      tooltip: {
        title: "Wat is Cashflow?",
        content: "Cashflow is wat je overhoudt nadat alle kosten (hypotheek, onderhoud, belasting, beheer, leegstandsbuffer) zijn betaald.",
      },
      variant: monthlyCashflow >= 0 ? "success" as const : "default" as const,
    },
    {
      title: "Bezettingsgraad",
      value: `${bezettingsgraad}%`,
      subtitle: verhuurdeProperties.length === properties.filter(p => p.status !== "te_koop" && p.status !== "aankoop").length ? "Geen leegstand" : `${verhuurdeProperties.length} verhuurd`,
      icon: <Users className="w-5 h-5 text-primary" />,
      tooltip: {
        title: "Bezettingsgraad",
        content: "Het percentage van je verhuurbare panden dat momenteel verhuurd is.",
      },
    },
    {
      title: "Bruto Rendement",
      value: `${gemiddeldRendement.toFixed(1)}%`,
      subtitle: "Gemiddeld",
      icon: <TrendingUp className="w-5 h-5 text-warning" />,
      tooltip: {
        title: "Bruto Rendement",
        content: "Jaarlijkse huurinkomsten gedeeld door de aankoopprijs van je panden. Gemiddelde over alle panden.",
      },
    },
  ];

  const topProperties = properties
    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
    .slice(0, 4)
    .map((p) => {
      const tenant = tenants.find((t) => t.property_id === p.id);
      return {
        id: p.id,
        name: p.naam,
        location: p.locatie,
        status: p.status,
        healthScore: p.gezondheidsscore || 5,
        monthlyIncome: Number(p.maandelijkse_huur) || 0,
        tenant: tenant?.naam,
        isPinned: p.is_pinned || false,
      };
    });

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          <WelcomeHeader />
          <div className="px-4 md:px-6 lg:px-8 space-y-6 pb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-card rounded-xl border animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {showOnboarding && (
        <WelcomeOnboarding onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="max-w-7xl mx-auto">
        <WelcomeHeader />

        <div className="px-4 md:px-6 lg:px-8 space-y-6 pb-8">
          {/* Co-Piloot Section */}
          {showCoPilot && (
            <CoPiloot onSwitchToManual={() => setShowCoPilot(false)} />
          )}

          {/* Switch to Co-Piloot button when hidden */}
          {!showCoPilot && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCoPilot(true)}
                className="gap-2"
              >
                <Compass className="w-4 h-4" />
                Gebruik Co-Piloot
              </Button>
            </div>
          )}

          {/* Contract Warning */}
          {expiringContracts.length > 0 && (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 animate-fade-in">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">
                    {expiringContracts.length} {expiringContracts.length === 1 ? "contract verloopt" : "contracten verlopen"} binnen 90 dagen
                  </p>
                  <button 
                    onClick={() => navigate("/contracten")}
                    className="text-sm text-primary hover:underline"
                  >
                    Bekijk contracten →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Streak Banner */}
          <StreakBanner />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                {...stat}
              />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-foreground">Snelle Acties</h2>
              <InfoTooltip
                title="Snelle Acties"
                content="Voer veelvoorkomende taken snel uit zonder door menu's te navigeren."
              />
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              <QuickAction
                icon={<Plus className="w-5 h-5" />}
                label="Nieuw Pand"
                variant="primary"
                onClick={() => navigate("/panden")}
              />
              <QuickAction
                icon={<Euro className="w-5 h-5" />}
                label="Huur Ontvangen"
                variant="success"
                onClick={() => navigate("/financien")}
              />
              <QuickAction
                icon={<Receipt className="w-5 h-5" />}
                label="Kosten Toevoegen"
                onClick={() => navigate("/financien")}
              />
              <QuickAction
                icon={<AlertTriangle className="w-5 h-5" />}
                label="Contracten"
                onClick={() => navigate("/contracten")}
              />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Properties Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-foreground">Mijn Panden</h2>
                  <InfoTooltip
                    title="Panden Overzicht"
                    content="Hier zie je je panden met hun huidige status en gezondheidsscore. Gepinde panden verschijnen eerst."
                  />
                </div>
                <button 
                  onClick={() => navigate("/panden")}
                  className="text-sm text-primary hover:underline"
                >
                  Bekijk alle →
                </button>
              </div>

              {topProperties.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border">
                  <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Nog geen panden toegevoegd</p>
                  <button 
                    onClick={() => navigate("/panden")}
                    className="text-primary hover:underline"
                  >
                    Voeg je eerste pand toe →
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {topProperties.map((property, index) => (
                    <div key={property.id} style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                      <PropertyCard {...property} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              <DailyMission />
              <LegacyMantra />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
