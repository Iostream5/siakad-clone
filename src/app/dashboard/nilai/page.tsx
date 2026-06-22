import { requireAuthorizedUser } from "@/lib/auth";
import { GradesManager } from "@/modules/grades/grades-manager";
import { getStudentGrades, getLecturerIdByUserId, getLecturerClasses, type GradeRow } from "@/lib/admin/grades";
import { getActiveAcademicYear } from "@/lib/admin/academic-years";
import { getMahasiswaByUserId } from "@/lib/admin/mahasiswa";
import type { LecturerClassItem, MahasiswaProfile } from "@/types/domain";

export default async function GradePage() {
  const user = await requireAuthorizedUser("nilai", ["Admin", "Prodi", "Dosen", "Mahasiswa"]);
  const activeYear = await getActiveAcademicYear();
  
  let gradesData: GradeRow[] = [];
  let lecturerClasses: LecturerClassItem[] = [];
  let studentProfile: MahasiswaProfile | null = null;

  if (user.role === "Mahasiswa") {
     const profile = await getMahasiswaByUserId(user.id);
     studentProfile = profile;
     gradesData = profile ? await getStudentGrades(profile.id, { publishedOnly: true }) : [];
  } else if (user.role === "Dosen") {
     const lecturerId = await getLecturerIdByUserId(user.id);
     if (lecturerId && activeYear) {
        lecturerClasses = await getLecturerClasses(lecturerId, activeYear.id);
     }
  }

  return (
    <div className="space-y-6">
      <GradesManager 
        role={user.role} 
        initialData={gradesData} 
        lecturerClasses={lecturerClasses}
        activeYear={activeYear}
        studentProfile={studentProfile}
      />
    </div>
  );
}
