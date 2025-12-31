import { useState, useEffect } from "react";
import { Building2, Calculator, PenLine, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

interface LoanPartForm {
  id?: string;
  naam: string;
  hoofdsom: number;
  rente_percentage: number;
  looptijd_jaren: number;
  rente_type: string;
  startdatum: string;
  restschuld: number;
  useCalculated: boolean;
  customMaandlast: number;
}

const emptyLoanPart = (): LoanPartForm => ({
  naam: "",
  hoofdsom: 0,
  rente_percentage: 0,
  looptijd_jaren: 30,
  rente_type: "vast",
  startdatum: new Date().toISOString().split("T")[0],
  restschuld: 0,
  useCalculated: true,
  customMaandlast: 0,
});

export const HypotheekDialog = ({
  open,
  onOpenChange,
  properties,
  loans,
  onSuccess,
}: HypotheekDialogProps) => {
  const { toast } = useToast();
  const [hypotheekType, setHypotheekType] = useState<Enums<"loan_type">>("eenvoudig");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [expandedParts, setExpandedParts] = useState<Set<number>>(new Set([0]));
  
  // Simple form state
  const [simpleForm, setSimpleForm] = useState({
    property_id: "",
    maandlast: 0,
    existingLoanId: null as string | null,
  });

  // Advanced form state - supports multiple parts
  const [loanParts, setLoanParts] = useState<LoanPartForm[]>([emptyLoanPart()]);

  // Reset forms when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setHypotheekType("eenvoudig");
      setSelectedPropertyId("");
      setSimpleForm({ property_id: "", maandlast: 0, existingLoanId: null });
      setLoanParts([emptyLoanPart()]);
      setExpandedParts(new Set([0]));
    }
  }, [open]);

  // Load existing loans when property is selected
  useEffect(() => {
    if (selectedPropertyId && hypotheekType === "gevorderd") {
      const existingLoans = loans.filter((l) => l.property_id === selectedPropertyId);
      
      if (existingLoans.length > 0) {
        const parts: LoanPartForm[] = existingLoans.map((loan, index) => {
          const calcMaandlast = calculateMonthlyPayment(
            Number(loan.hoofdsom) || 0,
            Number(loan.rente_percentage) || 0,
            loan.looptijd_jaren || 30
          );
          const storedMaandlast = Number(loan.maandlast);
          const isUsingCalculated = Math.abs(calcMaandlast - storedMaandlast) < 1;
          
          return {
            id: loan.id,
            naam: `Deel ${index + 1}`,
            hoofdsom: Number(loan.hoofdsom) || 0,
            rente_percentage: Number(loan.rente_percentage) || 0,
            looptijd_jaren: loan.looptijd_jaren || 30,
            rente_type: loan.rente_type || "vast",
            startdatum: loan.startdatum || new Date().toISOString().split("T")[0],
            restschuld: Number(loan.restschuld) || Number(loan.hoofdsom) || 0,
            useCalculated: isUsingCalculated,
            customMaandlast: isUsingCalculated ? 0 : storedMaandlast,
          };
        });
        setLoanParts(parts);
        setExpandedParts(new Set([0]));
      } else {
        setLoanParts([emptyLoanPart()]);
        setExpandedParts(new Set([0]));
      }
    }
  }, [selectedPropertyId, hypotheekType, loans]);

  // Load existing simple loan
  useEffect(() => {
    if (simpleForm.property_id && hypotheekType === "eenvoudig") {
      const existingLoan = loans.find(
        (l) => l.property_id === simpleForm.property_id && l.hypotheek_type === "eenvoudig"
      );
      
      if (existingLoan) {
        setSimpleForm({
          property_id: simpleForm.property_id,
          maandlast: Number(existingLoan.maandlast),
          existingLoanId: existingLoan.id,
        });
      } else {
        setSimpleForm({
          ...simpleForm,
          existingLoanId: null,
        });
      }
    }
  }, [simpleForm.property_id, hypotheekType]);

  const getPropertyLoansCount = (propertyId: string) => {
    return loans.filter((l) => l.property_id === propertyId).length;
  };

  const addLoanPart = () => {
    const newPart = emptyLoanPart();
    newPart.naam = `Deel ${loanParts.length + 1}`;
    setLoanParts([...loanParts, newPart]);
    setExpandedParts(new Set([loanParts.length]));
  };

  const removeLoanPart = async (index: number) => {
    const part = loanParts[index];
    
    // If this part exists in DB, delete it
    if (part.id) {
      try {
        const { error } = await supabase.from("loans").delete().eq("id", part.id);
        if (error) throw error;
        
        toast({
          title: "Hypotheekdeel verwijderd",
          description: "Het hypotheekdeel is succesvol verwijderd.",
        });
        onSuccess();
      } catch (error: any) {
        toast({
          title: "Fout",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }
    
    if (loanParts.length === 1) {
      setLoanParts([emptyLoanPart()]);
    } else {
      setLoanParts(loanParts.filter((_, i) => i !== index));
    }
  };

  const updateLoanPart = (index: number, updates: Partial<LoanPartForm>) => {
    const newParts = [...loanParts];
    newParts[index] = { ...newParts[index], ...updates };
    
    // Auto-set restschuld to hoofdsom if not yet set
    if (updates.hoofdsom !== undefined && newParts[index].restschuld === 0) {
      newParts[index].restschuld = updates.hoofdsom;
    }
    
    setLoanParts(newParts);
  };

  const togglePart = (index: number) => {
    const newExpanded = new Set(expandedParts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedParts(newExpanded);
  };

  const getPartMaandlast = (part: LoanPartForm) => {
    if (part.useCalculated) {
      return calculateMonthlyPayment(part.hoofdsom, part.rente_percentage, part.looptijd_jaren);
    }
    return part.customMaandlast;
  };

  const getTotalMaandlast = () => {
    return loanParts.reduce((sum, part) => sum + getPartMaandlast(part), 0);
  };

  const handleSubmitSimple = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (simpleForm.existingLoanId) {
        const { error } = await supabase
          .from("loans")
          .update({
            maandlast: simpleForm.maandlast,
            hypotheek_type: "eenvoudig" as Enums<"loan_type">,
          })
          .eq("id", simpleForm.existingLoanId);
        
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
    
    if (!selectedPropertyId) {
      toast({
        title: "Fout",
        description: "Selecteer eerst een pand.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Process each loan part
      for (const part of loanParts) {
        const loanData = {
          property_id: selectedPropertyId,
          maandlast: getPartMaandlast(part),
          hypotheek_type: "gevorderd" as Enums<"loan_type">,
          hoofdsom: part.hoofdsom,
          rente_percentage: part.rente_percentage,
          looptijd_jaren: part.looptijd_jaren,
          rente_type: part.rente_type,
          startdatum: part.startdatum,
          restschuld: part.restschuld,
        };
        
        if (part.id) {
          // Update existing
          const { error } = await supabase
            .from("loans")
            .update(loanData)
            .eq("id", part.id);
          
          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase.from("loans").insert(loanData);
          if (error) throw error;
        }
      }
      
      toast({
        title: "Hypotheek opgeslagen",
        description: `${loanParts.length} hypotheekde${loanParts.length === 1 ? 'el' : 'len'} succesvol opgeslagen.`,
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

  const handleDeleteSimpleLoan = async () => {
    if (!simpleForm.existingLoanId) return;
    
    try {
      const { error } = await supabase
        .from("loans")
        .delete()
        .eq("id", simpleForm.existingLoanId);
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hypotheek Beheren</DialogTitle>
          <DialogDescription>
            Voeg hypotheekdelen toe of bewerk bestaande hypotheekgegevens per pand. 
            Je kunt meerdere delen met verschillende rentes en looptijden toevoegen.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={hypotheekType}
          onValueChange={(v) => {
            setHypotheekType(v as Enums<"loan_type">);
            setSelectedPropertyId("");
            setSimpleForm({ property_id: "", maandlast: 0, existingLoanId: null });
            setLoanParts([emptyLoanPart()]);
          }}
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
                  onValueChange={(v) => setSimpleForm({ ...simpleForm, property_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een pand" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => {
                      const loanCount = getPropertyLoansCount(property.id);
                      return (
                        <SelectItem key={property.id} value={property.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {property.naam}
                            {loanCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({loanCount} hypotheek{loanCount > 1 ? 'delen' : ''})
                              </span>
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
                {simpleForm.existingLoanId && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteSimpleLoan}
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
                  {simpleForm.existingLoanId ? "Bijwerken" : "Toevoegen"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="gevorderd" className="mt-4">
            <form onSubmit={handleSubmitAdvanced} className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                Voeg meerdere hypotheekdelen toe met verschillende rentes en looptijden. 
                De restschuld kun je handmatig aanpassen.
              </div>

              <div className="space-y-2">
                <Label>Pand *</Label>
                <Select
                  value={selectedPropertyId}
                  onValueChange={setSelectedPropertyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een pand" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => {
                      const loanCount = getPropertyLoansCount(property.id);
                      return (
                        <SelectItem key={property.id} value={property.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {property.naam}
                            {loanCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({loanCount} deel{loanCount > 1 ? 'en' : ''})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedPropertyId && (
                <>
                  {/* Loan Parts */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Hypotheekdelen</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addLoanPart}
                        className="gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Deel toevoegen
                      </Button>
                    </div>

                    {loanParts.map((part, index) => {
                      const partMaandlast = getPartMaandlast(part);
                      const isExpanded = expandedParts.has(index);
                      
                      return (
                        <Collapsible
                          key={index}
                          open={isExpanded}
                          onOpenChange={() => togglePart(index)}
                        >
                          <div className="border rounded-lg overflow-hidden">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <div>
                                    <p className="font-medium">
                                      {part.naam || `Deel ${index + 1}`}
                                      {part.id && (
                                        <span className="ml-2 text-xs text-muted-foreground">(opgeslagen)</span>
                                      )}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {part.hoofdsom > 0 
                                        ? `€${part.hoofdsom.toLocaleString("nl-NL")} • ${part.rente_percentage}% ${part.rente_type}`
                                        : "Nog niet ingevuld"
                                      }
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="font-semibold">
                                      €{partMaandlast.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">/maand</p>
                                  </div>
                                  {loanParts.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeLoanPart(index);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <div className="p-4 space-y-4 border-t">
                                <div className="space-y-2">
                                  <Label>Naam deel</Label>
                                  <Input
                                    value={part.naam}
                                    onChange={(e) => updateLoanPart(index, { naam: e.target.value })}
                                    placeholder={`bijv. Deel ${index + 1}`}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Hoofdsom (€) *</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={part.hoofdsom || ""}
                                      onChange={(e) => updateLoanPart(index, { hoofdsom: Number(e.target.value) })}
                                      placeholder="bijv. 200000"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Restschuld (€)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={part.restschuld || ""}
                                      onChange={(e) => updateLoanPart(index, { restschuld: Number(e.target.value) })}
                                      placeholder="bijv. 180000"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Rente (%) *</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={part.rente_percentage || ""}
                                      onChange={(e) => updateLoanPart(index, { rente_percentage: Number(e.target.value) })}
                                      placeholder="bijv. 3.5"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Rente type</Label>
                                    <Select
                                      value={part.rente_type}
                                      onValueChange={(v) => updateLoanPart(index, { rente_type: v })}
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

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Looptijd (jaren) *</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="50"
                                      value={part.looptijd_jaren || ""}
                                      onChange={(e) => updateLoanPart(index, { looptijd_jaren: Number(e.target.value) })}
                                      placeholder="bijv. 30"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Startdatum</Label>
                                    <Input
                                      type="date"
                                      value={part.startdatum}
                                      onChange={(e) => updateLoanPart(index, { startdatum: e.target.value })}
                                    />
                                  </div>
                                </div>

                                {/* Maandlast choice */}
                                <div className="space-y-3">
                                  <Label>Maandlast bepalen</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant={part.useCalculated ? "default" : "outline"}
                                      size="sm"
                                      className={part.useCalculated ? "gradient-primary text-primary-foreground" : ""}
                                      onClick={() => updateLoanPart(index, { useCalculated: true })}
                                    >
                                      <Calculator className="w-4 h-4 mr-2" />
                                      Berekend
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={!part.useCalculated ? "default" : "outline"}
                                      size="sm"
                                      className={!part.useCalculated ? "gradient-primary text-primary-foreground" : ""}
                                      onClick={() => updateLoanPart(index, { useCalculated: false })}
                                    >
                                      <PenLine className="w-4 h-4 mr-2" />
                                      Handmatig
                                    </Button>
                                  </div>

                                  {part.useCalculated ? (
                                    part.hoofdsom > 0 && part.rente_percentage > 0 && (
                                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-muted-foreground">Berekende maandlast:</span>
                                          <span className="text-lg font-bold text-primary">
                                            €{calculateMonthlyPayment(part.hoofdsom, part.rente_percentage, part.looptijd_jaren).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
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
                                        value={part.customMaandlast || ""}
                                        onChange={(e) => updateLoanPart(index, { customMaandlast: Number(e.target.value) })}
                                        placeholder="bijv. 850"
                                        required={!part.useCalculated}
                                      />
                                      {part.hoofdsom > 0 && part.rente_percentage > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                          Berekende maandlast zou €{calculateMonthlyPayment(part.hoofdsom, part.rente_percentage, part.looptijd_jaren).toLocaleString("nl-NL", { minimumFractionDigits: 2 })} zijn
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>

                  {/* Total */}
                  {loanParts.length > 0 && loanParts.some(p => p.hoofdsom > 0) && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-muted-foreground">Totale maandlast ({loanParts.length} deel{loanParts.length > 1 ? 'en' : ''}):</span>
                        </div>
                        <span className="text-xl font-bold text-primary">
                          €{getTotalMaandlast().toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 pt-4">
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
                  disabled={!selectedPropertyId || loanParts.every(p => !p.hoofdsom)}
                >
                  Opslaan
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
