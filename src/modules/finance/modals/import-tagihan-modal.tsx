"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";

import { importTagihanAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ImportTagihanModalProps = {
  open: boolean;
  onClose: () => void;
};

const requiredHeaders = ["nim", "tahun_akademik_kode", "jenis", "nominal", "jatuh_tempo"];
const optionalHeaders = ["master_biaya_nama", "status"];

export default function ImportTagihanModal({ open, onClose }: ImportTagihanModalProps) {
  const [fileName, setFileName] = useState("");
  const [headerLine, setHeaderLine] = useState("");

  const missingHeaders = useMemo(() => {
    if (!headerLine) return [];
    const headers = headerLine.split(",").map((item) => item.trim().toLowerCase());
    return requiredHeaders.filter((header) => !headers.includes(header));
  }, [headerLine]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md" onClick={onClose}>
      <Card className="w-full max-w-2xl overflow-hidden rounded-none border-none bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center bg-emerald-600 text-white">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Import Tagihan</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CSV atau XLSX, diparse server-side lalu file dibuang.</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-11 w-11 sm:h-9 sm:w-9 rounded-none text-slate-400">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form action={importTagihanAction} encType="multipart/form-data" className="grid gap-5 p-6" onSubmit={onClose}>
          <div className="rounded-none border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Header wajib</p>
            <p className="mt-2 break-words font-mono text-xs font-bold text-slate-800">{requiredHeaders.join(",")}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Opsional: {optionalHeaders.join(", ")}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Mode Import</label>
              <select name="mode" defaultValue="skip_existing" className="h-11 w-full rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-emerald-500">
                <option value="skip_existing">Skip Existing</option>
                <option value="update_unpaid">Update Belum Dibayar</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">File</label>
              <Input
                name="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                required
                className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold file:mr-3 file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-xs file:font-bold"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  setFileName(file?.name ?? "");
                  setHeaderLine("");
                  if (file?.name.toLowerCase().endsWith(".csv")) {
                    const text = await file.text();
                    setHeaderLine(text.split(/\r?\n/)[0] ?? "");
                  }
                }}
              />
            </div>
          </div>

          <div className="rounded-none border border-slate-100 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preview Validasi</p>
            <p className="mt-2 text-xs font-bold text-slate-700">{fileName || "Belum ada file dipilih"}</p>
            {headerLine ? (
              <p className={missingHeaders.length ? "mt-2 text-xs font-bold text-rose-600" : "mt-2 text-xs font-bold text-emerald-600"}>
                {missingHeaders.length ? `Header kurang: ${missingHeaders.join(", ")}` : "Header CSV dasar cocok."}
              </p>
            ) : (
              <p className="mt-2 text-xs font-bold text-slate-400">Preview header otomatis tersedia untuk CSV. XLSX divalidasi saat submit.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button type="button" variant="ghost" onClick={onClose} className="h-10 rounded-none text-[10px] font-black uppercase tracking-widest text-slate-500">
              Batal
            </Button>
            <Button type="submit" disabled={missingHeaders.length > 0} className="h-10 rounded-none bg-emerald-600 px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700">
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
