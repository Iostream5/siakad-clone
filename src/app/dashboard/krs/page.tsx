import { connection } from "next/server";

import { getAvailableJadwal, getStudentKrs, listKrsSubmissions } from "@/lib/admin/krs";
import { getDosenIdByUserId } from "@/lib/admin/dosen";
import { createAdminClient } from "@/supabase/admin";
import { requireAuthorizedUser } from "@/lib/auth";
import { KrsManager } from "@/modules/krs/krs-manager";

export default async function KrsPage() {
  await connection();

  const user = await requireAuthorizedUser("krs", ["Admin", "Prodi", "Dosen", "Mahasiswa"]);
  
  const supabase = createAdminClient();
  if (!supabase) return null;

  // 1. Ambil Tahun Akademik Aktif
  const { data: activeYear } = await supabase
    .from("tahun_akademik")
    .select("*")
    .eq("is_aktif", true)
    .single();

  if (!activeYear) {
    return <div className="p-10 text-center">Tahun akademik aktif belum diset.</div>;
  }

  let mahasiswaId = null;
  let currentKrs = null;
  let submissions: any[] = [];

  // 2. Logika per Role
  if (user.role === "Mahasiswa") {
    const { data: mhs } = await supabase
      .from("mahasiswa")
      .select("id, prodi_id")
      .eq("user_id", user.id)
      .single();
    
    if (mhs) {
      mahasiswaId = mhs.id;
      currentKrs = await getStudentKrs(mhs.id, activeYear.id);
    }
  } else if (user.role === "Dosen") {
    const dosenId = await getDosenIdByUserId(user.id);
    if (dosenId) {
      submissions = await listKrsSubmissions({ 
        tahunAkademikId: activeYear.id,
        dosenId: dosenId 
      });
    }
  } else {
    // Admin / Prodi see all
    submissions = await listKrsSubmissions({ 
      tahunAkademikId: activeYear.id 
    });
  }

  const availableJadwal = await getAvailableJadwal(activeYear.id);

  return (
    <div className="space-y-6">
      <KrsManager 
        availableJadwal={availableJadwal}
        currentKrs={currentKrs}
        tahunAkademik={activeYear}
        user={{ ...user, mahasiswaId }}
        submissions={submissions}
      />
    </div>
  );
}
