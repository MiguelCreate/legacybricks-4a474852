import { 
  Home, Building2, Wallet, MoreHorizontal, Users, Target, Heart, Settings, 
  ClipboardCheck, Calculator, Wrench, Building, FileText, Snowflake, PiggyBank, Sunset, TrendingUp
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Building2, label: "Panden", path: "/panden" },
  { icon: Wallet, label: "Financiën", path: "/financien" },
];

const moreGroups = [
  {
    label: "Vastgoed",
    items: [
      { icon: Users, label: "Huurders", path: "/huurders" },
      { icon: Wrench, label: "Aannemers", path: "/aannemers" },
      { icon: FileText, label: "Contracten", path: "/contracten" },
      { icon: ClipboardCheck, label: "Inchecklijsten", path: "/inchecklijsten" },
      { icon: Building, label: "VvE Overzicht", path: "/vve" },
    ],
  },
  {
    label: "Analyse",
    items: [
      { icon: Calculator, label: "Analysator", path: "/analysator" },
      { icon: Building2, label: "Multi-Unit", path: "/multi-unit" },
    ],
  },
  {
    label: "Vermogensopbouw",
    items: [
      { icon: Target, label: "Doelen", path: "/doelen" },
      { icon: Snowflake, label: "Sneeuwbal", path: "/sneeuwbal" },
      { icon: PiggyBank, label: "Vermogen", path: "/vermogen" },
      { icon: Sunset, label: "Pensioen", path: "/pensioen" },
      { icon: Heart, label: "Legacy", path: "/legacy" },
    ],
  },
  {
    label: "Overig",
    items: [
      { icon: Settings, label: "Instellingen", path: "/instellingen" },
    ],
  },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t md:hidden">
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
          <DropdownMenuContent 
            align="end" 
            className="bg-popover border shadow-lg mb-2 w-56 max-h-[70vh] overflow-y-auto"
            sideOffset={8}
          >
            {moreGroups.map((group, groupIndex) => (
              <div key={group.label}>
                {groupIndex > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </DropdownMenuLabel>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <DropdownMenuItem 
                      key={item.path} 
                      onClick={() => navigate(item.path)}
                      className={isActive ? "bg-accent text-accent-foreground" : ""}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
