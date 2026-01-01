import { Bell, Search, Sun, Moon, Building2, Users, FileText, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SearchResult {
  id: string;
  type: "property" | "tenant" | "contract";
  title: string;
  subtitle: string;
}

export const WelcomeHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const currentHour = new Date().getHours();
  
  const getGreeting = () => {
    if (currentHour < 12) return "Goedemorgen";
    if (currentHour < 18) return "Goedemiddag";
    return "Goedenavond";
  };

  useEffect(() => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserName();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const fetchUserName = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("naam")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (data?.naam) {
        const firstName = data.naam.split(" ")[0];
        setUserName(firstName);
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results: SearchResult[] = [];
      const lowerQuery = query.toLowerCase();

      // Search properties
      const { data: properties } = await supabase
        .from("properties")
        .select("id, naam, locatie")
        .eq("gearchiveerd", false)
        .or(`naam.ilike.%${query}%,locatie.ilike.%${query}%`)
        .limit(5);

      if (properties) {
        properties.forEach((p) => {
          results.push({
            id: p.id,
            type: "property",
            title: p.naam,
            subtitle: p.locatie,
          });
        });
      }

      // Search tenants
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, naam, email, property_id")
        .eq("actief", true)
        .or(`naam.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      if (tenants) {
        tenants.forEach((t) => {
          results.push({
            id: t.id,
            type: "tenant",
            title: t.naam,
            subtitle: t.email || "Geen email",
          });
        });
      }

      // Search contracts - we need to join with properties for context
      const { data: contracts } = await supabase
        .from("contracts")
        .select("id, type, startdatum, einddatum, property_id")
        .limit(10);

      if (contracts) {
        // Get property names for contracts
        const propertyIds = [...new Set(contracts.map(c => c.property_id))];
        const { data: contractProperties } = await supabase
          .from("properties")
          .select("id, naam")
          .in("id", propertyIds);

        const propertyMap = new Map(contractProperties?.map(p => [p.id, p.naam]) || []);

        contracts.forEach((c) => {
          const propertyName = propertyMap.get(c.property_id) || "";
          if (propertyName.toLowerCase().includes(lowerQuery) || c.type.toLowerCase().includes(lowerQuery)) {
            results.push({
              id: c.id,
              type: "contract",
              title: `${c.type.charAt(0).toUpperCase() + c.type.slice(1)} contract`,
              subtitle: propertyName,
            });
          }
        });
      }

      setSearchResults(results.slice(0, 10));
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery("");
    
    switch (result.type) {
      case "property":
        navigate(`/panden/${result.id}`);
        break;
      case "tenant":
        navigate(`/huurders`);
        break;
      case "contract":
        navigate(`/contracten`);
        break;
    }
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "property":
        return <Building2 className="w-4 h-4 text-primary" />;
      case "tenant":
        return <Users className="w-4 h-4 text-success" />;
      case "contract":
        return <FileText className="w-4 h-4 text-warning" />;
    }
  };

  const getResultTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "property":
        return "Pand";
      case "tenant":
        return "Huurder";
      case "contract":
        return "Contract";
    }
  };

  return (
    <header className="flex flex-col gap-3 sm:gap-4 p-4 md:p-6 lg:p-8">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="animate-fade-in min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
            {getGreeting()}, {userName || "Investeerder"} 👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Hier is je portefeuille-overzicht
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button 
            onClick={toggleDarkMode}
            className="p-2 sm:p-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            )}
          </button>
          <button className="relative p-2 sm:p-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-colors">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full bg-destructive animate-pulse-soft" />
          </button>
        </div>
      </div>

      {/* Search Bar with Dropdown */}
      <div ref={searchRef} className="relative max-w-md animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          placeholder="Zoek panden, huurders, contracten..."
          className="w-full pl-10 pr-10 py-2.5 bg-card border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}

        {/* Search Results Dropdown */}
        {showResults && (searchResults.length > 0 || isSearching) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Zoeken...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left border-b border-border last:border-b-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-accent text-muted-foreground">
                      {getResultTypeLabel(result.type)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* No results message */}
        {showResults && !isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
            <div className="p-4 text-center text-sm text-muted-foreground">
              Geen resultaten gevonden voor "{searchQuery}"
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
