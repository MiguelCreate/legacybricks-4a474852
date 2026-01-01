import { useState, useEffect } from "react";
import { Heart, Users, Calendar, Shield, FileText, Save, Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BeneficiariesManager } from "@/components/legacy/BeneficiariesManager";
import type { Tables } from "@/integrations/supabase/types";

type LegacySettings = Tables<"legacy_settings">;

interface FamilieRol {
  naam: string;
  rol: string;
}

interface FiscaleDeadline {
  naam: string;
  datum: string;
}

const erfopvolgingOpties = [
  { value: "schenking", label: "Schenking bij leven", description: "Geleidelijke overdracht van eigendom aan erfgenamen" },
  { value: "holding", label: "Familiale holding", description: "Vastgoed onderbrengen in een BV/holding structuur" },
  { value: "usufruct", label: "Vruchtgebruik (Usufruct)", description: "Bloot eigendom overdragen, vruchtgebruik behouden" },
  { value: "testament", label: "Testament", description: "Verdeling via testament na overlijden" },
];

const Legacy = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<LegacySettings>>({
    waardenverklaring: "",
    erfopvolging_optie: "",
    jaarlijkse_review_datum: "",
    notities: "",
    familie_rollen: [],
    fiscale_deadlines: [],
  });

  const [familieRollen, setFamilieRollen] = useState<FamilieRol[]>([]);
  const [fiscaleDeadlines, setFiscaleDeadlines] = useState<FiscaleDeadline[]>([]);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("legacy_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFamilieRollen(Array.isArray(data.familie_rollen) ? data.familie_rollen as unknown as FamilieRol[] : []);
        setFiscaleDeadlines(Array.isArray(data.fiscale_deadlines) ? data.fiscale_deadlines as unknown as FiscaleDeadline[] : []);
      }
    } catch (error) {
      console.error("Error fetching legacy settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const settingsData = {
        user_id: user.id,
        waardenverklaring: settings.waardenverklaring || null,
        erfopvolging_optie: settings.erfopvolging_optie || null,
        jaarlijkse_review_datum: settings.jaarlijkse_review_datum || null,
        notities: settings.notities || null,
        familie_rollen: JSON.parse(JSON.stringify(familieRollen)),
        fiscale_deadlines: JSON.parse(JSON.stringify(fiscaleDeadlines)),
      };

      const { data: existing } = await supabase
        .from("legacy_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("legacy_settings")
          .update(settingsData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("legacy_settings")
          .insert([settingsData]);

        if (error) throw error;
      }

      toast({
        title: "Opgeslagen",
        description: "Je legacy instellingen zijn bijgewerkt.",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addFamilieRol = () => {
    setFamilieRollen([...familieRollen, { naam: "", rol: "" }]);
  };

  const removeFamilieRol = (index: number) => {
    setFamilieRollen(familieRollen.filter((_, i) => i !== index));
  };

  const updateFamilieRol = (index: number, field: keyof FamilieRol, value: string) => {
    const updated = [...familieRollen];
    updated[index][field] = value;
    setFamilieRollen(updated);
  };

  const addFiscaleDeadline = () => {
    setFiscaleDeadlines([...fiscaleDeadlines, { naam: "", datum: "" }]);
  };

  const removeFiscaleDeadline = (index: number) => {
    setFiscaleDeadlines(fiscaleDeadlines.filter((_, i) => i !== index));
  };

  const updateFiscaleDeadline = (index: number, field: keyof FiscaleDeadline, value: string) => {
    const updated = [...fiscaleDeadlines];
    updated[index][field] = value;
    setFiscaleDeadlines(updated);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          <div className="h-48 bg-card rounded-xl border animate-pulse" />
          <div className="h-48 bg-card rounded-xl border animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Legacy & Governance
            </h1>
            <InfoTooltip
              title="Legacy Planning"
              content="Plan hier je erfgoed en familiale governance. Leg vast wie wat doet, wanneer je review-momenten zijn, en hoe je vastgoed aan de volgende generatie overdraagt."
            />
          </div>
          <p className="text-muted-foreground mt-1">
            Bouw aan duurzaam erfgoed voor de volgende generatie
          </p>
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8 space-y-6">
          {/* Waardenverklaring */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Waardenverklaring
                <InfoTooltip
                  title="Waardenverklaring"
                  content="Beschrijf hier de kernwaarden en visie achter je vastgoed portefeuille. Dit helpt toekomstige generaties te begrijpen waarom je deze keuzes hebt gemaakt."
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Bijv: 'Ons doel is duurzaam erfgoed opbouwen, niet maximale winst. Wij kiezen voor kwaliteitspanden die generaties meegaan.'"
                value={settings.waardenverklaring || ""}
                onChange={(e) => setSettings({ ...settings, waardenverklaring: e.target.value })}
                className="min-h-32"
              />
            </CardContent>
          </Card>

          {/* Familierollen */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Familierollen
                <InfoTooltip
                  title="Familierollen"
                  content="Leg vast wie welke verantwoordelijkheid heeft. Bijv: 'Jan - Financieel beheer', 'Lisa - Juridische zaken', 'Tom - Onderhoud'."
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {familieRollen.map((rol, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    placeholder="Naam"
                    value={rol.naam}
                    onChange={(e) => updateFamilieRol(index, "naam", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Rol/Verantwoordelijkheid"
                    value={rol.rol}
                    onChange={(e) => updateFamilieRol(index, "rol", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFamilieRol(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addFamilieRol} className="gap-2">
                <Plus className="w-4 h-4" />
                Familielid toevoegen
              </Button>
            </CardContent>
          </Card>

          {/* Erfopvolging */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Erfopvolgingsstrategie
                <InfoTooltip
                  title="Erfopvolging"
                  content="Kies hoe je vastgoed aan de volgende generatie overdraagt. Elke optie heeft verschillende fiscale en juridische gevolgen."
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={settings.erfopvolging_optie || ""}
                onValueChange={(value) => setSettings({ ...settings, erfopvolging_optie: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer strategie" />
                </SelectTrigger>
                <SelectContent>
                  {erfopvolgingOpties.map((optie) => (
                    <SelectItem key={optie.value} value={optie.value}>
                      {optie.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {settings.erfopvolging_optie && (
                <p className="text-sm text-muted-foreground p-3 bg-accent/50 rounded-lg">
                  {erfopvolgingOpties.find((o) => o.value === settings.erfopvolging_optie)?.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Fiscale Deadlines */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Fiscale Deadlines & Review Momenten
                <InfoTooltip
                  title="Deadlines"
                  content="Houd belangrijke data bij zoals IMI-betaling, IRS-aangifte, of de jaarlijkse familie vastgoed review."
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Jaarlijkse Familie Review</Label>
                <Input
                  type="date"
                  value={settings.jaarlijkse_review_datum || ""}
                  onChange={(e) => setSettings({ ...settings, jaarlijkse_review_datum: e.target.value })}
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <Label>Overige deadlines</Label>
                {fiscaleDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      placeholder="Bijv: IMI betaling"
                      value={deadline.naam}
                      onChange={(e) => updateFiscaleDeadline(index, "naam", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={deadline.datum}
                      onChange={(e) => updateFiscaleDeadline(index, "datum", e.target.value)}
                      className="w-40"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFiscaleDeadline(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addFiscaleDeadline} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Deadline toevoegen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notities */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Aanvullende Notities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Overige notities, contactgegevens van adviseurs, belangrijke documenten..."
                value={settings.notities || ""}
                onChange={(e) => setSettings({ ...settings, notities: e.target.value })}
                className="min-h-32"
              />
            </CardContent>
          </Card>

          {/* Begunstigden Manager */}
          <BeneficiariesManager />

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full gradient-primary text-primary-foreground gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Opslaan..." : "Wijzigingen Opslaan"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Legacy;
