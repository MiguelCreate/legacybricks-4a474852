import { Building2, Users, Euro, TrendingUp, Plus, Receipt, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { QuickAction } from "@/components/ui/QuickAction";
import { DailyMission } from "@/components/dashboard/DailyMission";
import { StreakBanner } from "@/components/dashboard/StreakBanner";
import { LegacyMantra } from "@/components/dashboard/LegacyMantra";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

// Mock data
const stats = [
  {
    title: "Totale Portefeuille",
    value: "€485.000",
    subtitle: "3 panden",
    icon: <Building2 className="w-5 h-5 text-primary" />,
    trend: { value: 8.2, label: "vs vorig jaar" },
    tooltip: {
      title: "Totale Portefeuillewaarde",
      content: "Dit is de geschatte waarde van al je panden samen. Gebaseerd op je handmatig ingevoerde waarderingen.",
    },
  },
  {
    title: "Maandelijkse Cashflow",
    value: "€2.340",
    subtitle: "Netto na kosten",
    icon: <Euro className="w-5 h-5 text-success" />,
    trend: { value: 5.4, label: "vs vorige maand" },
    tooltip: {
      title: "Wat is Cashflow?",
      content: "Cashflow is wat je overhoudt nadat alle kosten (hypotheek, onderhoud, belasting) zijn betaald. Een positieve cashflow betekent dat je panden geld opleveren.",
    },
    variant: "success" as const,
  },
  {
    title: "Bezettingsgraad",
    value: "100%",
    subtitle: "Geen leegstand",
    icon: <Users className="w-5 h-5 text-primary" />,
    tooltip: {
      title: "Bezettingsgraad",
      content: "Het percentage van je panden dat verhuurd is. 100% betekent dat al je verhuurpanden bezet zijn.",
    },
  },
  {
    title: "Bruto Rendement",
    value: "6.2%",
    subtitle: "Jaarlijks",
    icon: <TrendingUp className="w-5 h-5 text-warning" />,
    trend: { value: -0.3, label: "vs vorig jaar" },
    tooltip: {
      title: "Bruto Rendement",
      content: "Jaarlijkse huurinkomsten gedeeld door de waarde van je panden. Geeft aan hoe efficiënt je investering is.",
    },
  },
];

const properties = [
  {
    id: "1",
    name: "Casa Lisboa",
    location: "Lissabon, Portugal",
    status: "verhuur" as const,
    healthScore: 9,
    monthlyIncome: 1200,
    tenant: "Maria Silva",
    isPinned: true,
  },
  {
    id: "2",
    name: "Apartamento Porto",
    location: "Porto, Portugal",
    status: "verhuur" as const,
    healthScore: 7,
    monthlyIncome: 950,
    tenant: "João Santos",
  },
  {
    id: "3",
    name: "Villa Algarve",
    location: "Albufeira, Portugal",
    status: "renovatie" as const,
    healthScore: 5,
  },
];

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <WelcomeHeader />

        <div className="px-4 md:px-6 lg:px-8 space-y-6 pb-8">
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
                content="Voer veelvoorkomende taken snel uit zonder door menu's te navigeren. Perfect voor dagelijkse updates."
              />
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              <QuickAction
                icon={<Plus className="w-5 h-5" />}
                label="Nieuw Pand"
                variant="primary"
              />
              <QuickAction
                icon={<Euro className="w-5 h-5" />}
                label="Huur Ontvangen"
                variant="success"
              />
              <QuickAction
                icon={<Receipt className="w-5 h-5" />}
                label="Kosten Toevoegen"
              />
              <QuickAction
                icon={<AlertTriangle className="w-5 h-5" />}
                label="Melding Maken"
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
                    content="Hier zie je al je panden met hun huidige status en gezondheidsscore. Klik op een pand voor meer details."
                  />
                </div>
                <button className="text-sm text-primary hover:underline">
                  Bekijk alle →
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {properties.map((property, index) => (
                  <div key={property.id} style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                    <PropertyCard {...property} />
                  </div>
                ))}
              </div>
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
