import { notFound } from "next/navigation";
import { requireAuthorizedUser } from "@/lib/auth";
import { 
  canAccessLmsTopik,
  getLmsForumTopikDetails, 
  getLmsForumKomentar 
} from "@/lib/admin/lms";
import { ForumDetailManager } from "@/modules/lms/forum-detail-manager";

export default async function ForumTopikPage({ params }: { params: Promise<{ jadwalId: string; topikId: string }> }) {
  const { jadwalId, topikId } = await params;
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Prodi", "Dosen", "Mahasiswa"]);

  let topik;
  let komentar;

  try {
    [topik, komentar] = await Promise.all([
      getLmsForumTopikDetails(topikId),
      getLmsForumKomentar(topikId),
    ]);

    if (!topik) notFound();
  } catch (error) {
    console.error("LMS Forum Error:", error);
    notFound();
  }

  if (topik.jadwal_id !== jadwalId) notFound();
  if (!(await canAccessLmsTopik({ userId: user.id, role: user.role, topikId }))) {
    notFound();
  }

  return (
    <ForumDetailManager
      user={user}
      topik={topik}
      initialKomentar={komentar}
    />
  );
}
