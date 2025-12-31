import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Image,
  Download,
  Share2,
  Palette,
  MapPin,
  Euro,
  TrendingUp,
  Quote,
  Sparkles,
  Upload,
} from "lucide-react";

interface PandAlsKunstwerkProps {
  propertyId: string;
  propertyName: string;
  locatie: string;
  aankoopprijs: number;
  huidigeWaarde: number;
  maandelijksHuur: number;
  rendement?: number;
  persoonlijkeQuote?: string;
  fotoUrl?: string;
  onUpdate?: () => void;
}

export const PandAlsKunstwerk = ({
  propertyId,
  propertyName,
  locatie,
  aankoopprijs,
  huidigeWaarde,
  maandelijksHuur,
  rendement,
  persoonlijkeQuote: initialQuote,
  fotoUrl: initialFotoUrl,
  onUpdate,
}: PandAlsKunstwerkProps) => {
  const { toast } = useToast();
  const [quote, setQuote] = useState(initialQuote || "");
  const [fotoUrl, setFotoUrl] = useState(initialFotoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  // Calculate color based on rendement
  const getColorScheme = () => {
    if (!rendement) return { primary: "hsl(var(--primary))", accent: "hsl(var(--muted))" };
    if (rendement >= 8) return { primary: "#22c55e", accent: "#86efac" }; // Green - excellent
    if (rendement >= 5) return { primary: "hsl(var(--primary))", accent: "hsl(var(--primary-glow))" }; // Blue - good
    if (rendement >= 3) return { primary: "#f59e0b", accent: "#fcd34d" }; // Orange - moderate
    return { primary: "#ef4444", accent: "#fca5a5" }; // Red - low
  };

  const colorScheme = getColorScheme();
  const waardeStijging = huidigeWaarde - aankoopprijs;
  const waardeStijgingPercent = aankoopprijs > 0 ? ((waardeStijging / aankoopprijs) * 100).toFixed(1) : "0";

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${propertyId}-${Date.now()}.${fileExt}`;
      const filePath = `property-images/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("checklist-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("checklist-files")
        .getPublicUrl(filePath);

      setFotoUrl(urlData.publicUrl);
      
      toast({
        title: "Foto geüpload",
        description: "Je kunt nu de poster genereren.",
      });
    } catch (error: any) {
      toast({
        title: "Upload mislukt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          persoonlijke_quote: quote,
          foto_url: fotoUrl,
        })
        .eq("id", propertyId);

      if (error) throw error;

      toast({
        title: "Opgeslagen",
        description: "Je kunstwerk instellingen zijn opgeslagen.",
      });
      
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    // For now, just show a toast - full implementation would use html2canvas
    toast({
      title: "Download gestart",
      description: "Je poster wordt voorbereid... (functie in ontwikkeling)",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mijn vastgoed: ${propertyName}`,
          text: quote || `Bekijk mijn pand in ${locatie}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      toast({
        title: "Delen",
        description: "Kopieer de link om te delen.",
      });
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Pand als Kunstwerk
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload & Quote Section */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              Upload foto van je pand
            </Label>
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="cursor-pointer"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Upload className="w-4 h-4 animate-bounce" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Quote className="w-4 h-4" />
              Persoonlijke quote
            </Label>
            <Textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Wat betekent dit pand voor jou?"
              rows={2}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} variant="outline" size="sm">
          {saving ? "Opslaan..." : "Instellingen opslaan"}
        </Button>

        {/* Poster Preview */}
        <div
          ref={posterRef}
          className="relative rounded-2xl overflow-hidden aspect-[3/4] max-w-md mx-auto shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${colorScheme.primary} 0%, ${colorScheme.accent} 100%)`,
          }}
        >
          {/* Photo Section */}
          <div className="absolute inset-0 opacity-20">
            {fotoUrl && (
              <img
                src={fotoUrl}
                alt={propertyName}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Content Overlay */}
          <div className="relative h-full flex flex-col justify-between p-6 text-white">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{locatie}</span>
              </div>
              <h2 className="text-2xl font-bold">{propertyName}</h2>
              {quote && (
                <p className="text-sm italic text-white/90 border-l-2 border-white/50 pl-3">
                  "{quote}"
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-white/70">Aankoopprijs</p>
                  <p className="font-bold">€{aankoopprijs.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-white/70">Huidige waarde</p>
                  <p className="font-bold">€{huidigeWaarde.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-white/70">Maandelijkse huur</p>
                  <p className="font-bold">€{maandelijksHuur.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-white/70">Waardestijging</p>
                  <p className="font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{waardeStijgingPercent}%
                  </p>
                </div>
              </div>

              {rendement && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                  <p className="text-xs text-white/70">Bruto Rendement</p>
                  <p className="text-3xl font-bold">{rendement.toFixed(1)}%</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Sparkles className="w-3 h-3" />
                Vastgoed Portfolio
              </div>
              <div className="text-xs text-white/60">
                {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2">
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download als poster
          </Button>
          <Button onClick={handleShare} variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Delen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
