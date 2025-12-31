import { useState, useEffect } from "react";
import { Building2, Users, Euro, TrendingUp, Plus, Receipt, AlertTriangle, FileText, Compass, Wallet } from "lucide-react";
import { ExportMenu, ExportData } from "@/components/ui/ExportMenu";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { QuickAction } from "@/components/ui/QuickAction";
import { DailyMission } from "@/components/dashboard/DailyMission";

import { CoPiloot } from "@/components/dashboard/CoPiloot";
import { RentalIncomeChart } from "@/components/dashboard/RentalIncomeChart";
import { CashflowChart } from "@/components/dashboard/CashflowChart";
import { WelcomeOnboarding } from "@/components/dashboard/WelcomeOnboarding";
import { ShortTermRentalOverview } from "@/components/dashboard/ShortTermRentalOverview";
import { StilteModus } from "@/components/dashboard/StilteModus";
import { VrijheidsDashboard } from "@/components/dashboard/VrijheidsDashboard";
import { AudioSamenvatting } from "@/components/dashboard/AudioSamenvatting";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calculateGrossYield, calculatePropertyCashflow } from "@/lib/financialCalculations";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Tenant = Tables<"tenants">;
type Loan = Tables<"loans">;
type Contract = Tables<"contracts">;
type Profile = Tables<"profiles"> & {
  stilte_modus_aan?: boolean;
  vrijheidskosten_maand?: number;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [useCoPilot, setUseCoPilot] = useState<boolean | null>(null);
  const [showCoPilot, setShowCoPilot] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stilteModusAan, setStilteModusAan] = useState(false);

  useEffect(() => {
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
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (data) {
        const profileData = data as any;
        setProfile(profileData);
        setUseCoPilot(profileData.co_pilot_standaard !== false);
        setShowCoPilot(profileData.co_pilot_standaard !== false);
        setStilteModusAan(profileData.stilte_modus_aan === true);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
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
  const totalDebt = loans.reduce((sum, l) => sum + Number(l.restschuld || l.hoofdsom || 0), 0);
  const nettoVermogen = totalPortfolioValue - totalDebt;
  const totalMonthlyRent = tenants.reduce((sum, t) => sum + Number(t.huurbedrag), 0);

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
  const vrijheidskosten = (profile as any)?.vrijheidskosten_maand || 2500;
  const vrijheidMaanden = vrijheidskosten > 0 ? nettoVermogen / vrijheidskosten : 0;

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

        <div className="px-4 md:px-6 lg:px-8 space-y-8 pb-8">
          {/* Stilte-Modus Toggle */}
          <StilteModus 
            vrijheidMaanden={vrijheidMaanden}
            isEnabled={stilteModusAan}
            onToggle={setStilteModusAan}
          />

          {stilteModusAan ? null : (
            <>
              {/* ===================== SECTIE 1: OVERZICHT ===================== */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Overzicht</h2>
                  <div className="flex items-center gap-2">
                    <ExportMenu 
                      data={{
                        title: "Portfolio Overzicht",
                        sections: [
                          {
                            title: "Kerngegevens",
                            explanation: "Dit zijn de belangrijkste cijfers van onze vastgoedportefeuille. Ze laten zien hoeveel we bezitten en verdienen.",
                            items: [
                              { 
                                label: "Totale Portefeuillewaarde", 
                                value: `€${totalPortfolioValue.toLocaleString("nl-NL")}`,
                                explanation: "De geschatte marktwaarde van al onze panden samen. Dit is wat we zouden ontvangen als we alles verkopen."
                              },
                              { 
                                label: "Openstaande Schuld", 
                                value: `€${totalDebt.toLocaleString("nl-NL")}`,
                                explanation: "Het bedrag dat we nog moeten aflossen op onze hypotheken."
                              },
                              { 
                                label: "Netto Vermogen", 
                                value: `€${nettoVermogen.toLocaleString("nl-NL")}`,
                                explanation: "Dit is wat we echt bezitten: de waarde van de panden minus wat we nog moeten betalen. Dit groeit elk jaar!"
                              },
                              { 
                                label: "Aantal Panden", 
                                value: properties.length,
                                explanation: "Het totaal aantal vastgoedobjecten in onze portefeuille."
                              },
                            ]
                          },
                          {
                            title: "Inkomsten & Cashflow",
                            explanation: "Dit laat zien hoeveel geld er maandelijks binnenkomt en wat we overhouden.",
                            items: [
                              { 
                                label: "Maandelijkse Huurinkomsten", 
                                value: `€${totalMonthlyRent.toLocaleString("nl-NL")}`,
                                explanation: "Het totale bedrag aan huur dat we elke maand ontvangen van onze huurders."
                              },
                              { 
                                label: "Netto Cashflow", 
                                value: `€${monthlyCashflow.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`,
                                explanation: "Wat we elke maand overhouden nadat alle kosten zijn betaald (hypotheek, onderhoud, verzekeringen). Dit is puur passief inkomen!"
                              },
                              { 
                                label: "Bruto Rendement", 
                                value: `${gemiddeldRendement.toFixed(1)}%`,
                                explanation: "Het percentage dat we jaarlijks verdienen op onze investering. Vergelijk dit met sparen op een bankrekening (vaak <1%)."
                              },
                              { 
                                label: "Aantal Huurders", 
                                value: tenants.length,
                                explanation: "Het totaal aantal actieve huurders in al onze panden."
                              },
                            ]
                          },
                          {
                            title: "Bezetting & Status",
                            explanation: "Een gezonde portefeuille heeft een hoge bezettingsgraad en weinig leegstand.",
                            items: [
                              { 
                                label: "Bezettingsgraad", 
                                value: `${bezettingsgraad}%`,
                                explanation: "Het percentage van onze verhuurbare panden dat daadwerkelijk verhuurd is. 100% = geen leegstand."
                              },
                              { 
                                label: "Panden in Verhuur", 
                                value: verhuurdeProperties.length,
                                explanation: "Het aantal panden dat momenteel actief verhuurd wordt."
                              },
                            ]
                          }
                        ]
                      }}
                      filename="portfolio_overzicht"
                    />
                    <AudioSamenvatting
                      nettoVermogen={nettoVermogen}
                      maandelijkseCashflow={monthlyCashflow}
                      openActies={expiringContracts.length}
                    />
                  </div>
                </div>

                {/* Stats Grid - 5 columns */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <StatCard
                    title="Portefeuillewaarde"
                    value={`€${totalPortfolioValue.toLocaleString("nl-NL")}`}
                    subtitle={`${properties.length} panden`}
                    icon={<Building2 className="w-5 h-5 text-primary" />}
                    tooltip={{
                      title: "Totale Portefeuillewaarde",
                      content: "De geschatte waarde van al je panden samen.",
                    }}
                  />
                  <StatCard
                    title="Netto Vermogen"
                    value={`€${nettoVermogen.toLocaleString("nl-NL")}`}
                    subtitle="Waarde - schulden"
                    icon={<TrendingUp className="w-5 h-5 text-success" />}
                    tooltip={{
                      title: "Netto Vermogen",
                      content: "Je totale portefeuillewaarde minus alle openstaande schulden.",
                    }}
                    variant="success"
                  />
                  <StatCard
                    title="Huurinkomsten"
                    value={`€${totalMonthlyRent.toLocaleString("nl-NL")}`}
                    subtitle={`${tenants.length} huurders`}
                    icon={<Wallet className="w-5 h-5 text-primary" />}
                    tooltip={{
                      title: "Maandelijkse Huurinkomsten",
                      content: "Totale huurinkomsten van alle actieve huurders.",
                    }}
                  />
                  <StatCard
                    title="Netto Cashflow"
                    value={`€${monthlyCashflow.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`}
                    subtitle="Per maand"
                    icon={<Euro className="w-5 h-5" />}
                    tooltip={{
                      title: "Netto Cashflow",
                      content: "Wat je overhoudt na alle kosten (hypotheek, onderhoud, belasting, beheer).",
                    }}
                    variant={monthlyCashflow >= 0 ? "success" : "default"}
                  />
                  <StatCard
                    title="Bruto Rendement"
                    value={`${gemiddeldRendement.toFixed(1)}%`}
                    subtitle="Gemiddeld"
                    icon={<TrendingUp className="w-5 h-5 text-warning" />}
                    tooltip={{
                      title: "Bruto Rendement",
                      content: "Jaarlijkse huurinkomsten gedeeld door aankoopprijs.",
                    }}
                  />
                </div>
              </section>

              {/* ===================== SECTIE 2: ACTIES & MELDINGEN ===================== */}
              {(expiringContracts.length > 0 || showCoPilot) && (
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Aandachtspunten</h2>
                  
                  {/* Contract Warnings */}
                  {expiringContracts.length > 0 && (
                    <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
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

                  {/* Co-Piloot */}
                  {showCoPilot && (
                    <CoPiloot onSwitchToManual={() => setShowCoPilot(false)} />
                  )}

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
                </section>
              )}

              {/* ===================== SECTIE 3: SNELLE ACTIES ===================== */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Snelle Acties</h2>
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
              </section>

              {/* ===================== SECTIE 4: HOOFDCONTENT ===================== */}
              <section className="grid lg:grid-cols-3 gap-6">
                {/* Linker kolom: Panden & Charts */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Charts */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Financiële Overzichten</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <RentalIncomeChart />
                      <CashflowChart />
                    </div>
                  </div>

                  {/* Short-Term Rental */}
                  <ShortTermRentalOverview properties={properties} />

                  {/* Panden Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-foreground">Mijn Panden</h2>
                      <button 
                        onClick={() => navigate("/panden")}
                        className="text-sm text-primary hover:underline"
                      >
                        Bekijk alle →
                      </button>
                    </div>

                    {topProperties.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-muted-foreground mb-4">Nog geen panden toegevoegd</p>
                          <Button onClick={() => navigate("/panden")} variant="outline">
                            Voeg je eerste pand toe
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {topProperties.map((property) => (
                          <PropertyCard key={property.id} {...property} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rechter kolom: Vrijheid & Focus */}
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-foreground">Vrijheid & Focus</h2>
                  <VrijheidsDashboard
                    nettoVermogen={nettoVermogen}
                    maandelijkseKosten={vrijheidskosten}
                    maandelijkseCashflow={monthlyCashflow}
                  />
                  <DailyMission />
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
