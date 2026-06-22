import { notFound } from "next/navigation";
import { requireAuthorizedUser } from "@/lib/auth";
import { getMahasiswaByUserId } from "@/lib/admin/mahasiswa";
import { 
  canManageLmsClass,
  canAccessLmsTugas,
  getTugasDetails, 
  getSubmissionForStudent,
  getSubmissionsForGrading 
} from "@/lib/admin/lms";
import { TugasSubmissionManager } from "@/modules/lms/tugas-submission-manager";
import { TugasGradingManager } from "@/modules/lms/tugas-grading-manager";

export default async function TugasPage({ params }: { params: Promise<{ jadwalId: string; tugasId: string }> }) {
  const { jadwalId, tugasId } = await params;
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Prodi", "Dosen", "Mahasiswa"]);

  let tugas;
  try {
    tugas = await getTugasDetails(tugasId);
    if (!tugas) notFound();
  } catch (error) {
    console.error("LMS Tugas Error:", error);
    notFound();
  }

  if (tugas.jadwal_id !== jadwalId) notFound();
  if (!(await canAccessLmsTugas({ userId: user.id, role: user.role, tugasId }))) {
    notFound();
  }

  if (user.role === "Dosen" || user.role === "Admin" || user.role === "Prodi") {
    const canGrade = await canManageLmsClass({ userId: user.id, role: user.role, jadwalId });
    const submissions = await getSubmissionsForGrading(tugasId);
    return (
      <TugasGradingManager
        user={user}
        tugas={tugas}
        initialSubmissions={submissions}
        canGrade={canGrade}
      />
    );
  }

  let submission = null;
  let studentProfile = null;

  if (user.role === "Mahasiswa") {
    studentProfile = await getMahasiswaByUserId(user.id);
    if (studentProfile) {
      submission = await getSubmissionForStudent(tugasId, studentProfile.id);
    }
  }

  return (
    <TugasSubmissionManager
      user={user}
      tugas={tugas}
      studentProfile={studentProfile}
      initialSubmission={submission}
    />
  );
}
