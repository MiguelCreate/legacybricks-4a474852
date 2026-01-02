import { GraduationCap, LineChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface MultiUnitModeToggleProps {
  mode: "beginner" | "gevorderd";
  onModeChange: (mode: "beginner" | "gevorderd") => void;
}

export const MultiUnitModeToggle = ({ mode, onModeChange }: MultiUnitModeToggleProps) => {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Weergave:</Label>
            <Tabs value={mode} onValueChange={(v) => onModeChange(v as "beginner" | "gevorderd")}>
              <TabsList>
                <TabsTrigger value="beginner" className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Beginners
                </TabsTrigger>
                <TabsTrigger value="gevorderd" className="gap-2">
                  <LineChart className="w-4 h-4" />
                  Gevorderden
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <Badge variant="outline" className="text-xs">
            {mode === "beginner" ? "Stapsgewijze uitleg per metric" : "Volledige tabel & KPI's"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
