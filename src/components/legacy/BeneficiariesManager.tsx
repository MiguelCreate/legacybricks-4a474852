import { useState, useEffect } from "react";
import { Plus, Trash2, Users, Heart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { format, differenceInYears } from "date-fns";
import { nl } from "date-fns/locale";

type Beneficiary = Tables<"beneficiaries">;

const relatieTypes = [
  { value: "kind", label: "Kind" },
  { value: "partner", label: "Partner" },
  { value: "kleinkind", label: "Kleinkind" },
  { value: "broer_zus", label: "Broer/Zus" },
  { value: "neef_nicht", label: "Neef/Nicht" },
  { value: "overig_familie", label: "Overige Familie" },
  { value: "vriend", label: "Vriend(in)" },
  { value: "organisatie", label: "Organisatie/Goed doel" },
];

export const BeneficiariesManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    naam: "",
    relatie: "kind",
    geboorte_datum: "",
    percentage_erfenis: 0,
    notities: "",
  });

  useEffect(() => {
    if (user) {
      fetchBeneficiaries();
    }
  }, [user]);

  const fetchBeneficiaries = async () => {
    try {
      const { data, error } = await supabase
        .from("beneficiaries")
        .select("*")
        .order("percentage_erfenis", { ascending: false });

      if (error) throw error;
      setBeneficiaries(data || []);
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("beneficiaries").insert({
        user_id: user.id,
        naam: formData.naam,
        relatie: formData.relatie,
        geboorte_datum: formData.geboorte_datum || null,
        percentage_erfenis: formData.percentage_erfenis || null,
        notities: formData.notities || null,
      });

      if (error) throw error;

      toast({
        title: "Begunstigde toegevoegd",
        description: "De begunstigde is succesvol geregistreerd.",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchBeneficiaries();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze begunstigde wilt verwijderen?")) return;

    try {
      const { error } = await supabase.from("beneficiaries").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Verwijderd",
        description: "De begunstigde is verwijderd.",
      });

      fetchBeneficiaries();
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
      naam: "",
      relatie: "kind",
      geboorte_datum: "",
      percentage_erfenis: 0,
      notities: "",
    });
  };

  const totalPercentage = beneficiaries.reduce((sum, b) => sum + Number(b.percentage_erfenis || 0), 0);

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
            <Heart className="w-5 h-5 text-primary" />
            <CardTitle>Begunstigden</CardTitle>
            <InfoTooltip
              title="Begunstigden"
              content="Registreer hier wie je erfgenamen zijn en hoeveel procent van je nalatenschap zij ontvangen."
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
              <span className="text-sm text-muted-foreground">Totaal verdeeld</span>
              <span className={`text-lg font-bold ${totalPercentage === 100 ? "text-success" : totalPercentage > 100 ? "text-destructive" : "text-warning"}`}>
                {totalPercentage}%
              </span>
            </div>
            {totalPercentage !== 100 && (
              <p className="text-xs text-muted-foreground mt-1">
                {totalPercentage < 100 ? `Nog ${100 - totalPercentage}% te verdelen` : `${totalPercentage - 100}% teveel verdeeld`}
              </p>
            )}
          </div>

          {/* Beneficiaries List */}
          {beneficiaries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nog geen begunstigden geregistreerd</p>
            </div>
          ) : (
            <div className="space-y-3">
              {beneficiaries.map((beneficiary) => {
                const relatieLabel = relatieTypes.find((r) => r.value === beneficiary.relatie)?.label || beneficiary.relatie;
                const age = beneficiary.geboorte_datum 
                  ? differenceInYears(new Date(), new Date(beneficiary.geboorte_datum))
                  : null;

                return (
                  <div
                    key={beneficiary.id}
                    className="p-4 bg-secondary/50 rounded-lg flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{beneficiary.naam}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {relatieLabel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {age !== null && (
                          <span>{age} jaar</span>
                        )}
                        {beneficiary.geboorte_datum && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(beneficiary.geboorte_datum), "d MMM yyyy", { locale: nl })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{beneficiary.percentage_erfenis || 0}%</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(beneficiary.id)}
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-strong max-w-lg">
          <DialogHeader>
            <DialogTitle>Begunstigde Toevoegen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Naam *</Label>
              <Input
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                placeholder="Volledige naam"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Relatie *</Label>
              <Select
                value={formData.relatie}
                onValueChange={(value) => setFormData({ ...formData, relatie: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relatieTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Geboortedatum</Label>
                <Input
                  type="date"
                  value={formData.geboorte_datum}
                  onChange={(e) => setFormData({ ...formData, geboorte_datum: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Percentage Erfenis</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentage_erfenis || ""}
                  onChange={(e) => setFormData({ ...formData, percentage_erfenis: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notities</Label>
              <Textarea
                value={formData.notities}
                onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
                placeholder="Extra informatie, wensen, contactgegevens..."
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
                disabled={!formData.naam || !formData.relatie}
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
