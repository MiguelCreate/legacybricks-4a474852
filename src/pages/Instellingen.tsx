import { useState, useEffect } from "react";
import { Settings, User, Bell, Shield, Moon, Sun, LogOut, HelpCircle, Save, Compass, Info } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTooltipVisibility } from "@/hooks/useTooltipVisibility";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const Instellingen = () => {
  const { user, signOut } = useAuth();
  const { globalTooltipsEnabled, setGlobalTooltipsEnabled } = useTooltipVisibility();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<Profile> & { co_pilot_standaard?: boolean }>({
    naam: "",
    email: "",
    huidige_leeftijd: null,
    gewenste_pensioenleeftijd: null,
    gewenst_maandinkomen: null,
    spaargeld: null,
    begeleiding_aan: true,
    erfgoed_mantra: "",
    co_pilot_standaard: true,
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
    setIsDarkMode(document.documentElement.classList.contains("dark"));
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          naam: profile.naam,
          huidige_leeftijd: profile.huidige_leeftijd,
          gewenste_pensioenleeftijd: profile.gewenste_pensioenleeftijd,
          gewenst_maandinkomen: profile.gewenst_maandinkomen,
          spaargeld: profile.spaargeld,
          begeleiding_aan: profile.begeleiding_aan,
          erfgoed_mantra: profile.erfgoed_mantra,
          co_pilot_standaard: profile.co_pilot_standaard,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Instellingen opgeslagen",
        description: "Je profiel is succesvol bijgewerkt.",
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Uitgelogd",
      description: "Je bent succesvol uitgelogd.",
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Laden...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Instellingen
            </h1>
            <InfoTooltip
              title="Instellingen"
              content="Pas hier je profiel, voorkeuren en doelen aan. Deze gegevens helpen ons je beter te adviseren."
            />
          </div>
          <p className="text-muted-foreground mt-1">
            Beheer je account en voorkeuren
          </p>
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8 space-y-6">
          {/* Profile Section */}
          <section className="bg-card rounded-xl border shadow-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Profiel</h2>
            </div>

            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="naam">Naam</Label>
                  <Input
                    id="naam"
                    value={profile.naam || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, naam: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    value={profile.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leeftijd">
                    Huidige leeftijd
                    <InfoTooltip
                      title="Waarom dit?"
                      content="Je leeftijd helpt ons berekenen hoeveel tijd je hebt om je financiële doelen te bereiken."
                    />
                  </Label>
                  <Input
                    id="leeftijd"
                    type="number"
                    min="18"
                    max="100"
                    value={profile.huidige_leeftijd || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        huidige_leeftijd: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pensioen">Gewenste pensioenleeftijd</Label>
                  <Input
                    id="pensioen"
                    type="number"
                    min="40"
                    max="100"
                    value={profile.gewenste_pensioenleeftijd || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        gewenste_pensioenleeftijd: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maandinkomen">
                    Gewenst maandinkomen (€)
                    <InfoTooltip
                      title="Passief Inkomen Doel"
                      content="Hoeveel wil je maandelijks ontvangen uit je vastgoed? Dit helpt bij het berekenen van je doelen."
                    />
                  </Label>
                  <Input
                    id="maandinkomen"
                    type="number"
                    min="0"
                    value={profile.gewenst_maandinkomen || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        gewenst_maandinkomen: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spaargeld">Beschikbaar spaargeld (€)</Label>
                  <Input
                    id="spaargeld"
                    type="number"
                    min="0"
                    value={profile.spaargeld || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        spaargeld: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mantra">
                  Erfgoed Mantra
                  <InfoTooltip
                    title="Je Persoonlijke Motivatie"
                    content="Schrijf een zin die je herinnert aan waarom je investeert. Dit wordt getoond op je dashboard."
                  />
                </Label>
                <Textarea
                  id="mantra"
                  value={profile.erfgoed_mantra || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, erfgoed_mantra: e.target.value })
                  }
                  placeholder="Bijv: 'Elke steen die ik leg, bouwt aan de toekomst van mijn familie.'"
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="bg-card rounded-xl border shadow-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Voorkeuren</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    <Label>Vastgoed Co-Piloot als standaard</Label>
                    <InfoTooltip
                      title="Co-Piloot Modus"
                      content="Wanneer actief, opent het dashboard met de interactieve Co-Piloot dropdown waarmee je snel acties kunt kiezen."
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Toon de Co-Piloot assistent op het dashboard
                  </p>
                </div>
                <Switch
                  checked={profile.co_pilot_standaard !== false}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, co_pilot_standaard: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>Begeleide Modus</Label>
                    <InfoTooltip
                      title="Begeleide Modus"
                      content="Wanneer actief, worden taken stapsgewijs begeleid met extra uitleg. Ideaal voor nieuwe gebruikers."
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ontvang stapsgewijze begeleiding bij taken
                  </p>
                </div>
                <Switch
                  checked={profile.begeleiding_aan || false}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, begeleiding_aan: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {isDarkMode ? (
                      <Moon className="w-4 h-4" />
                    ) : (
                      <Sun className="w-4 h-4" />
                    )}
                    <Label>Donkere Modus</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Schakel tussen licht en donker thema
                  </p>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <Label>Toon Uitleg ℹ️</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Toon uitleg-iconen bij financiële begrippen
                  </p>
                </div>
                <Switch
                  checked={globalTooltipsEnabled}
                  onCheckedChange={setGlobalTooltipsEnabled}
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gradient-primary text-primary-foreground gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Opslaan..." : "Instellingen Opslaan"}
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Uitloggen
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Instellingen;
