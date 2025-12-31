import { useState, useEffect } from "react";
import { Building2, Calculator, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Loan = Tables<"loans">;

interface HypotheekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  loans: Loan[];
  onSuccess: () => void;
}

// Calculate monthly payment using annuity formula
const calculateMonthlyPayment = (
  hoofdsom: number,
  rentePercentage: number,
  looptijdJaren: number
): number => {
  if (!hoofdsom || !rentePercentage || !looptijdJaren) return 0;
  
  const maandRente = rentePercentage / 100 / 12;
  const aantalMaanden = looptijdJaren * 12;
  
  if (maandRente === 0) {
    return hoofdsom / aantalMaanden;
  }
  
  const maandlast = hoofdsom * (maandRente * Math.pow(1 + maandRente, aantalMaanden)) / 
    (Math.pow(1 + maandRente, aantalMaanden) - 1);
  
  return Math.round(maandlast * 100) / 100;
};

export const HypotheekDialog = ({
  open,
  onOpenChange,
  properties,
  loans,
  onSuccess,
}: HypotheekDialogProps) => {
  const { toast } = useToast();
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [hypotheekType, setHypotheekType] = useState<Enums<"loan_type">>("eenvoudig");
  
  // Simple form state
  const [simpleForm, setSimpleForm] = useState({
    property_id: "",
    maandlast: 0,
  });

  // Advanced form state
  const [advancedForm, setAdvancedForm] = useState({
    property_id: "",
    hoofdsom: 0,
    rente_percentage: 0,
    looptijd_jaren: 30,
    rente_type: "vast",
    startdatum: new Date().toISOString().split("T")[0],
    useCalculated: true,
    customMaandlast: 0,
  });

  // Calculate maandlast for advanced form
  const calculatedMaandlast = calculateMonthlyPayment(
    advancedForm.hoofdsom,
    advancedForm.rente_percentage,
    advancedForm.looptijd_jaren
  );

  // Get the effective maandlast based on user choice
  const effectiveMaandlast = advancedForm.useCalculated 
    ? calculatedMaandlast 
    : advancedForm.customMaandlast;

  // Reset forms when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setEditingLoan(null);
      setHypotheekType("eenvoudig");
      setSimpleForm({ property_id: "", maandlast: 0 });
      setAdvancedForm({
        property_id: "",
        hoofdsom: 0,
        rente_percentage: 0,
        looptijd_jaren: 30,
        rente_type: "vast",
        startdatum: new Date().toISOString().split("T")[0],
        useCalculated: true,
        customMaandlast: 0,
      });
    }
  }, [open]);

  // Get properties that don't have a loan yet (for adding new loans)
  const propertiesWithoutLoan = properties.filter(
    (p) => !loans.some((l) => l.property_id === p.id)
  );

  // Get properties with existing loans (for editing)
  const propertiesWithLoan = properties.filter(
    (p) => loans.some((l) => l.property_id === p.id)
  );

  const handlePropertySelect = (propertyId: string, isAdvanced: boolean) => {
    const existingLoan = loans.find((l) => l.property_id === propertyId);
    
    if (existingLoan) {
      setEditingLoan(existingLoan);
      setHypotheekType(existingLoan.hypotheek_type);
      
      if (existingLoan.hypotheek_type === "eenvoudig") {
        setSimpleForm({
          property_id: propertyId,
          maandlast: Number(existingLoan.maandlast),
        });
      } else {
        const calcMaandlast = calculateMonthlyPayment(
          Number(existingLoan.hoofdsom) || 0,
          Number(existingLoan.rente_percentage) || 0,
          existingLoan.looptijd_jaren || 30
        );
        const storedMaandlast = Number(existingLoan.maandlast);
        const isUsingCalculated = Math.abs(calcMaandlast - storedMaandlast) < 1;
        
        setAdvancedForm({
          property_id: propertyId,
          hoofdsom: Number(existingLoan.hoofdsom) || 0,
          rente_percentage: Number(existingLoan.rente_percentage) || 0,
          looptijd_jaren: existingLoan.looptijd_jaren || 30,
          rente_type: existingLoan.rente_type || "vast",
          startdatum: existingLoan.startdatum || new Date().toISOString().split("T")[0],
          useCalculated: isUsingCalculated,
          customMaandlast: isUsingCalculated ? 0 : storedMaandlast,
        });
      }
    } else {
      setEditingLoan(null);
      if (isAdvanced) {
        setAdvancedForm({ ...advancedForm, property_id: propertyId });
      } else {
        setSimpleForm({ ...simpleForm, property_id: propertyId });
      }
    }
  };

  const handleSubmitSimple = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLoan) {
        const { error } = await supabase
          .from("loans")
          .update({
            maandlast: simpleForm.maandlast,
            hypotheek_type: "eenvoudig" as Enums<"loan_type">,
          })
          .eq("id", editingLoan.id);
        
        if (error) throw error;
        
        toast({
          title: "Hypotheek bijgewerkt",
          description: "De hypotheekgegevens zijn succesvol bijgewerkt.",
        });
      } else {
        const { error } = await supabase.from("loans").insert({
          property_id: simpleForm.property_id,
          maandlast: simpleForm.maandlast,
          hypotheek_type: "eenvoudig" as Enums<"loan_type">,
        });
        
        if (error) throw error;
        
        toast({
          title: "Hypotheek toegevoegd",
          description: "De hypotheek is succesvol toegevoegd.",
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitAdvanced = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const loanData = {
        property_id: advancedForm.property_id,
        maandlast: effectiveMaandlast,
        hypotheek_type: "gevorderd" as Enums<"loan_type">,
        hoofdsom: advancedForm.hoofdsom,
        rente_percentage: advancedForm.rente_percentage,
        looptijd_jaren: advancedForm.looptijd_jaren,
        rente_type: advancedForm.rente_type,
        startdatum: advancedForm.startdatum,
        restschuld: advancedForm.hoofdsom, // Initially same as principal
      };
      
      if (editingLoan) {
        const { error } = await supabase
          .from("loans")
          .update(loanData)
          .eq("id", editingLoan.id);
        
        if (error) throw error;
        
        toast({
          title: "Hypotheek bijgewerkt",
          description: "De hypotheekgegevens zijn succesvol bijgewerkt.",
        });
      } else {
        const { error } = await supabase.from("loans").insert(loanData);
        
        if (error) throw error;
        
        toast({
          title: "Hypotheek toegevoegd",
          description: "De hypotheek is succesvol toegevoegd.",
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteLoan = async () => {
    if (!editingLoan) return;
    
    try {
      const { error } = await supabase
        .from("loans")
        .delete()
        .eq("id", editingLoan.id);
      
      if (error) throw error;
      
      toast({
        title: "Hypotheek verwijderd",
        description: "De hypotheek is succesvol verwijderd.",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const allProperties = [...propertiesWithoutLoan, ...propertiesWithLoan].sort(
    (a, b) => a.naam.localeCompare(b.naam)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Hypotheek Beheren</DialogTitle>
          <DialogDescription>
            Voeg een hypotheek toe of bewerk bestaande hypotheekgegevens per pand.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={hypotheekType}
          onValueChange={(v) => setHypotheekType(v as Enums<"loan_type">)}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="eenvoudig" className="gap-2">
              <PenLine className="w-4 h-4" />
              Eenvoudig
            </TabsTrigger>
            <TabsTrigger value="gevorderd" className="gap-2">
              <Calculator className="w-4 h-4" />
              Gevorderd
            </TabsTrigger>
          </TabsList>

          <TabsContent value="eenvoudig" className="mt-4">
            <form onSubmit={handleSubmitSimple} className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                Voer alleen de maandelijkse hypotheeklast in. Ideaal als je de exacte maandlast al weet.
              </div>

              <div className="space-y-2">
                <Label>Pand *</Label>
                <Select
                  value={simpleForm.property_id}
                  onValueChange={(v) => handlePropertySelect(v, false)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een pand" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProperties.map((property) => {
                      const hasLoan = loans.some((l) => l.property_id === property.id);
                      return (
                        <SelectItem key={property.id} value={property.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {property.naam}
                            {hasLoan && (
                              <span className="text-xs text-muted-foreground">(bewerken)</span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Maandlast (€) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={simpleForm.maandlast || ""}
                  onChange={(e) =>
                    setSimpleForm({ ...simpleForm, maandlast: Number(e.target.value) })
                  }
                  placeholder="bijv. 850"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                {editingLoan && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteLoan}
                  >
                    Verwijderen
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-primary-foreground"
                  disabled={!simpleForm.property_id || !simpleForm.maandlast}
                >
                  {editingLoan ? "Bijwerken" : "Toevoegen"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="gevorderd" className="mt-4">
            <form onSubmit={handleSubmitAdvanced} className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                Vul de hypotheekgegevens in en de app berekent automatisch de maandlast.
              </div>

              <div className="space-y-2">
                <Label>Pand *</Label>
                <Select
                  value={advancedForm.property_id}
                  onValueChange={(v) => handlePropertySelect(v, true)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een pand" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProperties.map((property) => {
                      const hasLoan = loans.some((l) => l.property_id === property.id);
                      return (
                        <SelectItem key={property.id} value={property.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {property.naam}
                            {hasLoan && (
                              <span className="text-xs text-muted-foreground">(bewerken)</span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hoofdsom (€) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={advancedForm.hoofdsom || ""}
                    onChange={(e) =>
                      setAdvancedForm({ ...advancedForm, hoofdsom: Number(e.target.value) })
                    }
                    placeholder="bijv. 200000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rente (%) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={advancedForm.rente_percentage || ""}
                    onChange={(e) =>
                      setAdvancedForm({ ...advancedForm, rente_percentage: Number(e.target.value) })
                    }
                    placeholder="bijv. 3.5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Looptijd (jaren) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={advancedForm.looptijd_jaren || ""}
                    onChange={(e) =>
                      setAdvancedForm({ ...advancedForm, looptijd_jaren: Number(e.target.value) })
                    }
                    placeholder="bijv. 30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rente type</Label>
                  <Select
                    value={advancedForm.rente_type}
                    onValueChange={(v) =>
                      setAdvancedForm({ ...advancedForm, rente_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vast">Vast</SelectItem>
                      <SelectItem value="variabel">Variabel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Startdatum</Label>
                <Input
                  type="date"
                  value={advancedForm.startdatum}
                  onChange={(e) =>
                    setAdvancedForm({ ...advancedForm, startdatum: e.target.value })
                  }
                />
              </div>

              {/* Maandlast choice */}
              <div className="space-y-3">
                <Label>Maandlast bepalen</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={advancedForm.useCalculated ? "default" : "outline"}
                    size="sm"
                    className={advancedForm.useCalculated ? "gradient-primary text-primary-foreground" : ""}
                    onClick={() => setAdvancedForm({ ...advancedForm, useCalculated: true })}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Berekend
                  </Button>
                  <Button
                    type="button"
                    variant={!advancedForm.useCalculated ? "default" : "outline"}
                    size="sm"
                    className={!advancedForm.useCalculated ? "gradient-primary text-primary-foreground" : ""}
                    onClick={() => setAdvancedForm({ ...advancedForm, useCalculated: false })}
                  >
                    <PenLine className="w-4 h-4 mr-2" />
                    Handmatig
                  </Button>
                </div>

                {advancedForm.useCalculated ? (
                  advancedForm.hoofdsom > 0 && advancedForm.rente_percentage > 0 && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Berekende maandlast:</span>
                        <span className="text-xl font-bold text-primary">
                          €{calculatedMaandlast.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <Label>Handmatige maandlast (€) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={advancedForm.customMaandlast || ""}
                      onChange={(e) =>
                        setAdvancedForm({ ...advancedForm, customMaandlast: Number(e.target.value) })
                      }
                      placeholder="bijv. 850"
                      required={!advancedForm.useCalculated}
                    />
                    {calculatedMaandlast > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Berekende maandlast zou €{calculatedMaandlast.toLocaleString("nl-NL", { minimumFractionDigits: 2 })} zijn
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                {editingLoan && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteLoan}
                  >
                    Verwijderen
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-primary-foreground"
                  disabled={
                    !advancedForm.property_id ||
                    !advancedForm.hoofdsom ||
                    !advancedForm.rente_percentage ||
                    !advancedForm.looptijd_jaren
                  }
                >
                  {editingLoan ? "Bijwerken" : "Toevoegen"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
