"use server";

import { revalidatePath } from "next/cache";

import { requireAuthorizedUser } from "@/lib/auth";
import {
  deleteAcademicYear,
  importAcademicYearsFromCsv,
  saveAcademicYear,
  setAcademicYearKrsOpen,
  setActiveAcademicYear,
} from "@/lib/admin/academic-years";
import { logActivity } from "@/lib/admin/audit-logger";

export type AcademicYearActionState = {
  success: boolean;
  message: string | null;
};

const initialState: AcademicYearActionState = {
  success: false,
  message: null,
};

function toBool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

export async function saveAcademicYearAction(
  previousState: AcademicYearActionState = initialState,
  formData: FormData,
): Promise<AcademicYearActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.tahun-akademik");

  try {
    const id = `${formData.get("id") ?? ""}`.trim() || undefined;
    const data = {
        kode: `${formData.get("kode") ?? ""}`.trim(),
        nama: `${formData.get("nama") ?? ""}`.trim(),
        semester: `${formData.get("semester") ?? ""}`.trim() as "Ganjil" | "Genap" | "Pendek",
        tanggalMulai: `${formData.get("tanggalMulai") ?? ""}`.trim(),
        tanggalSelesai: `${formData.get("tanggalSelesai") ?? ""}`.trim(),
        isAktif: toBool(formData.get("isAktif")),
        isKrsOpen: toBool(formData.get("isKrsOpen")),
    };

    await saveAcademicYear(data, id);

    await logActivity({
      modul: "TAHUN_AKADEMIK",
      aksi: id ? "UPDATE" : "CREATE",
      tableName: "tahun_akademik",
      recordId: id,
      newData: data
    });

    revalidatePath("/dashboard/master-data/tahun-akademik");
    revalidatePath("/dashboard/master-data");
    return {
      success: true,
      message: "Data tahun akademik berhasil disimpan.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menyimpan tahun akademik.",
    };
  }
}

export async function deleteAcademicYearAction(
  previousState: AcademicYearActionState = initialState,
  formData: FormData,
): Promise<AcademicYearActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.tahun-akademik");

  const id = `${formData.get("id") ?? ""}`.trim();

  if (!id) {
    return {
      success: false,
      message: "Data tahun akademik tidak valid.",
    } satisfies AcademicYearActionState;
  }

  try {
    await deleteAcademicYear(id);

    await logActivity({
      modul: "TAHUN_AKADEMIK",
      aksi: "DELETE",
      tableName: "tahun_akademik",
      recordId: id,
    });

    revalidatePath("/dashboard/master-data/tahun-akademik");
    revalidatePath("/dashboard/master-data");

    return {
      success: true,
      message: "Data tahun akademik berhasil dihapus.",
    } satisfies AcademicYearActionState;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menghapus tahun akademik.",
    } satisfies AcademicYearActionState;
  }
}

export async function setActiveAcademicYearAction(
  previousState: AcademicYearActionState = initialState,
  formData: FormData,
): Promise<AcademicYearActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.tahun-akademik");

  const id = `${formData.get("id") ?? ""}`.trim();
  const openKrs = `${formData.get("openKrs") ?? ""}`.trim() === "true";

  if (!id) {
    return {
      success: false,
      message: "Periode akademik tidak valid.",
    } satisfies AcademicYearActionState;
  }

  try {
    await setActiveAcademicYear(id);
    await setAcademicYearKrsOpen(id, openKrs);

    await logActivity({
      modul: "TAHUN_AKADEMIK",
      aksi: "UPDATE",
      tableName: "tahun_akademik",
      recordId: id,
      newData: { set_aktif: true, open_krs: openKrs }
    });

    revalidatePath("/dashboard/master-data/tahun-akademik");
    revalidatePath("/dashboard/master-data");

    return {
      success: true,
      message: openKrs
        ? "Periode aktif berhasil diperbarui dan KRS dibuka."
        : "Periode aktif berhasil diperbarui.",
    } satisfies AcademicYearActionState;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengubah periode aktif.",
    } satisfies AcademicYearActionState;
  }
}

export async function toggleAcademicYearKrsAction(formData: FormData) {
  await requireAuthorizedUser("master-data.tahun-akademik");

  const id = `${formData.get("id") ?? ""}`.trim();
  const open = `${formData.get("open") ?? ""}`.trim() === "true";

  if (!id) {
    return;
  }

  await setAcademicYearKrsOpen(id, open);
  revalidatePath("/dashboard/master-data/tahun-akademik");
  revalidatePath("/dashboard/master-data");
}

export async function importAcademicYearsAction(
  previousState: AcademicYearActionState = initialState,
  formData: FormData,
): Promise<AcademicYearActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.tahun-akademik");

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      success: false,
      message: "File CSV belum dipilih.",
    };
  }

  try {
    const content = await file.text();
    const result = await importAcademicYearsFromCsv(content);

    revalidatePath("/dashboard/master-data/tahun-akademik");
    revalidatePath("/dashboard/master-data");
    return {
      success: true,
      message: `${result.imported} data tahun akademik berhasil diimport.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengimport file CSV.",
    };
  }
}
