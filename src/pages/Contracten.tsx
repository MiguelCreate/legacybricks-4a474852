import { useState, useEffect } from "react";
import { FileText, Plus, Search, Calendar, Bell, Building2, User, MoreVertical, Pencil, Trash2, ExternalLink, Link } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { format, differenceInDays, addMonths } from "date-fns";
import { nl } from "date-fns/locale";

type Contract = Tables<"contracts">;
type Property = Tables<"properties">;
type Tenant = Tables<"tenants">;

const contractTypeConfig = {
  langdurig: { label: "Langdurig", color: "success" as const },
  kort: { label: "Kort", color: "secondary" as const },
  airbnb: { label: "Airbnb", color: "warning" as const },
  koop: { label: "Koop", color: "destructive" as const },
};

const Contracten = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    property_id: "",
    tenant_id: "",
    type: "langdurig" as Contract["type"],
    startdatum: "",
    einddatum: "",
    herinnering_ingesteld: true,
    document_link: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [contractsRes, propertiesRes, tenantsRes] = await Promise.all([
        supabase.from("contracts").select("*").order("einddatum", { ascending: true }),
        supabase.from("properties").select("*").eq("gearchiveerd", false),
        supabase.from("tenants").select("*").eq("actief", true),
      ]);

      if (contractsRes.error) throw contractsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (tenantsRes.error) throw tenantsRes.error;

      setContracts(contractsRes.data || []);
      setProperties(propertiesRes.data || []);
      setTenants(tenantsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Fout",
        description: "Kon contracten niet laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const contractData = {
        property_id: formData.property_id,
        tenant_id: formData.tenant_id || null,
        type: formData.type,
        startdatum: formData.startdatum,
        einddatum: formData.einddatum,
        herinnering_ingesteld: formData.herinnering_ingesteld,
        document_link: formData.document_link || null,
      };

      if (editingContract) {
        const { error } = await supabase
          .from("contracts")
          .update(contractData)
          .eq("id", editingContract.id);

        if (error) throw error;

        toast({
          title: "Contract bijgewerkt",
          description: "Het contract is succesvol bijgewerkt.",
        });
      } else {
        const { error } = await supabase.from("contracts").insert(contractData);

        if (error) throw error;

        toast({
          title: "Contract toegevoegd",
          description: "Het contract is succesvol toegevoegd.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Er is iets misgegaan",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      property_id: contract.property_id,
      tenant_id: contract.tenant_id || "",
      type: contract.type,
      startdatum: contract.startdatum,
      einddatum: contract.einddatum,
      herinnering_ingesteld: contract.herinnering_ingesteld,
      document_link: (contract as any).document_link || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (contract: Contract) => {
    if (!confirm("Weet je zeker dat je dit contract wilt verwijderen?")) return;

    try {
      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", contract.id);

      if (error) throw error;

      toast({
        title: "Contract verwijderd",
        description: "Het contract is succesvol verwijderd.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingContract(null);
    setFormData({
      property_id: "",
      tenant_id: "",
      type: "langdurig",
      startdatum: "",
      einddatum: "",
      herinnering_ingesteld: true,
      document_link: "",
    });
  };

  const getPropertyName = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId)?.naam || "Onbekend";
  };

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return null;
    return tenants.find((t) => t.id === tenantId)?.naam || "Onbekend";
  };

  const getDaysUntilEnd = (einddatum: string) => {
    return differenceInDays(new Date(einddatum), new Date());
  };

  const getExpiryStatus = (einddatum: string) => {
    const days = getDaysUntilEnd(einddatum);
    if (days < 0) return { label: "Verlopen", color: "destructive" as const };
    if (days <= 30) return { label: `${days} dagen`, color: "destructive" as const };
    if (days <= 90) return { label: `${days} dagen`, color: "warning" as const };
    return { label: `${days} dagen`, color: "secondary" as const };
  };

  const generateICalLink = (contract: Contract) => {
    const property = properties.find((p) => p.id === contract.property_id);
    const endDate = new Date(contract.einddatum);
    const reminderDate = addMonths(endDate, -1);
    
    const event = {
      title: `Contract verloopt: ${property?.naam || "Pand"}`,
      start: reminderDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
      end: reminderDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
      description: `Contract voor ${property?.naam} verloopt op ${format(endDate, "d MMMM yyyy", { locale: nl })}`,
    };
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.description)}`;
  };

  const filteredContracts = contracts.filter((contract) => {
    const propertyName = getPropertyName(contract.property_id).toLowerCase();
    const tenantName = getTenantName(contract.tenant_id)?.toLowerCase() || "";
    return propertyName.includes(searchQuery.toLowerCase()) || tenantName.includes(searchQuery.toLowerCase());
  });

  const expiringContracts = filteredContracts.filter((c) => getDaysUntilEnd(c.einddatum) <= 90 && getDaysUntilEnd(c.einddatum) >= 0);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Contracten
                </h1>
                <InfoTooltip
                  title="Contractbeheer"
                  content="Beheer hier alle huur- en koopcontracten. Stel herinneringen in voor verloopdatums en exporteer naar Google Calendar."
                />
              </div>
              <p className="text-muted-foreground mt-1">
                {contracts.length} {contracts.length === 1 ? "contract" : "contracten"} totaal
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
              Nieuw Contract
            </Button>
          </div>

          {/* Warning Banner */}
          {expiringContracts.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/30">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">
                    {expiringContracts.length} {expiringContracts.length === 1 ? "contract verloopt" : "contracten verlopen"} binnen 90 dagen
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Controleer deze contracten en neem actie indien nodig.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-md mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op pand of huurder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </header>

        {/* Contracts List */}
        <div className="px-4 md:px-6 lg:px-8 pb-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-card rounded-xl border animate-pulse" />
              ))}
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "Geen contracten gevonden" : "Nog geen contracten"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "Probeer andere zoektermen" : "Voeg je eerste contract toe"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="gradient-primary text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Eerste contract toevoegen
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContracts.map((contract, index) => {
                const typeInfo = contractTypeConfig[contract.type];
                const expiryStatus = getExpiryStatus(contract.einddatum);
                const tenantName = getTenantName(contract.tenant_id);

                return (
                  <div
                    key={contract.id}
                    className="p-5 bg-card rounded-xl border shadow-card hover:shadow-glow hover:border-primary/30 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
                          <FileText className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">
                              {getPropertyName(contract.property_id)}
                            </h3>
                            <Badge variant={typeInfo.color === "success" ? "success" : typeInfo.color === "warning" ? "warning" : "secondary"}>
                              {typeInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>{getPropertyName(contract.property_id)}</span>
                            </div>
                            {tenantName && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{tenantName}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {format(new Date(contract.startdatum), "d MMM yyyy", { locale: nl })} - {format(new Date(contract.einddatum), "d MMM yyyy", { locale: nl })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={expiryStatus.color}>
                          {expiryStatus.label}
                        </Badge>
                        {(contract as any).document_link && (
                          <a
                            href={(contract as any).document_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-accent transition-colors"
                            title="Contract document openen"
                          >
                            <Link className="w-4 h-4 text-primary" />
                          </a>
                        )}
                        {contract.herinnering_ingesteld && (
                          <a
                            href={generateICalLink(contract)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-accent transition-colors"
                            title="Toevoegen aan Google Calendar"
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </a>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-strong">
                            <DropdownMenuItem onClick={() => handleEdit(contract)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Bewerken
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(contract)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="glass-strong max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingContract ? "Contract Bewerken" : "Nieuw Contract"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Pand *</Label>
                  <InfoTooltip
                    title="Pand"
                    content="Selecteer het pand waarvoor dit contract geldt."
                  />
                </div>
                <Select
                  value={formData.property_id}
                  onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer pand" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.naam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Huurder (optioneel)</Label>
                <Select
                  value={formData.tenant_id}
                  onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer huurder" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants
                      .filter((t) => t.property_id === formData.property_id)
                      .map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.naam}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Type *</Label>
                  <InfoTooltip
                    title="Contracttype"
                    content="Langdurig = >1 jaar, Kort = <1 jaar, Airbnb = toeristische verhuur, Koop = koopcontract."
                  />
                </div>
                <Select
                  value={formData.type}
                  onValueChange={(value: Contract["type"]) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="langdurig">Langdurig (&gt;1 jaar)</SelectItem>
                    <SelectItem value="kort">Kort (&lt;1 jaar)</SelectItem>
                    <SelectItem value="airbnb">Airbnb/Toeristisch</SelectItem>
                    <SelectItem value="koop">Koopcontract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Startdatum *</Label>
                  <Input
                    type="date"
                    value={formData.startdatum}
                    onChange={(e) => setFormData({ ...formData, startdatum: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Einddatum *</Label>
                  <Input
                    type="date"
                    value={formData.einddatum}
                    onChange={(e) => setFormData({ ...formData, einddatum: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Document link (optioneel)</Label>
                  <InfoTooltip
                    title="Document link"
                    content="Voeg een link toe naar het contract bestand op Google Drive, OneDrive, Dropbox of een andere online locatie."
                  />
                </div>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={formData.document_link}
                    onChange={(e) => setFormData({ ...formData, document_link: e.target.value })}
                    placeholder="https://drive.google.com/... of https://onedrive.com/..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Herinnering</p>
                    <p className="text-sm text-muted-foreground">
                      1 maand voor einddatum
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.herinnering_ingesteld}
                  onCheckedChange={(checked) => setFormData({ ...formData, herinnering_ingesteld: checked })}
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
                  disabled={!formData.property_id || !formData.startdatum || !formData.einddatum}
                >
                  {editingContract ? "Opslaan" : "Toevoegen"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Contracten;
