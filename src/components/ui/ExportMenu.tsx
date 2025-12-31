import { useState } from "react";
import { Download, FileText, Calculator, Heart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  explanation?: string; // Voor partner-variant
}

export interface ExportItem {
  label: string;
  value: string | number;
  explanation?: string; // Extra uitleg voor partner-variant
}

interface ExportMenuProps {
  data: ExportData;
  filename?: string;
}

const formatValue = (value: string | number): string => {
  if (typeof value === "number") {
    return value.toLocaleString("nl-NL");
  }
  return value;
};

const generatePDF = (data: ExportData, type: ExportType) => {
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
  doc.text(`Gegenereerd op: ${new Date().toLocaleDateString("nl-NL")}`, marginLeft, y);
  y += 15;
  doc.setTextColor(0, 0, 0);

  data.sections.forEach((section) => {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // Section title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, marginLeft, y);
    y += 8;

    // Section explanation for partner variant
    if (type === "partner" && section.explanation) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(80, 80, 80);
      const explanationLines = doc.splitTextToSize(section.explanation, contentWidth);
      doc.text(explanationLines, marginLeft, y);
      y += explanationLines.length * 5 + 5;
      doc.setTextColor(0, 0, 0);
    }

    // Items
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

      // Extra explanation for partner variant
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

  // Footer for partner variant
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

const generateExcel = (data: ExportData, type: ExportType) => {
  const workbook = XLSX.utils.book_new();
  
  data.sections.forEach((section, index) => {
    const sheetData: any[][] = [];
    
    // Header
    sheetData.push([section.title]);
    sheetData.push([]);
    
    if (type === "partner" && section.explanation) {
      sheetData.push(["Uitleg:", section.explanation]);
      sheetData.push([]);
    }
    
    // Column headers
    if (type === "partner") {
      sheetData.push(["Kenmerk", "Waarde", "Wat betekent dit?"]);
    } else if (type === "accountant") {
      sheetData.push(["Kenmerk", "Waarde", "Details"]);
    } else {
      sheetData.push(["Kenmerk", "Waarde"]);
    }
    
    // Data rows
    section.items.forEach((item) => {
      if (type === "partner" || type === "accountant") {
        sheetData.push([item.label, formatValue(item.value), item.explanation || ""]);
      } else {
        sheetData.push([item.label, formatValue(item.value)]);
      }
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Set column widths
    worksheet["!cols"] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 50 },
    ];
    
    // Limit sheet name to 31 characters (Excel limitation)
    const sheetName = section.title.substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });
  
  return workbook;
};

export const ExportMenu = ({ data, filename = "export" }: ExportMenuProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: ExportType, format: "pdf" | "excel") => {
    setIsExporting(true);
    
    try {
      const typeLabels = {
        simple: "simpele",
        accountant: "accountant",
        partner: "partner",
      };

      if (format === "pdf") {
        const doc = generatePDF(data, type);
        doc.save(`${filename}_${type}.pdf`);
      } else {
        const workbook = generateExcel(data, type);
        XLSX.writeFile(workbook, `${filename}_${type}.xlsx`);
      }

      toast.success(`${typeLabels[type].charAt(0).toUpperCase() + typeLabels[type].slice(1)} ${format.toUpperCase()} gedownload`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Er ging iets mis bij het exporteren");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting} className="gap-2">
          <Download className="w-4 h-4" />
          Export
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Simpele weergave
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport("simple", "pdf")}>
          Download als PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("simple", "excel")}>
          Download als Excel
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-muted-foreground" />
          Accountant weergave
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport("accountant", "pdf")}>
          Download als PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("accountant", "excel")}>
          Download als Excel
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-muted-foreground" />
          Partner overtuigen
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport("partner", "pdf")}>
          Download als PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("partner", "excel")}>
          Download als Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
