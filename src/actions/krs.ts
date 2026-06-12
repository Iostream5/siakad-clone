"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getMahasiswaByUserId } from "@/lib/admin/mahasiswa";
import { canDosenApproveKrs, submitKrs, updateKrsStatus } from "@/lib/admin/krs";
import { withToastParams } from "@/lib/toast-query";
import { requireAuthorizedUser } from "@/lib/auth";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan internal";
}

function isKrsApprovalStatus(value: string): value is "Disetujui" | "Ditolak" {
  return value === "Disetujui" || value === "Ditolak";
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
    redirect(withToastParams("/dashboard/krs", { variant: "success", title: "KRS berhasil diajukan", message: "Menunggu persetujuan Dosen Wali." }));
  } catch (error) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Gagal mengajukan KRS", message: getErrorMessage(error) }));
  }
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
    redirect(withToastParams("/dashboard/krs", { variant: "success", title: "Status KRS diperbarui" }));
  } catch (error) {
    redirect(withToastParams("/dashboard/krs", { variant: "error", title: "Gagal memproses KRS", message: getErrorMessage(error) }));
  }
}
