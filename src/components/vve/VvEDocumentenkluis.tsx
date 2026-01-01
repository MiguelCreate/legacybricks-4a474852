import { useState, useEffect } from "react";
import { FolderOpen, FileText, Calendar, ExternalLink, Info, AlertTriangle, Shield, Zap, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";

interface VvEDocumentenKluisProps {
  propertyId: string;
  propertyName: string;
  verzekeringsPolisnummer: string | null;
  verzekeringsVervaldatum: string | null;
  verzekeringsLink: string | null;
  bouwkundigRapportLink: string | null;
  energieCertificaatVervaldatum: string | null;
  onUpdate: () => void;
}

export const VvEDocumentenkluis = ({
  propertyId,
  propertyName,
  verzekeringsPolisnummer,
  verzekeringsVervaldatum,
  verzekeringsLink,
  bouwkundigRapportLink,
  energieCertificaatVervaldatum,
  onUpdate,
}: VvEDocumentenKluisProps) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    verzekeringsPolisnummer: verzekeringsPolisnummer || "",
    verzekeringsVervaldatum: verzekeringsVervaldatum || "",
    verzekeringsLink: verzekeringsLink || "",
    bouwkundigRapportLink: bouwkundigRapportLink || "",
    energieCertificaatVervaldatum: energieCertificaatVervaldatum || "",
  });

  useEffect(() => {
    setFormData({
      verzekeringsPolisnummer: verzekeringsPolisnummer || "",
      verzekeringsVervaldatum: verzekeringsVervaldatum || "",
      verzekeringsLink: verzekeringsLink || "",
      bouwkundigRapportLink: bouwkundigRapportLink || "",
      energieCertificaatVervaldatum: energieCertificaatVervaldatum || "",
    });
  }, [verzekeringsPolisnummer, verzekeringsVervaldatum, verzekeringsLink, bouwkundigRapportLink, energieCertificaatVervaldatum]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          gebouw_verzekering_polisnummer: formData.verzekeringsPolisnummer || null,
          gebouw_verzekering_vervaldatum: formData.verzekeringsVervaldatum || null,
          gebouw_verzekering_link: formData.verzekeringsLink || null,
          bouwkundig_rapport_link: formData.bouwkundigRapportLink || null,
          energie_certificaat_gebouw_vervaldatum: formData.energieCertificaatVervaldatum || null,
        })
        .eq("id", propertyId);

      if (error) throw error;

      toast({ title: "Documenten bijgewerkt" });
      setEditing(false);
      onUpdate();
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

  const getExpiryWarning = (date: string | null) => {
    if (!date) return null;
    const dagenTot = differenceInDays(new Date(date), new Date());
    
    if (dagenTot < 0) {
      return { type: "expired", message: "Verlopen" };
    } else if (dagenTot <= 30) {
      return { type: "urgent", message: `Verloopt over ${dagenTot} dagen` };
    } else if (dagenTot <= 60) {
      return { type: "warning", message: `Verloopt over ${dagenTot} dagen` };
    }
    return null;
  };

  const verzekeringsWarning = getExpiryWarning(verzekeringsVervaldatum);
  const energieWarning = getExpiryWarning(energieCertificaatVervaldatum);

  const documents = [
    {
      id: "verzekering",
      icon: Shield,
      title: "Gebouwverzekering (collectief)",
      subtitle: verzekeringsPolisnummer ? `Polisnummer: ${verzekeringsPolisnummer}` : null,
      date: verzekeringsVervaldatum,
      dateLabel: "Vervalt",
      link: verzekeringsLink,
      warning: verzekeringsWarning,
    },
    {
      id: "bouwkundig",
      icon: FileText,
      title: "Bouwkundig rapport gebouw",
      subtitle: null,
      date: null,
      dateLabel: null,
      link: bouwkundigRapportLink,
      warning: null,
    },
    {
      id: "energie",
      icon: Zap,
      title: "Energiecertificaat (gebouw)",
      subtitle: null,
      date: energieCertificaatVervaldatum,
      dateLabel: "Vervalt",
      link: null,
      warning: energieWarning,
    },
  ];

  const warnings = [verzekeringsWarning, energieWarning].filter(w => w && (w.type === "expired" || w.type === "urgent"));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Gemeenschappelijke Documentenkluis
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Bewaar hier alle gemeenschappelijke documenten zoals verzekeringen en certificaten. Je krijgt automatisch waarschuwingen bij verloopdata.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (editing) {
                handleSave();
              } else {
                setEditing(true);
              }
            }}
            disabled={saving}
          >
            {editing ? "Opslaan" : "Bewerken"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Warnings */}
        {warnings.length > 0 && !editing && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Actie vereist:</strong> Er zijn documenten die binnenkort verlopen of al verlopen zijn.
            </AlertDescription>
          </Alert>
        )}

        {editing ? (
          <div className="space-y-6">
            {/* Verzekering */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Shield className="w-4 h-4" />
                Gebouwverzekering
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Polisnummer</Label>
                  <Input
                    value={formData.verzekeringsPolisnummer}
                    onChange={(e) => setFormData({ ...formData, verzekeringsPolisnummer: e.target.value })}
                    placeholder="bijv. POL-123456"
                  />
                </div>
                <div>
                  <Label>Vervaldatum</Label>
                  <Input
                    type="date"
                    value={formData.verzekeringsVervaldatum}
                    onChange={(e) => setFormData({ ...formData, verzekeringsVervaldatum: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Link naar document (PDF of Google Drive)</Label>
                <Input
                  value={formData.verzekeringsLink}
                  onChange={(e) => setFormData({ ...formData, verzekeringsLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Bouwkundig rapport */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="w-4 h-4" />
                Bouwkundig rapport
              </div>
              <div>
                <Label>Link naar document (PDF of Google Drive)</Label>
                <Input
                  value={formData.bouwkundigRapportLink}
                  onChange={(e) => setFormData({ ...formData, bouwkundigRapportLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Energiecertificaat */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Zap className="w-4 h-4" />
                Energiecertificaat (gebouw)
              </div>
              <div>
                <Label>Vervaldatum</Label>
                <Input
                  type="date"
                  value={formData.energieCertificaatVervaldatum}
                  onChange={(e) => setFormData({ ...formData, energieCertificaatVervaldatum: e.target.value })}
                />
              </div>
            </div>

            <Button variant="outline" onClick={() => setEditing(false)}>
              Annuleren
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => {
              const DocIcon = doc.icon;
              const hasContent = doc.subtitle || doc.date || doc.link;
              
              return (
                <div
                  key={doc.id}
                  className={`flex items-start justify-between p-4 border rounded-lg ${
                    doc.warning?.type === "expired" ? "border-destructive bg-destructive/5" :
                    doc.warning?.type === "urgent" ? "border-warning bg-warning/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      doc.warning?.type === "expired" ? "bg-destructive/10 text-destructive" :
                      doc.warning?.type === "urgent" ? "bg-warning/10 text-warning" :
                      "bg-muted"
                    }`}>
                      <DocIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      {doc.subtitle && (
                        <p className="text-sm text-muted-foreground">{doc.subtitle}</p>
                      )}
                      {doc.date && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {doc.dateLabel}: {format(new Date(doc.date), "d MMMM yyyy", { locale: nl })}
                        </p>
                      )}
                      {doc.warning && (
                        <Badge 
                          variant={doc.warning.type === "expired" ? "destructive" : "warning"}
                          className="mt-2"
                        >
                          {doc.warning.message}
                        </Badge>
                      )}
                      {!hasContent && (
                        <p className="text-sm text-muted-foreground italic">Nog niet ingevuld</p>
                      )}
                    </div>
                  </div>
                  {doc.link && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.link!, "_blank")}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Openen
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
