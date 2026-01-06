import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Home, 
  Building, 
  Wallet, 
  Target, 
  Menu,
  Bot,
  Calculator,
  PiggyBank,
  GraduationCap,
  Leaf,
  Users,
  FileText,
  Hammer,
  Building2,
  TrendingUp
} from "lucide-react";

export const BottomNav = () => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Alleen zichtbaar op mobiel (md:hidden)
  return (
    <>
      {/* Bottom Navigation - alleen op kleine schermen */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40">
        <div className="flex justify-around p-2">
          <Link to="/" className="flex flex-col items-center text-xs p-1 text-primary">
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link to="/panden" className="flex flex-col items-center text-xs p-1">
            <Building className="h-5 w-5" />
            <span>Panden</span>
          </Link>
          <Link to="/financien" className="flex flex-col items-center text-xs p-1">
            <Wallet className="h-5 w-5" />
            <span>Financiën</span>
          </Link>
          <Link to="/doelen" className="flex flex-col items-center text-xs p-1">
            <Target className="h-5 w-5" />
            <span>Doelen</span>
          </Link>
          <button 
            onClick={() => setShowMoreMenu(true)} 
            className="flex flex-col items-center text-xs p-1"
          >
            <Menu className="h-5 w-5" />
            <span>Meer</span>
          </button>
        </div>
      </div>

      {/* Uitklapbaar 'Meer' menu */}
      {showMoreMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-background/90 backdrop-blur z-50 flex justify-center items-end"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="w-full max-h-[70vh] overflow-y-auto bg-background border-t rounded-t-xl p-4 touch-pan-y"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-4 text-center">Alle onderdelen</h3>
            <div className="space-y-3">
              <Link to="/ai-analyzer" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                <Bot className="h-5 w-5 text-primary" />
                <span>AI Advertentie Analyzer</span>
              </Link>
              <Link to="/verkopen-of-behouden" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Verkopen of Behouden</span>
              </Link>
              <Link to="/analysator" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                <Calculator className="h-5 w-5 text-primary" />
                <span>Rendementsanalysator</span>
              </Link>
              <Link to="/sneeuwbal" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Sneeuwbal-effect</span>
              </Link>
              <Link to="/rente-op-rente" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                <PiggyBank className="h-5 w-5 text-primary" />
                <span>Rente op Rente</span>
              </Link>
              <Link to="/academy" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span>Academy</span>
              </Link>
              <Link to="/legacy" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                <Leaf className="h-5 w-5 text-primary" />
                <span>Legacy</span>
              </Link>
              <Link to="/huurders" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                <Users className="h-5 w-5 text-primary" />
                <span>Huurders</span>
              </Link>
              <Link to="/contracten" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
                <span>Contracten</span>
              </Link>
              <Link to="/aannemers" onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                <Hammer className="h-5 w-5 text-primary" />
                <span>Aannemers</span>
              </Link>
            </div>
            <button 
              onClick={() => setShowMoreMenu(false)} 
              className="mt-6 w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
    </>
  );
};
