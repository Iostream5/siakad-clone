"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logActivity } from "@/lib/admin/audit-logger";
import {
  canAccessLmsJadwal,
  canAccessLmsTopik,
  canGradeLmsSubmission,
  canManageLmsClass,
  createLmsForumTopik,
  createLmsMateri,
  createLmsTugas,
  deleteLmsForumKomentar,
  getLmsForumTopikDetails,
  submitLmsTugas,
  updateLmsMateri,
  validateLmsSubmission,
  updateLmsForumTopik,
  deleteLmsForumTopik,
  updateLmsForumKomentar,
} from "@/lib/admin/lms";
import { createAdminClient } from "@/supabase/admin";
import { requireAuthorizedUser } from "@/lib/auth";

const optionalUrl = z.preprocess(
  (value) => {
    const text = typeof value === "string" ? value.trim() : "";
    return text.length > 0 ? text : undefined;
  },
  z.string().url("URL tidak valid. Gunakan format https://...").optional(),
);

const textField = (message: string, max = 5000) => z
  .string()
  .trim()
  .min(1, message)
  .max(max, "Teks terlalu panjang.");

const createCommentSchema = z.object({
  topikId: z.string().uuid("Topik tidak valid."),
  konten: textField("Komentar wajib diisi."),
  fileUrl: optionalUrl,
});

const createMateriSchema = z.object({
  jadwalId: z.string().uuid("Kelas tidak valid."),
  judul: textField("Judul materi wajib diisi.", 200),
  deskripsi: z.string().trim().max(5000, "Deskripsi terlalu panjang.").optional(),
  fileUrl: optionalUrl,
  fileType: z.enum(["pdf", "doc", "video", "link", "other"]).optional(),
  isVisible: z.boolean(),
});

const createTugasSchema = z.object({
  jadwalId: z.string().uuid("Kelas tidak valid."),
  judul: textField("Judul tugas wajib diisi.", 200),
  instruksi: z.string().trim().max(8000, "Instruksi terlalu panjang.").optional(),
  deadline: z.string().datetime("Deadline tidak valid."),
  poinMax: z.number().min(1, "Poin minimal 1.").max(1000, "Poin terlalu besar."),
  fileUrl: optionalUrl,
});

const submitTugasSchema = z.object({
  tugasId: z.string().uuid("Tugas tidak valid."),
  kontenTeks: z.string().trim().max(8000, "Jawaban terlalu panjang.").optional(),
  fileUrl: optionalUrl,
}).refine((value) => Boolean(value.kontenTeks?.trim() || value.fileUrl), {
  message: "Isi jawaban atau link tugas wajib diisi.",
  path: ["kontenTeks"],
});

const createTopikSchema = z.object({
  jadwalId: z.string().uuid("Kelas tidak valid."),
  judul: textField("Judul topik wajib diisi.", 200),
  konten: textField("Isi diskusi wajib diisi."),
  isPinned: z.boolean(),
  fileUrl: optionalUrl,
});

const gradeSchema = z.object({
  submissionId: z.string().uuid("Submission tidak valid."),
  nilai: z.number().min(0, "Nilai tidak boleh kurang dari 0."),
  umpanBalik: z.string().trim().max(5000, "Umpan balik terlalu panjang.").optional(),
});

function formString(formData: FormData, key: string) {
  return formData.get(key)?.toString() ?? "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Data tidak valid.";
  }
  return error instanceof Error ? error.message : "Terjadi kesalahan sistem.";
}

function normalizeDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}

async function getSubmissionGradeContext(submissionId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_pengumpulan")
    .select("id, tugas:lms_tugas!inner(id, jadwal_id, poin_max)")
    .eq("id", submissionId)
    .maybeSingle();

  if (error) throw error;
  const tugasValue = (data as { tugas?: { id: string; jadwal_id: string; poin_max: number } | Array<{ id: string; jadwal_id: string; poin_max: number }> } | null)?.tugas;
  const tugas = Array.isArray(tugasValue) ? tugasValue[0] : tugasValue;
  if (!tugas) throw new Error("Submission tidak ditemukan.");

  return { tugas };
}

export async function createLmsForumKomentarAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen", "Mahasiswa"]);

  try {
    const parsed = createCommentSchema.parse({
      topikId: formString(formData, "topikId"),
      konten: formString(formData, "konten"),
      fileUrl: formString(formData, "fileUrl"),
    });

    if (!(await canAccessLmsTopik({ userId: user.id, role: user.role, topikId: parsed.topikId }))) {
      throw new Error("Anda tidak memiliki akses ke forum kelas ini.");
    }

    const topik = await getLmsForumTopikDetails(parsed.topikId);
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Client error");

    const { data, error } = await supabase
      .from("lms_forum_komentar")
      .insert({
        topik_id: parsed.topikId,
        user_id: user.id,
        konten: parsed.konten,
        file_url: parsed.fileUrl || null,
      })
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      modul: "LMS - Forum",
      aksi: "CREATE",
      tableName: "lms_forum_komentar",
      recordId: data.id,
      newData: parsed,
    });

    revalidatePath(`/dashboard/akademik/lms/${topik.jadwal_id}/forum/${parsed.topikId}`);
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function gradeSubmissionAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen"]);

  try {
    const parsed = gradeSchema.parse({
      submissionId: formString(formData, "submissionId"),
      nilai: Number(formString(formData, "nilai")),
      umpanBalik: formString(formData, "umpanBalik"),
    });

    if (!(await canGradeLmsSubmission({ userId: user.id, role: user.role, submissionId: parsed.submissionId }))) {
      throw new Error("Anda tidak memiliki akses menilai submission ini.");
    }

    const { tugas } = await getSubmissionGradeContext(parsed.submissionId);
    if (parsed.nilai > Number(tugas.poin_max)) {
      throw new Error(`Nilai tidak boleh lebih dari ${tugas.poin_max}.`);
    }

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Client error");

    const payload = {
      nilai: parsed.nilai,
      umpan_balik: parsed.umpanBalik || null,
      graded_by: user.id,
      graded_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("lms_pengumpulan")
      .update(payload)
      .eq("id", parsed.submissionId)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      modul: "LMS - Penilaian",
      aksi: "UPDATE",
      tableName: "lms_pengumpulan",
      recordId: parsed.submissionId,
      newData: payload,
    });

    revalidatePath(`/dashboard/akademik/lms/${tugas.jadwal_id}/tugas/${tugas.id}`);
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function createLmsMateriAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen"]);

  try {
    const parsed = createMateriSchema.parse({
      jadwalId: formString(formData, "jadwalId"),
      judul: formString(formData, "judul"),
      deskripsi: formString(formData, "deskripsi"),
      fileUrl: formString(formData, "fileUrl"),
      fileType: formString(formData, "fileType") || undefined,
      isVisible: formData.get("isVisible") !== "false",
    });

    if (!(await canManageLmsClass({ userId: user.id, role: user.role, jadwalId: parsed.jadwalId }))) {
      throw new Error("Anda tidak memiliki akses mengelola kelas ini.");
    }

    const data = await createLmsMateri(parsed);

    await logActivity({
      modul: "LMS - Materi",
      aksi: "CREATE",
      tableName: "lms_materi",
      recordId: data.id,
      newData: parsed,
    });

    revalidatePath(`/dashboard/akademik/lms/${parsed.jadwalId}`);
    revalidatePath("/dashboard/akademik/lms");
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateLmsMateriAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Dosen", "Admin"]);

  try {
    const materiId = formString(formData, "materiId");
    const jadwalId = formString(formData, "jadwalId");
    
    const parsed = createMateriSchema.parse({
      jadwalId,
      judul: formString(formData, "judul"),
      deskripsi: formString(formData, "deskripsi"),
      fileUrl: formString(formData, "fileUrl"),
      fileType: formString(formData, "fileType") || undefined,
      isVisible: formData.get("isVisible") !== "false",
    });

    if (!(await canManageLmsClass({ userId: user.id, role: user.role, jadwalId: parsed.jadwalId }))) {
      throw new Error("Anda tidak memiliki akses mengelola kelas ini.");
    }

    const data = await updateLmsMateri({
      id: materiId,
      judul: parsed.judul,
      deskripsi: parsed.deskripsi,
      fileUrl: parsed.fileUrl,
      fileType: parsed.fileType,
      isVisible: parsed.isVisible,
    });

    await logActivity({
      modul: "LMS - Materi",
      aksi: "UPDATE",
      tableName: "lms_materi",
      recordId: materiId,
      newData: parsed,
    });

    revalidatePath(`/dashboard/akademik/lms/${parsed.jadwalId}`);
    revalidatePath("/dashboard/akademik/lms");
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function createLmsTugasAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen"]);

  try {
    const parsed = createTugasSchema.parse({
      jadwalId: formString(formData, "jadwalId"),
      judul: formString(formData, "judul"),
      instruksi: formString(formData, "instruksi"),
      deadline: normalizeDateTimeLocal(formString(formData, "deadline")),
      poinMax: Number(formString(formData, "poinMax") || 100),
      fileUrl: formString(formData, "fileUrl"),
    });

    if (!(await canManageLmsClass({ userId: user.id, role: user.role, jadwalId: parsed.jadwalId }))) {
      throw new Error("Anda tidak memiliki akses mengelola kelas ini.");
    }

    const data = await createLmsTugas(parsed);

    await logActivity({
      modul: "LMS - Tugas",
      aksi: "CREATE",
      tableName: "lms_tugas",
      recordId: data.id,
      newData: parsed,
    });

    revalidatePath(`/dashboard/akademik/lms/${parsed.jadwalId}`);
    revalidatePath("/dashboard/akademik/lms");
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function submitLmsTugasAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Mahasiswa"]);

  try {
    const parsed = submitTugasSchema.parse({
      tugasId: formString(formData, "tugasId"),
      kontenTeks: formString(formData, "kontenTeks"),
      fileUrl: formString(formData, "fileUrl"),
    });

    const { mahasiswaId, tugas } = await validateLmsSubmission({
      userId: user.id,
      tugasId: parsed.tugasId,
      kontenTeks: parsed.kontenTeks,
      fileUrl: parsed.fileUrl,
    });

    const data = await submitLmsTugas({ ...parsed, mahasiswaId });

    await logActivity({
      modul: "LMS - Pengumpulan",
      aksi: "CREATE",
      tableName: "lms_pengumpulan",
      recordId: data.id,
      newData: { ...parsed, mahasiswaId },
    });

    revalidatePath(`/dashboard/akademik/lms/${tugas.jadwal_id}/tugas/${parsed.tugasId}`);
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function createLmsForumTopikAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen", "Mahasiswa"]);

  try {
    const parsed = createTopikSchema.parse({
      jadwalId: formString(formData, "jadwalId"),
      judul: formString(formData, "judul"),
      konten: formString(formData, "konten"),
      isPinned: formData.get("isPinned") === "true",
      fileUrl: formString(formData, "fileUrl"),
    });

    if (!(await canAccessLmsJadwal({ userId: user.id, role: user.role, jadwalId: parsed.jadwalId }))) {
      throw new Error("Anda tidak memiliki akses ke kelas ini.");
    }

    const canManage = await canManageLmsClass({ userId: user.id, role: user.role, jadwalId: parsed.jadwalId });
    const data = await createLmsForumTopik({
      ...parsed,
      userId: user.id,
      isPinned: canManage ? parsed.isPinned : false,
    });

    await logActivity({
      modul: "LMS - Forum",
      aksi: "CREATE",
      tableName: "lms_forum_topik",
      recordId: data.id,
      newData: { ...parsed, isPinned: canManage ? parsed.isPinned : false },
    });

    revalidatePath(`/dashboard/akademik/lms/${parsed.jadwalId}`);
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateLmsForumTopikAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Dosen", "Mahasiswa"]);

  try {
    const topikId = formString(formData, "topikId");
    const jadwalId = formString(formData, "jadwalId");
    
    const parsed = createTopikSchema.parse({
      jadwalId,
      judul: formString(formData, "judul"),
      konten: formString(formData, "konten"),
      isPinned: formData.get("isPinned") === "true",
      fileUrl: formString(formData, "fileUrl"),
    });

    if (!(await canAccessLmsJadwal({ userId: user.id, role: user.role, jadwalId: parsed.jadwalId }))) {
      throw new Error("Anda tidak memiliki akses ke kelas ini.");
    }

    const data = await updateLmsForumTopik({
      id: topikId,
      judul: parsed.judul,
      konten: parsed.konten,
      fileUrl: parsed.fileUrl,
    });

    await logActivity({
      modul: "LMS - Forum",
      aksi: "UPDATE",
      tableName: "lms_forum_topik",
      recordId: topikId,
      newData: parsed,
    });

    revalidatePath(`/dashboard/akademik/lms/${jadwalId}`);
    revalidatePath(`/dashboard/akademik/lms/${jadwalId}/forum/${topikId}`);
    return { success: true, data };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteLmsForumTopikAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Dosen", "Mahasiswa"]);

  try {
    const topikId = formString(formData, "topikId");
    const jadwalId = formString(formData, "jadwalId");

    if (!(await canAccessLmsJadwal({ userId: user.id, role: user.role, jadwalId }))) {
      throw new Error("Anda tidak memiliki akses ke kelas ini.");
    }

    await deleteLmsForumTopik(topikId);

    await logActivity({
      modul: "LMS - Forum",
      aksi: "DELETE",
      tableName: "lms_forum_topik",
      recordId: topikId,
    });

    revalidatePath(`/dashboard/akademik/lms/${jadwalId}`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteLmsForumKomentarAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Dosen", "Mahasiswa"]);

  try {
    const komentarId = formString(formData, "komentarId");
    const jadwalId = formString(formData, "jadwalId");

    const result = await deleteLmsForumKomentar({
      komentarId,
      userId: user.id,
      userRole: user.role,
    });

    await logActivity({
      modul: "LMS - Forum",
      aksi: "DELETE",
      tableName: "lms_forum_komentar",
      recordId: komentarId,
      newData: { deleted_by: user.role },
    });

    revalidatePath(`/dashboard/akademik/lms/${jadwalId}/forum/${formData.get("topikId")}`);
    return { success: true, data: result };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateLmsForumKomentarAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.lms", ["Admin", "Dosen", "Mahasiswa"]);

  try {
    const komentarId = formString(formData, "komentarId");
    const konten = formString(formData, "konten");
    const fileUrl = formString(formData, "fileUrl");

    if (!konten.trim()) {
      throw new Error("Komentar tidak boleh kosong");
    }

    const result = await updateLmsForumKomentar({
      komentarId,
      userId: user.id,
      konten: konten.trim(),
      fileUrl: fileUrl || undefined,
    });

    await logActivity({
      modul: "LMS - Forum",
      aksi: "UPDATE",
      tableName: "lms_forum_komentar",
      recordId: komentarId,
      newData: { konten: konten.trim() },
    });

    return { success: true, data: result };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
