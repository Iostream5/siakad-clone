"use client";

import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToPdf } from "@/lib/pdf-generator";
import { exportToExcel } from "@/lib/excel-generator";
import { useRouter, useSearchParams } from "next/navigation";

export function ReportPMB({ data, prodiList }: { data: any[], prodiList: any[], tahunAkademikList: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentProdi = searchParams.get('prodiId_pmb') || 'all';
  const currentStatus = searchParams.get('statusSeleksi') || 'all';

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };

  const columns = [
    { header: "Nomor", accessorKey: "nomor" },
    { header: "Nama", accessorKey: "nama" },
    { header: "Prodi", accessorKey: "prodi" },
    { header: "Status Seleksi", accessorKey: "statusSeleksi" },
    { header: "Status Pembayaran", accessorKey: "statusPembayaran" },
    { header: "Tgl Daftar", accessorKey: "tanggalDaftar" },
  ];

  return (
    <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={currentProdi} onValueChange={(val) => handleFilterChange('prodiId_pmb', val)}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="Semua Prodi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prodi</SelectItem>
              {prodiList.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currentStatus} onValueChange={(val) => handleFilterChange('statusSeleksi', val)}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="BARU">BARU</SelectItem>
              <SelectItem value="VERIFIKASI">VERIFIKASI</SelectItem>
              <SelectItem value="LULUS">LULUS</SelectItem>
              <SelectItem value="DITOLAK">DITOLAK</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => exportToPdf({ title: "Laporan PMB", data, columns, fileName: "laporan_pmb" })}>
             <FileDown className="h-4 w-4 mr-2 text-rose-500" /> PDF
           </Button>
           <Button variant="outline" size="sm" onClick={() => exportToExcel({ title: "Laporan PMB", data, columns, fileName: "laporan_pmb" })}>
             <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" /> Excel
           </Button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[500px]">
         <Table>
           <THead className="sticky top-0 bg-white z-10 shadow-sm">
             <TR>
               <TH className="px-4 py-3">Pendaftar</TH>
               <TH className="px-4 py-3">Program Studi</TH>
               <TH className="px-4 py-3 text-center">Status Seleksi</TH>
               <TH className="px-4 py-3 text-center">Status Bayar</TH>
               <TH className="px-4 py-3 text-right">Tgl Daftar</TH>
             </TR>
           </THead>
           <TBody>
             {data.length === 0 ? (
               <TR><TD colSpan={5} className="text-center py-10 text-slate-500">Data tidak ditemukan.</TD></TR>
             ) : data.map((row, idx) => (
               <TR key={idx} className="hover:bg-slate-50">
                 <TD className="px-4 py-3">
                   <p className="font-bold text-slate-900">{row.nama}</p>
                   <p className="text-xs font-mono text-slate-500">{row.nomor}</p>
                 </TD>
                 <TD className="px-4 py-3 text-sm text-slate-600 font-medium">{row.prodi}</TD>
                 <TD className="px-4 py-3 text-center">
                   <Badge variant="outline" className={row.statusSeleksi === "LULUS" ? "bg-emerald-50 text-emerald-700" : ""}>{row.statusSeleksi}</Badge>
                 </TD>
                 <TD className="px-4 py-3 text-center">
                   <Badge variant="outline" className={row.statusPembayaran === "paid" ? "bg-emerald-50 text-emerald-700" : ""}>{row.statusPembayaran}</Badge>
                 </TD>
                 <TD className="px-4 py-3 text-right text-xs text-slate-500">
                    {row.tanggalDaftar}
                 </TD>
               </TR>
             ))}
           </TBody>
         </Table>
      </div>
    </Card>
  );
}
