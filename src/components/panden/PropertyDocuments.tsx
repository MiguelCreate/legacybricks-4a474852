import { useState } from "react";
import { FileText, ExternalLink, Pencil, Save, X, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PropertyDocumentsProps {
  propertyId: string;
  propertyName: string;
  googleDriveLink: string | null;
}

export const PropertyDocuments = ({ propertyId, propertyName, googleDriveLink }: PropertyDocumentsProps) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState(googleDriveLink || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({ google_drive_link: link || null })
        .eq("id", propertyId);

      if (error) throw error;

      toast({
        title: "Opgeslagen",
        description: "Documentenlink is bijgewerkt",
      });
      setEditing(false);
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

  const handleCancel = () => {
    setLink(googleDriveLink || "");
    setEditing(false);
  };

  const documentTypes = [
    { name: "Cadernetta Predial", description: "Eigendomsbewijs en kadastrale gegevens" },
    { name: "Escritura", description: "Notariële akte / Koopakte" },
    { name: "Certidão Permanente", description: "Actueel uittreksel handelsregister" },
    { name: "Licença de Utilização", description: "Gebruiksvergunning" },
    { name: "Certificado Energético", description: "Energiecertificaat" },
    { name: "Contrato de Arrendamento", description: "Huurcontracten" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="w-5 h-5 text-primary" />
              Documentenkluis
            </CardTitle>
            <CardDescription>
              Koppel je Google Drive of OneDrive map met alle documenten van dit pand
            </CardDescription>
          </div>
          {!editing && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="drive_link">Google Drive / OneDrive Link</Label>
              <Input
                id="drive_link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
              />
              <p className="text-xs text-muted-foreground">
                Plak hier de link naar je Google Drive of OneDrive map met alle documenten van {propertyName}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Opslaan..." : "Opslaan"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" />
                Annuleren
              </Button>
            </div>
          </div>
        ) : link ? (
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-3"
              onClick={() => window.open(link, "_blank")}
            >
              <FolderOpen className="w-5 h-5 text-primary" />
              <div className="text-left flex-1">
                <p className="font-medium">Open Documentenmap</p>
                <p className="text-xs text-muted-foreground truncate max-w-[300px]">{link}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </Button>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Aanbevolen documenten om op te slaan:
              </p>
              <div className="grid gap-2">
                {documentTypes.map((doc) => (
                  <div key={doc.name} className="flex items-start gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium">{doc.name}</span>
                      <span className="text-muted-foreground"> - {doc.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border rounded-lg border-dashed">
            <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Nog geen documentenmap gekoppeld
            </p>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4 mr-1" />
              Link toevoegen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
