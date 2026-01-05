import { useState, useEffect } from "react";
import { Wrench, Plus, Search, Mail, Phone, Building2, MoreVertical, Pencil, Trash2, Link2, Users, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

interface Tenant {
  id: string;
  naam: string;
  email: string | null;
  telefoon: string | null;
  property_id: string;
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
  const navigate = useNavigate();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
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
    heeft_contract: false,
    contract_type: "" as string,
    contract_document_link: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [contractorsRes, propertiesRes, linksRes, tenantsRes] = await Promise.all([
        supabase.from("contractors").select("*").order("bedrijfsnaam"),
        supabase.from("properties").select("id, naam, locatie").eq("gearchiveerd", false),
        supabase.from("property_contractors").select("property_id, contractor_id"),
        supabase.from("tenants").select("id, naam, email, telefoon, property_id").eq("actief", true),
      ]);

      if (contractorsRes.error) throw contractorsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (linksRes.error) throw linksRes.error;
      if (tenantsRes.error) throw tenantsRes.error;

      // Store properties first to filter other data
      const userProperties = propertiesRes.data || [];
      setProperties(userProperties);
      
      // Filter tenants and property_contractors to only include those from user's properties
      const userPropertyIds = userProperties.map(p => p.id);
      const userTenants = (tenantsRes.data || []).filter((t: Tenant) => userPropertyIds.includes(t.property_id));
      const userPropertyContractors = (linksRes.data || []).filter((pc: PropertyContractor) => userPropertyIds.includes(pc.property_id));
      
      setContractors(contractorsRes.data || []);
      setPropertyContractors(userPropertyContractors);
      setTenants(userTenants);
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
            heeft_contract: formData.heeft_contract,
            contract_type: formData.contract_type || null,
            contract_document_link: formData.contract_document_link || null,
          } as any)
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
          heeft_contract: formData.heeft_contract,
          contract_type: formData.contract_type || null,
          contract_document_link: formData.contract_document_link || null,
        } as any);

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
      heeft_contract: (contractor as any).heeft_contract || false,
      contract_type: (contractor as any).contract_type || "",
      contract_document_link: (contractor as any).contract_document_link || "",
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
      heeft_contract: false,
      contract_type: "",
      contract_document_link: "",
    });
  };

  const getLinkedProperties = (contractorId: string) => {
    const links = propertyContractors.filter((pc) => pc.contractor_id === contractorId);
    return properties.filter((p) => links.some((l) => l.property_id === p.id));
  };

  const getTenantsForProperties = (propertyIds: string[]) => {
    return tenants.filter((t) => propertyIds.includes(t.property_id));
  };

  const handleEmailTenantWithContractor = (tenant: Tenant, contractor: Contractor) => {
    if (!tenant.email) {
      toast({
        title: "Geen e-mailadres",
        description: "Deze huurder heeft geen e-mailadres opgegeven.",
        variant: "destructive",
      });
      return;
    }
    const property = properties.find(p => p.id === tenant.property_id);
    const subject = encodeURIComponent(`${contractor.type_werkzaamheden} - ${property?.naam || 'Uw woning'}`);
    const body = encodeURIComponent(
      `Beste ${tenant.naam},\n\nVoor ${contractor.type_werkzaamheden.toLowerCase()} werkzaamheden kunt u contact opnemen met:\n\n` +
      `${contractor.bedrijfsnaam}\n` +
      (contractor.contactpersoon ? `Contactpersoon: ${contractor.contactpersoon}\n` : '') +
      (contractor.email ? `E-mail: ${contractor.email}\n` : '') +
      (contractor.telefoon ? `Telefoon: ${contractor.telefoon}\n` : '') +
      `\nMet vriendelijke groet`
    );
    window.open(`mailto:${tenant.email}?subject=${subject}&body=${body}`, '_blank');
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
                      <div className="mt-4 pt-3 border-t space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            Gekoppelde panden:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {linkedProps.map((p) => (
                              <Badge 
                                key={p.id} 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-accent"
                                onClick={() => navigate('/panden')}
                              >
                                {p.naam}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* Huurders voor snelle communicatie */}
                        {getTenantsForProperties(linkedProps.map(p => p.id)).length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Huurders contacteren:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {getTenantsForProperties(linkedProps.map(p => p.id)).slice(0, 3).map((t) => (
                                <Button
                                  key={t.id}
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs gap-1"
                                  onClick={() => handleEmailTenantWithContractor(t, contractor)}
                                  disabled={!t.email}
                                >
                                  <Send className="w-3 h-3" />
                                  {t.naam}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
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
                rows={2}
              />
            </div>

            {/* Contract velden */}
            <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="heeft_contract"
                  checked={formData.heeft_contract}
                  onCheckedChange={(checked) => setFormData({ ...formData, heeft_contract: !!checked })}
                />
                <Label htmlFor="heeft_contract" className="font-medium">Heeft contract</Label>
              </div>

              {formData.heeft_contract && (
                <>
                  <div className="space-y-2">
                    <Label>Contract type</Label>
                    <Select
                      value={formData.contract_type}
                      onValueChange={(v) => setFormData({ ...formData, contract_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onderhoud">Onderhoudscontract</SelectItem>
                        <SelectItem value="all_in">All-in contract</SelectItem>
                        <SelectItem value="ad_hoc">Ad-hoc / Op afroep</SelectItem>
                        <SelectItem value="project">Projectcontract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contract_document_link">Contract document link</Label>
                    <Input
                      id="contract_document_link"
                      value={formData.contract_document_link}
                      onChange={(e) => setFormData({ ...formData, contract_document_link: e.target.value })}
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </>
              )}
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
