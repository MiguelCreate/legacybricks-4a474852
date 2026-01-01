import { useState } from "react";
import { Download, FileText, Calculator, Heart, ChevronDown, Calendar } from "lucide-react";
import { format as formatDate, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export type ExportType = "simple" | "accountant" | "partner";

export interface ExportData {
  title: string;
  sections: ExportSection[];
}

export interface ExportSection {
  title: string;
  items: ExportItem[];
  explanation?: string;
}

export interface ExportItem {
  label: string;
  value: string | number;
  explanation?: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

interface ExportMenuProps {
  data: ExportData;
  filename?: string;
  onDateRangeChange?: (range: DateRange) => void;
  showDateFilter?: boolean;
}

const formatValue = (value: string | number): string => {
  if (typeof value === "number") {
    return value.toLocaleString("nl-NL");
  }
  return value;
};

const generatePDF = (data: ExportData, type: ExportType, dateRange?: DateRange) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  const lineHeight = 7;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, marginLeft, y);
  y += 10;

  // Subtitle based on type
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  
  if (type === "simple") {
    doc.text("Simpele weergave", marginLeft, y);
  } else if (type === "accountant") {
    doc.text("Uitgebreide weergave voor accountants", marginLeft, y);
  } else {
    doc.text("Overzicht: Hoe overtuig ik mijn partner?", marginLeft, y);
  }
  
  y += 5;
  
  // Date range info
  if (dateRange) {
    doc.text(`Periode: ${formatDate(dateRange.from, "d MMM yyyy", { locale: nl })} - ${formatDate(dateRange.to, "d MMM yyyy", { locale: nl })}`, marginLeft, y);
    y += 5;
  }
  
  doc.text(`Gegenereerd op: ${new Date().toLocaleDateString("nl-NL")}`, marginLeft, y);
  y += 15;
  doc.setTextColor(0, 0, 0);

  data.sections.forEach((section) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, marginLeft, y);
    y += 8;

    if (type === "partner" && section.explanation) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(80, 80, 80);
      const explanationLines = doc.splitTextToSize(section.explanation, contentWidth);
      doc.text(explanationLines, marginLeft, y);
      y += explanationLines.length * 5 + 5;
      doc.setTextColor(0, 0, 0);
    }

    doc.setFontSize(10);
    section.items.forEach((item) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "normal");
      const labelWidth = 80;
      doc.text(item.label + ":", marginLeft, y);
      doc.setFont("helvetica", "bold");
      doc.text(formatValue(item.value), marginLeft + labelWidth, y);
      y += lineHeight;

      if (type === "partner" && item.explanation) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const expLines = doc.splitTextToSize("→ " + item.explanation, contentWidth - 10);
        doc.text(expLines, marginLeft + 5, y);
        y += expLines.length * 4 + 2;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
      }
    });

    y += 10;
  });

  if (type === "partner") {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Samenvatting", marginLeft, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const summary = "Dit overzicht laat zien hoe vastgoedinvesteringen bijdragen aan onze financiële toekomst. " +
      "Elk pand genereert passief inkomen en bouwt vermogen op voor de lange termijn. " +
      "Met een gediversifieerde portefeuille spreiden we risico's en creëren we financiële vrijheid.";
    const summaryLines = doc.splitTextToSize(summary, contentWidth);
    doc.text(summaryLines, marginLeft, y);
  }

  return doc;
};

const generateExcel = (data: ExportData, type: ExportType, dateRange?: DateRange) => {
  const workbook = XLSX.utils.book_new();
  
  // Add info sheet with date range
  if (dateRange) {
    const infoData = [
      ["Export Informatie"],
      [],
      ["Periode van:", formatDate(dateRange.from, "d MMMM yyyy", { locale: nl })],
      ["Periode tot:", formatDate(dateRange.to, "d MMMM yyyy", { locale: nl })],
      ["Gegenereerd op:", new Date().toLocaleDateString("nl-NL")],
    ];
    const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
    XLSX.utils.book_append_sheet(workbook, infoSheet, "Info");
  }
  
  data.sections.forEach((section) => {
    const sheetData: any[][] = [];
    
    sheetData.push([section.title]);
    sheetData.push([]);
    
    if (type === "partner" && section.explanation) {
      sheetData.push(["Uitleg:", section.explanation]);
      sheetData.push([]);
    }
    
    if (type === "partner") {
      sheetData.push(["Kenmerk", "Waarde", "Wat betekent dit?"]);
    } else if (type === "accountant") {
      sheetData.push(["Kenmerk", "Waarde", "Details"]);
    } else {
      sheetData.push(["Kenmerk", "Waarde"]);
    }
    
    section.items.forEach((item) => {
      if (type === "partner" || type === "accountant") {
        sheetData.push([item.label, formatValue(item.value), item.explanation || ""]);
      } else {
        sheetData.push([item.label, formatValue(item.value)]);
      }
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    worksheet["!cols"] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 50 },
    ];
    
    const sheetName = section.title.substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });
  
  return workbook;
};

type PresetPeriod = "this_month" | "last_month" | "last_3_months" | "this_year" | "last_year" | "last_30_days" | "custom";

const getPresetDateRange = (preset: PresetPeriod): DateRange => {
  const now = new Date();
  
  switch (preset) {
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month":
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    case "last_3_months":
      return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "last_year":
      const lastYear = new Date(now.getFullYear() - 1, 0, 1);
      return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    case "last_30_days":
      return { from: subDays(now, 30), to: now };
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
};

const presetLabels: Record<PresetPeriod, string> = {
  this_month: "Deze maand",
  last_month: "Vorige maand",
  last_3_months: "Afgelopen 3 maanden",
  this_year: "Dit jaar",
  last_year: "Vorig jaar",
  last_30_days: "Laatste 30 dagen",
  custom: "Aangepast",
};

export const ExportMenu = ({ data, filename = "export", onDateRangeChange, showDateFilter = true }: ExportMenuProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetPeriod>("this_month");
  const [dateRange, setDateRange] = useState<DateRange>(getPresetDateRange("this_month"));
  const [pendingExport, setPendingExport] = useState<{ type: ExportType; format: "pdf" | "excel" } | null>(null);

  const handlePresetChange = (preset: PresetPeriod) => {
    setSelectedPreset(preset);
    if (preset !== "custom") {
      const range = getPresetDateRange(preset);
      setDateRange(range);
      onDateRangeChange?.(range);
    }
  };

  const handleDateChange = (type: "from" | "to", date: Date | undefined) => {
    if (!date) return;
    const newRange = { ...dateRange, [type]: date };
    setDateRange(newRange);
    setSelectedPreset("custom");
    onDateRangeChange?.(newRange);
  };

  const handleExportClick = (type: ExportType, exportFormat: "pdf" | "excel") => {
    if (showDateFilter) {
      setPendingExport({ type, format: exportFormat });
      setIsDialogOpen(true);
    } else {
      executeExport(type, exportFormat);
    }
  };

  const executeExport = async (type: ExportType, exportFormat: "pdf" | "excel") => {
    setIsExporting(true);
    
    try {
      const typeLabels = {
        simple: "simpele",
        accountant: "accountant",
        partner: "partner",
      };

      const dateStr = `${formatDate(dateRange.from, "yyyyMMdd")}-${formatDate(dateRange.to, "yyyyMMdd")}`;

      if (exportFormat === "pdf") {
        const doc = generatePDF(data, type, showDateFilter ? dateRange : undefined);
        doc.save(`${filename}_${type}_${dateStr}.pdf`);
      } else {
        const workbook = generateExcel(data, type, showDateFilter ? dateRange : undefined);
        XLSX.writeFile(workbook, `${filename}_${type}_${dateStr}.xlsx`);
      }

      toast.success(`${typeLabels[type].charAt(0).toUpperCase() + typeLabels[type].slice(1)} ${exportFormat.toUpperCase()} gedownload`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Er ging iets mis bij het exporteren");
    } finally {
      setIsExporting(false);
      setPendingExport(null);
    }
  };

  const confirmExport = () => {
    if (pendingExport) {
      executeExport(pendingExport.type, pendingExport.format);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting} className="gap-2">
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-popover">
          <DropdownMenuLabel className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Simpele weergave
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleExportClick("simple", "pdf")}>
            Download als PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportClick("simple", "excel")}>
            Download als Excel
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-muted-foreground" />
            Accountant weergave
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleExportClick("accountant", "pdf")}>
            Download als PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportClick("accountant", "excel")}>
            Download als Excel
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-muted-foreground" />
            Partner overtuigen
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleExportClick("partner", "pdf")}>
            Download als PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportClick("partner", "excel")}>
            Download als Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Date Range Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Selecteer periode
            </DialogTitle>
            <DialogDescription>
              Kies de periode voor je export
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Preset buttons */}
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(presetLabels) as PresetPeriod[]).filter(p => p !== "custom").map((preset) => (
                <Button
                  key={preset}
                  variant={selectedPreset === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange(preset)}
                  className="justify-start"
                >
                  {presetLabels[preset]}
                </Button>
              ))}
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm text-muted-foreground mb-3 block">Of kies een aangepaste periode:</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Van</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.from ? formatDate(dateRange.from, "d MMM yyyy", { locale: nl }) : "Kies datum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => handleDateChange("from", date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Tot</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.to ? formatDate(dateRange.to, "d MMM yyyy", { locale: nl }) : "Kies datum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => handleDateChange("to", date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Selected range summary */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Geselecteerde periode: </span>
              <span className="font-medium">
                {formatDate(dateRange.from, "d MMMM yyyy", { locale: nl })} - {formatDate(dateRange.to, "d MMMM yyyy", { locale: nl })}
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Annuleren
              </Button>
              <Button onClick={confirmExport} disabled={isExporting} className="flex-1 gradient-primary">
                {isExporting ? "Exporteren..." : "Exporteren"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
