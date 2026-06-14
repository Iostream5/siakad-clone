import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import { createAdminClient } from "@/supabase/admin";
import { getTranscript } from "@/lib/admin/transkrip";
import { TranskripViewer } from "@/modules/grades/transkrip-viewer";
import { Card } from "@/components/ui/card";

export default async function TranskripPage(props: { searchParams: Promise<{ mhs?: string }> }) {
  await connection();
  const searchParams = await props.searchParams;
  const user = await requireAuthorizedUser("akademik.transkrip", ["Mahasiswa", "Admin", "Prodi"]);

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
          // If admin/prodi hasn't selected a student
          return (
             <div className="p-10 text-center">
                 <Card className="p-10">
                     <p className="text-slate-500">Silakan tentukan parameter mhs (Mahasiswa ID) di URL untuk melihat Transkrip.</p>
                 </Card>
             </div>
          )
      }
  }

  if (!mahasiswaId) {
    return <div className="p-10 text-center">Parameter tidak lengkap.</div>;
  }

  const data = await getTranscript(mahasiswaId);

  if (!data) {
    return (
        <div className="p-10 text-center">
             <Card className="p-10">
                 <p className="text-slate-500">Data Transkrip tidak ditemukan.</p>
             </Card>
         </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <TranskripViewer data={data} />
    </div>
  );
}
