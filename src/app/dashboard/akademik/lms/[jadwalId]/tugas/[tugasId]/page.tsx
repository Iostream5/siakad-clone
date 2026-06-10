import { notFound } from "next/navigation";
import { requireAuthorizedUser } from "@/lib/auth";
import { getMahasiswaByUserId } from "@/lib/admin/mahasiswa";
import { 
  getTugasDetails, 
  getSubmissionForStudent,
  getSubmissionsForGrading 
} from "@/lib/admin/lms";
import { TugasSubmissionManager } from "@/modules/lms/tugas-submission-manager";
import { TugasGradingManager } from "@/modules/lms/tugas-grading-manager";

export default async function TugasPage({ params }: { params: { jadwalId: string, tugasId: string } }) {
  const { tugasId } = params;
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen", "Mahasiswa"]);

  try {
    const tugas = await getTugasDetails(tugasId);
    if (!tugas) notFound();

    if (user.role === "Dosen" || user.role === "Admin") {
      const submissions = await getSubmissionsForGrading(tugasId);
      return (
        <TugasGradingManager 
          user={user}
          tugas={tugas}
          initialSubmissions={submissions}
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
  } catch (error) {
    console.error("LMS Tugas Error:", error);
    notFound();
  }
}
