import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TooltipVisibilityContextType {
  // Global setting from profile
  globalTooltipsEnabled: boolean;
  setGlobalTooltipsEnabled: (enabled: boolean) => Promise<void>;
  
  // Local override per section
  localOverrides: Record<string, boolean>;
  setLocalOverride: (sectionId: string, enabled: boolean) => void;
  clearLocalOverride: (sectionId: string) => void;
  
  // Computed: should tooltips show for a specific section?
  shouldShowTooltips: (sectionId?: string) => boolean;
  
  // Loading state
  loading: boolean;
}

const TooltipVisibilityContext = createContext<TooltipVisibilityContextType | undefined>(undefined);

export const TooltipVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [globalTooltipsEnabled, setGlobalEnabled] = useState(true);
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Fetch global setting from profile
  useEffect(() => {
    const fetchSetting = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("toon_uitleg")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        
        // Default to true if not set
        setGlobalEnabled(data?.toon_uitleg !== false);
      } catch (error) {
        console.error("Error fetching tooltip setting:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSetting();
  }, [user]);

  // Update global setting in database
  const setGlobalTooltipsEnabled = async (enabled: boolean) => {
    if (!user) return;

    setGlobalEnabled(enabled);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ toon_uitleg: enabled } as any)
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating tooltip setting:", error);
      // Revert on error
      setGlobalEnabled(!enabled);
    }
  };

  // Set local override for a section
  const setLocalOverride = (sectionId: string, enabled: boolean) => {
    setLocalOverrides(prev => ({
      ...prev,
      [sectionId]: enabled
    }));
  };

  // Clear local override (use global setting)
  const clearLocalOverride = (sectionId: string) => {
    setLocalOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[sectionId];
      return newOverrides;
    });
  };

  // Determine if tooltips should show for a section
  const shouldShowTooltips = (sectionId?: string): boolean => {
    // If section has local override, use that
    if (sectionId && sectionId in localOverrides) {
      return localOverrides[sectionId];
    }
    // Otherwise use global setting
    return globalTooltipsEnabled;
  };

  return (
    <TooltipVisibilityContext.Provider value={{
      globalTooltipsEnabled,
      setGlobalTooltipsEnabled,
      localOverrides,
      setLocalOverride,
      clearLocalOverride,
      shouldShowTooltips,
      loading
    }}>
      {children}
    </TooltipVisibilityContext.Provider>
  );
};

export const useTooltipVisibility = () => {
  const context = useContext(TooltipVisibilityContext);
  if (context === undefined) {
    throw new Error("useTooltipVisibility must be used within a TooltipVisibilityProvider");
  }
  return context;
};
