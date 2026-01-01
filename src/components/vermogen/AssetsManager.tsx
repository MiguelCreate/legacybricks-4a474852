import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingUp, Wallet, Bitcoin, Banknote, PiggyBank, Building, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Asset = Tables<"assets">;

const assetTypes = [
  { value: "spaargeld", label: "Spaargeld", icon: PiggyBank },
  { value: "aandelen", label: "Aandelen", icon: BarChart },
  { value: "obligaties", label: "Obligaties", icon: Banknote },
  { value: "crypto", label: "Crypto", icon: Bitcoin },
  { value: "vastgoed_extern", label: "Vastgoed (extern)", icon: Building },
  { value: "overig", label: "Overig", icon: Wallet },
];

export const AssetsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "spaargeld",
    naam: "",
    huidige_waarde: 0,
    aankoop_waarde: 0,
    aankoop_datum: "",
    rendement_percentage: 0,
    land: "NL",
    notities: "",
  });

  useEffect(() => {
    if (user) {
      fetchAssets();
    }
  }, [user]);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("type");

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("assets").insert({
        user_id: user.id,
        type: formData.type,
        naam: formData.naam,
        huidige_waarde: formData.huidige_waarde,
        aankoop_waarde: formData.aankoop_waarde || null,
        aankoop_datum: formData.aankoop_datum || null,
        rendement_percentage: formData.rendement_percentage || null,
        land: formData.land || null,
        notities: formData.notities || null,
      });

      if (error) throw error;

      toast({
        title: "Vermogensonderdeel toegevoegd",
        description: "Het onderdeel is succesvol geregistreerd.",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchAssets();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit vermogensonderdeel wilt verwijderen?")) return;

    try {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Verwijderd",
        description: "Het vermogensonderdeel is verwijderd.",
      });

      fetchAssets();
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
      type: "spaargeld",
      naam: "",
      huidige_waarde: 0,
      aankoop_waarde: 0,
      aankoop_datum: "",
      rendement_percentage: 0,
      land: "NL",
      notities: "",
    });
  };

  const totalValue = assets.reduce((sum, a) => sum + Number(a.huidige_waarde), 0);
  const totalGain = assets.reduce((sum, a) => sum + (Number(a.huidige_waarde) - Number(a.aankoop_waarde || 0)), 0);

  // Group assets by type
  const groupedAssets = assetTypes.map((type) => ({
    ...type,
    assets: assets.filter((a) => a.type === type.value),
    total: assets.filter((a) => a.type === type.value).reduce((sum, a) => sum + Number(a.huidige_waarde), 0),
  })).filter((g) => g.assets.length > 0);

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
            <Wallet className="w-5 h-5 text-primary" />
            <CardTitle>Overig Vermogen</CardTitle>
            <InfoTooltip
              title="Overig Vermogen"
              content="Naast vastgoed kun je hier je andere bezittingen registreren: spaargeld, beleggingen, crypto, etc."
            />
          </div>
          <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Toevoegen
          </Button>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Totale Waarde</p>
              <p className="text-2xl font-bold text-foreground">€{totalValue.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Totale Winst/Verlies</p>
              <p className={`text-2xl font-bold ${totalGain >= 0 ? "text-success" : "text-destructive"}`}>
                {totalGain >= 0 ? "+" : ""}€{totalGain.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Assets by Type */}
          {groupedAssets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nog geen vermogensonderdelen geregistreerd</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedAssets.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.value} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-medium text-foreground">{group.label}</h4>
                      </div>
                      <span className="font-semibold text-foreground">€{group.total.toLocaleString()}</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      {group.assets.map((asset) => {
                        const gain = Number(asset.huidige_waarde) - Number(asset.aankoop_waarde || 0);
                        return (
                          <div
                            key={asset.id}
                            className="p-3 bg-secondary/50 rounded-lg flex items-center justify-between group"
                          >
                            <div>
                              <p className="font-medium text-foreground">{asset.naam}</p>
                              {asset.land && (
                                <p className="text-xs text-muted-foreground">{asset.land}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-semibold text-foreground">€{Number(asset.huidige_waarde).toLocaleString()}</p>
                                {asset.aankoop_waarde && Number(asset.aankoop_waarde) > 0 && (
                                  <p className={`text-xs ${gain >= 0 ? "text-success" : "text-destructive"}`}>
                                    {gain >= 0 ? "+" : ""}€{gain.toLocaleString()}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(asset.id)}
                                className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
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
            <DialogTitle>Vermogensonderdeel Toevoegen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
                placeholder="bijv. ING Spaarrekening, Bitcoin, ETF Portfolio"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Huidige Waarde *</Label>
                <Input
                  type="number"
                  value={formData.huidige_waarde || ""}
                  onChange={(e) => setFormData({ ...formData, huidige_waarde: Number(e.target.value) })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Aankoopwaarde</Label>
                <Input
                  type="number"
                  value={formData.aankoop_waarde || ""}
                  onChange={(e) => setFormData({ ...formData, aankoop_waarde: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aankoopdatum</Label>
                <Input
                  type="date"
                  value={formData.aankoop_datum}
                  onChange={(e) => setFormData({ ...formData, aankoop_datum: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Land</Label>
                <Input
                  value={formData.land}
                  onChange={(e) => setFormData({ ...formData, land: e.target.value })}
                  placeholder="NL"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Verwacht Rendement %</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.rendement_percentage || ""}
                onChange={(e) => setFormData({ ...formData, rendement_percentage: Number(e.target.value) })}
                placeholder="bijv. 7 voor 7% per jaar"
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
                disabled={!formData.naam || !formData.huidige_waarde}
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
