import { useState, useEffect } from "react";
import { Wrench, Plus, Search, Mail, Phone, Building2, MoreVertical, Pencil, Trash2, Link2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Contractor {
  id: string;
  user_id: string;
  bedrijfsnaam: string;
  type_werkzaamheden: string;
  contactpersoon: string | null;
  email: string | null;
  telefoon: string | null;
  notities: string | null;
  created_at: string;
}

interface Property {
  id: string;
  naam: string;
  locatie: string;
}

interface PropertyContractor {
  property_id: string;
  contractor_id: string;
  properties?: Property;
}

const werkzaamhedenTypes = [
  "Loodgieter",
  "Elektricien",
  "Schilder",
  "Timmerman",
  "Metselaar",
  "Dakdekker",
  "Glazenwasser",
  "Schoonmaker",
  "Tuinman",
  "Algemeen onderhoud",
  "Overig",
];

const Aannemers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyContractors, setPropertyContractors] = useState<PropertyContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [linkingContractor, setLinkingContractor] = useState<Contractor | null>(null);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    bedrijfsnaam: "",
    type_werkzaamheden: "",
    contactpersoon: "",
    email: "",
    telefoon: "",
    notities: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [contractorsRes, propertiesRes, linksRes] = await Promise.all([
        supabase.from("contractors").select("*").order("bedrijfsnaam"),
        supabase.from("properties").select("id, naam, locatie").eq("gearchiveerd", false),
        supabase.from("property_contractors").select("property_id, contractor_id"),
      ]);

      if (contractorsRes.error) throw contractorsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (linksRes.error) throw linksRes.error;

      setContractors(contractorsRes.data || []);
      setProperties(propertiesRes.data || []);
      setPropertyContractors(linksRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Fout",
        description: "Kon gegevens niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingContractor) {
        const { error } = await supabase
          .from("contractors")
          .update({
            bedrijfsnaam: formData.bedrijfsnaam,
            type_werkzaamheden: formData.type_werkzaamheden,
            contactpersoon: formData.contactpersoon || null,
            email: formData.email || null,
            telefoon: formData.telefoon || null,
            notities: formData.notities || null,
          })
          .eq("id", editingContractor.id);

        if (error) throw error;
        toast({ title: "Aannemer bijgewerkt" });
      } else {
        const { error } = await supabase.from("contractors").insert({
          user_id: user.id,
          bedrijfsnaam: formData.bedrijfsnaam,
          type_werkzaamheden: formData.type_werkzaamheden,
          contactpersoon: formData.contactpersoon || null,
          email: formData.email || null,
          telefoon: formData.telefoon || null,
          notities: formData.notities || null,
        });

        if (error) throw error;
        toast({ title: "Aannemer toegevoegd" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (contractor: Contractor) => {
    if (!confirm(`Weet je zeker dat je "${contractor.bedrijfsnaam}" wilt verwijderen?`)) return;

    try {
      const { error } = await supabase.from("contractors").delete().eq("id", contractor.id);
      if (error) throw error;
      toast({ title: "Aannemer verwijderd" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setFormData({
      bedrijfsnaam: contractor.bedrijfsnaam,
      type_werkzaamheden: contractor.type_werkzaamheden,
      contactpersoon: contractor.contactpersoon || "",
      email: contractor.email || "",
      telefoon: contractor.telefoon || "",
      notities: contractor.notities || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenLinkDialog = (contractor: Contractor) => {
    setLinkingContractor(contractor);
    const linkedIds = propertyContractors
      .filter((pc) => pc.contractor_id === contractor.id)
      .map((pc) => pc.property_id);
    setSelectedPropertyIds(linkedIds);
    setIsLinkDialogOpen(true);
  };

  const handleSaveLinks = async () => {
    if (!linkingContractor) return;

    try {
      // Remove existing links
      await supabase
        .from("property_contractors")
        .delete()
        .eq("contractor_id", linkingContractor.id);

      // Add new links
      if (selectedPropertyIds.length > 0) {
        const links = selectedPropertyIds.map((propertyId) => ({
          property_id: propertyId,
          contractor_id: linkingContractor.id,
        }));
        const { error } = await supabase.from("property_contractors").insert(links);
        if (error) throw error;
      }

      toast({ title: "Koppelingen opgeslagen" });
      setIsLinkDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingContractor(null);
    setFormData({
      bedrijfsnaam: "",
      type_werkzaamheden: "",
      contactpersoon: "",
      email: "",
      telefoon: "",
      notities: "",
    });
  };

  const getLinkedProperties = (contractorId: string) => {
    const links = propertyContractors.filter((pc) => pc.contractor_id === contractorId);
    return properties.filter((p) => links.some((l) => l.property_id === p.id));
  };

  const filteredContractors = contractors.filter(
    (c) =>
      c.bedrijfsnaam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type_werkzaamheden.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <Wrench className="w-7 h-7 text-primary" />
                Aannemers
              </h1>
              <p className="text-muted-foreground mt-1">
                {contractors.length} {contractors.length === 1 ? "aannemer" : "aannemers"} geregistreerd
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="gradient-primary text-primary-foreground gap-2"
            >
              <Plus className="w-4 h-4" />
              Nieuwe Aannemer
            </Button>
          </div>

          <div className="relative max-w-md mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op naam of type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />
              ))}
            </div>
          ) : filteredContractors.length === 0 ? (
            <div className="text-center py-16">
              <Wrench className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Geen aannemers gevonden" : "Nog geen aannemers"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "Probeer andere zoektermen" : "Voeg je eerste aannemer toe"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Eerste aannemer toevoegen
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContractors.map((contractor) => {
                const linkedProps = getLinkedProperties(contractor.id);
                return (
                  <div
                    key={contractor.id}
                    className="p-5 bg-card rounded-xl border shadow-card hover:shadow-glow hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{contractor.bedrijfsnaam}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {contractor.type_werkzaamheden}
                          </Badge>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-lg hover:bg-accent">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(contractor)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Bewerken
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenLinkDialog(contractor)}>
                            <Link2 className="w-4 h-4 mr-2" />
                            Panden koppelen
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(contractor)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {contractor.contactpersoon && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Contact: {contractor.contactpersoon}
                      </p>
                    )}

                    <div className="space-y-1 text-sm">
                      {contractor.email && (
                        <a
                          href={`mailto:${contractor.email}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                        >
                          <Mail className="w-3 h-3" />
                          {contractor.email}
                        </a>
                      )}
                      {contractor.telefoon && (
                        <a
                          href={`tel:${contractor.telefoon}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                        >
                          <Phone className="w-3 h-3" />
                          {contractor.telefoon}
                        </a>
                      )}
                    </div>

                    {linkedProps.length > 0 && (
                      <div className="mt-4 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Gekoppelde panden:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {linkedProps.map((p) => (
                            <Badge key={p.id} variant="outline" className="text-xs">
                              {p.naam}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContractor ? "Aannemer Bewerken" : "Nieuwe Aannemer"}</DialogTitle>
            <DialogDescription>
              {editingContractor ? "Wijzig de gegevens" : "Voeg een nieuwe aannemer toe"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bedrijfsnaam">Bedrijfsnaam *</Label>
              <Input
                id="bedrijfsnaam"
                value={formData.bedrijfsnaam}
                onChange={(e) => setFormData({ ...formData, bedrijfsnaam: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type werkzaamheden *</Label>
              <Select
                value={formData.type_werkzaamheden}
                onValueChange={(v) => setFormData({ ...formData, type_werkzaamheden: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer type" />
                </SelectTrigger>
                <SelectContent>
                  {werkzaamhedenTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactpersoon">Contactpersoon</Label>
              <Input
                id="contactpersoon"
                value={formData.contactpersoon}
                onChange={(e) => setFormData({ ...formData, contactpersoon: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefoon">Telefoon</Label>
                <Input
                  id="telefoon"
                  value={formData.telefoon}
                  onChange={(e) => setFormData({ ...formData, telefoon: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notities">Notities</Label>
              <Textarea
                id="notities"
                value={formData.notities}
                onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Annuleren
              </Button>
              <Button type="submit" className="flex-1 gradient-primary">
                {editingContractor ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Properties Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Panden Koppelen</DialogTitle>
            <DialogDescription>
              Selecteer de panden waar {linkingContractor?.bedrijfsnaam} aan gekoppeld moet worden
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-64 overflow-y-auto py-4">
            {properties.map((property) => (
              <label
                key={property.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={selectedPropertyIds.includes(property.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPropertyIds([...selectedPropertyIds, property.id]);
                    } else {
                      setSelectedPropertyIds(selectedPropertyIds.filter((id) => id !== property.id));
                    }
                  }}
                />
                <div>
                  <p className="font-medium">{property.naam}</p>
                  <p className="text-xs text-muted-foreground">{property.locatie}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)} className="flex-1">
              Annuleren
            </Button>
            <Button onClick={handleSaveLinks} className="flex-1 gradient-primary">
              Opslaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Aannemers;
