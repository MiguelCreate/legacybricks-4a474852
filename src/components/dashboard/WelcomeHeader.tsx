import { Bell, Search, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const WelcomeHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  const fetchUserName = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("naam")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      if (data?.naam) {
        // Get first name only
        const firstName = data.naam.split(" ")[0];
        setUserName(firstName);
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to panden with search query
      navigate(`/panden?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <header className="flex flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {getGreeting()}, {userName || "Investeerder"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Hier is je portefeuille-overzicht voor vandaag
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-warning" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          <button className="relative p-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive animate-pulse-soft" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative max-w-md animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Zoek panden, huurders, documenten..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </form>
    </header>
  );
};
