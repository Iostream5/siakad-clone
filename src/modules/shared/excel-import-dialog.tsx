"use client";

import { useState, useRef } from "react";
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-provider";

interface ExcelImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  templateHeaders: string[];
  onImport: (data: any[]) => Promise<void>;
  onDownloadTemplate: () => void;
}

export function ExcelImportDialog({
  isOpen,
  onOpenChange,
  title,
  templateHeaders,
  onImport,
  onDownloadTemplate,
}: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success: showSuccess, error: showError } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      setError("Format file tidak didukung. Gunakan .xlsx atau .xls");
      setFile(null);
      setPreviewData([]);
      return;
    }

    setError(null);
    setFile(selectedFile);
    processPreview(selectedFile);
  };

  const processPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          setError("File Excel kosong");
          setPreviewData([]);
          return;
        }

        const fileHeaders = Object.keys(jsonData[0] as object);
        const missingHeaders = templateHeaders.filter((h) => !fileHeaders.includes(h));

        if (missingHeaders.length > 0) {
          setError(`Header tidak sesuai template. Kurang: ${missingHeaders.join(", ")}`);
        } else {
          setError(null);
        }

        setPreviewData(jsonData);
      } catch (err) {
        setError("Gagal membaca file Excel. Pastikan file tidak rusak.");
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    setFile(null);
    setPreviewData([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (previewData.length === 0 || error) return;

    setIsProcessing(true);
    try {
      await onImport(previewData);
      showSuccess("Import Berhasil", `${previewData.length} baris data berhasil diproses`);
      handleClearFile();
      onOpenChange(false);
    } catch (err: any) {
      showError("Import Gagal", err.message || "Terjadi kesalahan saat memproses data");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isProcessing) {
        if (!open) handleClearFile();
        onOpenChange(open);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Unggah file Excel (.xlsx) untuk menambahkan data secara massal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Butuh format standar?</span>
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="text-cyan-600 hover:text-cyan-700 font-medium hover:underline"
            >
              Unduh Template
            </button>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              file ? "border-cyan-200 bg-cyan-50/30" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
            onClick={!file ? handleUploadClick : undefined}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isProcessing}
            />

            {!file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Klik untuk unggah file</p>
                  <p className="text-xs text-slate-500 mt-1">Maksimal ukuran file 5MB</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileSpreadsheet className="h-8 w-8 text-emerald-500 shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{previewData.length} baris data ditemukan</p>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFile();
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {previewData.length > 0 && !error && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Format file sesuai. Siap mengunggah {previewData.length} baris data.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || !!error || isProcessing}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isProcessing ? "Sedang Memproses..." : "Import Data"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
