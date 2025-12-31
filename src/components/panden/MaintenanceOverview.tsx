import { useState, useEffect } from "react";
import { Wrench, Calendar, AlertTriangle, AlertCircle, CheckCircle, Building2, DoorOpen, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

interface PropertyFeature {
  id: string;
  property_id: string;
  naam: string;
  merk_type: string | null;
  onderhoudsbehoefte: string;
  onderhoudsstatus: string | null;
  gepland_onderhoudsjaar: number | null;
  property?: { naam: string };
}

interface RoomFeature {
  id: string;
  room_id: string;
  naam: string;
  merk_type: string | null;
  onderhoudsbehoefte: string;
  onderhoudsstatus: string | null;
  gepland_onderhoudsjaar: number | null;
  room?: { naam: string; property?: { naam: string } };
}

interface MaintenanceItem {
  id: string;
  naam: string;
  merk_type: string | null;
  onderhoudsbehoefte: string;
  gepland_onderhoudsjaar: number | null;
  locatie: string;
  type: "pand" | "kamer";
}

const onderhoudLabels: Record<string, { label: string; color: string; icon: typeof CheckCircle; badge: "default" | "secondary" | "destructive" | "outline" }> = {
  geen: { label: "Geen", color: "text-success", icon: CheckCircle, badge: "secondary" },
  licht: { label: "Licht", color: "text-warning", icon: AlertTriangle, badge: "outline" },
  groot: { label: "Groot", color: "text-destructive", icon: AlertCircle, badge: "destructive" },
};

export const MaintenanceOverview = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [behoefteFilter, setBehoefteFilter] = useState<string>("all");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  useEffect(() => {
    if (user) {
      fetchMaintenanceItems();
    }
  }, [user]);

  const fetchMaintenanceItems = async () => {
    try {
      // Fetch property features with property info
      const { data: propFeatures, error: propError } = await supabase
        .from("property_features")
        .select(`
          id, naam, merk_type, onderhoudsbehoefte, gepland_onderhoudsjaar,
          properties!inner(naam, user_id)
        `)
        .neq("onderhoudsbehoefte", "geen");

      if (propError) throw propError;

      // Fetch room features with room and property info
      const { data: roomFeatures, error: roomError } = await supabase
        .from("room_features")
        .select(`
          id, naam, merk_type, onderhoudsbehoefte, gepland_onderhoudsjaar,
          rooms!inner(naam, properties!inner(naam, user_id))
        `)
        .neq("onderhoudsbehoefte", "geen");

      if (roomError) throw roomError;

      const maintenanceItems: MaintenanceItem[] = [];

      // Process property features
      (propFeatures as any[] || []).forEach((f) => {
        maintenanceItems.push({
          id: f.id,
          naam: f.naam,
          merk_type: f.merk_type,
          onderhoudsbehoefte: f.onderhoudsbehoefte,
          gepland_onderhoudsjaar: f.gepland_onderhoudsjaar,
          locatie: f.properties?.naam || "Onbekend",
          type: "pand",
        });
      });

      // Process room features
      (roomFeatures as any[] || []).forEach((f) => {
        maintenanceItems.push({
          id: f.id,
          naam: f.naam,
          merk_type: f.merk_type,
          onderhoudsbehoefte: f.onderhoudsbehoefte,
          gepland_onderhoudsjaar: f.gepland_onderhoudsjaar,
          locatie: `${f.rooms?.properties?.naam || "Onbekend"} - ${f.rooms?.naam || "Kamer"}`,
          type: "kamer",
        });
      });

      // Sort by year, then by behoefte (groot first)
      maintenanceItems.sort((a, b) => {
        const yearA = a.gepland_onderhoudsjaar || 9999;
        const yearB = b.gepland_onderhoudsjaar || 9999;
        if (yearA !== yearB) return yearA - yearB;
        
        const behoefteOrder = { groot: 0, licht: 1, geen: 2 };
        return (behoefteOrder[a.onderhoudsbehoefte as keyof typeof behoefteOrder] || 2) - 
               (behoefteOrder[b.onderhoudsbehoefte as keyof typeof behoefteOrder] || 2);
      });

      setItems(maintenanceItems);
    } catch (error) {
      console.error("Error fetching maintenance items:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesYear = yearFilter === "all" || item.gepland_onderhoudsjaar?.toString() === yearFilter;
    const matchesBehoefte = behoefteFilter === "all" || item.onderhoudsbehoefte === behoefteFilter;
    return matchesYear && matchesBehoefte;
  });

  const grootCount = items.filter(i => i.onderhoudsbehoefte === "groot").length;
  const lichtCount = items.filter(i => i.onderhoudsbehoefte === "licht").length;
  const thisYearCount = items.filter(i => i.gepland_onderhoudsjaar === currentYear).length;

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Onderhoud Overzicht
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {grootCount} groot
            </Badge>
            <Badge variant="outline" className="gap-1 text-warning border-warning">
              <AlertTriangle className="w-3 h-3" />
              {lichtCount} licht
            </Badge>
            {thisYearCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="w-3 h-3" />
                {thisYearCount} dit jaar
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Jaar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle jaren</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={behoefteFilter} onValueChange={setBehoefteFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Behoefte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle types</SelectItem>
              <SelectItem value="groot">Groot onderhoud</SelectItem>
              <SelectItem value="licht">Licht onderhoud</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Geen onderhoud gepland</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredItems.map((item) => {
              const info = onderhoudLabels[item.onderhoudsbehoefte] || onderhoudLabels.geen;
              const Icon = info.icon;
              const isThisYear = item.gepland_onderhoudsjaar === currentYear;
              
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isThisYear ? "border-warning/50 bg-warning/5" : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.onderhoudsbehoefte === "groot" ? "bg-destructive/10" : "bg-warning/10"
                    }`}>
                      {item.type === "pand" ? (
                        <Building2 className={`w-4 h-4 ${info.color}`} />
                      ) : (
                        <DoorOpen className={`w-4 h-4 ${info.color}`} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{item.naam}</p>
                        {item.merk_type && (
                          <span className="text-xs text-muted-foreground">({item.merk_type})</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.locatie}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={info.badge} className="gap-1">
                      <Icon className="w-3 h-3" />
                      {info.label}
                    </Badge>
                    {item.gepland_onderhoudsjaar && (
                      <Badge variant="secondary" className="gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.gepland_onderhoudsjaar}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
