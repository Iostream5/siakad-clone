"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExcelExportButtonProps {
  onExport: () => void;
  label?: string;
}

export function ExcelExportButton({ onExport, label = "Export Excel" }: ExcelExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 gap-2 text-slate-700 border-slate-200 hover:bg-slate-50"
      onClick={onExport}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
