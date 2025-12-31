import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Snowflake, TrendingDown, Clock, Zap } from "lucide-react";
import { simulateSnowball, SnowballProperty } from "@/lib/financialCalculations";

interface SnowballImpactProps {
  newPropertyDebt: number;
  newPropertyMonthlyPayment: number;
  newPropertyNetCashflow: number;
  newPropertyInterestRate: number;
  newPropertyName: string;
}

interface ExistingProperty {
  id: string;
  naam: string;
}

interface ExistingLoan {
  property_id: string;
  maandlast: number;
  restschuld: number | null;
  rente_percentage: number | null;
}

interface ExistingTenant {
  property_id: string;
  huurbedrag: number;
}

export function SnowballImpact({
  newPropertyDebt,
  newPropertyMonthlyPayment,
  newPropertyNetCashflow,
  newPropertyInterestRate,
  newPropertyName,
}: SnowballImpactProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existingProperties, setExistingProperties] = useState<ExistingProperty[]>([]);
  const [existingLoans, setExistingLoans] = useState<ExistingLoan[]>([]);
  const [existingTenants, setExistingTenants] = useState<ExistingTenant[]>([]);
  const [impact, setImpact] = useState<{
    monthsWithout: number;
    monthsWith: number;
    monthsSaved: number;
    isRendabel: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchExistingData = async () => {
      if (!user) return;

      setLoading(true);

      const [propertiesRes, loansRes, tenantsRes] = await Promise.all([
        supabase
          .from("properties")
          .select("id, naam")
          .eq("user_id", user.id)
          .eq("gearchiveerd", false),
        supabase
          .from("loans")
          .select("property_id, maandlast, restschuld, rente_percentage"),
        supabase
          .from("tenants")
          .select("property_id, huurbedrag")
          .eq("actief", true),
      ]);

      if (propertiesRes.data) setExistingProperties(propertiesRes.data);
      if (loansRes.data) setExistingLoans(loansRes.data);
      if (tenantsRes.data) setExistingTenants(tenantsRes.data);

      setLoading(false);
    };

    fetchExistingData();
  }, [user]);

  useEffect(() => {
    if (loading || existingProperties.length === 0) {
      setImpact(null);
      return;
    }

    // Build existing snowball properties
    const existingSnowballProps: SnowballProperty[] = existingProperties.map((prop) => {
      const propLoans = existingLoans.filter((l) => l.property_id === prop.id);
      const propTenants = existingTenants.filter((t) => t.property_id === prop.id);

      const totalDebt = propLoans.reduce((sum, l) => sum + (l.restschuld || 0), 0);
      const totalMonthlyPayment = propLoans.reduce((sum, l) => sum + l.maandlast, 0);
      const totalRent = propTenants.reduce((sum, t) => sum + t.huurbedrag, 0);
      const avgInterestRate =
        propLoans.length > 0
          ? propLoans.reduce((sum, l) => sum + (l.rente_percentage || 0), 0) / propLoans.length
          : 3.5;

      // Estimate net cashflow (simplified)
      const estimatedExpenses = totalMonthlyPayment * 0.3; // rough OPEX estimate
      const netCashflow = totalRent - totalMonthlyPayment - estimatedExpenses;

      return {
        id: prop.id,
        name: prop.naam,
        debt: totalDebt,
        monthlyPayment: totalMonthlyPayment,
        netCashflow: Math.max(0, netCashflow),
        interestRate: avgInterestRate,
      };
    }).filter((p) => p.debt > 0);

    if (existingSnowballProps.length === 0) {
      setImpact(null);
      return;
    }

    // Simulate without new property
    const resultsWithout = simulateSnowball(existingSnowballProps, 0, "smallest");
    const maxMonthsWithout = Math.max(...resultsWithout.map((r) => r.monthsToPayoff));

    // Add new property to simulation
    const newProperty: SnowballProperty = {
      id: "new-property",
      name: newPropertyName,
      debt: newPropertyDebt,
      monthlyPayment: newPropertyMonthlyPayment,
      netCashflow: Math.max(0, newPropertyNetCashflow),
      interestRate: newPropertyInterestRate,
    };

    const allProperties = [...existingSnowballProps, newProperty];
    const resultsWith = simulateSnowball(allProperties, 0, "smallest");
    const maxMonthsWith = Math.max(...resultsWith.map((r) => r.monthsToPayoff));

    // IRR > 12% is considered rendabel
    const isRendabel = newPropertyNetCashflow > 0;

    setImpact({
      monthsWithout: maxMonthsWithout,
      monthsWith: maxMonthsWith,
      monthsSaved: maxMonthsWithout - maxMonthsWith,
      isRendabel,
    });
  }, [
    loading,
    existingProperties,
    existingLoans,
    existingTenants,
    newPropertyDebt,
    newPropertyMonthlyPayment,
    newPropertyNetCashflow,
    newPropertyInterestRate,
    newPropertyName,
  ]);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Snowflake className="h-6 w-6 animate-spin mx-auto mb-2" />
          Laden sneeuwbaleffect...
        </CardContent>
      </Card>
    );
  }

  if (existingProperties.length === 0 || !impact) {
    return (
      <Card className="shadow-card bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-primary" />
            Sneeuwbaleffect
            <InfoTooltip
              title="Sneeuwbaleffect"
              content="Wanneer je bestaande panden hebt met schulden, berekenen we hoeveel sneller je schuldenvrij bent als je dit pand koopt."
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Voeg eerst actieve panden met hypotheken toe om het sneeuwbaleffect te berekenen.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatMonths = (months: number) => {
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return remainingMonths > 0
        ? `${years} jaar en ${remainingMonths} maanden`
        : `${years} jaar`;
    }
    return `${months} maanden`;
  };

  const isBeneficial = impact.monthsSaved > 0;

  return (
    <Card
      className={`shadow-card border-l-4 ${
        isBeneficial
          ? "border-l-green-500 bg-green-50/30 dark:bg-green-950/20"
          : impact.monthsSaved === 0
          ? "border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/20"
          : "border-l-red-500 bg-red-50/30 dark:bg-red-950/20"
      }`}
    >
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Snowflake className="h-4 w-4 text-primary" />
          Sneeuwbaleffect Analyse
          <InfoTooltip
            title="Sneeuwbaleffect"
            content="Het sneeuwbaleffect berekent hoe snel je schuldenvrij wordt door de cashflow van afbetaalde panden te gebruiken voor het volgende pand."
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current situation */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-background/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Zonder dit pand</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatMonths(impact.monthsWithout)}
            </p>
            <p className="text-xs text-muted-foreground">tot schuldenvrij</p>
          </div>

          <div className="bg-background/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Met dit pand</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatMonths(impact.monthsWith)}
            </p>
            <p className="text-xs text-muted-foreground">tot schuldenvrij</p>
          </div>
        </div>

        {/* Impact summary */}
        <div
          className={`p-4 rounded-lg ${
            isBeneficial
              ? "bg-green-100 dark:bg-green-900/30"
              : impact.monthsSaved === 0
              ? "bg-yellow-100 dark:bg-yellow-900/30"
              : "bg-red-100 dark:bg-red-900/30"
          }`}
        >
          <div className="flex items-start gap-3">
            {isBeneficial ? (
              <TrendingDown className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
            )}
            <div>
              {isBeneficial ? (
                <>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    🎉 {formatMonths(Math.abs(impact.monthsSaved))} eerder schuldenvrij!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Door de positieve cashflow van dit pand versnelt je aflossingsstrategie aanzienlijk.
                  </p>
                </>
              ) : impact.monthsSaved === 0 ? (
                <>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    ⚖️ Geen versnelling
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Dit pand heeft weinig impact op je sneeuwbaleffect. De extra schuld wordt gecompenseerd door de cashflow.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    ⚠️ {formatMonths(Math.abs(impact.monthsSaved))} later schuldenvrij
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    De extra schuld vertraagt je aflossingsstrategie. Overweeg een hogere eigen inleg of beter renderende locatie.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        {impact.isRendabel && isBeneficial && (
          <p className="text-sm text-muted-foreground border-t pt-3">
            💡 <strong>Tip:</strong> Met een IRR {'>'} 12% en een positief sneeuwbaleffect is dit pand een
            sterke kandidaat voor je portefeuille.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
