import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Building2, MapPin, Euro, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Property {
  id: string;
  naam: string;
  locatie: string;
  status: string;
  maandelijkse_huur?: number;
  aantal_units?: number;
  gezondheidsscore?: number;
}

interface PropertyWithCoords extends Property {
  lat: number;
  lng: number;
}

interface PropertyMapProps {
  properties: Property[];
  onPropertyClick?: (propertyId: string) => void;
}

// Component to fit bounds
const FitBounds = ({ properties }: { properties: PropertyWithCoords[] }) => {
  const map = useMap();

  useEffect(() => {
    if (properties.length > 0) {
      const bounds = L.latLngBounds(properties.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [properties, map]);

  return null;
};

// Simple geocoding using OpenStreetMap Nominatim (no API key needed)
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          "Accept-Language": "pt,en",
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
};

export const PropertyMap = ({ properties, onPropertyClick }: PropertyMapProps) => {
  const [propertiesWithCoords, setPropertiesWithCoords] = useState<PropertyWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const geocodedRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  useEffect(() => {
    const geocodeProperties = async () => {
      setLoading(true);
      const results: PropertyWithCoords[] = [];

      for (const property of properties) {
        // Check cache first
        if (geocodedRef.current.has(property.id)) {
          const coords = geocodedRef.current.get(property.id)!;
          results.push({ ...property, ...coords });
          continue;
        }

        // Geocode with rate limiting
        const coords = await geocodeAddress(property.locatie);
        if (coords) {
          geocodedRef.current.set(property.id, coords);
          results.push({ ...property, ...coords });
        }

        // Rate limit to avoid Nominatim limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setPropertiesWithCoords(results);
      setLoading(false);
    };

    if (properties.length > 0) {
      geocodeProperties();
    } else {
      setLoading(false);
    }
  }, [properties]);

  // Default center (Portugal)
  const defaultCenter: [number, number] = [39.5, -8.0];
  const defaultZoom = 6;

  if (loading && propertiesWithCoords.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30 rounded-xl">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-muted-foreground">Locaties laden...</p>
        </div>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    aankoop: { label: "Aankoop", color: "secondary" },
    renovatie: { label: "Renovatie", color: "warning" },
    verhuur: { label: "Verhuurd", color: "success" },
    te_koop: { label: "Te Koop", color: "destructive" },
  };

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border shadow-card">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {propertiesWithCoords.length > 0 && <FitBounds properties={propertiesWithCoords} />}

        {propertiesWithCoords.map((property) => (
          <Marker key={property.id} position={[property.lat, property.lng]} icon={customIcon}>
            <Popup>
              <div className="min-w-[200px] p-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{property.naam}</span>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {property.locatie}
                </p>

                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={statusConfig[property.status]?.color as any || "secondary"}>
                    {statusConfig[property.status]?.label || property.status}
                  </Badge>
                  {property.aantal_units && property.aantal_units > 1 && (
                    <Badge variant="outline" className="text-xs">
                      {property.aantal_units} units
                    </Badge>
                  )}
                </div>

                {property.maandelijkse_huur && property.maandelijkse_huur > 0 && (
                  <p className="text-sm flex items-center gap-1 text-success mb-2">
                    <Euro className="w-3 h-3" />
                    €{Number(property.maandelijkse_huur).toLocaleString()}/mnd
                  </p>
                )}

                {onPropertyClick && (
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => onPropertyClick(property.id)}
                  >
                    Bekijk pand
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
