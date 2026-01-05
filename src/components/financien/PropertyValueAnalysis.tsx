import { useState } from "react";
import { Building2, TrendingUp, Calculator, ChevronDown, ChevronRight, Globe, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;
type Loan = Tables<"loans">;

interface PropertyValueAnalysisProps {
  properties: Property[];
  loans: Loan[];
}

// Default values for Portugal (2026)
const DEFAULT_SELLING_COSTS_PERCENT = 7; // 7% (makelaar + notaris + administratie)
const DEFAULT_CGT_PERCENT = 28; // 28% Capital Gains Tax

// Translations
const translations = {
  nl: {
    title: "Vastgoedwaarde",
    subtitle: "Boekwaarde vs Realiseerbare Waarde",
    bookValue: "Boekwaarde",
    realizableValue: "Realiseerbare Waarde",
    marketValue: "Marktwaarde",
    mortgage: "Hypotheek",
    sellingCosts: "Verkoopkosten",
    capitalGainsTax: "Vermogenswinstbelasting",
    property: "Pand",
    total: "Totaal Portfolio",
    advancedMode: "Geavanceerde modus",
    simpleMode: "Eenvoudige modus",
    legacyImpact: "Legacy Impact",
    legacyText: "De realiseerbare waarde van jouw portfolio kan",
    legacyYears: "jaar ondersteuning bieden",
    noProperties: "Geen panden gevonden",
    addProperties: "Voeg panden toe om de waarde-analyse te zien",
    tooltips: {
      bookValue: "Boekwaarde = Marktwaarde minus resterende hypotheek. Dit is je netto vermogen op papier.",
      realizableValue: "Realiseerbare waarde = Wat je daadwerkelijk overhoudt na verkoop, minus verkoopkosten en belastingen.",
      sellingCosts: "Verkoopkosten omvatten makelaarscommissie, notariskosten en administratiekosten (standaard 7%).",
      cgt: "Capital Gains Tax (CGT) is belasting over de winst bij verkoop (standaard 28% in Portugal voor niet-hoofdverblijf).",
      marketValue: "Huidige geschatte marktwaarde van het pand.",
      mortgage: "Resterende hypotheekschuld op het pand."
    },
    disclaimer: "Deze berekeningen zijn indicatief en vormen geen fiscaal of juridisch advies."
  },
  pt: {
    title: "Valor Imobiliário",
    subtitle: "Valor Contabilístico vs Valor Realizável",
    bookValue: "Valor Contabilístico",
    realizableValue: "Valor Realizável",
    marketValue: "Valor de Mercado",
    mortgage: "Hipoteca",
    sellingCosts: "Custos de Venda",
    capitalGainsTax: "Imposto sobre Mais-Valias",
    property: "Imóvel",
    total: "Total Portfólio",
    advancedMode: "Modo avançado",
    simpleMode: "Modo simples",
    legacyImpact: "Impacto Legacy",
    legacyText: "O valor realizável do seu portfólio pode proporcionar",
    legacyYears: "anos de apoio",
    noProperties: "Nenhum imóvel encontrado",
    addProperties: "Adicione imóveis para ver a análise de valor",
    tooltips: {
      bookValue: "Valor contabilístico = Valor de mercado menos hipoteca restante. Este é o seu património líquido no papel.",
      realizableValue: "Valor realizável = O que realmente recebe após a venda, menos custos de venda e impostos.",
      sellingCosts: "Custos de venda incluem comissão de agente, custos notariais e administrativos (padrão 7%).",
      cgt: "Imposto sobre Mais-Valias (CGT) é o imposto sobre o lucro na venda (padrão 28% em Portugal para não-residência principal).",
      marketValue: "Valor de mercado estimado atual do imóvel.",
      mortgage: "Dívida hipotecária restante no imóvel."
    },
    disclaimer: "Estes cálculos são indicativos e não constituem aconselhamento fiscal ou jurídico."
  }
};

export function PropertyValueAnalysis({ properties, loans }: PropertyValueAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<"nl" | "pt">("nl");
  const [advancedMode, setAdvancedMode] = useState(false);
  
  const t = translations[language];

  // Calculate values for each property
  const propertyValues = properties.map(property => {
    const marketValue = property.waardering || property.aankoopprijs;
    const purchasePrice = property.aankoopprijs;
    const propertyLoans = loans.filter(loan => loan.property_id === property.id);
    const totalMortgage = propertyLoans.reduce((sum, loan) => sum + (loan.restschuld || loan.hoofdsom || 0), 0);
    
    // Book value = Market value - Mortgage
    const bookValue = marketValue - totalMortgage;
    
    // Capital gain = Market value - Purchase price
    const capitalGain = Math.max(0, marketValue - purchasePrice);
    
    // Selling costs
    const sellingCosts = marketValue * (DEFAULT_SELLING_COSTS_PERCENT / 100);
    
    // CGT (only on positive capital gain)
    const cgt = capitalGain > 0 ? capitalGain * (DEFAULT_CGT_PERCENT / 100) : 0;
    
    // Realizable value = Market value - Mortgage - Selling costs - CGT
    const realizableValue = marketValue - totalMortgage - sellingCosts - cgt;
    
    return {
      id: property.id,
      name: property.naam,
      location: property.locatie,
      marketValue,
      purchasePrice,
      mortgage: totalMortgage,
      bookValue,
      capitalGain,
      sellingCosts,
      cgt,
      realizableValue
    };
  });

  // Portfolio totals
  const totals = propertyValues.reduce((acc, prop) => ({
    marketValue: acc.marketValue + prop.marketValue,
    mortgage: acc.mortgage + prop.mortgage,
    bookValue: acc.bookValue + prop.bookValue,
    sellingCosts: acc.sellingCosts + prop.sellingCosts,
    cgt: acc.cgt + prop.cgt,
    realizableValue: acc.realizableValue + prop.realizableValue
  }), {
    marketValue: 0,
    mortgage: 0,
    bookValue: 0,
    sellingCosts: 0,
    cgt: 0,
    realizableValue: 0
  });

  // Legacy impact calculation (assuming €2000/month support needed)
  const monthlySupport = 2000;
  const legacyYears = Math.floor(totals.realizableValue / (monthlySupport * 12));

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (properties.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-xl border shadow-card overflow-hidden">
        <CollapsibleTrigger className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <h2 className="font-semibold text-foreground">{t.title}</h2>
            <InfoTooltip
              title={t.title}
              content={t.tooltips.bookValue}
            />
          </div>
          <span className="text-sm text-muted-foreground">{t.subtitle}</span>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Language Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === "nl" ? "pt" : "nl")}
                className="gap-2"
              >
                <Globe className="h-4 w-4" />
                {language === "nl" ? "NL" : "PT"}
              </Button>
              
              {/* Mode Toggle */}
              <div className="flex items-center gap-2">
                <Label htmlFor="advanced-mode" className="text-sm text-muted-foreground">
                  {advancedMode ? t.advancedMode : t.simpleMode}
                </Label>
                <Switch
                  id="advanced-mode"
                  checked={advancedMode}
                  onCheckedChange={setAdvancedMode}
                />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-muted-foreground">{t.bookValue}</p>
                      <InfoTooltip title={t.bookValue} content={t.tooltips.bookValue} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totals.bookValue)}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Calculator className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-muted-foreground">{t.realizableValue}</p>
                      <InfoTooltip title={t.realizableValue} content={t.tooltips.realizableValue} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totals.realizableValue)}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Comparison Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.realizableValue}</span>
                <span className="text-muted-foreground">{t.bookValue}</span>
              </div>
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                  style={{ width: totals.bookValue > 0 ? `${(totals.realizableValue / totals.bookValue) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {totals.bookValue > 0 
                  ? `${Math.round((totals.realizableValue / totals.bookValue) * 100)}% ${language === "nl" ? "van boekwaarde is realiseerbaar" : "do valor contabilístico é realizável"}`
                  : ""
                }
              </p>
            </div>

            {/* Property Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{t.property}</TableHead>
                    <TableHead className="text-right">{t.marketValue}</TableHead>
                    <TableHead className="text-right">{t.mortgage}</TableHead>
                    <TableHead className="text-right">{t.bookValue}</TableHead>
                    {advancedMode && (
                      <>
                        <TableHead className="text-right">{t.sellingCosts}</TableHead>
                        <TableHead className="text-right">CGT</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">{t.realizableValue}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyValues.map(prop => (
                    <TableRow key={prop.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{prop.name}</p>
                          <p className="text-xs text-muted-foreground">{prop.location}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(prop.marketValue)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(prop.mortgage)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(prop.bookValue)}</TableCell>
                      {advancedMode && (
                        <>
                          <TableCell className="text-right text-muted-foreground">{formatCurrency(prop.sellingCosts)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatCurrency(prop.cgt)}</TableCell>
                        </>
                      )}
                      <TableCell className="text-right font-medium text-primary">{formatCurrency(prop.realizableValue)}</TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Totals Row */}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell>{t.total}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.marketValue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.mortgage)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.bookValue)}</TableCell>
                    {advancedMode && (
                      <>
                        <TableCell className="text-right">{formatCurrency(totals.sellingCosts)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totals.cgt)}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right text-primary">{formatCurrency(totals.realizableValue)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Legacy Impact */}
            {legacyYears > 0 && (
              <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.legacyImpact}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.legacyText} <span className="font-bold text-amber-600">{legacyYears}</span> {t.legacyYears}
                      <span className="text-xs ml-1">(€{monthlySupport.toLocaleString()}/mnd)</span>
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{t.disclaimer}</p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}