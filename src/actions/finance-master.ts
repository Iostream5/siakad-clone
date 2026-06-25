"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/supabase/admin";
import { logActivity } from "@/lib/admin/audit-logger";
import { enqueueFinanceNotification } from "@/lib/admin/notifications";
import { requireAuthorizedUser } from "@/lib/auth";
import { withToastParams } from "@/lib/toast-query";

const financeSetupPath = "/dashboard/keuangan?tab=setup";
const financeTagihanPath = "/dashboard/keuangan?tab=tagihan";

function getErrorMessage() {
  return "Terjadi kesalahan sistem. Permintaan gagal diproses.";
}

function getString(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

function isUuid(value: string | null | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

async function resolveExistingPublicUserId(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string | null | undefined,
) {
  if (!isUuid(userId)) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[finance-master] failed to resolve actor user", {
      code: error.code,
      message: error.message,
      hint: error.hint,
    });
    return null;
  }

  return data?.id ?? null;
}

function logFinanceMasterError(context: string, error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const dbError = error as { code?: string; message?: string; hint?: string | null; details?: string | null };
    console.error(`[finance-master] ${context}`, {
      code: dbError.code,
      message: dbError.message,
      hint: dbError.hint,
      details: dbError.details,
    });
    return;
  }

  console.error(`[finance-master] ${context}`, error);
}

export async function createMasterBiayaAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan.setup", ["Admin", "Keuangan"]);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase client not available");
  const actorUserId = await resolveExistingPublicUserId(supabase, user.id);

  const nama = getString(formData, "nama");
  const nominal = Number(formData.get("nominal"));
  const tahunAkademikId = getString(formData, "tahunAkademikId") || null;
  const prodiId = getString(formData, "prodiId") || null;
  const angkatan = formData.get("angkatan") ? Number(formData.get("angkatan")) : null;
  
  // Advanced fields
  const tingkatKelas = formData.getAll("tingkat_kelas").map(String).filter(Boolean);
  const jurusan = formData.getAll("jurusan").map(String).filter(Boolean);
  const jenisKelamin = getString(formData, "jenis_kelamin") || "Semua";
  const gelombang = getString(formData, "gelombang") || null;
  const jalur = getString(formData, "jalur") || null;
  const terbit = getString(formData, "terbit") || "Sekali";
  const bolehAngsur = formData.get("boleh_angsur") === "on";
  const isMutasi = formData.get("is_mutasi") === "on";
  const isBoarding = formData.get("is_boarding") === "on";
  const keterangan = getString(formData, "keterangan");
  const status = formData.get("status") === "on";

  if (!nama || !Number.isFinite(nominal) || nominal <= 0) {
    redirect(withToastParams(financeSetupPath, { variant: "error", title: "Data tarif tidak lengkap" }));
  }

  const payload = {
    nama,
    nominal,
    tahun_akademik_id: tahunAkademikId,
    prodi_id: prodiId,
    angkatan,
    tingkat_kelas: tingkatKelas,
    jurusan: jurusan,
    jenis_kelamin: jenisKelamin,
    gelombang,
    jalur,
    terbit,
    boleh_angsur: bolehAngsur,
    is_mutasi: isMutasi,
    is_boarding: isBoarding,
    keterangan,
    is_active: status,
    status,
    updated_by: actorUserId
  };

  try {
    const { error } = await supabase.from("master_biaya").insert(payload);
    if (error) throw error;

    // Log Activity
    await logActivity({
      modul: "Keuangan - Master Tarif",
      aksi: "CREATE",
      tableName: "master_biaya",
      newData: payload
    });
  } catch (error) {
    logFinanceMasterError("create master biaya failed", error);
    redirect(withToastParams(financeSetupPath, { variant: "error", title: "Gagal membuat tarif", message: getErrorMessage() }));
  }

  revalidatePath("/dashboard/keuangan");
  redirect(withToastParams(financeSetupPath, { variant: "success", title: "Tarif dibuat" }));
}

async function updateMasterBiayaRecord(id: string, payload: any, userId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase client not available");

  const { error } = await supabase
    .from("master_biaya")
    .update({
      ...payload,
      updated_by: userId,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw error;
}

export async function updateMasterBiayaAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan.setup", ["Admin", "Keuangan"]);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase client not available");
  const actorUserId = await resolveExistingPublicUserId(supabase, user.id);

  const id = getString(formData, "id");
  if (!id) return redirect(withToastParams(financeSetupPath, { variant: "error", title: "ID Tarif tidak ditemukan" }));

  const nama = getString(formData, "nama");
  const nominal = Number(formData.get("nominal"));
  const tahunAkademikId = getString(formData, "tahunAkademikId") || null;
  const prodiId = getString(formData, "prodiId") || null;
  const angkatan = formData.get("angkatan") ? Number(formData.get("angkatan")) : null;

  // Advanced fields
  const tingkatKelas = formData.getAll("tingkat_kelas").map(String).filter(Boolean);
  const jurusan = formData.getAll("jurusan").map(String).filter(Boolean);
  const jenisKelamin = getString(formData, "jenis_kelamin") || "Semua";
  const gelombang = getString(formData, "gelombang") || null;
  const jalur = getString(formData, "jalur") || null;
  const terbit = getString(formData, "terbit") || "Sekali";
  const bolehAngsur = formData.get("boleh_angsur") === "on";
  const isActive = formData.get("status") === "on";

  try {
    const payload = {
      nama, nominal, tahun_akademik_id: tahunAkademikId, prodi_id: prodiId, angkatan,
      tingkat_kelas: tingkatKelas.length > 0 ? tingkatKelas : null,
      jurusan: jurusan.length > 0 ? jurusan : null,
      jenis_kelamin: jenisKelamin,
      gelombang, jalur, terbit, boleh_angsur: bolehAngsur,
      status: isActive,
    };

    await updateMasterBiayaRecord(id, payload, actorUserId || user.id);

    revalidatePath("/dashboard/keuangan");
    redirect(withToastParams(financeSetupPath, { variant: "success", title: "Master biaya berhasil diperbarui" }));
  } catch (error) {
    console.error("updateMasterBiayaAction error:", error);
    redirect(withToastParams(financeSetupPath, { variant: "error", title: error instanceof Error ? error.message : "Gagal memperbarui master biaya" }));
  }
}

export async function deleteMasterBiayaAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan.setup", ["Admin", "Keuangan"]);

  const id = getString(formData, "id");
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase client not available");
  const actorUserId = await resolveExistingPublicUserId(supabase, user.id);

  if (!id) {
    redirect(withToastParams(financeSetupPath, { variant: "error", title: "ID tarif tidak valid" }));
  }

  try {
    // Fetch old data for audit log
    const { data: oldMaster } = await supabase.from("master_biaya").select("*").eq("id", id).single();

    const { error } = await supabase
      .from("master_biaya")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: actorUserId,
        updated_by: actorUserId,
      })
      .eq("id", id)
      .is("deleted_at", null);
    if (error) throw error;

    // Log Activity
    await logActivity({
      modul: "Keuangan - Master Tarif",
      aksi: "DELETE",
      tableName: "master_biaya",
      recordId: id,
      oldData: oldMaster
    });
  } catch (error) {
    logFinanceMasterError("delete master biaya failed", error);
    redirect(withToastParams(financeSetupPath, { variant: "error", title: "Gagal menghapus tarif", message: getErrorMessage() }));
  }

  revalidatePath("/dashboard/keuangan");
  redirect(withToastParams(financeSetupPath, { variant: "success", title: "Tarif dihapus" }));
}

export async function generateBulkTagihanAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan.setup", ["Admin", "Keuangan"]);

  const masterId = getString(formData, "masterId");
  const tahunAkademikId = getString(formData, "tahunAkademikId");
  const jatuhTempo = getString(formData, "jatuhTempo");
  
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase client not available");
  const actorUserId = await resolveExistingPublicUserId(supabase, user.id);

  if (!masterId || !tahunAkademikId || !jatuhTempo) {
    redirect(withToastParams(financeSetupPath, { variant: "error", title: "Data generate tagihan tidak lengkap" }));
  }

  try {
    const { data: master } = await supabase.from("master_biaya").select("*").eq("id", masterId).is("deleted_at", null).single();
    if (!master) throw new Error("Master biaya tidak ditemukan");

    let query = supabase.from("mahasiswa").select("id, user_id").eq("status_mahasiswa", "AKTIF").is("deleted_at", null);
    if (master.angkatan) query = query.eq("angkatan", master.angkatan);
    if (master.prodi_id) query = query.eq("prodi_id", master.prodi_id);

    const { data: mahasiswa } = await query;
    if (!mahasiswa || mahasiswa.length === 0) throw new Error("Tidak ada mahasiswa yang cocok dengan kriteria");

    // Prevent duplicate tagihan mapping
    const { data: existingTagihan } = await supabase
      .from("tagihan")
      .select("mahasiswa_id")
      .eq("tahun_akademik_id", tahunAkademikId)
      .eq("jenis", master.nama)
      .is("deleted_at", null)
      .in("mahasiswa_id", mahasiswa.map(m => m.id));

    const existingMahasiswaIds = new Set(existingTagihan?.map(t => t.mahasiswa_id) || []);

    const tagihanData = mahasiswa
      .filter(m => !existingMahasiswaIds.has(m.id))
      .map(m => ({
        mahasiswa_id: m.id,
        tahun_akademik_id: tahunAkademikId,
        jenis: master.nama,
        nominal: master.nominal,
        jatuh_tempo: jatuhTempo,
        status: "Belum Lunas",
        master_biaya_id: masterId,
        updated_by: actorUserId
      }));

    if (tagihanData.length === 0) throw new Error("Semua mahasiswa yang cocok sudah memiliki tagihan ini");

    const { data: insertedTagihan, error } = await supabase
      .from("tagihan")
      .insert(tagihanData)
      .select("id, mahasiswa_id, jenis, nominal, jatuh_tempo");
    if (error) throw error;

    const mahasiswaById = new Map(mahasiswa.map((m) => [m.id, m]));
    const notificationTasks = [];
    for (const bill of insertedTagihan ?? []) {
      const student = mahasiswaById.get(bill.mahasiswa_id);
      if (!student?.user_id) continue;
      notificationTasks.push(enqueueFinanceNotification({
        userId: student.user_id,
        event: "billing.bulk_created",
        relatedType: "tagihan",
        relatedId: bill.id,
        href: `/dashboard/keuangan?tab=tagihan&tagihan=${bill.id}`,
        variables: {
          jumlah_tagihan: tagihanData.length,
          jenis_tagihan: bill.jenis,
          tahun_akademik: tahunAkademikId,
          nominal: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(bill.nominal)),
          jatuh_tempo: new Date(bill.jatuh_tempo).toLocaleDateString("id-ID", { dateStyle: "medium" }),
        },
      }));
    }

    const notificationResults = await Promise.allSettled(notificationTasks);
    notificationResults
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .forEach((result) => logFinanceMasterError("bulk tagihan notification failed", result.reason));

    // Log Activity
    const auditResult = await logActivity({
      modul: "Keuangan - Tagihan Massal",
      aksi: "CREATE",
      tableName: "tagihan",
      newData: {
        master_id: masterId,
        count: tagihanData.length,
        tahun_akademik_id: tahunAkademikId,
        message: `Berhasil generate ${tagihanData.length} tagihan secara massal.`
      }
    });
    if ("error" in auditResult && auditResult.error) {
      logFinanceMasterError("bulk tagihan audit failed", auditResult.error);
    }
  } catch (error) {
    logFinanceMasterError("generate bulk tagihan failed", error);
    redirect(withToastParams(financeSetupPath, { variant: "error", title: "Gagal generate tagihan", message: getErrorMessage() }));
  }

  revalidatePath("/dashboard/keuangan");
  redirect(withToastParams(financeTagihanPath, { variant: "success", title: "Tagihan massal dibuat" }));
}
