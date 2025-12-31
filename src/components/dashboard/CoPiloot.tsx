import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Compass, 
  ChevronRight, 
  Building2, 
  Users, 
  FileText, 
  Euro, 
  Target, 
  Heart, 
  Calculator, 
  TrendingUp,
  ClipboardCheck,
  AlertTriangle,
  PiggyBank,
  Wallet,
  Home,
  Receipt,
  Scale,
  Shield,
  Calendar,
  BarChart3,
  Wrench,
  Bell,
  FileCheck,
  Landmark,
  Percent,
  HelpCircle,
  Settings,
  FolderOpen,
  Banknote,
  HandCoins
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

interface CoPilotOption {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  path: string;
  description: string;
}

const coPilotOptions: CoPilotOption[] = [
  // Panden (12 opties)
  { id: "nieuw-pand", label: "Een nieuw pand toevoegen", category: "Panden", icon: <Building2 className="w-4 h-4" />, path: "/panden", description: "Voeg een nieuw vastgoedobject toe aan je portfolio." },
  { id: "pand-bekijken", label: "Mijn panden bekijken", category: "Panden", icon: <Home className="w-4 h-4" />, path: "/panden", description: "Bekijk al je panden en hun status." },
  { id: "pand-details", label: "Pand details bekijken", category: "Panden", icon: <Building2 className="w-4 h-4" />, path: "/panden", description: "Bekijk alle details, kamers en huurders van een pand." },
  { id: "kamers-beheren", label: "Kamers/units beheren", category: "Panden", icon: <Home className="w-4 h-4" />, path: "/panden", description: "Bekijk en beheer kamers en units per pand." },
  { id: "risico-analyseren", label: "Risico's van een pand analyseren", category: "Panden", icon: <Shield className="w-4 h-4" />, path: "/panden", description: "Bekijk en bewerk de risicokaart van je panden." },
  { id: "pand-archiveren", label: "Een pand archiveren of verkopen", category: "Panden", icon: <Building2 className="w-4 h-4" />, path: "/panden", description: "Markeer een pand als verkocht of gearchiveerd." },
  { id: "onderhoud-pand", label: "Onderhoud per pand bekijken", category: "Panden", icon: <Wrench className="w-4 h-4" />, path: "/panden", description: "Bekijk het onderhoudsoverzicht met kenmerken en features." },
  { id: "nutskosten-bekijken", label: "Nutsvoorzieningen kosten bekijken", category: "Panden", icon: <Banknote className="w-4 h-4" />, path: "/panden", description: "Bekijk water, gas en elektriciteitskosten per pand." },
  { id: "documenten-openen", label: "Documenten van een pand openen", category: "Panden", icon: <FolderOpen className="w-4 h-4" />, path: "/panden", description: "Open de documentenkluis (Google Drive/OneDrive) van een pand." },
  { id: "energielabel-updaten", label: "Energielabel bijwerken", category: "Panden", icon: <FileCheck className="w-4 h-4" />, path: "/panden", description: "Werk het energielabel van een pand bij." },
  { id: "vergelijkbare-panden", label: "Vergelijkbare panden beheren", category: "Panden", icon: <BarChart3 className="w-4 h-4" />, path: "/panden", description: "Voeg vergelijkbare panden toe voor waardebepaling." },
  { id: "exit-strategie", label: "Exit strategie bekijken", category: "Panden", icon: <TrendingUp className="w-4 h-4" />, path: "/panden", description: "Bekijk advies voor verkoop of exit van een pand." },
  
  // Huurders (6 opties)
  { id: "nieuwe-huurder", label: "Een nieuwe huurder toevoegen", category: "Huurders", icon: <Users className="w-4 h-4" />, path: "/huurders", description: "Registreer een nieuwe huurder voor een van je panden." },
  { id: "huurders-bekijken", label: "Mijn huurders bekijken", category: "Huurders", icon: <Users className="w-4 h-4" />, path: "/huurders", description: "Bekijk alle actieve huurders en hun gegevens." },
  { id: "huurder-koppelen", label: "Huurder aan kamer koppelen", category: "Huurders", icon: <Home className="w-4 h-4" />, path: "/huurders", description: "Koppel een huurder aan een specifieke kamer of unit." },
  { id: "huurder-beoordelen", label: "Een huurder beoordelen", category: "Huurders", icon: <Users className="w-4 h-4" />, path: "/huurders", description: "Geef een betrouwbaarheidsscore aan een huurder." },
  { id: "huurder-contacteren", label: "Contact opnemen met huurder", category: "Huurders", icon: <Users className="w-4 h-4" />, path: "/huurders", description: "Bekijk contactgegevens van een huurder." },
  { id: "betalingshistorie", label: "Betalingshistorie van huurder bekijken", category: "Huurders", icon: <HandCoins className="w-4 h-4" />, path: "/financien", description: "Bekijk alle betalingen van een specifieke huurder." },
  
  // Aannemers (4 opties)
  { id: "nieuwe-aannemer", label: "Een nieuwe aannemer toevoegen", category: "Aannemers", icon: <Wrench className="w-4 h-4" />, path: "/aannemers", description: "Registreer een aannemer of vakman in je adresboek." },
  { id: "aannemers-bekijken", label: "Mijn aannemers bekijken", category: "Aannemers", icon: <Wrench className="w-4 h-4" />, path: "/aannemers", description: "Bekijk al je aannemers en hun contactgegevens." },
  { id: "aannemer-koppelen", label: "Aannemer aan pand koppelen", category: "Aannemers", icon: <Building2 className="w-4 h-4" />, path: "/aannemers", description: "Koppel een aannemer aan een specifiek pand." },
  { id: "aannemer-contacteren", label: "Contact opnemen met aannemer", category: "Aannemers", icon: <Wrench className="w-4 h-4" />, path: "/aannemers", description: "Bekijk contactgegevens van een aannemer." },
  
  // Contracten (5 opties)
  { id: "nieuw-contract", label: "Een nieuw contract aanmaken", category: "Contracten", icon: <FileText className="w-4 h-4" />, path: "/contracten", description: "Maak een huurcontract voor een pand." },
  { id: "verlopen-contracten", label: "Zien welke contracten bijna verlopen", category: "Contracten", icon: <AlertTriangle className="w-4 h-4" />, path: "/contracten", description: "Bekijk contracten die binnen 90 dagen aflopen." },
  { id: "herinnering-instellen", label: "Contract herinnering instellen", category: "Contracten", icon: <Bell className="w-4 h-4" />, path: "/contracten", description: "Stel herinneringen in voor contractverlengingen." },
  { id: "contract-verlengen", label: "Een contract verlengen", category: "Contracten", icon: <Calendar className="w-4 h-4" />, path: "/contracten", description: "Verleng een bestaand huurcontract." },
  { id: "contract-exporteren", label: "Contract naar agenda exporteren", category: "Contracten", icon: <Calendar className="w-4 h-4" />, path: "/contracten", description: "Exporteer contract data naar Google Calendar." },
  
  // Inchecklijsten (4 opties)
  { id: "inchecklijst-starten", label: "Een inchecklijst starten", category: "Inchecklijsten", icon: <ClipboardCheck className="w-4 h-4" />, path: "/inchecklijsten", description: "Start een in- of uitchecklijst met foto's en handtekening." },
  { id: "checklists-bekijken", label: "Voltooide checklists bekijken", category: "Inchecklijsten", icon: <ClipboardCheck className="w-4 h-4" />, path: "/inchecklijsten", description: "Bekijk eerder ingevulde in- en uitchecklists." },
  { id: "uitchecklijst-starten", label: "Een uitchecklijst starten", category: "Inchecklijsten", icon: <ClipboardCheck className="w-4 h-4" />, path: "/inchecklijsten", description: "Start een retour/uitcheck bij vertrek van huurder." },
  { id: "checklist-fotos", label: "Foto's van checklist bekijken", category: "Inchecklijsten", icon: <FolderOpen className="w-4 h-4" />, path: "/inchecklijsten", description: "Bekijk de foto's van een voltooide checklist." },
  
  // Financiën (8 opties)
  { id: "huur-ontvangen", label: "Huur als ontvangen registreren", category: "Financiën", icon: <Euro className="w-4 h-4" />, path: "/financien", description: "Registreer een ontvangen huurbetaling." },
  { id: "kosten-toevoegen", label: "Kosten toevoegen", category: "Financiën", icon: <Receipt className="w-4 h-4" />, path: "/financien", description: "Voeg onderhoud, verzekering of andere kosten toe." },
  { id: "cashflow-bekijken", label: "Mijn cashflow bekijken", category: "Financiën", icon: <TrendingUp className="w-4 h-4" />, path: "/financien", description: "Bekijk je maandelijkse inkomsten en uitgaven." },
  { id: "hypotheek-toevoegen", label: "Een hypotheek/lening toevoegen", category: "Financiën", icon: <Scale className="w-4 h-4" />, path: "/financien", description: "Voeg een lening toe aan een pand." },
  { id: "imi-berekenen", label: "IMI belasting berekenen", category: "Financiën", icon: <Landmark className="w-4 h-4" />, path: "/financien", description: "Bereken de jaarlijkse IMI (onroerendezaakbelasting)." },
  { id: "verzekering-bekijken", label: "Verzekeringen bekijken", category: "Financiën", icon: <Shield className="w-4 h-4" />, path: "/financien", description: "Bekijk de verzekeringen per pand." },
  { id: "rendement-berekenen", label: "Rendement berekenen", category: "Financiën", icon: <Percent className="w-4 h-4" />, path: "/financien", description: "Bereken bruto en netto rendement van je panden." },
  { id: "financien-exporteren", label: "Financiën exporteren", category: "Financiën", icon: <FileText className="w-4 h-4" />, path: "/financien", description: "Exporteer financiële overzichten naar PDF of Excel." },
  
  // Rendementsanalysator (6 opties)
  { id: "analysator-openen", label: "Rendementsanalysator openen", category: "Analysator", icon: <Calculator className="w-4 h-4" />, path: "/rendementsanalysator", description: "Open de geavanceerde rendementsanalyse tool." },
  { id: "lab-modus", label: "Lab modus gebruiken", category: "Analysator", icon: <Calculator className="w-4 h-4" />, path: "/rendementsanalysator", description: "Simuleer wat-als scenario's in de lab modus." },
  { id: "sensitivity-analyse", label: "Gevoeligheidsanalyse bekijken", category: "Analysator", icon: <BarChart3 className="w-4 h-4" />, path: "/rendementsanalysator", description: "Bekijk hoe parameters je rendement beïnvloeden." },
  { id: "fiscaal-overzicht", label: "Fiscaal overzicht bekijken", category: "Analysator", icon: <Landmark className="w-4 h-4" />, path: "/rendementsanalysator", description: "Bekijk belastingen en fiscale impact per pand." },
  { id: "cashflow-projectie", label: "Cashflow projectie bekijken", category: "Analysator", icon: <TrendingUp className="w-4 h-4" />, path: "/rendementsanalysator", description: "Bekijk meerjarige cashflow projecties." },
  { id: "partner-overzicht", label: "Partner overzicht maken", category: "Analysator", icon: <Users className="w-4 h-4" />, path: "/rendementsanalysator", description: "Maak een versimpeld overzicht voor je partner." },
  
  // Vermogen & Rendement (5 opties)
  { id: "netto-vermogen", label: "Mijn netto vermogen bekijken", category: "Vermogen", icon: <Wallet className="w-4 h-4" />, path: "/netto-vermogen", description: "Bekijk je totale vermogen en schulden." },
  { id: "sneeuwbal", label: "Berekenen wanneer ik schuldenvrij ben", category: "Vermogen", icon: <Calculator className="w-4 h-4" />, path: "/sneeuwbal", description: "Simuleer het sneeuwbaleffect voor je leningen." },
  { id: "rendement-analyseren", label: "Rendement per pand analyseren", category: "Vermogen", icon: <BarChart3 className="w-4 h-4" />, path: "/panden", description: "Bekijk bruto en netto rendement per pand." },
  { id: "vermogen-groei", label: "Vermogensgroei simuleren", category: "Vermogen", icon: <TrendingUp className="w-4 h-4" />, path: "/netto-vermogen", description: "Bekijk hoe je vermogen groeit over tijd." },
  { id: "schuld-ratio", label: "Schuld-ratio bekijken", category: "Vermogen", icon: <Scale className="w-4 h-4" />, path: "/netto-vermogen", description: "Analyseer je schuld ten opzichte van bezittingen." },
  
  // Doelen (4 opties)
  { id: "doel-instellen", label: "Een doel instellen (bijv. vakantie)", category: "Doelen", icon: <Target className="w-4 h-4" />, path: "/doelen", description: "Stel een financieel doel in en koppel het aan een pand." },
  { id: "doelen-bekijken", label: "Mijn doelen bekijken", category: "Doelen", icon: <Target className="w-4 h-4" />, path: "/doelen", description: "Bekijk je voortgang naar je financiële doelen." },
  { id: "doel-voortgang", label: "Voortgang naar doel bijwerken", category: "Doelen", icon: <Target className="w-4 h-4" />, path: "/doelen", description: "Werk de voortgang van een doel bij." },
  { id: "doel-koppelen", label: "Doel aan pand koppelen", category: "Doelen", icon: <Target className="w-4 h-4" />, path: "/doelen", description: "Koppel een doel aan een specifiek pand als bron." },
  
  // Pensioen (4 opties)
  { id: "pensioengat", label: "Mijn pensioengat analyseren", category: "Pensioen", icon: <PiggyBank className="w-4 h-4" />, path: "/pensioen", description: "Bereken hoeveel inkomen je nog nodig hebt voor pensioen." },
  { id: "pensioen-plan", label: "Pensioenplan bekijken", category: "Pensioen", icon: <PiggyBank className="w-4 h-4" />, path: "/pensioen", description: "Bekijk je volledige pensioenplanning." },
  { id: "aow-invoeren", label: "AOW en pensioengegevens invoeren", category: "Pensioen", icon: <Landmark className="w-4 h-4" />, path: "/instellingen", description: "Voer je verwachte AOW en pensioeninkomsten in." },
  { id: "pensioen-simulatie", label: "Pensioen scenario simuleren", category: "Pensioen", icon: <Calculator className="w-4 h-4" />, path: "/pensioen", description: "Simuleer verschillende pensioenscenario's." },
  
  // Legacy (6 opties)
  { id: "erfgoed-waarden", label: "Mijn erfgoedwaarden bekijken", category: "Legacy", icon: <Heart className="w-4 h-4" />, path: "/legacy", description: "Bekijk je waardenverklaring en legacy planning." },
  { id: "familie-rollen", label: "Familierollen beheren", category: "Legacy", icon: <Users className="w-4 h-4" />, path: "/legacy", description: "Wijs rollen toe aan familieleden voor je vastgoed." },
  { id: "erfopvolging", label: "Erfopvolging plannen", category: "Legacy", icon: <Heart className="w-4 h-4" />, path: "/legacy", description: "Plan hoe je vastgoed wordt overgedragen." },
  { id: "fiscale-deadlines", label: "Fiscale deadlines bekijken", category: "Legacy", icon: <Calendar className="w-4 h-4" />, path: "/legacy", description: "Bekijk belangrijke belastingdeadlines." },
  { id: "mantra-instellen", label: "Erfgoed mantra instellen", category: "Legacy", icon: <Heart className="w-4 h-4" />, path: "/instellingen", description: "Stel je persoonlijke erfgoed mantra in." },
  { id: "familie-handleiding", label: "Familie handleiding per pand maken", category: "Legacy", icon: <FileText className="w-4 h-4" />, path: "/panden", description: "Maak instructies voor familieleden per pand." },
  
  // Instellingen (4 opties)
  { id: "profiel-bewerken", label: "Mijn profiel bewerken", category: "Instellingen", icon: <Settings className="w-4 h-4" />, path: "/instellingen", description: "Pas je naam, leeftijd en voorkeuren aan." },
  { id: "begeleiding-toggle", label: "Begeleide modus aan/uitzetten", category: "Instellingen", icon: <HelpCircle className="w-4 h-4" />, path: "/instellingen", description: "Schakel stapsgewijze begeleiding in of uit." },
  { id: "copiloot-instelling", label: "Co-Piloot standaard instellen", category: "Instellingen", icon: <Compass className="w-4 h-4" />, path: "/instellingen", description: "Kies of de Co-Piloot standaard getoond wordt." },
  { id: "stilte-modus", label: "Stilte modus aan/uitzetten", category: "Instellingen", icon: <Settings className="w-4 h-4" />, path: "/instellingen", description: "Schakel de minimalistische stilte modus in of uit." },
];

const categories = [...new Set(coPilotOptions.map(o => o.category))];

interface CoPilootProps {
  onSwitchToManual: () => void;
}

export const CoPiloot = ({ onSwitchToManual }: CoPilootProps) => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const selectedDetails = coPilotOptions.find(o => o.id === selectedOption);

  const handleSelect = (value: string) => {
    setSelectedOption(value);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (selectedDetails) {
      navigate(selectedDetails.path);
    }
  };

  const handleCancel = () => {
    setSelectedOption("");
    setShowConfirmation(false);
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 rounded-2xl border border-primary/20 p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Compass className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Vastgoed Co-Piloot</h2>
            <p className="text-sm text-muted-foreground">Waar wil je vandaag mee aan de slag?</p>
          </div>
          <InfoTooltip
            title="Vastgoed Co-Piloot"
            content="Selecteer een actie uit de dropdown en je wordt automatisch naar het juiste scherm geleid. Ideaal voor snelle taken!"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onSwitchToManual} className="text-muted-foreground hover:text-foreground">
          Handmatige navigatie →
        </Button>
      </div>

      {!showConfirmation ? (
        <Select onValueChange={handleSelect} value={selectedOption}>
          <SelectTrigger className="w-full bg-background/80 backdrop-blur-sm border-primary/20 h-12 text-base">
            <SelectValue placeholder="Kies een actie..." />
          </SelectTrigger>
          <SelectContent className="max-h-[400px] bg-popover">
            {categories.map((category) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                  {category}
                </div>
                {coPilotOptions
                  .filter(o => o.category === category)
                  .map((option) => (
                    <SelectItem key={option.id} value={option.id} className="py-3">
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 bg-background/80 backdrop-blur-sm rounded-xl border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              {selectedDetails?.icon}
              <span className="font-medium text-foreground">{selectedDetails?.label}</span>
            </div>
            <p className="text-sm text-muted-foreground ml-7">
              {selectedDetails?.description}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={handleConfirm} className="flex-1 gradient-primary gap-2">
              Doorgaan <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Annuleren
            </Button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-primary/10">
        <p className="text-xs text-muted-foreground mb-2">Populaire keuzes vandaag:</p>
        <div className="flex flex-wrap gap-2">
          {["huur-ontvangen", "netto-vermogen", "analysator-openen", "kamers-beheren"].map((id) => {
            const option = coPilotOptions.find(o => o.id === id);
            return option ? (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-background/60 hover:bg-background rounded-full border border-border/50 transition-colors"
              >
                {option.icon}
                {option.label}
              </button>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
};
