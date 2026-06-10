"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canDosenAccessJadwal, getClassStudentsWithGrades, updateStudentGrade } from "@/lib/admin/grades";
import { requireAuthorizedUser } from "@/lib/auth";
import { withToastParams } from "@/lib/toast-query";
import { logActivity } from "@/lib/admin/audit-logger";
import { createAdminClient } from "@/supabase/admin";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan internal";
}

/**
 * Server Action untuk mengambil daftar mahasiswa di suatu kelas
 */
export async function getClassGradesAction(jadwalId: string) {
  const user = await requireAuthorizedUser("nilai", ["Admin", "Prodi", "Dosen"]);

  if (!jadwalId) {
    return { error: "Kelas tidak valid." };
  }

  if (user.role === "Dosen" && !(await canDosenAccessJadwal(jadwalId, user.id))) {
    return { error: "Anda hanya dapat membuka kelas yang Anda ampu." };
  }

  try {
    const students = await getClassStudentsWithGrades(jadwalId);
    return { success: true, data: students };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/**
 * Server Action untuk input/update nilai mahasiswa
 */
export async function updateGradeAction(formData: FormData) {
  const user = await requireAuthorizedUser("nilai", ["Admin", "Prodi", "Dosen"]);

  const mahasiswaId = formData.get("mahasiswaId")?.toString() || "";
  const jadwalId = formData.get("jadwalId")?.toString() || "";
  const score = Number(formData.get("score"));
  const publish = formData.get("publish") === "on";

  if (!mahasiswaId || !jadwalId) {
    redirect(withToastParams("/dashboard/nilai", { variant: "error", title: "Data tidak lengkap" }));
  }

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return { error: "Nilai harus berupa angka 0 sampai 100." };
  }

  if (user.role === "Dosen" && !(await canDosenAccessJadwal(jadwalId, user.id))) {
    return { error: "Anda hanya dapat menginput nilai untuk kelas yang Anda ampu." };
  }

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  // Fetch old data for audit log
  const { data: oldGrade } = await supabase
    .from("nilai_akhir")
    .select("*")
    .eq("mahasiswa_id", mahasiswaId)
    .eq("jadwal_id", jadwalId)
    .maybeSingle();

  try {
    await updateStudentGrade(mahasiswaId, jadwalId, score, publish);

    // Log Activity
    await logActivity({
      modul: "Akademik - Nilai",
      aksi: "UPDATE",
      tableName: "nilai_akhir",
      recordId: oldGrade?.id || undefined,
      oldData: oldGrade,
      newData: { mahasiswa_id: mahasiswaId, jadwal_id: jadwalId, nilai_angka: score, published_at: publish ? "now()" : null }
    });

    revalidatePath("/dashboard/nilai");
    return { success: true };
  } catch (error) {
    console.error("Failed to update grade:", error);
    return { error: getErrorMessage(error) };
  }
}
