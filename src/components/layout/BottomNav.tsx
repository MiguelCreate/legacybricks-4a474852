import { Home, Building2, Wallet, FileText, MoreHorizontal, Users, Target, Heart, Settings, ClipboardCheck, Calculator, Wrench, Building } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Building2, label: "Panden", path: "/panden" },
  { icon: Wallet, label: "Financiën", path: "/financien" },
  { icon: FileText, label: "Contracten", path: "/contracten" },
];

const moreItems = [
  { icon: Users, label: "Huurders", path: "/huurders" },
  { icon: Wrench, label: "Aannemers", path: "/aannemers" },
  { icon: Building, label: "VvE Overzicht", path: "/vve" },
  { icon: Calculator, label: "Analysator", path: "/analysator" },
  { icon: Target, label: "Doelen", path: "/doelen" },
  { icon: Heart, label: "Legacy", path: "/legacy" },
  { icon: Settings, label: "Instellingen", path: "/instellingen" },
  { icon: ClipboardCheck, label: "Inchecklijsten", path: "/inchecklijsten" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">Meer</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-strong mb-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)}>
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
