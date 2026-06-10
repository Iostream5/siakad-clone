import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const reports = [
  {
    title: "Laporan Mahasiswa per Prodi",
    description: "Siap export Excel untuk rekap jumlah mahasiswa aktif, cuti, dan lulus.",
    icon: FileSpreadsheet,
  },
  {
    title: "Laporan Keuangan Semester",
    description: "Siap export PDF untuk tagihan, pembayaran, dispensasi, dan piutang.",
    icon: FileText,
  },
];

export function ReportPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {reports.map((report) => {
        const Icon = report.icon;

        return (
          <Card key={report.title}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--primary-strong)]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-slate-900">{report.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{report.description}</p>
            <Button className="mt-6">
              <Download className="mr-2 h-4 w-4" />
              Export placeholder
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
