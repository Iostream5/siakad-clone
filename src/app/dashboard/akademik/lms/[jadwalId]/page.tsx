import { notFound } from "next/navigation";
import { requireAuthorizedUser } from "@/lib/auth";
import { 
  getJadwalDetails, 
  getLmsMateriByJadwal, 
  getLmsTugasByJadwal, 
  getLmsForumByJadwal 
} from "@/lib/admin/lms";
import { ClassroomManager } from "@/modules/lms/classroom-manager";

export default async function ClassroomPage({ params }: { params: { jadwalId: string } }) {
  const { jadwalId } = params;
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Prodi", "Dosen", "Mahasiswa"]);

  try {
    const [jadwal, materi, tugas, forum] = await Promise.all([
      getJadwalDetails(jadwalId),
      getLmsMateriByJadwal(jadwalId),
      getLmsTugasByJadwal(jadwalId),
      getLmsForumByJadwal(jadwalId),
    ]);

    if (!jadwal) {
      notFound();
    }

    return (
      <ClassroomManager 
        user={user}
        jadwal={jadwal}
        initialMateri={materi}
        initialTugas={tugas}
        initialForum={forum}
      />
    );
  } catch (error) {
    console.error("LMS Error:", error);
    notFound();
  }
}
