import { notFound } from "next/navigation";
import { requireAuthorizedUser } from "@/lib/auth";
import { 
  getLmsClassContext,
  getLmsMateriByJadwal, 
  getLmsTugasByJadwal, 
  getLmsForumByJadwal,
  getLmsParticipants,
} from "@/lib/admin/lms";
import { ClassroomManager } from "@/modules/lms/classroom-manager";

export default async function ClassroomPage({ params }: { params: Promise<{ jadwalId: string }> }) {
  const { jadwalId } = await params;
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Prodi", "Dosen", "Mahasiswa"]);

  let jadwal;
  let materi;
  let tugas;
  let forum;
  let participants;
  let canManage = false;

  try {
    const context = await getLmsClassContext({ userId: user.id, role: user.role, jadwalId });
    if (!context.canRead) {
      notFound();
    }

    canManage = context.canManage;

    jadwal = context.jadwal;
    [materi, tugas, forum, participants] = await Promise.all([
      getLmsMateriByJadwal(jadwalId, { includeHidden: user.role !== "Mahasiswa" }),
      getLmsTugasByJadwal(jadwalId),
      getLmsForumByJadwal(jadwalId),
      getLmsParticipants(jadwalId),
    ]);

    if (!jadwal) {
      notFound();
    }
  } catch (error: unknown) {
    const errObj = error as Record<string, unknown>;
    console.error("LMS Error:", errObj?.message ?? errObj?.code ?? JSON.stringify(error));
    notFound();
  }

  return (
    <ClassroomManager
      user={user}
      jadwal={jadwal}
      initialMateri={materi}
      initialTugas={tugas}
      initialForum={forum}
      participants={participants}
      canManage={canManage}
    />
  );
}
