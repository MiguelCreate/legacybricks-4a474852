import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  Receipt,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Upload,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bell,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReciboDeRendaTrackerProps {
  propertyId: string;
  propertyName: string;
  tenantRents: { tenantId: string; tenantName: string; monthlyRent: number }[];
}

interface ReciboRecord {
  month: number;
  year: number;
  status: 'pending' | 'uploaded' | 'skipped';
  link?: string;
  uploadedAt?: Date;
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const ReciboDeRendaTracker = ({
  propertyId,
  propertyName,
  tenantRents
}: ReciboDeRendaTrackerProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [recibos, setRecibos] = useState<ReciboRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth(); // 0-indexed
  const currentYear = new Date().getFullYear();
  
  // Generate years list (current and past 3 years)
  const years = useMemo(() => {
    const result = [];
    for (let i = 0; i <= 3; i++) {
      result.push(currentYear - i);
    }
    return result;
  }, [currentYear]);

  // Generate 12 months for selected year
  const monthsData = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const recibo = recibos.find(r => r.month === i && r.year === selectedYear);
      const isPast = selectedYear < currentYear || (selectedYear === currentYear && i < currentMonth);
      const isCurrent = selectedYear === currentYear && i === currentMonth;
      const isFuture = selectedYear > currentYear || (selectedYear === currentYear && i > currentMonth);
      
      months.push({
        month: i,
        name: MONTHS_PT[i],
        status: recibo?.status || (isPast ? 'pending' : 'future'),
        link: recibo?.link,
        isPast,
        isCurrent,
        isFuture
      });
    }
    return months;
  }, [recibos, selectedYear, currentMonth, currentYear]);

  // Count pending recibos
  const pendingCount = monthsData.filter(m => m.status === 'pending' && !m.isFuture).length;
  const uploadedCount = monthsData.filter(m => m.status === 'uploaded').length;

  // Load recibos from localStorage (could be migrated to DB later)
  useEffect(() => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(`recibos_${propertyId}`);
      if (stored) {
        setRecibos(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recibos:', e);
    }
    setLoading(false);
  }, [propertyId]);

  // Save recibos to localStorage
  const saveRecibos = (newRecibos: ReciboRecord[]) => {
    setRecibos(newRecibos);
    localStorage.setItem(`recibos_${propertyId}`, JSON.stringify(newRecibos));
  };

  const markAsUploaded = (month: number, link?: string) => {
    const filtered = recibos.filter(r => !(r.month === month && r.year === selectedYear));
    saveRecibos([...filtered, {
      month,
      year: selectedYear,
      status: 'uploaded',
      link,
      uploadedAt: new Date()
    }]);
    toast({
      title: "Recibo gemarkeerd",
      description: `Recibo de Renda voor ${MONTHS_PT[month]} ${selectedYear} gemarkeerd als geüpload.`,
    });
  };

  const markAsSkipped = (month: number) => {
    const filtered = recibos.filter(r => !(r.month === month && r.year === selectedYear));
    saveRecibos([...filtered, {
      month,
      year: selectedYear,
      status: 'skipped'
    }]);
  };

  const resetMonth = (month: number) => {
    const filtered = recibos.filter(r => !(r.month === month && r.year === selectedYear));
    saveRecibos(filtered);
  };

  // Current month reminder
  const showReminder = currentMonth > 0 && monthsData[currentMonth - 1]?.status === 'pending';

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Laden...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Recibo de Renda Tracker
                <InfoTooltip
                  title="Recibo de Renda"
                  content="In Portugal moet je maandelijks een huurbon (Recibo de Renda) uitreiken aan je huurders via het Finanças-portaal. Dit is verplicht voor belastingaangifte."
                />
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingCount} openstaand
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </CardTitle>
            <CardDescription>
              Houd je maandelijkse huurontvangstbewijzen bij voor {propertyName}
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Reminder Banner */}
            {showReminder && (
              <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg border border-warning/30">
                <Bell className="h-5 w-5 text-warning mt-0.5 animate-pulse" />
                <div>
                  <p className="font-medium text-foreground">
                    Vergeet niet je Recibo de Renda voor {MONTHS_PT[currentMonth - 1]} te uploaden!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Deadline: uiterlijk de 10e van {MONTHS_PT[currentMonth]}
                  </p>
                </div>
              </div>
            )}

            {/* Year Selector & Stats */}
            <div className="flex items-center justify-between">
              <Select 
                value={String(selectedYear)} 
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>{uploadedCount}/12 geüpload</span>
                </div>
                {pendingCount > 0 && (
                  <div className="flex items-center gap-1.5 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{pendingCount} openstaand</span>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {monthsData.map((month) => (
                <div
                  key={month.month}
                  className={`p-3 rounded-lg border transition-colors ${
                    month.status === 'uploaded' 
                      ? 'bg-success/10 border-success/30'
                      : month.status === 'skipped'
                      ? 'bg-muted/50 border-muted'
                      : month.isFuture
                      ? 'bg-muted/30 border-dashed'
                      : month.isCurrent
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-destructive/5 border-destructive/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{month.name}</span>
                    {month.status === 'uploaded' && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    {month.status === 'pending' && !month.isFuture && (
                      <Clock className="h-4 w-4 text-destructive" />
                    )}
                    {month.isCurrent && month.status !== 'uploaded' && (
                      <Badge variant="outline" className="text-xs">Nu</Badge>
                    )}
                  </div>

                  {month.isFuture ? (
                    <p className="text-xs text-muted-foreground">Toekomstig</p>
                  ) : month.status === 'uploaded' ? (
                    <div className="space-y-1">
                      {month.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs w-full justify-start gap-1"
                          onClick={() => window.open(month.link, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Bekijken
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs w-full justify-start text-muted-foreground"
                        onClick={() => resetMonth(month.month)}
                      >
                        Reset
                      </Button>
                    </div>
                  ) : month.status === 'skipped' ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Overgeslagen</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs w-full justify-start"
                        onClick={() => resetMonth(month.month)}
                      >
                        Reset
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1 gap-1"
                        onClick={() => markAsUploaded(month.month)}
                      >
                        <Upload className="h-3 w-3" />
                        Gedaan
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Info Section */}
            <div className="p-4 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-2">💡 Tips voor Recibo de Renda</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Log in op het Finanças-portaal vóór de 10e van elke maand</li>
                <li>• Selecteer de juiste huurder en huurperiode</li>
                <li>• Download het PDF-bewijs en sla het op in je administratie</li>
                <li>• Bewaar kopieën voor je jaarlijkse IRS-aangifte</li>
              </ul>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto mt-2"
                onClick={() => window.open('https://www.portaldasfinancas.gov.pt', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Naar Portal das Finanças
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
