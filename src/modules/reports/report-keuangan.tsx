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

export function ReportKeuangan({ data, tahunAkademikList }: { data: any[], tahunAkademikList: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTahun = searchParams.get('tahunAkademikId') || 'all';
  const currentStatus = searchParams.get('statusTagihan') || 'all';

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };

  const columns = [
    { header: "Mahasiswa", accessorKey: "mahasiswaNama" },
    { header: "NIM", accessorKey: "mahasiswaNim" },
    { header: "Prodi", accessorKey: "prodi" },
    { header: "Jenis Tagihan", accessorKey: "jenis" },
    { header: "Nominal", accessorFn: (r: any) => `Rp ${r.nominal.toLocaleString('id-ID')}` },
    { header: "Terbayar", accessorFn: (r: any) => `Rp ${r.terbayar.toLocaleString('id-ID')}` },
    { header: "Tunggakan", accessorFn: (r: any) => `Rp ${r.tunggakan.toLocaleString('id-ID')}` },
    { header: "Status", accessorKey: "status" },
  ];

  return (
    <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={currentTahun} onValueChange={(val) => handleFilterChange('tahunAkademikId', val)}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="Pilih Tahun Akademik" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun</SelectItem>
              {tahunAkademikList.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nama} - {t.semester}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currentStatus} onValueChange={(val) => handleFilterChange('statusTagihan', val)}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Belum Lunas">Belum Lunas</SelectItem>
              <SelectItem value="Lunas">Lunas</SelectItem>
              <SelectItem value="Dispensasi">Dispensasi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => exportToPdf({ title: "Laporan Keuangan", data, columns, fileName: "laporan_keuangan" })}>
             <FileDown className="h-4 w-4 mr-2 text-rose-500" /> PDF
           </Button>
           <Button variant="outline" size="sm" onClick={() => exportToExcel({ title: "Laporan Keuangan", data, columns, fileName: "laporan_keuangan" })}>
             <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" /> Excel
           </Button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[500px]">
         <Table>
           <THead className="sticky top-0 bg-white z-10 shadow-sm">
             <TR>
               <TH className="px-4 py-3">Mahasiswa</TH>
               <TH className="px-4 py-3">Tagihan</TH>
               <TH className="px-4 py-3 text-right">Nominal</TH>
               <TH className="px-4 py-3 text-right">Terbayar</TH>
               <TH className="px-4 py-3 text-right">Tunggakan</TH>
               <TH className="px-4 py-3 text-center">Status</TH>
             </TR>
           </THead>
           <TBody>
             {data.length === 0 ? (
               <TR><TD colSpan={6} className="text-center py-10 text-slate-500">Data tidak ditemukan.</TD></TR>
             ) : data.map((row, idx) => (
               <TR key={idx} className="hover:bg-slate-50">
                 <TD className="px-4 py-3">
                   <p className="font-bold text-slate-900">{row.mahasiswaNama}</p>
                   <p className="text-xs font-mono text-slate-500">{row.mahasiswaNim}</p>
                   <p className="text-[10px] text-slate-400 mt-1">{row.prodi}</p>
                 </TD>
                 <TD className="px-4 py-3 text-sm text-slate-600 font-medium">
                   <p>{row.jenis}</p>
                   <p className="text-[10px] text-rose-500 mt-0.5">Tempo: {row.jatuhTempo}</p>
                 </TD>
                 <TD className="px-4 py-3 text-right font-mono text-sm">Rp {row.nominal.toLocaleString('id-ID')}</TD>
                 <TD className="px-4 py-3 text-right font-mono text-sm text-emerald-600">Rp {row.terbayar.toLocaleString('id-ID')}</TD>
                 <TD className="px-4 py-3 text-right font-mono text-sm text-rose-600 font-bold">Rp {row.tunggakan.toLocaleString('id-ID')}</TD>
                 <TD className="px-4 py-3 text-center">
                   <Badge variant="outline" className={row.status === "Lunas" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}>{row.status}</Badge>
                 </TD>
               </TR>
             ))}
           </TBody>
         </Table>
      </div>
    </Card>
  );
}
