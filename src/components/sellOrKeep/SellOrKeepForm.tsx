import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Building2, PiggyBank, Euro, Receipt, Target } from "lucide-react";
import { SellOrKeepInputs, translations, Language } from "@/lib/sellOrKeepCalculations";

interface SellOrKeepFormProps {
  inputs: SellOrKeepInputs;
  updateInput: <K extends keyof SellOrKeepInputs>(key: K, value: SellOrKeepInputs[K]) => void;
  language: Language;
}

export function SellOrKeepForm({ inputs, updateInput, language }: SellOrKeepFormProps) {
  const t = translations[language];

  const tooltips: Record<string, { title: string; content: string }> = {
    currentMarketValue: {
      title: language === 'nl' ? 'Marktwaarde' : 'Valor de Mercado',
      content: language === 'nl' 
        ? 'De geschatte huidige marktwaarde van je pand. Kijk naar vergelijkbare woningen in de buurt.' 
        : 'O valor de mercado atual estimado do seu imóvel.',
    },
    cadastralValue: {
      title: language === 'nl' ? 'VPT Waarde' : 'Valor VPT',
      content: language === 'nl'
        ? 'De VPT (Valor Patrimonial Tributário) staat op je IMI-aanslag. Dit is de fiscale waarde.'
        : 'O VPT está na sua nota de liquidação do IMI.',
    },
    remainingDebt: {
      title: language === 'nl' ? 'Restschuld' : 'Dívida Restante',
      content: language === 'nl'
        ? 'Het bedrag dat je nog moet aflossen op je hypotheek.'
        : 'O montante que ainda deve na hipoteca.',
    },
    renovationReservePercent: {
      title: language === 'nl' ? 'Renovatie Reserve' : 'Reserva de Renovação',
      content: language === 'nl'
        ? 'Reserveer 5-10% van de huur voor grote onderhoud en renovaties.'
        : 'Reserve 5-10% da renda para manutenção e renovações.',
    },
    vacancyPercent: {
      title: language === 'nl' ? 'Leegstand' : 'Vacância',
      content: language === 'nl'
        ? 'Gemiddelde leegstand per jaar. 5% = ~18 dagen per jaar leeg.'
        : 'Vacância média anual. 5% = ~18 dias por ano.',
    },
    imiAnnual: {
      title: language === 'nl' ? 'IMI Belasting' : 'Imposto IMI',
      content: language === 'nl'
        ? 'IMI is de jaarlijkse onroerendgoedbelasting in Portugal (0.3-0.45% van VPT).'
        : 'IMI é o imposto municipal sobre imóveis (0.3-0.45% do VPT).',
    },
    reinvestInEUResidence: {
      title: language === 'nl' ? 'EU Herinvestering' : 'Reinvestimento UE',
      content: language === 'nl'
        ? 'Als je de opbrengst herinvesteert in een hoofdverblijf in de EU binnen 36 maanden, betaal je geen capital gains.'
        : 'Se reinvestir em habitação própria na UE dentro de 36 meses, não paga mais-valias.',
    },
    alternativeReturnPercent: {
      title: language === 'nl' ? 'ETF Rendement' : 'Retorno ETF',
      content: language === 'nl'
        ? 'Gemiddeld rendement van een gediversifieerde ETF-portefeuille (bijv. MSCI World).'
        : 'Retorno médio de um portfólio diversificado de ETFs.',
    },
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["basics", "financing", "rental", "taxes", "assumptions"]} className="space-y-4">
        {/* Section 1: Property Basics */}
        <AccordionItem value="basics" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="font-semibold">{t.sections.basics}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  {t.fields.currentMarketValue}
                  <InfoTooltip {...tooltips.currentMarketValue} />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    type="number"
                    value={inputs.currentMarketValue}
                    onChange={(e) => updateInput('currentMarketValue', Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.fields.originalPurchasePrice}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    type="number"
                    value={inputs.originalPurchasePrice}
                    onChange={(e) => updateInput('originalPurchasePrice', Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.fields.purchaseDate}</Label>
                <Input
                  type="date"
                  value={inputs.purchaseDate}
                  onChange={(e) => updateInput('purchaseDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  {t.fields.cadastralValue}
                  <InfoTooltip {...tooltips.cadastralValue} />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    type="number"
                    value={inputs.cadastralValue}
                    onChange={(e) => updateInput('cadastralValue', Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>{t.fields.rentalType}</Label>
                <Select value={inputs.rentalType} onValueChange={(v) => updateInput('rentalType', v as 'longterm' | 'vacation')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="longterm">{t.options.longterm}</SelectItem>
                    <SelectItem value="vacation">{t.options.vacation}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Financing */}
        <AccordionItem value="financing" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-primary" />
              <span className="font-semibold">{t.sections.financing}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  {t.fields.remainingDebt}
                  <InfoTooltip {...tooltips.remainingDebt} />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    type="number"
                    value={inputs.remainingDebt}
                    onChange={(e) => updateInput('remainingDebt', Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.fields.mortgageRate}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.mortgageRate}
                    onChange={(e) => updateInput('mortgageRate', Number(e.target.value))}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.fields.mortgageType}</Label>
                <Select value={inputs.mortgageType} onValueChange={(v) => updateInput('mortgageType', v as 'interest_only' | 'annuity')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interest_only">{t.options.interest_only}</SelectItem>
                    <SelectItem value="annuity">{t.options.annuity}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.fields.remainingYears}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={inputs.remainingYears}
                    onChange={(e) => updateInput('remainingYears', Number(e.target.value))}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {language === 'nl' ? 'jaren' : 'anos'}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Rental & Costs */}
        <AccordionItem value="rental" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Euro className="w-5 h-5 text-primary" />
              <span className="font-semibold">{t.sections.rental}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.fields.grossMonthlyRent}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    type="number"
                    value={inputs.grossMonthlyRent}
                    onChange={(e) => updateInput('grossMonthlyRent', Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.fields.maintenanceCostsMonthly}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    type="number"
                    value={inputs.maintenanceCostsMonthly}
                    onChange={(e) => updateInput('maintenanceCostsMonthly', Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  {t.fields.renovationReservePercent}
                  <InfoTooltip {...tooltips.renovationReservePercent} />
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    value={inputs.renovationReservePercent}
                    onChange={(e) => updateInput('renovationReservePercent', Number(e.target.value))}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  {t.fields.vacancyPercent}
                  <InfoTooltip {...tooltips.vacancyPercent} />
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    value={inputs.vacancyPercent}
                    onChange={(e) => updateInput('vacancyPercent', Number(e.target.value))}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>{t.fields.propertyManager}</Label>
                <Select value={inputs.propertyManager} onValueChange={(v) => updateInput('propertyManager', v as 'self' | 'pm_longterm' | 'pm_vacation')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">{t.options.self}</SelectItem>
                    <SelectItem value="pm_longterm">{t.options.pm_longterm}</SelectItem>
                    <SelectItem value="pm_vacation">{t.options.pm_vacation}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Taxes */}
        <AccordionItem value="taxes" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <span className="font-semibold">{t.sections.taxes}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  {t.fields.imiAnnual}
                  <InfoTooltip {...tooltips.imiAnnual} />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    type="number"
                    value={inputs.imiAnnual}
                    onChange={(e) => updateInput('imiAnnual', Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.fields.rentalTaxType}</Label>
                <Select value={inputs.rentalTaxType} onValueChange={(v) => updateInput('rentalTaxType', v as 'autonomous' | 'progressive')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="autonomous">{t.options.autonomous}</SelectItem>
                    <SelectItem value="progressive">{t.options.progressive}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.fields.saleCostsPercent}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    value={inputs.saleCostsPercent}
                    onChange={(e) => updateInput('saleCostsPercent', Number(e.target.value))}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.fields.capitalGainsTaxType}</Label>
                <Select value={inputs.capitalGainsTaxType} onValueChange={(v) => updateInput('capitalGainsTaxType', v as 'autonomous' | 'progressive')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="autonomous">{t.options.autonomous}</SelectItem>
                    <SelectItem value="progressive">{t.options.progressive}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1">
                    {t.fields.reinvestInEUResidence}
                    <InfoTooltip {...tooltips.reinvestInEUResidence} />
                  </Label>
                  <Switch
                    checked={inputs.reinvestInEUResidence}
                    onCheckedChange={(v) => updateInput('reinvestInEUResidence', v)}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: Assumptions & Goals */}
        <AccordionItem value="assumptions" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-semibold">{t.sections.assumptions}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.fields.annualGrowthPercent}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.annualGrowthPercent}
                    onChange={(e) => updateInput('annualGrowthPercent', Number(e.target.value))}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  {t.fields.alternativeReturnPercent}
                  <InfoTooltip {...tooltips.alternativeReturnPercent} />
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.alternativeReturnPercent}
                    onChange={(e) => updateInput('alternativeReturnPercent', Number(e.target.value))}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.fields.investmentHorizon}</Label>
                <Select value={String(inputs.investmentHorizon)} onValueChange={(v) => updateInput('investmentHorizon', Number(v) as 10 | 30)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 {language === 'nl' ? 'jaar' : 'anos'}</SelectItem>
                    <SelectItem value="30">30 {language === 'nl' ? 'jaar' : 'anos'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.fields.primaryGoal}</Label>
                <Select value={inputs.primaryGoal} onValueChange={(v) => updateInput('primaryGoal', v as 'cashflow' | 'networth' | 'pension' | 'legacy')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashflow">{t.options.cashflow}</SelectItem>
                    <SelectItem value="networth">{t.options.networth}</SelectItem>
                    <SelectItem value="pension">{t.options.pension}</SelectItem>
                    <SelectItem value="legacy">{t.options.legacy}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>{t.fields.riskProfile}</Label>
                <Select value={inputs.riskProfile} onValueChange={(v) => updateInput('riskProfile', v as 'low' | 'medium' | 'high')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t.options.low}</SelectItem>
                    <SelectItem value="medium">{t.options.medium}</SelectItem>
                    <SelectItem value="high">{t.options.high}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
