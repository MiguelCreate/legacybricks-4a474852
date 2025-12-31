import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface PropertyBase {
  id: string;
  naam: string;
  locatie: string;
  status: string;
  maandelijkse_huur?: number | null;
  aantal_units?: number;
  gezondheidsscore?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface PropertyWithCoords extends PropertyBase {
  lat: number;
  lng: number;
}

interface PropertyMapProps {
  properties: PropertyBase[];
  onPropertyClick?: (property: PropertyBase) => void;
}

// Component to fit bounds - must be child of MapContainer
const MapController = ({ properties }: { properties: PropertyWithCoords[] }) => {
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

// Save coordinates to database
const saveCoordinates = async (propertyId: string, lat: number, lng: number) => {
  try {
    await supabase
      .from("properties")
      .update({ latitude: lat, longitude: lng } as any)
      .eq("id", propertyId);
  } catch (error) {
    console.error("Error saving coordinates:", error);
  }
};

const statusLabels: Record<string, string> = {
  aankoop: "Aankoop",
  renovatie: "Renovatie",
  verhuur: "Verhuurd",
  te_koop: "Te Koop",
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
        // First check if we have stored coordinates
        if (property.latitude && property.longitude) {
          const coords = { lat: Number(property.latitude), lng: Number(property.longitude) };
          geocodedRef.current.set(property.id, coords);
          results.push({ ...property, ...coords });
          continue;
        }

        // Check cache
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
          // Save to database for future use
          saveCoordinates(property.id, coords.lat, coords.lng);
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
      setPropertiesWithCoords([]);
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

  if (propertiesWithCoords.length === 0 && !loading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30 rounded-xl">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Geen locaties gevonden</p>
        </div>
      </div>
    );
  }

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
        
        <MapController properties={propertiesWithCoords} />

        {propertiesWithCoords.map((property) => (
          <Marker key={property.id} position={[property.lat, property.lng]} icon={customIcon}>
            <Popup>
              <div style={{ minWidth: "200px", padding: "4px" }}>
                <h4 style={{ fontWeight: 600, marginBottom: "4px", fontSize: "14px" }}>
                  {property.naam}
                </h4>
                <p style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>
                  📍 {property.locatie}
                </p>
                <p style={{ fontSize: "10px", color: "#999", marginBottom: "6px" }}>
                  {property.lat.toFixed(5)}, {property.lng.toFixed(5)}
                </p>
                <p style={{ fontSize: "11px", marginBottom: "4px" }}>
                  <span style={{ 
                    background: "#eee", 
                    padding: "2px 6px", 
                    borderRadius: "4px",
                    fontSize: "10px"
                  }}>
                    {statusLabels[property.status] || property.status}
                  </span>
                  {property.aantal_units && property.aantal_units > 1 && (
                    <span style={{ 
                      marginLeft: "4px",
                      background: "#e3f2fd", 
                      padding: "2px 6px", 
                      borderRadius: "4px",
                      fontSize: "10px"
                    }}>
                      {property.aantal_units} units
                    </span>
                  )}
                </p>
                {property.maandelijkse_huur && property.maandelijkse_huur > 0 && (
                  <p style={{ fontSize: "12px", color: "#22c55e", fontWeight: 500 }}>
                    €{Number(property.maandelijkse_huur).toLocaleString()}/mnd
                  </p>
                )}
                {onPropertyClick && (
                  <button
                    onClick={() => onPropertyClick(property)}
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      padding: "6px 12px",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Bekijk pand
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
