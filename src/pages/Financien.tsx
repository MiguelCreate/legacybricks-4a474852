import { useState, useEffect } from "react";
import { Euro, TrendingUp, TrendingDown, Plus, Receipt, PiggyBank, BarChart3, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";

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

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

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
    }
  }, [user]);

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

  // Calculate stats
  const totalMonthlyRent = tenants.reduce((sum, t) => sum + Number(t.huurbedrag), 0);
  const totalMonthlyLoanPayments = loans.reduce((sum, l) => sum + Number(l.maandlast), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyExpenses = expenses
    .filter((e) => {
      const date = new Date(e.datum);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + Number(e.bedrag), 0);

  const monthlyPaymentsReceived = payments
    .filter((p) => {
      const date = new Date(p.datum);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && p.status === "betaald";
    })
    .reduce((sum, p) => sum + Number(p.bedrag), 0);

  const netCashflow = totalMonthlyRent - totalMonthlyLoanPayments - monthlyExpenses;
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
            <div className="flex gap-2">
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
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          </div>

          {/* Recent Transactions */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Payments */}
            <div className="bg-card rounded-xl border shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Recente Betalingen</h2>
                <span className="text-sm text-muted-foreground">
                  €{monthlyPaymentsReceived.toLocaleString()} deze maand
                </span>
              </div>
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

            {/* Recent Expenses */}
            <div className="bg-card rounded-xl border shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Recente Kosten</h2>
                <span className="text-sm text-muted-foreground">
                  €{monthlyExpenses.toLocaleString()} deze maand
                </span>
              </div>
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
                            onClick={() => setExpenseToDelete(expense.id)}
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
          </div>
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
    </AppLayout>
  );
};

export default Financien;
