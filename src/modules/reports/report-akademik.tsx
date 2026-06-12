"use client";

import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { exportToPdf } from "@/lib/pdf-generator";
import { exportToExcel } from "@/lib/excel-generator";
import { useRouter, useSearchParams } from "next/navigation";

export function ReportAkademik({ data, prodiList }: { data: any[], prodiList: any[], tahunAkademikList: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentProdi = searchParams.get('prodiId') || 'all';

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };

  const columns = [
    { header: "NIM", accessorKey: "nim" },
    { header: "Nama", accessorKey: "nama" },
    { header: "Prodi", accessorKey: "prodi" },
    { header: "Angkatan", accessorKey: "angkatan" },
    { header: "Status", accessorKey: "status" },
    { header: "IPS", accessorKey: "ips" },
    { header: "IPK", accessorKey: "ipk" },
  ];

  return (
    <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={currentProdi} onValueChange={(val) => handleFilterChange('prodiId', val)}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="Pilih Program Studi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prodi</SelectItem>
              {prodiList.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => exportToPdf({ title: "Laporan Mahasiswa", data, columns, fileName: "laporan_mahasiswa" })}>
             <FileDown className="h-4 w-4 mr-2 text-rose-500" /> PDF
           </Button>
           <Button variant="outline" size="sm" onClick={() => exportToExcel({ title: "Laporan Mahasiswa", data, columns, fileName: "laporan_mahasiswa" })}>
             <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" /> Excel
           </Button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[500px]">
         <Table>
           <THead className="sticky top-0 bg-white z-10 shadow-sm">
             <TR>
               <TH className="px-4 py-3">Mahasiswa</TH>
               <TH className="px-4 py-3">Program Studi</TH>
               <TH className="px-4 py-3 text-center">Angkatan</TH>
               <TH className="px-4 py-3 text-center">Status</TH>
               <TH className="px-4 py-3 text-center">IPS/IPK</TH>
             </TR>
           </THead>
           <TBody>
             {data.length === 0 ? (
               <TR><TD colSpan={5} className="text-center py-10 text-slate-500">Data tidak ditemukan.</TD></TR>
             ) : data.map((row, idx) => (
               <TR key={idx} className="hover:bg-slate-50">
                 <TD className="px-4 py-3">
                   <p className="font-bold text-slate-900">{row.nama}</p>
                   <p className="text-xs font-mono text-slate-500">{row.nim}</p>
                 </TD>
                 <TD className="px-4 py-3 text-sm text-slate-600 font-medium">{row.prodi}</TD>
                 <TD className="px-4 py-3 text-center text-sm">{row.angkatan}</TD>
                 <TD className="px-4 py-3 text-center">
                   <Badge variant="outline" className={row.status === "AKTIF" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>{row.status}</Badge>
                 </TD>
                 <TD className="px-4 py-3 text-center text-sm font-bold text-slate-700">
                    {row.ips} / {row.ipk}
                 </TD>
               </TR>
             ))}
           </TBody>
         </Table>
      </div>
    </Card>
  );
}
