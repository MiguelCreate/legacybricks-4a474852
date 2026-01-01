import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Euro, RefreshCw, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type RecurringExpense = Tables<"recurring_expenses">;
type Property = Tables<"properties">;

interface RecurringExpensesManagerProps {
  properties: Property[];
  onUpdate?: () => void;
}

const frequentieOpties = [
  { value: "maandelijks", label: "Maandelijks" },
  { value: "kwartaal", label: "Per kwartaal" },
  { value: "halfjaarlijks", label: "Halfjaarlijks" },
  { value: "jaarlijks", label: "Jaarlijks" },
];

const categorieOpties = [
  { value: "verzekering", label: "Verzekering" },
  { value: "abonnement", label: "Abonnement" },
  { value: "beheer", label: "Beheerskosten" },
  { value: "onderhoud", label: "Onderhoud" },
  { value: "belasting", label: "Belasting" },
  { value: "overig", label: "Overig" },
];

export const RecurringExpensesManager = ({ properties, onUpdate }: RecurringExpensesManagerProps) => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    property_id: "",
    naam: "",
    bedrag: 0,
    frequentie: "maandelijks",
    categorie: "overig",
    start_datum: "",
    eind_datum: "",
    bankrekening: "",
    notities: "",
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("*")
        .order("naam");

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching recurring expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("recurring_expenses").insert({
        property_id: formData.property_id,
        naam: formData.naam,
        bedrag: formData.bedrag,
        frequentie: formData.frequentie,
        categorie: formData.categorie,
        start_datum: formData.start_datum || null,
        eind_datum: formData.eind_datum || null,
        bankrekening: formData.bankrekening || null,
        notities: formData.notities || null,
      });

      if (error) throw error;

      toast({
        title: "Terugkerende kosten toegevoegd",
        description: "De kosten zijn succesvol geregistreerd.",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchExpenses();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze terugkerende kosten wilt verwijderen?")) return;

    try {
      const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Verwijderd",
        description: "De terugkerende kosten zijn verwijderd.",
      });

      fetchExpenses();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      property_id: "",
      naam: "",
      bedrag: 0,
      frequentie: "maandelijks",
      categorie: "overig",
      start_datum: "",
      eind_datum: "",
      bankrekening: "",
      notities: "",
    });
  };

  const getPropertyName = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId)?.naam || "Onbekend";
  };

  const calculateMonthlyEquivalent = (bedrag: number, frequentie: string) => {
    switch (frequentie) {
      case "maandelijks": return bedrag;
      case "kwartaal": return bedrag / 3;
      case "halfjaarlijks": return bedrag / 6;
      case "jaarlijks": return bedrag / 12;
      default: return bedrag;
    }
  };

  const totalMonthly = expenses.reduce((sum, e) => 
    sum + calculateMonthlyEquivalent(Number(e.bedrag), e.frequentie || "maandelijks"), 0
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse text-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            <CardTitle>Terugkerende Kosten</CardTitle>
            <InfoTooltip
              title="Terugkerende Kosten"
              content="Vaste lasten zoals verzekeringen, abonnementen en beheerkosten die periodiek terugkomen."
            />
          </div>
          <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Toevoegen
          </Button>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="p-4 bg-accent/50 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Totaal maandelijks equivalent</span>
              <span className="text-lg font-bold text-foreground">€{totalMonthly.toFixed(2)}</span>
            </div>
          </div>

          {/* Expenses List */}
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nog geen terugkerende kosten</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="p-4 bg-secondary/50 rounded-lg flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{expense.naam}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {frequentieOpties.find((f) => f.value === expense.frequentie)?.label || expense.frequentie}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {categorieOpties.find((c) => c.value === expense.categorie)?.label || expense.categorie}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getPropertyName(expense.property_id)}
                      {expense.bankrekening && ` • ${expense.bankrekening}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">€{Number(expense.bedrag).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        €{calculateMonthlyEquivalent(Number(expense.bedrag), expense.frequentie || "maandelijks").toFixed(2)}/mnd
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(expense.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-strong max-w-lg">
          <DialogHeader>
            <DialogTitle>Terugkerende Kosten Toevoegen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pand *</Label>
              <Select
                value={formData.property_id}
                onValueChange={(value) => setFormData({ ...formData, property_id: value })}
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
              <Label>Naam *</Label>
              <Input
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                placeholder="bijv. Opstalverzekering"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bedrag *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formData.bedrag || ""}
                    onChange={(e) => setFormData({ ...formData, bedrag: Number(e.target.value) })}
                    placeholder="0"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frequentie</Label>
                <Select
                  value={formData.frequentie}
                  onValueChange={(value) => setFormData({ ...formData, frequentie: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequentieOpties.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categorie</Label>
              <Select
                value={formData.categorie}
                onValueChange={(value) => setFormData({ ...formData, categorie: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorieOpties.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startdatum</Label>
                <Input
                  type="date"
                  value={formData.start_datum}
                  onChange={(e) => setFormData({ ...formData, start_datum: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Einddatum (optioneel)</Label>
                <Input
                  type="date"
                  value={formData.eind_datum}
                  onChange={(e) => setFormData({ ...formData, eind_datum: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bankrekening (optioneel)</Label>
              <Input
                value={formData.bankrekening}
                onChange={(e) => setFormData({ ...formData, bankrekening: e.target.value })}
                placeholder="NL00 BANK 0000 0000 00"
              />
            </div>

            <div className="space-y-2">
              <Label>Notities</Label>
              <Textarea
                value={formData.notities}
                onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
                placeholder="Extra informatie..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-primary text-primary-foreground"
                disabled={!formData.property_id || !formData.naam || !formData.bedrag}
              >
                Toevoegen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
