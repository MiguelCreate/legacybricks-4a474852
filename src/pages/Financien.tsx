import { useState, useEffect } from "react";
import { Euro, TrendingUp, TrendingDown, Plus, Receipt, PiggyBank, BarChart3, Trash2, Landmark, Building2, Pencil, Calendar, Percent, ChevronDown, ChevronRight } from "lucide-react";
import { ExportMenu, ExportData } from "@/components/ui/ExportMenu";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";
import { HypotheekDialog } from "@/components/financien/HypotheekDialog";
import { FinancienModeToggle } from "@/components/financien/FinancienModeToggle";
import { BeginnerFinancienView } from "@/components/financien/BeginnerFinancienView";
import { RecurringExpensesManager } from "@/components/financien/RecurringExpensesManager";
import { PortfolioTaxSummary } from "@/components/financien/PortfolioTaxSummary";
import { PropertyValueAnalysis } from "@/components/financien/PropertyValueAnalysis";
import { DetailedCostBreakdown } from "@/components/financien/DetailedCostBreakdown";
import { CashflowBreakdown } from "@/components/dashboard/CashflowBreakdown";
import { CashflowBarChart } from "@/components/dashboard/CashflowBarChart";
import { calculatePropertyCashflow, TenantRent } from "@/lib/financialCalculations";

type Expense = Tables<"expenses">;
type Payment = Tables<"payments">;
type Property = Tables<"properties">;
type Tenant = Tables<"tenants">;
type Loan = Tables<"loans">;

const expenseCategories: { value: Enums<"expense_category">; label: string }[] = [
  { value: "onderhoud", label: "Onderhoud" },
  { value: "leegstand", label: "Leegstand" },
  { value: "verzekering", label: "Verzekering" },
  { value: "belasting", label: "Belasting" },
  { value: "administratie", label: "Administratie" },
  { value: "energie", label: "Energie" },
  { value: "overig", label: "Overig" },
];

const Financien = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [mode, setMode] = useState<"beginner" | "gevorderd">("beginner");

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isHypotheekDialogOpen, setIsHypotheekDialogOpen] = useState(false);
  const [editPropertyId, setEditPropertyId] = useState<string | undefined>(undefined);
  
  // Collapsible section states
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(true);
  const [isExpensesOpen, setIsExpensesOpen] = useState(true);
  const [isRecurringOpen, setIsRecurringOpen] = useState(true);
  const [isHypotheekOpen, setIsHypotheekOpen] = useState(false);
  const [isTaxOpen, setIsTaxOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    tenant_id: "",
    property_id: "",
    bedrag: 0,
    datum: new Date().toISOString().split("T")[0],
    status: "betaald" as const,
  });

  const [expenseForm, setExpenseForm] = useState<Partial<TablesInsert<"expenses">>>({
    property_id: "",
    categorie: "onderhoud",
    bedrag: 0,
    datum: new Date().toISOString().split("T")[0],
    beschrijving: "",
    herhalend: false,
  });

  useEffect(() => {
    if (user) {
      fetchData();
      fetchModePreference();
    }
  }, [user]);

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

  const fetchData = async () => {
    try {
      const [propertiesRes, tenantsRes, expensesRes, paymentsRes, loansRes] = await Promise.all([
        supabase.from("properties").select("*").eq("gearchiveerd", false),
        supabase.from("tenants").select("*").eq("actief", true),
        supabase.from("expenses").select("*").order("datum", { ascending: false }),
        supabase.from("payments").select("*").order("datum", { ascending: false }),
        supabase.from("loans").select("*"),
      ]);

      if (propertiesRes.error) throw propertiesRes.error;
      if (tenantsRes.error) throw tenantsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (loansRes.error) throw loansRes.error;

      setProperties(propertiesRes.data || []);
      setTenants(tenantsRes.data || []);
      setExpenses(expensesRes.data || []);
      setPayments(paymentsRes.data || []);
      setLoans(loansRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Fout",
        description: "Kon gegevens niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter data to only include items from user's properties (extra security layer)
  const userPropertyIds = properties.map(p => p.id);
  const userTenants = tenants.filter(t => userPropertyIds.includes(t.property_id));
  const userLoans = loans.filter(l => userPropertyIds.includes(l.property_id));
  const userExpenses = expenses.filter(e => userPropertyIds.includes(e.property_id));
  const userPayments = payments.filter(p => userPropertyIds.includes(p.property_id));

  // Calculate stats using filtered data
  const totalMonthlyRent = userTenants.reduce((sum, t) => sum + Number(t.huurbedrag), 0);
  const totalMonthlyLoanPayments = userLoans.reduce((sum, l) => sum + Number(l.maandlast), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyExpenses = userExpenses
    .filter((e) => {
      const date = new Date(e.datum);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + Number(e.bedrag), 0);

  const monthlyPaymentsReceived = userPayments
    .filter((p) => {
      const date = new Date(p.datum);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && p.status === "betaald";
    })
    .reduce((sum, p) => sum + Number(p.bedrag), 0);

  // Calculate netto cashflow using same logic as Dashboard (per property with IRS, IMI, etc.)
  const netCashflow = properties.reduce((sum, property) => {
    const propertyTenants = userTenants.filter(t => t.property_id === property.id);
    const actualRent = propertyTenants.reduce((s, t) => s + Number(t.huurbedrag || 0), 0);
    
    const tenantRents: TenantRent[] = propertyTenants.map(t => ({
      monthlyRent: Number(t.huurbedrag || 0)
    }));
    
    const loan = userLoans.find((l) => l.property_id === property.id);
    
    const cashflowResult = calculatePropertyCashflow(
      actualRent,
      Number(property.subsidie_bedrag) || 0,
      loan ? Number(loan.maandlast) : 0,
      Number(property.aankoopprijs),
      Number(property.imi_percentage) || 0.003,
      Number(property.verzekering_jaarlijks) || 0,
      Number(property.onderhoud_jaarlijks) || 0,
      Number(property.leegstand_buffer_percentage) || 5,
      Number(property.beheerkosten_percentage) || 0,
      0,
      { jaarHuurinkomst: new Date().getFullYear() },
      tenantRents
    );
    
    return sum + cashflowResult.netCashflow;
  }, 0);
  
  // Calculate total monthly costs for beginner view (difference between rent and net cashflow)
  const totalMonthlyCosts = totalMonthlyRent - netCashflow;
  const portfolioValue = properties.reduce(
    (sum, p) => sum + Number(p.waardering || p.aankoopprijs),
    0
  );
  const grossYield = portfolioValue > 0 ? ((totalMonthlyRent * 12) / portfolioValue) * 100 : 0;

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("payments").insert({
        tenant_id: paymentForm.tenant_id,
        property_id: paymentForm.property_id,
        bedrag: paymentForm.bedrag,
        datum: paymentForm.datum,
        status: paymentForm.status,
      });

      if (error) throw error;

      toast({
        title: "Betaling geregistreerd",
        description: "De huurbetaling is succesvol vastgelegd.",
      });

      setIsPaymentDialogOpen(false);
      setPaymentForm({
        tenant_id: "",
        property_id: "",
        bedrag: 0,
        datum: new Date().toISOString().split("T")[0],
        status: "betaald",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("expenses").insert({
        property_id: expenseForm.property_id!,
        categorie: expenseForm.categorie!,
        bedrag: expenseForm.bedrag!,
        datum: expenseForm.datum!,
        beschrijving: expenseForm.beschrijving,
        herhalend: expenseForm.herhalend || false,
      });

      if (error) throw error;

      toast({
        title: "Kosten toegevoegd",
        description: "De kosten zijn succesvol geregistreerd.",
      });

      setIsExpenseDialogOpen(false);
      setExpenseForm({
        property_id: "",
        categorie: "onderhoud",
        bedrag: 0,
        datum: new Date().toISOString().split("T")[0],
        beschrijving: "",
        herhalend: false,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", expenseToDelete);
      if (error) throw error;

      toast({
        title: "Kosten verwijderd",
        description: "De kosten zijn succesvol verwijderd.",
      });

      setExpenseToDelete(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const selectedTenant = tenants.find((t) => t.id === paymentForm.tenant_id);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Financiën
                </h1>
                <InfoTooltip
                  title="Financieel Overzicht"
                  content="Bekijk je cashflow, registreer betalingen en houd je kosten bij. Alles om inzicht te krijgen in je rendement."
                />
              </div>
              <p className="text-muted-foreground mt-1">
                Overzicht van je vastgoedinkomsten en -uitgaven
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ExportMenu
                data={{
                  title: "Financieel Overzicht",
                  sections: [
                    {
                      title: "Maandelijks Overzicht",
                      explanation: "Dit zijn de belangrijkste financiële cijfers van onze vastgoedportefeuille per maand.",
                      items: [
                        {
                          label: "Huurinkomsten",
                          value: `€${totalMonthlyRent.toLocaleString("nl-NL")}`,
                          explanation: "Het totale bedrag aan huur dat we elke maand ontvangen van al onze huurders."
                        },
                        {
                          label: "Hypotheeklasten",
                          value: `€${totalMonthlyLoanPayments.toLocaleString("nl-NL")}`,
                          explanation: "Wat we maandelijks betalen aan de bank voor onze hypotheken."
                        },
                        {
                          label: "Overige Kosten (deze maand)",
                          value: `€${monthlyExpenses.toLocaleString("nl-NL")}`,
                          explanation: "Extra kosten zoals onderhoud, verzekeringen en belastingen."
                        },
                        {
                          label: "Netto Cashflow",
                          value: `€${netCashflow.toLocaleString("nl-NL")}`,
                          explanation: "Wat we elke maand overhouden na alle kosten. Dit is puur passief inkomen!"
                        },
                      ]
                    },
                    {
                      title: "Rendement & Waarde",
                      explanation: "Deze cijfers laten zien hoe goed onze investering presteert.",
                      items: [
                        {
                          label: "Portefeuillewaarde",
                          value: `€${portfolioValue.toLocaleString("nl-NL")}`,
                          explanation: "De totale geschatte waarde van al onze panden samen."
                        },
                        {
                          label: "Bruto Rendement",
                          value: `${grossYield.toFixed(1)}%`,
                          explanation: "Het percentage dat we jaarlijks verdienen. Vergelijk dit met een spaarrekening (<1%)!"
                        },
                        {
                          label: "Jaarlijkse Huurinkomsten",
                          value: `€${(totalMonthlyRent * 12).toLocaleString("nl-NL")}`,
                          explanation: "Totale huurinkomsten per jaar (12 maanden)."
                        },
                      ]
                    },
                    {
                      title: "Hypotheken",
                      explanation: "Overzicht van onze financieringen.",
                      items: loans.map(loan => {
                        const property = properties.find(p => p.id === loan.property_id);
                        return {
                          label: property?.naam || "Pand",
                          value: `€${Number(loan.maandlast).toLocaleString("nl-NL")}/mnd`,
                          explanation: `Hoofdsom: €${Number(loan.hoofdsom || 0).toLocaleString("nl-NL")}, Rente: ${loan.rente_percentage || 0}%`
                        };
                      })
                    },
                    {
                      title: "Recente Kosten",
                      explanation: "De laatste geregistreerde uitgaven voor onderhoud en beheer.",
                      items: expenses.slice(0, 10).map(expense => {
                        const property = properties.find(p => p.id === expense.property_id);
                        const category = expenseCategories.find(c => c.value === expense.categorie);
                        return {
                          label: `${category?.label || expense.categorie} - ${property?.naam || "Pand"}`,
                          value: `€${Number(expense.bedrag).toLocaleString("nl-NL")}`,
                          explanation: expense.beschrijving || `Datum: ${new Date(expense.datum).toLocaleDateString("nl-NL")}`
                        };
                      })
                    }
                  ]
                }}
                filename="financien_overzicht"
              />
              <Button
                variant="outline"
                onClick={() => setIsHypotheekDialogOpen(true)}
                className="gap-2"
              >
                <Landmark className="w-4 h-4" />
                Hypotheek
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsExpenseDialogOpen(true)}
                className="gap-2"
              >
                <Receipt className="w-4 h-4" />
                Kosten
              </Button>
              <Button
                onClick={() => setIsPaymentDialogOpen(true)}
                className="gradient-primary text-primary-foreground gap-2"
              >
                <Euro className="w-4 h-4" />
                Huur Ontvangen
              </Button>
            </div>
          </div>
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8 space-y-6">
          {/* Mode Toggle */}
          <FinancienModeToggle mode={mode} onModeChange={handleModeChange} />

          {mode === "beginner" ? (
            <>
            <BeginnerFinancienView
                totalMonthlyRent={totalMonthlyRent}
                totalMonthlyLoanPayments={totalMonthlyLoanPayments}
                monthlyExpenses={totalMonthlyCosts}
                netCashflow={netCashflow}
                portfolioValue={portfolioValue}
                grossYield={grossYield}
              />
              
              {/* Detailed Cost Breakdown */}
              <DetailedCostBreakdown
                properties={properties}
                tenants={userTenants}
                loans={userLoans}
              />
              
              {/* Cashflow Visualization Section - also in beginner mode */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CashflowBarChart 
                  properties={properties} 
                  tenants={userTenants} 
                  loans={userLoans} 
                />
                <CashflowBreakdown 
                  properties={properties} 
                  tenants={userTenants} 
                  loans={userLoans} 
                />
              </div>
            </>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <StatCard
                  title="Maandelijkse Cashflow"
                  value={`€${netCashflow.toLocaleString()}`}
                  subtitle="Netto na kosten"
                  icon={<TrendingUp className="w-5 h-5 text-success" />}
                  variant={netCashflow >= 0 ? "success" : "default"}
                  tooltip={{
                    title: "Netto Cashflow",
                    content: "Dit is wat je overhoudt na aftrek van hypotheeklasten en kosten. Een positieve cashflow is je doel!",
                  }}
                />
                <StatCard
                  title="Huurinkomsten"
                  value={`€${totalMonthlyRent.toLocaleString()}`}
                  subtitle="Per maand"
                  icon={<Euro className="w-5 h-5 text-primary" />}
                  tooltip={{
                    title: "Totale Huurinkomsten",
                    content: "De som van alle maandelijkse huren van je actieve huurders.",
                  }}
                />
                <StatCard
                  title="Hypotheeklasten"
                  value={`€${totalMonthlyLoanPayments.toLocaleString()}`}
                  subtitle="Per maand"
                  icon={<TrendingDown className="w-5 h-5 text-destructive" />}
                  tooltip={{
                    title: "Totale Hypotheeklasten",
                    content: "De som van alle maandelijkse hypotheekbetalingen.",
                  }}
                />
                <StatCard
                  title="Bruto Rendement"
                  value={`${grossYield.toFixed(1)}%`}
                  subtitle="Jaarlijks"
                  icon={<BarChart3 className="w-5 h-5 text-warning" />}
                  tooltip={{
                    title: "Bruto Rendement",
                    content: "Jaarlijkse huurinkomsten gedeeld door de totale waarde van je portefeuille. Geeft aan hoe efficiënt je investering is.",
                  }}
                />
                <StatCard
                  title="Netto Rendement"
                  value={`${portfolioValue > 0 ? (((netCashflow * 12) / portfolioValue) * 100).toFixed(1) : 0}%`}
                  subtitle="Na kosten"
                  icon={<Percent className="w-5 h-5 text-success" />}
                  variant="success"
                  tooltip={{
                    title: "Netto Rendement",
                    content: "Jaarlijkse netto cashflow gedeeld door de totale waarde van je portefeuille. Dit is je werkelijke rendement na alle kosten.",
                  }}
                />
              </div>

              {/* Cashflow Visualization Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CashflowBarChart 
                  properties={properties} 
                  tenants={userTenants} 
                  loans={userLoans} 
                />
                <CashflowBreakdown 
                  properties={properties} 
                  tenants={userTenants} 
                  loans={userLoans} 
                />
              </div>

              {/* Recent Transactions - Collapsible */}
              <Collapsible open={isPaymentsOpen} onOpenChange={setIsPaymentsOpen}>
                <div className="bg-card rounded-xl border shadow-card overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {isPaymentsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <h2 className="font-semibold text-foreground">Recente Geld Ontvangsten</h2>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      €{monthlyPaymentsReceived.toLocaleString()} deze maand
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                      {payments.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">
                          Nog geen betalingen geregistreerd
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {payments.slice(0, 5).map((payment) => {
                            const tenant = tenants.find((t) => t.id === payment.tenant_id);
                            const property = properties.find((p) => p.id === payment.property_id);
                            return (
                              <div
                                key={payment.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                              >
                                <div>
                                  <p className="font-medium text-foreground">
                                    {tenant?.naam || "Onbekend"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {property?.naam} • {new Date(payment.datum).toLocaleDateString("nl-NL")}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-success">
                                    +€{Number(payment.bedrag).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Recent Expenses - Collapsible */}
              <Collapsible open={isExpensesOpen} onOpenChange={setIsExpensesOpen}>
                <div className="bg-card rounded-xl border shadow-card overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {isExpensesOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <h2 className="font-semibold text-foreground">Recente Kosten</h2>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      €{monthlyExpenses.toLocaleString()} deze maand
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                      {expenses.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">
                          Nog geen kosten geregistreerd
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {expenses.slice(0, 5).map((expense) => {
                            const property = properties.find((p) => p.id === expense.property_id);
                            const category = expenseCategories.find((c) => c.value === expense.categorie);
                            return (
                              <div
                                key={expense.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group"
                              >
                                <div>
                                  <p className="font-medium text-foreground">
                                    {category?.label || expense.categorie}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {property?.naam} • {new Date(expense.datum).toLocaleDateString("nl-NL")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="font-semibold text-destructive">
                                    -€{Number(expense.bedrag).toLocaleString()}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpenseToDelete(expense.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Recurring Expenses - Collapsible */}
              <Collapsible open={isRecurringOpen} onOpenChange={setIsRecurringOpen}>
                <div className="bg-card rounded-xl border shadow-card overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {isRecurringOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <h2 className="font-semibold text-foreground">Terugkerende Kosten</h2>
                    </div>
                    <span className="text-sm text-muted-foreground">Beheer vaste lasten</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                      <RecurringExpensesManager properties={properties} onUpdate={fetchData} />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Hypotheek Overzicht - Collapsible */}
              <Collapsible open={isHypotheekOpen} onOpenChange={setIsHypotheekOpen}>
                <div className="bg-card rounded-xl border shadow-card overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {isHypotheekOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <h2 className="font-semibold text-foreground">Hypotheek Overzicht</h2>
                      <InfoTooltip
                        title="Hypotheek Overzicht"
                        content="Bekijk alle hypotheken per pand met de belangrijkste details zoals maandlast, hoofdsom en rente."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        €{totalMonthlyLoanPayments.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}/mnd
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsHypotheekDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Toevoegen
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                      {loans.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">
                          Nog geen hypotheken geregistreerd
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {/* Group loans by property */}
                          {properties
                            .filter((p) => loans.some((l) => l.property_id === p.id))
                            .map((property) => {
                              const propertyLoans = loans.filter((l) => l.property_id === property.id);
                              const propertyTotalMaandlast = propertyLoans.reduce(
                                (sum, l) => sum + Number(l.maandlast),
                                0
                              );
                              const propertyTotalRestschuld = propertyLoans.reduce(
                                (sum, l) => sum + Number(l.restschuld || l.hoofdsom || 0),
                                0
                              );
                              
                              return (
                                <div
                                  key={property.id}
                                  className="rounded-lg border bg-secondary/30 overflow-hidden"
                                >
                                  {/* Property Header */}
                                  <div className="p-4 bg-secondary/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-foreground">{property.naam}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {propertyLoans.length} hypotheekdeel{propertyLoans.length > 1 ? 'en' : ''}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <p className="font-semibold text-foreground">
                                          €{propertyTotalMaandlast.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                                          <span className="text-sm font-normal text-muted-foreground">/mnd</span>
                                        </p>
                                        {propertyTotalRestschuld > 0 && (
                                          <p className="text-xs text-muted-foreground">
                                            Restschuld: €{propertyTotalRestschuld.toLocaleString("nl-NL")}
                                          </p>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setEditPropertyId(property.id);
                                          setIsHypotheekDialogOpen(true);
                                        }}
                                        className="h-8 w-8"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Loan Parts */}
                                  <div className="divide-y divide-border/50">
                                    {propertyLoans.map((loan, index) => {
                                      const isAdvanced = loan.hypotheek_type === "gevorderd";
                                      
                                      return (
                                        <div key={loan.id} className="p-4">
                                          <div className="flex items-start justify-between gap-4 mb-2">
                                            <div>
                                              <p className="font-medium text-foreground text-sm">
                                                Deel {index + 1}
                                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                  ({isAdvanced ? "Gevorderd" : "Eenvoudig"})
                                                </span>
                                              </p>
                                            </div>
                                            <p className="font-medium text-foreground">
                                              €{Number(loan.maandlast).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                                              <span className="text-xs font-normal text-muted-foreground">/mnd</span>
                                            </p>
                                          </div>
                                          
                                          {isAdvanced && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                              <div>
                                                <p className="text-muted-foreground text-xs">Hoofdsom</p>
                                                <p className="font-medium">€{Number(loan.hoofdsom || 0).toLocaleString("nl-NL")}</p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground text-xs">Rente</p>
                                                <p className="font-medium">
                                                  {Number(loan.rente_percentage || 0).toFixed(2)}% 
                                                  <span className="text-xs text-muted-foreground ml-1">
                                                    {loan.rente_type === "vast" ? "(vast)" : "(var.)"}
                                                  </span>
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground text-xs">Looptijd</p>
                                                <p className="font-medium">{loan.looptijd_jaren || 0} jaar</p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground text-xs">Restschuld</p>
                                                <p className="font-medium">€{Number(loan.restschuld || loan.hoofdsom || 0).toLocaleString("nl-NL")}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          
                          {/* Totaal */}
                          <div className="pt-4 border-t border-border flex items-center justify-between">
                            <p className="font-medium text-muted-foreground">Totaal maandlasten</p>
                            <p className="text-lg font-bold text-foreground">
                              €{totalMonthlyLoanPayments.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                              <span className="text-sm font-normal text-muted-foreground">/mnd</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Tax Summary - Collapsible */}
              <Collapsible open={isTaxOpen} onOpenChange={setIsTaxOpen}>
                <div className="bg-card rounded-xl border shadow-card overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {isTaxOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <h2 className="font-semibold text-foreground">Portugese Belastingen</h2>
                      <InfoTooltip
                        title="Belastingoverzicht"
                        content="Automatische berekening van IMT, IMI en IRS voor al je panden."
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">IMT, IMI & IRS</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                      <PortfolioTaxSummary properties={properties} tenants={tenants} />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Property Value Analysis */}
              <PropertyValueAnalysis properties={properties} loans={loans} />
            </>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Huurbetaling Registreren</DialogTitle>
            <DialogDescription>
              Registreer een ontvangen huurbetaling
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Huurder *</Label>
              <Select
                value={paymentForm.tenant_id}
                onValueChange={(value) => {
                  const tenant = tenants.find((t) => t.id === value);
                  setPaymentForm({
                    ...paymentForm,
                    tenant_id: value,
                    property_id: tenant?.property_id || "",
                    bedrag: Number(tenant?.huurbedrag) || 0,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer huurder" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.naam} - €{Number(tenant.huurbedrag)}/mnd
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bedrag (€) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={paymentForm.bedrag || ""}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, bedrag: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Datum *</Label>
                <Input
                  type="date"
                  value={paymentForm.datum}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, datum: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-primary text-primary-foreground"
                disabled={!paymentForm.tenant_id}
              >
                Registreren
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kosten Toevoegen</DialogTitle>
            <DialogDescription>
              Registreer kosten voor een van je panden
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Pand *</Label>
              <Select
                value={expenseForm.property_id}
                onValueChange={(value) =>
                  setExpenseForm({ ...expenseForm, property_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer pand" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.naam}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categorie *</Label>
              <Select
                value={expenseForm.categorie}
                onValueChange={(value: Enums<"expense_category">) =>
                  setExpenseForm({ ...expenseForm, categorie: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bedrag (€) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={expenseForm.bedrag || ""}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, bedrag: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Datum *</Label>
                <Input
                  type="date"
                  value={expenseForm.datum}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, datum: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beschrijving</Label>
              <Textarea
                value={expenseForm.beschrijving || ""}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, beschrijving: e.target.value })
                }
                placeholder="Korte omschrijving van de kosten..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpenseDialogOpen(false)}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-primary text-primary-foreground"
                disabled={!expenseForm.property_id}
              >
                Toevoegen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Confirmation */}
      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kosten verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze kosten wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hypotheek Dialog */}
      <HypotheekDialog
        open={isHypotheekDialogOpen}
        onOpenChange={(open) => {
          setIsHypotheekDialogOpen(open);
          if (!open) setEditPropertyId(undefined);
        }}
        properties={properties}
        loans={loans}
        onSuccess={fetchData}
        initialPropertyId={editPropertyId}
      />
    </AppLayout>
  );
};

export default Financien;
