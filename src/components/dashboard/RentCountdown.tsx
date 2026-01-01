import { useState, useEffect } from "react";
import { Clock, Euro, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Tenant {
  id: string;
  naam: string;
  huurbedrag: number;
  betaaldag: number;
  property_id: string;
}

export const RentCountdown = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTenants();
  }, [user]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, naam, huurbedrag, betaaldag, property_id")
        .eq("actief", true);

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNextPaymentInfo = () => {
    if (tenants.length === 0) return null;

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let nearestDays = Infinity;
    let totalAmount = 0;
    let payingTenants = 0;

    tenants.forEach((tenant) => {
      const payDay = tenant.betaaldag;
      let daysUntil: number;

      if (payDay > currentDay) {
        // Payment is later this month
        daysUntil = payDay - currentDay;
      } else if (payDay === currentDay) {
        // Payment is today!
        daysUntil = 0;
      } else {
        // Payment is next month
        const nextMonth = new Date(currentYear, currentMonth + 1, payDay);
        daysUntil = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      if (daysUntil < nearestDays) {
        nearestDays = daysUntil;
        totalAmount = Number(tenant.huurbedrag);
        payingTenants = 1;
      } else if (daysUntil === nearestDays) {
        totalAmount += Number(tenant.huurbedrag);
        payingTenants++;
      }
    });

    return { days: nearestDays, amount: totalAmount, count: payingTenants };
  };

  const paymentInfo = getNextPaymentInfo();

  if (loading) {
    return <div className="h-24 bg-card rounded-xl border animate-pulse" />;
  }

  if (!paymentInfo || tenants.length === 0) {
    return null;
  }

  const isToday = paymentInfo.days === 0;
  const isSoon = paymentInfo.days <= 3;

  return (
    <Card className={`shadow-card transition-all ${isToday ? 'ring-2 ring-success bg-success/5' : isSoon ? 'ring-1 ring-primary/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isToday ? 'bg-success/20' : 'bg-primary/10'}`}>
              {isToday ? (
                <Euro className="w-6 h-6 text-success" />
              ) : (
                <Clock className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {isToday ? "Vandaag ontvang je" : "Volgende huur over"}
              </p>
              <p className={`text-2xl font-bold ${isToday ? 'text-success' : 'text-foreground'}`}>
                {isToday ? (
                  `€${paymentInfo.amount.toLocaleString("nl-NL")}`
                ) : (
                  <>
                    {paymentInfo.days} {paymentInfo.days === 1 ? "dag" : "dagen"}
                  </>
                )}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            {!isToday && (
              <p className="text-lg font-semibold text-success">
                €{paymentInfo.amount.toLocaleString("nl-NL")}
              </p>
            )}
            <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
              <CalendarDays className="w-3 h-3" />
              {paymentInfo.count} {paymentInfo.count === 1 ? "huurder" : "huurders"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
