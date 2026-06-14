import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import { getKalenderEvents, getActiveTahunAkademik } from "@/lib/admin/kalender";
import { AcademicCalendar } from "@/modules/dashboard/academic-calendar";
import { Card } from "@/components/ui/card";

export default async function KalenderPage() {
  await connection();

  const user = await requireAuthorizedUser("akademik.kalender", ["Admin", "Prodi", "Dosen", "Mahasiswa", "Staff", "Pimpinan", "Calon Mahasiswa", "Keuangan", "Bendahara"]);
  const isAdmin = user.role === "Admin" || user.role === "Prodi";

  const ta = await getActiveTahunAkademik();

  if (!ta) {
     return <div className="p-10"><Card className="p-10 text-center text-slate-500">Tahun Akademik aktif belum diset.</Card></div>
  }

  const events = await getKalenderEvents(ta.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Kalender Akademik</h1>
        <p className="text-slate-500">Tahun Akademik: {ta.nama}</p>
      </div>

      <AcademicCalendar
         events={events}
         isAdmin={isAdmin}
         tahunAkademikId={ta.id}
      />
    </div>
  );
}
