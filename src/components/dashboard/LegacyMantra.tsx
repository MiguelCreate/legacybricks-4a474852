import { Heart, Sparkles } from "lucide-react";

export const LegacyMantra = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-accent to-primary/5 rounded-xl border border-primary/10 p-6 animate-fade-in">
      <Sparkles className="absolute top-3 right-3 w-5 h-5 text-primary/30 animate-pulse-soft" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Heart className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">Erfgoed Mantra</span>
      </div>

      <blockquote className="text-lg font-medium text-foreground italic">
        "Elke steen die ik leg, bouwt aan de toekomst van mijn familie."
      </blockquote>
      
      <p className="text-sm text-muted-foreground mt-3">
        — Jouw persoonlijke herinnering aan waarom je dit doet
      </p>
    </div>
  );
};
