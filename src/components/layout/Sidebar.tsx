import { 
  Home, Building2, Users, Wallet, Settings, Target, ChevronLeft, ChevronRight, 
  Snowflake, PiggyBank, Sunset, FileText, Heart, ClipboardCheck, Calculator, 
  Wrench, Building, ChevronDown, TrendingUp, GraduationCap
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Vastgoed",
    icon: Building2,
    items: [
      { icon: Building2, label: "Panden", path: "/panden" },
      { icon: Users, label: "Huurders", path: "/huurders" },
      { icon: Wrench, label: "Aannemers", path: "/aannemers" },
      { icon: FileText, label: "Contracten", path: "/contracten" },
      { icon: ClipboardCheck, label: "Inchecklijsten", path: "/inchecklijsten" },
      { icon: Building, label: "VvE Overzicht", path: "/vve" },
    ],
  },
  {
    label: "Analyse",
    icon: TrendingUp,
    items: [
      { icon: Wallet, label: "Financiën", path: "/financien" },
      { icon: Calculator, label: "Analysator", path: "/analysator" },
      { icon: Building2, label: "Multi-Unit", path: "/multi-unit" },
    ],
  },
  {
    label: "Vermogensopbouw",
    icon: PiggyBank,
    items: [
      { icon: Target, label: "Doelen", path: "/doelen" },
      { icon: Snowflake, label: "Sneeuwbal", path: "/sneeuwbal" },
      { icon: PiggyBank, label: "Vermogen", path: "/vermogen" },
      { icon: TrendingUp, label: "Rente-op-Rente", path: "/rente-op-rente" },
      { icon: Sunset, label: "Pensioen", path: "/pensioen" },
      { icon: Heart, label: "Legacy", path: "/legacy" },
    ],
  },
  {
    label: "Leren",
    icon: GraduationCap,
    items: [
      { icon: GraduationCap, label: "Academy", path: "/academy" },
    ],
  },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(["Vastgoed", "Analyse", "Vermogensopbouw", "Leren"]);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some(item => location.pathname === item.path);
  };

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
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Dashboard - Always visible */}
        <button
          onClick={() => navigate("/")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            location.pathname === "/"
              ? "bg-sidebar-accent text-sidebar-primary font-medium"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          } ${isCollapsed ? "justify-center" : ""}`}
        >
          <Home className={`w-5 h-5 flex-shrink-0 ${location.pathname === "/" ? "text-sidebar-primary" : ""}`} />
          {!isCollapsed && <span>Dashboard</span>}
        </button>

        {/* Grouped Navigation */}
        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = openGroups.includes(group.label);
          const hasActiveItem = isGroupActive(group);

          if (isCollapsed) {
            // In collapsed mode, show group icon that expands on hover
            return (
              <div key={group.label} className="relative group">
                <button
                  className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    hasActiveItem
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <GroupIcon className="w-5 h-5" />
                </button>
                {/* Hover dropdown for collapsed mode */}
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
                  <div className="bg-popover border rounded-xl shadow-lg p-2 min-w-48">
                    <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-popover-foreground hover:bg-accent/50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Collapsible
              key={group.label}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.label)}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    hasActiveItem && !isOpen
                      ? "bg-sidebar-accent/50 text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon className={`w-5 h-5 ${hasActiveItem ? "text-sidebar-primary" : ""}`} />
                    <span className="font-medium text-sm">{group.label}</span>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`} 
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 mt-1 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-sidebar-primary" : ""}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => navigate("/instellingen")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            location.pathname === "/instellingen"
              ? "bg-sidebar-accent text-sidebar-primary font-medium"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          } ${isCollapsed ? "justify-center" : ""}`}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Instellingen</span>}
        </button>
      </div>
    </aside>
  );
};
