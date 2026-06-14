import { LmsClassItem } from "@/types/domain";
import { requireAuthorizedUser } from "@/lib/auth";
import { getLmsClassesForLecturer, getLmsClassesForStudent, getLmsClassesForAdmin } from "@/lib/admin/lms";
import { LmsDashboard } from "@/modules/lms/lms-dashboard";
import { createAdminClient } from "@/supabase/admin";

export default async function LmsPage() {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Prodi", "Dosen", "Mahasiswa"]);

  let classes: any[] = [];
  let stats = null;

  if (user.role === "Dosen") {
    classes = await getLmsClassesForLecturer(user.id);
  } else if (user.role === "Mahasiswa") {
    classes = await getLmsClassesForStudent(user.id);
  } else if (user.role === "Admin" || user.role === "Prodi") {
    const supabase = createAdminClient();
    let prodiId = undefined;

    if (user.role === "Prodi" && supabase) {
        // Find prodi_id for this user
        const { data: prodiUser } = await supabase
            .from("program_studi")
            .select("id")
            .eq("kaprodi_id", user.id) // Assuming Kaprodi maps to user id or we need to map via dosen
            .maybeSingle();

        // Fallback: If no direct map, we might need a specific role mapping table
        if (prodiUser) prodiId = prodiUser.id;
    }

    classes = await getLmsClassesForAdmin({ prodiId });

    // Calculate global stats for admin
    let totalMateri = 0;
    let totalTugas = 0;
    let totalForum = 0;

    classes.forEach(c => {
        totalMateri += c.materi?.[0]?.count || 0;
        totalTugas += c.tugas?.[0]?.count || 0;
        totalForum += c.forum?.[0]?.count || 0;
    });

    stats = { totalMateri, totalTugas, totalForum };
  }

  return (
    <div className="space-y-6">
      <LmsDashboard role={user.role} initialClasses={classes} stats={stats} />
    </div>
  );
}
