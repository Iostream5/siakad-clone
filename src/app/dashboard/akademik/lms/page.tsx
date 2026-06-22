import type { ComponentProps } from "react";
import { requireAuthorizedUser } from "@/lib/auth";
import { getLmsClassesForLecturer, getLmsClassesForStudent, getLmsClassesForAdmin } from "@/lib/admin/lms";
import { LmsDashboard } from "@/modules/lms/lms-dashboard";
import { createAdminClient } from "@/supabase/admin";

type LmsDashboardClass = ComponentProps<typeof LmsDashboard>["initialClasses"][number];

export default async function LmsPage() {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Prodi", "Dosen", "Mahasiswa"]);

  let classes: LmsDashboardClass[] = [];
  let stats = null;

  if (user.role === "Dosen") {
    classes = await getLmsClassesForLecturer(user.id) as LmsDashboardClass[];
  } else if (user.role === "Mahasiswa") {
    classes = await getLmsClassesForStudent(user.id) as LmsDashboardClass[];
  } else if (user.role === "Admin") {
    classes = await getLmsClassesForAdmin() as unknown as LmsDashboardClass[];
  } else if (user.role === "Prodi") {
    const supabase = createAdminClient();

    if (supabase) {
      const { data: prodiUser } = await supabase
        .from("program_studi")
        .select("id")
        .eq("kaprodi_id", user.id)
        .maybeSingle();

      if (prodiUser?.id) {
        classes = await getLmsClassesForAdmin({ prodiId: prodiUser.id }) as unknown as LmsDashboardClass[];
      }
    }
  }

  if (user.role === "Admin" || user.role === "Prodi") {
    // Calculate global stats for admin
    let totalMateri = 0;
    let totalTugas = 0;
    let totalForum = 0;

    classes.forEach((item) => {
      totalMateri += item.materi?.[0]?.count || 0;
      totalTugas += item.tugas?.[0]?.count || 0;
      totalForum += item.forum?.[0]?.count || 0;
    });

    stats = { totalMateri, totalTugas, totalForum };
  }

  return (
    <div className="space-y-6">
      <LmsDashboard role={user.role} initialClasses={classes} stats={stats} />
    </div>
  );
}
