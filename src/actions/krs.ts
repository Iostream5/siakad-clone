"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getMahasiswaByUserId } from "@/lib/admin/mahasiswa";
import {
  assignDosenWali,
  canDosenApproveKrs,
  canProdiApproveKrs,
  submitKrs,
  updateKrsStatus,
} from "@/lib/admin/krs";
import { withToastParams } from "@/lib/toast-query";
import { requireAuthorizedUser } from "@/lib/auth";
import { createAdminClient } from "@/supabase/admin";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan internal";
}

function isKrsApprovalStatus(value: string): value is "Disetujui" | "Ditolak" {
  return value === "Disetujui" || value === "Ditolak";
}

async function canProdiManageMahasiswa(userId: string, mahasiswaId: string) {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const [{ data: prodi }, { data: mahasiswa }] = await Promise.all([
    supabase.from("program_studi").select("id").eq("kaprodi_id", userId).maybeSingle(),
    supabase.from("mahasiswa").select("prodi_id").eq("id", mahasiswaId).maybeSingle(),
  ]);

  return Boolean(prodi?.id && mahasiswa?.prodi_id === prodi.id);
}

export async function submitKrsAction(mahasiswaId: string, tahunAkademikId: string, formData: FormData) {
  const user = await requireAuthorizedUser("krs", ["Mahasiswa", "Admin"]);

  if (!mahasiswaId || !tahunAkademikId) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Data KRS tidak valid" }));
  }

  if (user.role === "Mahasiswa") {
    const mahasiswa = await getMahasiswaByUserId(user.id);
    if (!mahasiswa || mahasiswa.id !== mahasiswaId) {
      redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Anda tidak berwenang mengajukan KRS mahasiswa lain" }));
    }
  }

  const jadwalIds = formData.getAll("jadwalIds").map(String).filter(Boolean);

  if (jadwalIds.length === 0) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Pilih minimal satu mata kuliah" }));
  }

  try {
    await submitKrs(mahasiswaId, tahunAkademikId, jadwalIds);

    // Add audit log
    const { logActivity } = await import("@/lib/admin/audit-logger");
    await logActivity({
      modul: "Akademik - KRS",
      aksi: "CREATE",
      tableName: "krs_header",
      newData: { mahasiswaId, tahunAkademikId, jadwalIds }
    });

    revalidatePath("/dashboard/krs");
  } catch (error) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Gagal mengajukan KRS", message: getErrorMessage(error) }));
  }

  redirect(withToastParams("/dashboard/krs", { variant: "success", title: "KRS berhasil diajukan", message: "Menunggu persetujuan Dosen Wali." }));
}

export async function approveKrsAction(formData: FormData) {
  const user = await requireAuthorizedUser("krs", ["Dosen", "Admin", "Prodi"]);

  const krsId = formData.get("krsId")?.toString() || "";
  const status = formData.get("status")?.toString() || "";
  const catatan = formData.get("catatan")?.toString();

  if (!krsId || !isKrsApprovalStatus(status)) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Parameter KRS tidak valid" }));
  }

  if (user.role === "Dosen" && !(await canDosenApproveKrs(krsId, user.id))) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Anda hanya dapat memproses KRS mahasiswa bimbingan" }));
  }

  if (user.role === "Prodi" && !(await canProdiApproveKrs(krsId, user.id))) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Anda hanya dapat memproses KRS mahasiswa pada prodi Anda" }));
  }

  try {
    await updateKrsStatus(krsId, status, user.id, catatan);

    // Add audit log
    const { logActivity } = await import("@/lib/admin/audit-logger");
    await logActivity({
      modul: "Akademik - KRS",
      aksi: status === "Disetujui" ? "APPROVE" : "REJECT",
      tableName: "krs_header",
      recordId: krsId,
      newData: { status, catatan, approved_by: user.id }
    });

    revalidatePath("/dashboard/krs");
    revalidatePath("/dashboard/akademik/lms");
  } catch (error) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Gagal memproses KRS", message: getErrorMessage(error) }));
  }

  redirect(withToastParams("/dashboard/krs", { variant: "success", title: "Status KRS diperbarui" }));
}

export async function assignDosenWaliAction(formData: FormData) {
  const user = await requireAuthorizedUser("krs", ["Admin", "Prodi"]);

  const mahasiswaId = formData.get("mahasiswaId")?.toString() || "";
  const dosenId = formData.get("dosenId")?.toString() || "";

  if (!mahasiswaId || !dosenId) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Data dosen wali tidak valid" }));
  }

  if (user.role === "Prodi" && !(await canProdiManageMahasiswa(user.id, mahasiswaId))) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Anda hanya dapat mengatur mahasiswa pada prodi Anda" }));
  }

  try {
    const result = await assignDosenWali({ mahasiswaId, dosenId });

    const { logActivity } = await import("@/lib/admin/audit-logger");
    await logActivity({
      modul: "Akademik - Dosen Wali",
      aksi: "UPDATE",
      tableName: "dosen_wali",
      recordId: result.id,
      newData: { mahasiswaId, dosenId },
    });

    revalidatePath("/dashboard/krs");
  } catch (error) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Gagal mengatur dosen wali", message: getErrorMessage(error) }));
  }

  redirect(withToastParams("/dashboard/krs", { variant: "success", title: "Dosen wali diperbarui" }));
}
