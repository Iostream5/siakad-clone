"use server";

import { revalidatePath } from "next/cache";

import { bulkDeleteKelas, bulkHardDeleteKelas, bulkRestoreKelas, deleteKelas, hardDeleteKelas, importKelasFromCsv, restoreKelas, saveKelas } from "@/lib/admin/kelas";
import { requireAuthorizedUser } from "@/lib/auth";
import { kelasSchema } from "@/lib/validators";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan internal";
}

export type KelasActionState = {
  success: boolean;
  message: string | null;
};

const initialState: KelasActionState = { success: false, message: null };

export async function saveKelasAction(previousState: KelasActionState = initialState, formData: FormData): Promise<KelasActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kelas", ["Admin", "Prodi", "Staff"]);

  const rawData = {
    kode: `${formData.get("kode") ?? ""}`.trim(),
    nama: `${formData.get("nama") ?? ""}`.trim(),
    prodiId: `${formData.get("prodiId") ?? ""}`.trim(),
    angkatan: formData.get("angkatan") ? Number(formData.get("angkatan")) : null,
    tingkat: `${formData.get("tingkat") ?? ""}`.trim(),
    kapasitas: Number(formData.get("kapasitas")),
    isAktif: formData.get("isAktif") === "on",
  };

  const validated = kelasSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, message: validated.error.issues[0]?.message ?? "Data kelas tidak valid." };
  }

  try {
    await saveKelas(validated.data, `${formData.get("id") ?? ""}`.trim() || undefined);
    revalidatePath("/dashboard/master-data/kelas");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kelas berhasil disimpan." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function deleteKelasAction(previousState: KelasActionState = initialState, formData: FormData): Promise<KelasActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kelas", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data kelas tidak valid." };

  try {
    await deleteKelas(id);
    revalidatePath("/dashboard/master-data/kelas");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kelas berhasil dihapus." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function restoreKelasAction(previousState: KelasActionState = initialState, formData: FormData): Promise<KelasActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kelas", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data kelas tidak valid." };

  try {
    await restoreKelas(id);
    revalidatePath("/dashboard/master-data/kelas");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kelas berhasil dipulihkan." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function hardDeleteKelasAction(previousState: KelasActionState = initialState, formData: FormData): Promise<KelasActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kelas", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data kelas tidak valid." };

  try {
    await hardDeleteKelas(id);
    revalidatePath("/dashboard/master-data/kelas");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kelas dihapus permanen." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function importKelasAction(previousState: KelasActionState = initialState, formData: FormData): Promise<KelasActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kelas", ["Admin", "Prodi", "Staff"]);

  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false, message: "File CSV belum dipilih." };

  try {
    const content = await file.text();
    const result = await importKelasFromCsv(content);
    revalidatePath("/dashboard/master-data/kelas");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${result.imported} data kelas berhasil diimport.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

function getIds(formData: FormData) {
  return formData.getAll("ids").map((value) => `${value}`.trim()).filter(Boolean);
}

export async function bulkDeleteKelasAction(previousState: KelasActionState = initialState, formData: FormData): Promise<KelasActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kelas", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkDeleteKelas(ids);
    revalidatePath("/dashboard/master-data/kelas");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data kelas berhasil dipindahkan ke sampah.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function bulkRestoreKelasAction(previousState: KelasActionState = initialState, formData: FormData): Promise<KelasActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kelas", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkRestoreKelas(ids);
    revalidatePath("/dashboard/master-data/kelas");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data kelas berhasil dipulihkan.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function bulkHardDeleteKelasAction(previousState: KelasActionState = initialState, formData: FormData): Promise<KelasActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kelas", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkHardDeleteKelas(ids);
    revalidatePath("/dashboard/master-data/kelas");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data kelas dihapus permanen.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}
