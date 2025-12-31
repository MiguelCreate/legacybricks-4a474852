import { Home, Building2, Users, Wallet, Settings, Target, ChevronLeft, ChevronRight, Snowflake, PiggyBank, Sunset, FileText, Heart, ClipboardCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const mainNavItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Building2, label: "Panden", path: "/panden" },
  { icon: Users, label: "Huurders", path: "/huurders" },
  { icon: FileText, label: "Contracten", path: "/contracten" },
  { icon: ClipboardCheck, label: "Inchecklijsten", path: "/inchecklijsten" },
  { icon: Wallet, label: "Financiën", path: "/financien" },
  { icon: Target, label: "Doelen", path: "/doelen" },
  { icon: Snowflake, label: "Sneeuwbal", path: "/sneeuwbal" },
  { icon: PiggyBank, label: "Vermogen", path: "/vermogen" },
  { icon: Sunset, label: "Pensioen", path: "/pensioen" },
  { icon: Heart, label: "Legacy", path: "/legacy" },
];

const secondaryNavItems = [
  { icon: Settings, label: "Instellingen", path: "/instellingen" },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">VastgoedApp</h1>
              <p className="text-xs text-muted-foreground">Portefeuillebeheer</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="p-3 space-y-1 border-t border-sidebar-border">
        {secondaryNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}

      </div>
    </aside>
  );
};
