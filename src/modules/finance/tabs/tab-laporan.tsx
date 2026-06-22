"use client";

import { Download, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type LaporanKeuanganItem = {
  id: string;
  jenis: string;
  nominal: number;
  terbayar: number;
  tunggakan: number;
  status: string;
  jatuhTempo: string;
  mahasiswaNama: string;
  mahasiswaNim: string;
  prodi: string;
};

type TabLaporanProps = {
  laporanKeuangan: LaporanKeuanganItem[];
};

function toCsv(rows: LaporanKeuanganItem[]) {
  const headers = ["nim", "nama", "prodi", "jenis", "nominal", "terbayar", "tunggakan", "status", "jatuh_tempo"];
  const body = rows.map((row) => [
    row.mahasiswaNim,
    row.mahasiswaNama,
    row.prodi,
    row.jenis,
    row.nominal,
    row.terbayar,
    row.tunggakan,
    row.status,
    row.jatuhTempo,
  ]);

  return [headers, ...body]
    .map((line) => line.map((cell) => `"${String(cell ?? "").replace(/"/g, "\"\"")}"`).join(","))
    .join("\n");
}

function downloadBlob(content: BlobPart, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function TabLaporan({ laporanKeuangan }: TabLaporanProps) {
  const exportCsv = () => {
    downloadBlob(toCsv(laporanKeuangan), "laporan-keuangan.csv", "text/csv;charset=utf-8");
  };

  const exportXlsx = async () => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(laporanKeuangan.map((row) => ({
      NIM: row.mahasiswaNim,
      Nama: row.mahasiswaNama,
      Prodi: row.prodi,
      Jenis: row.jenis,
      Nominal: row.nominal,
      Terbayar: row.terbayar,
      Tunggakan: row.tunggakan,
      Status: row.status,
      "Jatuh Tempo": row.jatuhTempo,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
    XLSX.writeFile(workbook, "laporan-keuangan.xlsx");
  };

  return (
    <Card className="min-h-[600px] overflow-hidden rounded-none border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-50 bg-slate-50/50 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Laporan Keuangan</p>
          <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-slate-900">Tagihan, Terbayar, Tunggakan</h3>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={exportCsv} className="h-10 rounded-none text-[10px] font-black uppercase tracking-widest">
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button type="button" onClick={exportXlsx} className="h-10 rounded-none bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> XLSX
          </Button>
        </div>
      </div>
      <Table>
        <THead className="bg-slate-50/50">
          <TR><TH className="pl-6 text-[10px]">Mahasiswa</TH><TH className="text-[10px]">Jenis</TH><TH className="text-[10px]">Nominal</TH><TH className="text-[10px]">Terbayar</TH><TH className="text-[10px]">Tunggakan</TH><TH className="pr-6 text-right text-[10px]">Status</TH></TR>
        </THead>
        <TBody>
          {laporanKeuangan.map((item) => (
            <TR key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
              <TD className="pl-6">
                <p className="text-xs font-black text-slate-900">{item.mahasiswaNama}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{item.mahasiswaNim} / {item.prodi}</p>
              </TD>
              <TD className="text-xs font-bold text-slate-700">{item.jenis}</TD>
              <TD className="font-mono text-xs font-black text-slate-900">{formatCurrency(item.nominal)}</TD>
              <TD className="font-mono text-xs font-black text-emerald-600">{formatCurrency(item.terbayar)}</TD>
              <TD className="font-mono text-xs font-black text-rose-600">{formatCurrency(item.tunggakan)}</TD>
              <TD className="pr-6 text-right text-xs font-black uppercase text-slate-600">{item.status}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
