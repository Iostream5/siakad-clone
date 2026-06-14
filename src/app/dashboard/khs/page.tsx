import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import { createAdminClient } from "@/supabase/admin";
import { getKhsBySemester } from "@/lib/admin/khs";
import { KhsViewer } from "@/modules/grades/khs-viewer";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function KhsPage(props: { searchParams: Promise<{ ta?: string; mhs?: string }> }) {
  await connection();
  const searchParams = await props.searchParams;
  const user = await requireAuthorizedUser("akademik.khs", ["Mahasiswa", "Admin", "Prodi"]);

  const supabase = createAdminClient();
  if (!supabase) return null;

  let mahasiswaId = searchParams.mhs;

  if (user.role === "Mahasiswa") {
    const { data: mhs } = await supabase
      .from("mahasiswa")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (mhs) {
      mahasiswaId = mhs.id;
    } else {
      return <div className="p-10 text-center">Data mahasiswa tidak ditemukan.</div>;
    }
  } else {
      if (!mahasiswaId) {
          // If admin/prodi hasn't selected a student, show search/info
          return (
             <div className="p-10 text-center">
                 <Card className="p-10">
                     <p className="text-slate-500">Silakan tentukan parameter mhs (Mahasiswa ID) di URL untuk melihat KHS.</p>
                 </Card>
             </div>
          )
      }
  }

  // Get active or selected year
  let tahunAkademikId = searchParams.ta;
  if (!tahunAkademikId) {
    const { data: activeYear } = await supabase
      .from("tahun_akademik")
      .select("id")
      .eq("is_aktif", true)
      .single();

    if (activeYear) {
      tahunAkademikId = activeYear.id;
    }
  }

  if (!tahunAkademikId || !mahasiswaId) {
    return <div className="p-10 text-center">Parameter tidak lengkap.</div>;
  }

  const khsData = await getKhsBySemester(mahasiswaId, tahunAkademikId);

  if (!khsData) {
    return (
        <div className="p-10 text-center">
             <Card className="p-10">
                 <p className="text-slate-500">Data KHS tidak ditemukan atau belum ada nilai yang dipublikasikan pada semester ini.</p>
             </Card>
         </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <KhsViewer data={khsData} />
    </div>
  );
}
