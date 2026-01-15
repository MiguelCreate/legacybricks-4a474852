import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Heart, Plus, ExternalLink, Trash2, Edit2, MapPin, Euro, 
  Home, Eye, FileText, CheckCircle2, X, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SavedListing {
  id: string;
  url: string | null;
  naam: string;
  locatie: string | null;
  vraagprijs: number | null;
  oppervlakte_m2: number | null;
  kamers: number | null;
  status: string;
  notities: string | null;
  bron: string | null;
  foto_url: string | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'nieuw', label: 'Nieuw', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
  { value: 'bezocht', label: 'Bezocht', color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' },
  { value: 'bod_gedaan', label: 'Bod gedaan', color: 'bg-purple-500/20 text-purple-700 border-purple-500/30' },
  { value: 'gekocht', label: 'Gekocht', color: 'bg-green-500/20 text-green-700 border-green-500/30' },
  { value: 'afgewezen', label: 'Afgewezen', color: 'bg-red-500/20 text-red-700 border-red-500/30' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

export const FavorietenTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [listings, setListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<SavedListing | null>(null);
  
  const [formData, setFormData] = useState({
    url: '',
    naam: '',
    locatie: '',
    vraagprijs: '',
    oppervlakte_m2: '',
    kamers: '',
    bron: '',
    notities: '',
  });

  useEffect(() => {
    if (user) fetchListings();
  }, [user]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_listings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.naam.trim()) {
      toast({ title: 'Fout', description: 'Naam is verplicht', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        user_id: user.id,
        url: formData.url || null,
        naam: formData.naam,
        locatie: formData.locatie || null,
        vraagprijs: formData.vraagprijs ? Number(formData.vraagprijs) : null,
        oppervlakte_m2: formData.oppervlakte_m2 ? Number(formData.oppervlakte_m2) : null,
        kamers: formData.kamers ? Number(formData.kamers) : null,
        bron: formData.bron || null,
        notities: formData.notities || null,
      };

      if (editingListing) {
        const { error } = await supabase
          .from('saved_listings')
          .update(payload)
          .eq('id', editingListing.id);
        if (error) throw error;
        toast({ title: 'Favoriet bijgewerkt' });
      } else {
        const { error } = await supabase
          .from('saved_listings')
          .insert(payload);
        if (error) throw error;
        toast({ title: 'Favoriet toegevoegd' });
      }

      resetForm();
      fetchListings();
    } catch (error: any) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze favoriet wilt verwijderen?')) return;
    
    try {
      const { error } = await supabase.from('saved_listings').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Favoriet verwijderd' });
      fetchListings();
    } catch (error: any) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('saved_listings')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      fetchListings();
    } catch (error: any) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    }
  };

  const handleAnalyze = (listing: SavedListing) => {
    if (listing.url) {
      navigate(`/ai-analyzer?url=${encodeURIComponent(listing.url)}`);
    } else {
      navigate('/ai-analyzer');
    }
  };

  const resetForm = () => {
    setFormData({
      url: '',
      naam: '',
      locatie: '',
      vraagprijs: '',
      oppervlakte_m2: '',
      kamers: '',
      bron: '',
      notities: '',
    });
    setEditingListing(null);
    setIsAddDialogOpen(false);
  };

  const openEditDialog = (listing: SavedListing) => {
    setEditingListing(listing);
    setFormData({
      url: listing.url || '',
      naam: listing.naam,
      locatie: listing.locatie || '',
      vraagprijs: listing.vraagprijs?.toString() || '',
      oppervlakte_m2: listing.oppervlakte_m2?.toString() || '',
      kamers: listing.kamers?.toString() || '',
      bron: listing.bron || '',
      notities: listing.notities || '',
    });
    setIsAddDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return <Badge variant="outline" className={opt.color}>{opt.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-card rounded-xl border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Favorieten
          </h2>
          <p className="text-sm text-muted-foreground">
            {listings.length} opgeslagen woningen
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsAddDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingListing ? 'Favoriet bewerken' : 'Nieuwe favoriet'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Naam *</Label>
                  <Input
                    value={formData.naam}
                    onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                    placeholder="Appartement Amsterdam"
                  />
                </div>
                <div className="col-span-2">
                  <Label>URL (optioneel)</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://idealista.pt/..."
                  />
                </div>
                <div>
                  <Label>Locatie</Label>
                  <Input
                    value={formData.locatie}
                    onChange={(e) => setFormData({ ...formData, locatie: e.target.value })}
                    placeholder="Amsterdam, NL"
                  />
                </div>
                <div>
                  <Label>Bron</Label>
                  <Input
                    value={formData.bron}
                    onChange={(e) => setFormData({ ...formData, bron: e.target.value })}
                    placeholder="Idealista, Funda..."
                  />
                </div>
                <div>
                  <Label>Vraagprijs (€)</Label>
                  <Input
                    type="number"
                    value={formData.vraagprijs}
                    onChange={(e) => setFormData({ ...formData, vraagprijs: e.target.value })}
                    placeholder="250000"
                  />
                </div>
                <div>
                  <Label>Oppervlakte (m²)</Label>
                  <Input
                    type="number"
                    value={formData.oppervlakte_m2}
                    onChange={(e) => setFormData({ ...formData, oppervlakte_m2: e.target.value })}
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label>Kamers</Label>
                  <Input
                    type="number"
                    value={formData.kamers}
                    onChange={(e) => setFormData({ ...formData, kamers: e.target.value })}
                    placeholder="3"
                  />
                </div>
              </div>
              <div>
                <Label>Notities</Label>
                <Textarea
                  value={formData.notities}
                  onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
                  placeholder="Mijn opmerkingen over deze woning..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Annuleren</Button>
                <Button onClick={handleSubmit}>{editingListing ? 'Opslaan' : 'Toevoegen'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {listings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Nog geen favorieten</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Bewaar interessante woningen van Idealista, Funda of andere sites
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Eerste favoriet toevoegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {listings.map(listing => (
            <Card key={listing.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Home className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{listing.naam}</h3>
                          {getStatusBadge(listing.status)}
                          {listing.bron && (
                            <Badge variant="secondary" className="text-xs">{listing.bron}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                          {listing.locatie && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {listing.locatie}
                            </span>
                          )}
                          {listing.vraagprijs && (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Euro className="w-3 h-3" />
                              {formatCurrency(listing.vraagprijs)}
                            </span>
                          )}
                          {listing.oppervlakte_m2 && (
                            <span>{listing.oppervlakte_m2} m²</span>
                          )}
                          {listing.kamers && (
                            <span>{listing.kamers} kamers</span>
                          )}
                        </div>
                        {listing.notities && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{listing.notities}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={listing.status} onValueChange={(v) => handleStatusChange(listing.id, v)}>
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleAnalyze(listing)}
                      title="Analyseren met AI"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    
                    {listing.url && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(listing.url!, '_blank')}
                        title="Open in nieuw tabblad"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(listing)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(listing.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
