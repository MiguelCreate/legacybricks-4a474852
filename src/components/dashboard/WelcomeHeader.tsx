import { Bell, Search, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export const WelcomeHeader = () => {
  const [isDark, setIsDark] = useState(false);
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

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="flex flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {getGreeting()}, Investeerder 👋
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
      <div className="relative max-w-md animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Zoek panden, huurders, documenten..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>
    </header>
  );
};
