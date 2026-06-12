"use server";

import { revalidatePath } from "next/cache";

import { bulkDeleteKampus, bulkHardDeleteKampus, bulkRestoreKampus, deleteKampus, hardDeleteKampus, importKampusFromCsv, restoreKampus, saveKampus } from "@/lib/admin/kampus";
import { requireAuthorizedUser } from "@/lib/auth";
import { kampusSchema } from "@/lib/validators";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan internal";
}

export type KampusActionState = {
  success: boolean;
  message: string | null;
};

const initialState: KampusActionState = { success: false, message: null };

export async function saveKampusAction(previousState: KampusActionState = initialState, formData: FormData): Promise<KampusActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kampus", ["Admin", "Prodi", "Staff"]);

  const rawData = {
    kode: `${formData.get("kode") ?? ""}`.trim(),
    nama: `${formData.get("nama") ?? ""}`.trim(),
    alamat: `${formData.get("alamat") ?? ""}`.trim(),
    kota: `${formData.get("kota") ?? ""}`.trim(),
    telepon: `${formData.get("telepon") ?? ""}`.trim(),
    email: `${formData.get("email") ?? ""}`.trim(),
    isAktif: formData.get("isAktif") === "on",
  };

  const validated = kampusSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, message: validated.error.issues[0]?.message ?? "Data kampus tidak valid." };
  }

  try {
    await saveKampus(validated.data, `${formData.get("id") ?? ""}`.trim() || undefined);
    revalidatePath("/dashboard/master-data/kampus");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kampus berhasil disimpan." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function deleteKampusAction(previousState: KampusActionState = initialState, formData: FormData): Promise<KampusActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kampus", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data kampus tidak valid." };

  try {
    await deleteKampus(id);
    revalidatePath("/dashboard/master-data/kampus");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kampus berhasil dihapus." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function restoreKampusAction(previousState: KampusActionState = initialState, formData: FormData): Promise<KampusActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kampus", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data kampus tidak valid." };

  try {
    await restoreKampus(id);
    revalidatePath("/dashboard/master-data/kampus");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kampus berhasil dipulihkan." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function hardDeleteKampusAction(previousState: KampusActionState = initialState, formData: FormData): Promise<KampusActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kampus", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data kampus tidak valid." };

  try {
    await hardDeleteKampus(id);
    revalidatePath("/dashboard/master-data/kampus");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kampus dihapus permanen." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function importKampusAction(previousState: KampusActionState = initialState, formData: FormData): Promise<KampusActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kampus", ["Admin", "Prodi", "Staff"]);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "File CSV belum dipilih." };
  }

  try {
    const content = await file.text();
    const result = await importKampusFromCsv(content);
    revalidatePath("/dashboard/master-data/kampus");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${result.imported} data kampus berhasil diimport.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

function getIds(formData: FormData) {
  return formData
    .getAll("ids")
    .map((value) => `${value}`.trim())
    .filter(Boolean);
}

export async function bulkDeleteKampusAction(previousState: KampusActionState = initialState, formData: FormData): Promise<KampusActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kampus", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkDeleteKampus(ids);
    revalidatePath("/dashboard/master-data/kampus");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data kampus berhasil dipindahkan ke sampah.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function bulkRestoreKampusAction(previousState: KampusActionState = initialState, formData: FormData): Promise<KampusActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kampus", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkRestoreKampus(ids);
    revalidatePath("/dashboard/master-data/kampus");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data kampus berhasil dipulihkan.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function bulkHardDeleteKampusAction(previousState: KampusActionState = initialState, formData: FormData): Promise<KampusActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kampus", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkHardDeleteKampus(ids);
    revalidatePath("/dashboard/master-data/kampus");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data kampus dihapus permanen.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}
