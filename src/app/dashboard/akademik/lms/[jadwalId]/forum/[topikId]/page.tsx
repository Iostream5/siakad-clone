import { notFound } from "next/navigation";
import { requireAuthorizedUser } from "@/lib/auth";
import { 
  getLmsForumTopikDetails, 
  getLmsForumKomentar 
} from "@/lib/admin/lms";
import { ForumDetailManager } from "@/modules/lms/forum-detail-manager";

export default async function ForumTopikPage({ params }: { params: { jadwalId: string, topikId: string } }) {
  const { topikId } = params;
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Prodi", "Dosen", "Mahasiswa"]);

  try {
    const [topik, komentar] = await Promise.all([
      getLmsForumTopikDetails(topikId),
      getLmsForumKomentar(topikId),
    ]);

    if (!topik) notFound();

    return (
      <ForumDetailManager 
        user={user}
        topik={topik}
        initialKomentar={komentar}
      />
    );
  } catch (error) {
    console.error("LMS Forum Error:", error);
    notFound();
  }
}
