import { requireAuthorizedUser } from "@/lib/auth";
import { ReportPanel } from "@/modules/reports/report-panel";
import { getLaporanAkademik, getLaporanPmb, getLaporanKeuangan } from "@/lib/admin/reports";
import { getStudyProgramList } from "@/lib/admin/study-programs";
import { listAcademicYears } from "@/lib/admin/academic-years";
import { FileBarChart2 } from "lucide-react";
import { Suspense } from "react";

export default async function ReportsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const user = await requireAuthorizedUser("laporan", ["Admin", "Prodi", "Keuangan", "Pimpinan"]);

  const prodiList = await getStudyProgramList();
  const { items: tahunAkademikList } = await listAcademicYears();

  const prodiId = typeof searchParams.prodiId === 'string' ? searchParams.prodiId : undefined;
  const prodiId_pmb = typeof searchParams.prodiId_pmb === 'string' ? searchParams.prodiId_pmb : undefined;
  const statusSeleksi = typeof searchParams.statusSeleksi === 'string' ? searchParams.statusSeleksi : undefined;
  const statusPembayaran = typeof searchParams.statusPembayaran === 'string' ? searchParams.statusPembayaran : undefined;

  const tahunAkademikId = typeof searchParams.tahunAkademikId === 'string' ? searchParams.tahunAkademikId : undefined;
  const statusTagihan = typeof searchParams.statusTagihan === 'string' ? searchParams.statusTagihan : undefined;

  const [akademikData, pmbData, keuanganData] = await Promise.all([
    getLaporanAkademik({ prodiId }),
    getLaporanPmb({ prodiId: prodiId_pmb, statusSeleksi, statusPembayaran }),
    getLaporanKeuangan({ tahunAkademikId, status: statusTagihan })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <FileBarChart2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan & Data</h2>
          <p className="text-sm text-slate-500">Akses laporan akademik, PMB, dan keuangan.</p>
        </div>
      </div>

      <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading laporan...</div>}>
        <ReportPanel
          akademikData={akademikData}
          pmbData={pmbData}
          keuanganData={keuanganData}
          prodiList={prodiList}
          tahunAkademikList={tahunAkademikList}
        />
      </Suspense>
    </div>
  );
}
