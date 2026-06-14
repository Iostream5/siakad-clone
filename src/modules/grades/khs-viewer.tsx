"use client";

import { useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Download, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { KhsResult } from "@/lib/admin/khs";

interface KhsViewerProps {
  data: KhsResult;
}

export function KhsViewer({ data }: KhsViewerProps) {
  const tableRef = useRef<HTMLTableElement>(null);

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("KARTU HASIL STUDI (KHS)", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Nama: ${data.mahasiswa.nama}`, 14, 35);
    doc.text(`NIM: ${data.mahasiswa.nim}`, 14, 42);
    doc.text(`Program Studi: ${data.mahasiswa.prodi}`, 14, 49);
    doc.text(`Tahun Akademik: ${data.tahunAkademik.nama}`, 14, 56);

    // Table
    const tableColumn = ["No", "Kode MK", "Mata Kuliah", "SKS", "Nilai", "Bobot"];
    const tableRows = data.items.map((item, index) => [
      index + 1,
      item.kode,
      item.nama,
      item.sks,
      item.nilaiHuruf,
      item.bobot.toFixed(2)
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 65;

    // Summary
    doc.text(`Total SKS Diambil: ${data.summary.totalSksDiambil}`, 14, finalY + 10);
    doc.text(`Total SKS Lulus: ${data.summary.totalSksLulus}`, 14, finalY + 17);
    doc.setFont("helvetica", "bold");
    doc.text(`Indeks Prestasi Semester (IPS): ${data.summary.ips.toFixed(2)}`, 14, finalY + 24);

    doc.save(`KHS_${data.mahasiswa.nim}_${data.tahunAkademik.nama.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Kartu Hasil Studi</h2>
          <p className="text-sm text-slate-500">Semester: {data.tahunAkademik.nama}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Cetak
          </Button>
          <Button onClick={handleExportPDF} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-8">
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
            <p className="text-sm text-slate-500">Tahun Akademik</p>
            <p className="font-bold text-slate-900">{data.tahunAkademik.nama}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table ref={tableRef}>
            <THead>
              <TR>
                <TH>No</TH>
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
                    Belum ada nilai yang dipublikasikan untuk semester ini.
                  </TD>
                </TR>
              ) : (
                data.items.map((item, index) => (
                  <TR key={index}>
                    <TD>{index + 1}</TD>
                    <TD className="font-mono text-sm">{item.kode}</TD>
                    <TD className="font-semibold">{item.nama}</TD>
                    <TD className="text-center">{item.sks}</TD>
                    <TD className="text-center font-bold">{item.nilaiHuruf}</TD>
                    <TD className="text-right">{item.bobot.toFixed(2)}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 w-full md:w-1/3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total SKS Diambil</span>
                <span className="font-semibold">{data.summary.totalSksDiambil}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total SKS Lulus</span>
                <span className="font-semibold">{data.summary.totalSksLulus}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900">IPS</span>
                <span className="text-2xl font-black text-emerald-600">
                  {data.summary.ips.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
