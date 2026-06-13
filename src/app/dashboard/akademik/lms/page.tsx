import { LmsClassItem } from "@/types/domain";
import { requireAuthorizedUser } from "@/lib/auth";
import { getLmsClassesForLecturer, getLmsClassesForStudent } from "@/lib/admin/lms";
import { LmsDashboard } from "@/modules/lms/lms-dashboard";

export default async function LmsPage() {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Prodi", "Dosen", "Mahasiswa"]);

  let classes: LmsClassItem[] = [];

  if (user.role === "Dosen") {
    classes = await getLmsClassesForLecturer(user.id);
  } else if (user.role === "Mahasiswa") {
    classes = await getLmsClassesForStudent(user.id);
  } else if (user.role === "Admin" || user.role === "Prodi") {
    // For admin/prodi, maybe show all active classes or a search
    // For now, let's keep it simple or empty
    classes = [];
  }

  return (
    <div className="space-y-6">
      <LmsDashboard role={user.role} initialClasses={classes} />
    </div>
  );
}
