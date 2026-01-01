import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  Calculator, 
  Building2, 
  CalendarDays, 
  Euro, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  Percent,
  FileText
} from "lucide-react";
import {
  calculateIMT2025,
  calculateIMI,
  calculateIRS,
  estimateVPT,
  type GemeenteType,
  type IMTResult,
  type IMIResult,
  type IRSResult
} from "@/lib/portugueseTaxCalculations";

interface PortugueseTaxCalculatorProps {
  aankoopprijs: number;
  maandelijksHuur: number;
  vptWaarde?: number;
  imiTarief?: number;
}

export const PortugueseTaxCalculator = ({
  aankoopprijs,
  maandelijksHuur,
  vptWaarde: initialVpt,
  imiTarief
}: PortugueseTaxCalculatorProps) => {
  const currentYear = new Date().getFullYear();
  
  // IMT State
  const [pandType, setPandType] = useState<'woning' | 'niet-woning'>('niet-woning');
  
  // IMI State
  const [vptWaarde, setVptWaarde] = useState(initialVpt || estimateVPT(aankoopprijs));
  const [gemeenteType, setGemeenteType] = useState<GemeenteType>('standaard');
  
  // IRS State
  const [jaarHuurinkomst, setJaarHuurinkomst] = useState(currentYear);
  const [maandHuur, setMaandHuur] = useState(maandelijksHuur);
  const [contractduurJaren, setContractduurJaren] = useState(5);
  const [aantalVerlengingen, setAantalVerlengingen] = useState(0);
  const [englobamento, setEnglobamento] = useState(false);
  const [dhdContract, setDhdContract] = useState(false);

  // Update maandHuur when prop changes
  useEffect(() => {
    setMaandHuur(maandelijksHuur);
  }, [maandelijksHuur]);

  // Calculate results
  const imtResult = useMemo(() => 
    calculateIMT2025(aankoopprijs, pandType), 
    [aankoopprijs, pandType]
  );

  const imiResult = useMemo(() => 
    calculateIMI(vptWaarde, gemeenteType, imiTarief ? imiTarief * 100 : undefined), 
    [vptWaarde, gemeenteType, imiTarief]
  );

  const irsResult = useMemo(() => 
    calculateIRS({
      jaarHuurinkomst,
      maandHuur,
      contractduurJaren,
      aantalVerlengingen,
      englobamento,
      dhdContract
    }), 
    [jaarHuurinkomst, maandHuur, contractduurJaren, aantalVerlengingen, englobamento, dhdContract]
  );

  const formatCurrency = (value: number) => 
    `€${value.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;

  const formatPercent = (value: number) => 
    `${value.toLocaleString("nl-NL", { maximumFractionDigits: 2 })}%`;

  // Total summary
  const totaalJaarlijks = imiResult.jaarlijksBedrag + irsResult.jaarlijksBedrag;
  const totaalMaandelijks = imiResult.maandelijksBedrag + irsResult.maandelijksBedrag;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Portugese Belastingcalculator
            <InfoTooltip
              title="Belastingoverzicht"
              content="Complete berekening van IMT, IMI en IRS belasting voor jouw Portugees vastgoed."
            />
          </CardTitle>
          <CardDescription>
            IMT, IMI & IRS belastingberekening (2025 tarieven)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Eenmalig (IMT)</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(imtResult.bedrag)}</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Jaarlijks (IMI + IRS)</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totaalJaarlijks)}</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Maandelijks (reserve)</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(totaalMaandelijks)}</p>
            </div>
          </div>

          {/* Quick summary */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p>
              💡 Een pand van {formatCurrency(aankoopprijs)} kost je ongeveer:
              <br />
              <strong className="text-foreground">Eénmalig:</strong> {formatCurrency(imtResult.bedrag)} IMT
              <br />
              <strong className="text-foreground">Jaarlijks:</strong> {formatCurrency(imiResult.jaarlijksBedrag)} IMI + {formatCurrency(irsResult.jaarlijksBedrag)} IRS = {formatCurrency(totaalJaarlijks)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="imt" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="imt" className="gap-2">
            <Building2 className="h-4 w-4" />
            IMT
          </TabsTrigger>
          <TabsTrigger value="imi" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            IMI
          </TabsTrigger>
          <TabsTrigger value="irs" className="gap-2">
            <Euro className="h-4 w-4" />
            IRS
          </TabsTrigger>
        </TabsList>

        {/* IMT Tab */}
        <TabsContent value="imt">
          <IMTSection 
            aankoopprijs={aankoopprijs}
            pandType={pandType}
            setPandType={setPandType}
            result={imtResult}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </TabsContent>

        {/* IMI Tab */}
        <TabsContent value="imi">
          <IMISection
            vptWaarde={vptWaarde}
            setVptWaarde={setVptWaarde}
            gemeenteType={gemeenteType}
            setGemeenteType={setGemeenteType}
            aankoopprijs={aankoopprijs}
            result={imiResult}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </TabsContent>

        {/* IRS Tab */}
        <TabsContent value="irs">
          <IRSSection
            jaarHuurinkomst={jaarHuurinkomst}
            setJaarHuurinkomst={setJaarHuurinkomst}
            maandHuur={maandHuur}
            setMaandHuur={setMaandHuur}
            contractduurJaren={contractduurJaren}
            setContractduurJaren={setContractduurJaren}
            aantalVerlengingen={aantalVerlengingen}
            setAantalVerlengingen={setAantalVerlengingen}
            englobamento={englobamento}
            setEnglobamento={setEnglobamento}
            dhdContract={dhdContract}
            setDhdContract={setDhdContract}
            result={irsResult}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </TabsContent>
      </Tabs>

      {/* Beginner Mode Explanations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Uitleg voor beginners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Building2 className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">IMT (Overdrachtsbelasting)</p>
              <p className="text-muted-foreground">Eenmalig bij aankoop. Voor investeerders: meestal 6,5% vaste taxa.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <CalendarDays className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="font-medium">IMI (Jaarlijkse belasting)</p>
              <p className="text-muted-foreground">Gebaseerd op de fiscale waarde (VPT), niet de marktwaarde. Betaling in mei/juni.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Euro className="h-5 w-5 text-success mt-0.5" />
            <div>
              <p className="font-medium">IRS (Huurinkomsten)</p>
              <p className="text-muted-foreground">Vanaf 2026: 10% als je huur ≤ €2.300/maand. Anders 25%.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// IMT Section Component
interface IMTSectionProps {
  aankoopprijs: number;
  pandType: 'woning' | 'niet-woning';
  setPandType: (type: 'woning' | 'niet-woning') => void;
  result: IMTResult;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
}

const IMTSection = ({ 
  aankoopprijs, 
  pandType, 
  setPandType, 
  result, 
  formatCurrency, 
  formatPercent 
}: IMTSectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        IMT – Overdrachtsbelasting bij aankoop
        <Badge variant="outline">2025 tarieven</Badge>
      </CardTitle>
      <CardDescription>
        Eenmalige belasting bij de aankoop van onroerend goed in Portugal
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            Aankoopprijs
            <InfoTooltip 
              title="Aankoopprijs" 
              content="De prijs waarvoor je het pand koopt. Dit is de basis voor de IMT-berekening." 
            />
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={aankoopprijs.toLocaleString("nl-NL")} disabled className="pl-10" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            Pandtype
            <InfoTooltip 
              title="Pandtype" 
              content="Voor investeerders geldt meestal 'niet-woning' met een vast tarief van 6,5%." 
            />
          </Label>
          <Select value={pandType} onValueChange={(v) => setPandType(v as 'woning' | 'niet-woning')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="niet-woning">Niet-woning (investering)</SelectItem>
              <SelectItem value="woning">Woning (eigen bewoning)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Result */}
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">IMT Bedrag</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(result.bedrag)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Marginaal tarief</p>
            <p className="text-xl font-bold">{formatPercent(result.marginaalTarief)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gemiddeld tarief</p>
            <p className="text-xl font-bold">{formatPercent(result.gemiddeldTarief)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Taxa única</p>
            <p className="text-xl font-bold">
              {result.taxaUnica ? (
                <Badge variant="success">Ja</Badge>
              ) : (
                <Badge variant="secondary">Nee</Badge>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
        <p className="text-muted-foreground">{result.uitleg}</p>
      </div>
    </CardContent>
  </Card>
);

// IMI Section Component
interface IMISectionProps {
  vptWaarde: number;
  setVptWaarde: (v: number) => void;
  gemeenteType: GemeenteType;
  setGemeenteType: (v: GemeenteType) => void;
  aankoopprijs: number;
  result: IMIResult;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
}

const IMISection = ({
  vptWaarde,
  setVptWaarde,
  gemeenteType,
  setGemeenteType,
  aankoopprijs,
  result,
  formatCurrency,
  formatPercent
}: IMISectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-warning" />
        IMI – Jaarlijkse onroerendgoedbelasting
      </CardTitle>
      <CardDescription>
        Gemeentelijke belasting gebaseerd op de fiscale waarde (VPT)
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Info alert */}
      <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg border border-warning/30">
        <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-foreground">Belangrijk: VPT ≠ Aankoopprijs</p>
          <p className="text-muted-foreground">
            De VPT staat op het Caderneta Predial. Vraag dit aan de verkoper of notaris. 
            VPT is meestal 50-70% van de aankoopprijs.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            Fiscale waarde (VPT)
            <InfoTooltip 
              title="VPT" 
              content="Valor Patrimonial Tributário - de fiscale waarde zoals vastgesteld door de Portugese belastingdienst." 
            />
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="number"
              value={vptWaarde} 
              onChange={(e) => setVptWaarde(Number(e.target.value))}
              className="pl-10" 
            />
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Schatting: {formatCurrency(estimateVPT(aankoopprijs, 60))} (60% van aankoopprijs)
          </p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            Gemeente type
            <InfoTooltip 
              title="Gemeente" 
              content="Het IMI-tarief varieert per gemeente. Grote steden hebben vaak lagere tarieven." 
            />
          </Label>
          <Select value={gemeenteType} onValueChange={(v) => setGemeenteType(v as GemeenteType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standaard">Standaard (0,5%)</SelectItem>
              <SelectItem value="grote_stad">Grote stad - Lissabon/Porto (0,45%)</SelectItem>
              <SelectItem value="landelijk">Landelijk gebied (0,3%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Result */}
      <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Jaarlijks</p>
            <p className="text-xl font-bold text-warning">{formatCurrency(result.jaarlijksBedrag)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Maandelijks</p>
            <p className="text-xl font-bold">{formatCurrency(result.maandelijksBedrag)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tarief</p>
            <p className="text-xl font-bold">{formatPercent(result.tarief)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Volgende betaling</p>
            <p className="text-lg font-bold">{result.volgendeBetaling}</p>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
        <p className="text-muted-foreground">{result.uitleg}</p>
      </div>
    </CardContent>
  </Card>
);

// IRS Section Component
interface IRSSectionProps {
  jaarHuurinkomst: number;
  setJaarHuurinkomst: (v: number) => void;
  maandHuur: number;
  setMaandHuur: (v: number) => void;
  contractduurJaren: number;
  setContractduurJaren: (v: number) => void;
  aantalVerlengingen: number;
  setAantalVerlengingen: (v: number) => void;
  englobamento: boolean;
  setEnglobamento: (v: boolean) => void;
  dhdContract: boolean;
  setDhdContract: (v: boolean) => void;
  result: IRSResult;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
}

const IRSSection = ({
  jaarHuurinkomst,
  setJaarHuurinkomst,
  maandHuur,
  setMaandHuur,
  contractduurJaren,
  setContractduurJaren,
  aantalVerlengingen,
  setAantalVerlengingen,
  englobamento,
  setEnglobamento,
  dhdContract,
  setDhdContract,
  result,
  formatCurrency,
  formatPercent
}: IRSSectionProps) => {
  const isNewRegime = jaarHuurinkomst >= 2026 && jaarHuurinkomst <= 2029;
  const isOldRegime = jaarHuurinkomst <= 2025;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Euro className="h-4 w-4 text-success" />
          IRS – Belasting op huurinkomsten
          {result.regeling === 'nieuw' && (
            <Badge variant="success">Nieuwe regeling 2026-2029</Badge>
          )}
          {result.regeling === 'oud' && (
            <Badge variant="secondary">Oude regeling</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Inkomstenbelasting op verhuurinkomsten in Portugal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Regime info */}
        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
          isNewRegime 
            ? 'bg-success/10 border-success/30' 
            : 'bg-muted/50 border-border'
        }`}>
          <Info className={`h-5 w-5 mt-0.5 ${isNewRegime ? 'text-success' : 'text-muted-foreground'}`} />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {isNewRegime 
                ? 'Nieuwe tijdelijke regeling (2026-2029)' 
                : isOldRegime 
                  ? 'Oude regeling gebaseerd op contractduur'
                  : 'Regeling na 2029 onbekend'}
            </p>
            <p className="text-muted-foreground">
              {isNewRegime 
                ? 'Tarief hangt af van maandhuur: ≤ €2.300 = 10%, anders 25%.' 
                : isOldRegime
                  ? 'Langere contracten geven lagere belastingtarieven (5% tot 28%).'
                  : 'Raadpleeg een fiscalist voor belastingplanning na 2029.'}
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Jaar huurinkomst
              <InfoTooltip 
                title="Jaar" 
                content="Het jaar waarin je de huurinkomsten ontvangt. Dit bepaalt welke regeling van toepassing is." 
              />
            </Label>
            <Input 
              type="number"
              value={jaarHuurinkomst} 
              onChange={(e) => setJaarHuurinkomst(Number(e.target.value))}
              min={2020}
              max={2035}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Maandhuur
              <InfoTooltip 
                title="Maandhuur" 
                content="De maandelijkse huur die je ontvangt. Bij de nieuwe regeling bepaalt dit het tarief." 
              />
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="number"
                value={maandHuur} 
                onChange={(e) => setMaandHuur(Number(e.target.value))}
                className="pl-10" 
              />
            </div>
          </div>

          {isOldRegime && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Contractduur (jaren)
                  <InfoTooltip 
                    title="Contractduur" 
                    content="Langere contracten geven lagere belastingtarieven. 5-10 jaar = 15%, 10-20 jaar = 10%, 20+ jaar = 5%." 
                  />
                </Label>
                <Input 
                  type="number"
                  value={contractduurJaren} 
                  onChange={(e) => setContractduurJaren(Number(e.target.value))}
                  min={1}
                  max={30}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Aantal verlengingen
                  <InfoTooltip 
                    title="Verlengingen" 
                    content="Bij contracten van 5-10 jaar krijg je 2% korting per verlenging (tot max 10%)." 
                  />
                </Label>
                <Input 
                  type="number"
                  value={aantalVerlengingen} 
                  onChange={(e) => setAantalVerlengingen(Number(e.target.value))}
                  min={0}
                  max={5}
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Switch 
                  checked={dhdContract} 
                  onCheckedChange={setDhdContract} 
                  id="dhd"
                />
                <Label htmlFor="dhd" className="cursor-pointer flex items-center gap-1">
                  DHD-contract
                  <InfoTooltip 
                    title="DHD" 
                    content="Direito de Habitação Duradoura - geeft 20% korting op de belasting bij maandelijkse betaling." 
                  />
                </Label>
              </div>
            </>
          )}

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Switch 
              checked={englobamento} 
              onCheckedChange={setEnglobamento} 
              id="englobamento"
            />
            <Label htmlFor="englobamento" className="cursor-pointer flex items-center gap-1">
              Englobamento
              <InfoTooltip 
                title="Englobamento" 
                content="Huurinkomsten optellen bij je andere inkomsten? Dit kan hoger of lager uitpakken (13-48%)." 
              />
            </Label>
          </div>
        </div>

        {/* Warning for unknown regime */}
        {result.waarschuwing && (
          <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg border border-warning/30">
            <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
            <p className="text-sm text-muted-foreground">{result.waarschuwing}</p>
          </div>
        )}

        {/* Result */}
        <div className={`p-4 rounded-lg border ${
          result.regeling === 'nieuw' && maandHuur <= 2300 && !englobamento
            ? 'bg-success/5 border-success/20'
            : 'bg-destructive/5 border-destructive/20'
        }`}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Bruto jaarhuur</p>
              <p className="text-lg font-bold">{formatCurrency(result.brutoJaarHuur)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tarief</p>
              <p className="text-lg font-bold">
                <Badge variant={result.tarief <= 10 ? "success" : result.tarief <= 15 ? "warning" : "destructive"}>
                  {formatPercent(result.tarief)}
                </Badge>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IRS bedrag</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(result.jaarlijksBedrag)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Netto jaarhuur</p>
              <p className="text-lg font-bold text-success">{formatCurrency(result.nettoJaarHuur)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Netto maandhuur</p>
              <p className="text-lg font-bold text-success">{formatCurrency(result.nettoMaandHuur)}</p>
            </div>
          </div>
        </div>

        {/* Savings calculation */}
        {result.besparing && result.besparing > 0 && (
          <div className="flex items-start gap-3 p-4 bg-success/10 rounded-lg border border-success/30">
            <CheckCircle className="h-5 w-5 text-success mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Besparing door nieuwe regeling</p>
              <p className="text-muted-foreground">
                Zonder de nieuwe regeling was je belasting {formatCurrency(result.brutoJaarHuur * 0.25)} geweest. 
                Je bespaart {formatCurrency(result.besparing)} per jaar!
              </p>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-muted-foreground">{result.uitleg}</p>
        </div>
      </CardContent>
    </Card>
  );
};
