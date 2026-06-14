"use client";
import React from "react";

import { useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Download, Printer, GraduationCap, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { TranskripResult, TranskripItem } from "@/lib/admin/transkrip";
import { Progress } from "@/components/ui/progress";

interface TranskripViewerProps {
  data: TranskripResult;
}

export function TranskripViewer({ data }: TranskripViewerProps) {
  const tableRef = useRef<HTMLTableElement>(null);

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("TRANSKRIP AKADEMIK", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Nama: ${data.mahasiswa.nama}`, 14, 35);
    doc.text(`NIM: ${data.mahasiswa.nim}`, 14, 42);
    doc.text(`Program Studi: ${data.mahasiswa.prodi}`, 105, 35);
    doc.text(`Angkatan: ${data.mahasiswa.angkatan}`, 105, 42);

    // Table
    const tableColumn = ["No", "Semester", "Kode MK", "Mata Kuliah", "SKS", "Nilai", "Bobot"];
    const tableRows = data.items.map((item, index) => [
      index + 1,
      item.semester,
      item.kode,
      item.nama,
      item.sks,
      item.nilaiHuruf,
      item.bobot.toFixed(2)
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'right' },
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 55;

    // Summary
    doc.setFont("helvetica", "bold");
    doc.text(`Total SKS Kumulatif: ${data.summary.totalSksLulus}`, 14, finalY + 10);
    doc.text(`Indeks Prestasi Kumulatif (IPK): ${data.summary.ipk.toFixed(2)}`, 14, finalY + 17);
    doc.text(`Predikat Kelulusan: ${data.summary.predikat}`, 14, finalY + 24);

    doc.save(`Transkrip_${data.mahasiswa.nim}.pdf`);
  };

  const progressPercentage = Math.min(100, Math.round((data.summary.totalSksLulus / data.summary.totalSksWajib) * 100));

  // Group by semester for better UI
  const groupedItems = data.items.reduce((acc, item) => {
      if (!acc[item.semester]) {
          acc[item.semester] = [];
      }
      acc[item.semester].push(item);
      return acc;
  }, {} as Record<number, TranskripItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Transkrip Kumulatif</h2>
            <p className="text-sm text-slate-500">Nilai keseluruhan mahasiswa</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Cetak
          </Button>
          <Button onClick={handleExportPDF} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Nama Mahasiswa</p>
                <p className="font-bold text-slate-900">{data.mahasiswa.nama}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">NIM</p>
                <p className="font-bold text-slate-900">{data.mahasiswa.nim}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Program Studi</p>
                <p className="font-bold text-slate-900">{data.mahasiswa.prodi}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Angkatan</p>
                <p className="font-bold text-slate-900">{data.mahasiswa.angkatan}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex flex-col justify-center relative overflow-hidden">
             <Award className="absolute right-[-20px] top-[-20px] h-32 w-32 text-white/10" />
             <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">IPK Kumulatif</p>
             <div className="flex items-baseline gap-2">
                 <h3 className="text-5xl font-black">{data.summary.ipk.toFixed(2)}</h3>
                 <span className="text-indigo-200">/ 4.00</span>
             </div>
             <p className="mt-2 text-indigo-100 font-medium bg-white/10 px-3 py-1 rounded-full self-start text-sm backdrop-blur-sm">
                 Predikat: {data.summary.predikat}
             </p>
          </Card>
      </div>

      <Card className="p-6">
          <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
             <div className="flex justify-between items-end mb-2">
                 <div>
                     <h4 className="font-bold text-slate-900">Progres Kelulusan</h4>
                     <p className="text-sm text-slate-500">{data.summary.totalSksLulus} dari {data.summary.totalSksWajib} SKS Wajib Terpenuhi</p>
                 </div>
                 <span className="font-black text-indigo-600 text-lg">{progressPercentage}%</span>
             </div>
             <Progress value={progressPercentage} className="h-3" />
          </div>

          <div className="overflow-x-auto">
            <Table ref={tableRef}>
              <THead>
                <TR>
                  <TH className="w-16">Sem</TH>
                  <TH>Kode MK</TH>
                  <TH>Mata Kuliah</TH>
                  <TH className="text-center">SKS</TH>
                  <TH className="text-center">Nilai</TH>
                  <TH className="text-right">Bobot</TH>
                </TR>
              </THead>
              <TBody>
                {data.items.length === 0 ? (
                  <TR>
                    <TD colSpan={6} className="text-center text-slate-500 py-8">
                      Belum ada nilai yang dipublikasikan.
                    </TD>
                  </TR>
                ) : (
                  Object.keys(groupedItems).sort((a,b) => Number(a) - Number(b)).map((semester) => (
                      <React.Fragment key={`sem-${semester}`}>
                          <TR className="bg-slate-50">
                              <TD colSpan={6} className="font-bold text-indigo-900 text-xs uppercase tracking-wider py-2">
                                  Semester {semester}
                              </TD>
                          </TR>
                          {groupedItems[Number(semester)].map((item, index) => (
                              <TR key={item.id}>
                                <TD className="text-center text-slate-400">{item.semester}</TD>
                                <TD className="font-mono text-sm">{item.kode}</TD>
                                <TD className="font-semibold">{item.nama}</TD>
                                <TD className="text-center">{item.sks}</TD>
                                <TD className="text-center font-bold text-indigo-700">{item.nilaiHuruf}</TD>
                                <TD className="text-right">{item.bobot.toFixed(2)}</TD>
                              </TR>
                          ))}
                      </React.Fragment>
                  ))
                )}
              </TBody>
            </Table>
          </div>
      </Card>
    </div>
  );
}
