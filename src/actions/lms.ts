"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/admin/audit-logger";
import { 
  createLmsForumTopik, 
  createLmsMateri, 
  createLmsTugas, 
  submitLmsTugas 
} from "@/lib/admin/lms";
import { createAdminClient } from "@/supabase/admin";
import { requireAuthorizedUser } from "@/lib/auth";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal.";
}

/**
 * Action: Create Forum Comment
 */
export async function createLmsForumKomentarAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen", "Mahasiswa"]);

  const values = {
    topikId: formData.get("topikId")?.toString() || "",
    userId: user.id,
    konten: formData.get("konten")?.toString() || "",
  };

  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Client error");

    const { data, error } = await supabase
      .from("lms_forum_komentar")
      .insert({
        topik_id: values.topikId,
        user_id: values.userId,
        konten: values.konten,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/dashboard/akademik/lms/forum/${values.topikId}`);
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/**
 * Action: Grade Submission (Lecturer Only)
 */
export async function gradeSubmissionAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen"]);

  const submissionId = formData.get("submissionId")?.toString() || "";
  const values = {
    nilai: Number(formData.get("nilai")),
    umpanBalik: formData.get("umpanBalik")?.toString() || "",
    graded_by: user.id,
    graded_at: new Date().toISOString(),
  };

  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Client error");

    const { data, error } = await supabase
      .from("lms_pengumpulan")
      .update({
        nilai: values.nilai,
        umpan_balik: values.umpanBalik,
        graded_by: values.graded_by,
        graded_at: values.graded_at,
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      modul: "LMS - Penilaian",
      aksi: "UPDATE",
      tableName: "lms_pengumpulan",
      recordId: submissionId,
      newData: values,
    });

    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/**
 * Action: Create Material (Lecturer Only)
 */
export async function createLmsMateriAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen"]);
  
  const values = {
    jadwalId: formData.get("jadwalId")?.toString() || "",
    judul: formData.get("judul")?.toString() || "",
    deskripsi: formData.get("deskripsi")?.toString() || "",
    fileUrl: formData.get("fileUrl")?.toString() || "",
    fileType: formData.get("fileType")?.toString() as "pdf" | "doc" | "video" | "link" | "other" | undefined,
  };

  try {
    const data = await createLmsMateri(values);

    await logActivity({
      modul: "LMS - Materi",
      aksi: "CREATE",
      tableName: "lms_materi",
      recordId: data.id,
      newData: values,
    });

    revalidatePath(`/dashboard/akademik/lms/${values.jadwalId}`);
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/**
 * Action: Create Assignment (Lecturer Only)
 */
export async function createLmsTugasAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen"]);

  const values = {
    jadwalId: formData.get("jadwalId")?.toString() || "",
    judul: formData.get("judul")?.toString() || "",
    instruksi: formData.get("instruksi")?.toString() || "",
    deadline: formData.get("deadline")?.toString() || "",
    poinMax: Number(formData.get("poinMax") || 100),
    fileUrl: formData.get("fileUrl")?.toString() || "",
  };

  try {
    const data = await createLmsTugas(values);

    await logActivity({
      modul: "LMS - Tugas",
      aksi: "CREATE",
      tableName: "lms_tugas",
      recordId: data.id,
      newData: values,
    });

    revalidatePath(`/dashboard/akademik/lms/${values.jadwalId}`);
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/**
 * Action: Submit Assignment (Student Only)
 */
export async function submitLmsTugasAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Mahasiswa"]);

  const values = {
    tugasId: formData.get("tugasId")?.toString() || "",
    mahasiswaId: formData.get("mahasiswaId")?.toString() || "",
    kontenTeks: formData.get("kontenTeks")?.toString() || "",
    fileUrl: formData.get("fileUrl")?.toString() || "",
  };

  try {
    const data = await submitLmsTugas(values);

    await logActivity({
      modul: "LMS - Pengumpulan",
      aksi: "CREATE",
      tableName: "lms_pengumpulan",
      recordId: data.id,
      newData: values,
    });

    revalidatePath(`/dashboard/akademik/lms/tugas/${values.tugasId}`);
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/**
 * Action: Create Discussion Topic
 */
export async function createLmsForumTopikAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen", "Mahasiswa"]);

  const values = {
    jadwalId: formData.get("jadwalId")?.toString() || "",
    userId: user.id,
    judul: formData.get("judul")?.toString() || "",
    konten: formData.get("konten")?.toString() || "",
    isPinned: formData.get("isPinned") === "true",
  };

  try {
    const data = await createLmsForumTopik(values);

    revalidatePath(`/dashboard/akademik/lms/${values.jadwalId}`);
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
