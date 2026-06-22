"use server";

import { revalidatePath } from "next/cache";

import { bulkDeleteGedung, bulkHardDeleteGedung, bulkRestoreGedung, deleteGedung, hardDeleteGedung, importGedungFromCsv, restoreGedung, saveGedung } from "@/lib/admin/gedung";
import { requireAuthorizedUser } from "@/lib/auth";
import { gedungSchema } from "@/lib/validators";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan internal";
}

export type GedungActionState = {
  success: boolean;
  message: string | null;
};

const initialState: GedungActionState = { success: false, message: null };

export async function saveGedungAction(previousState: GedungActionState = initialState, formData: FormData): Promise<GedungActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.gedung", ["Admin", "Prodi", "Staff"]);

  const rawData = {
    kode: `${formData.get("kode") ?? ""}`.trim(),
    nama: `${formData.get("nama") ?? ""}`.trim(),
    jumlahLantai: parseInt(`${formData.get("jumlahLantai") ?? "1"}`.trim(), 10),
    keterangan: `${formData.get("keterangan") ?? ""}`.trim(),
    isAktif: formData.get("isAktif") === "on",
  };

  const validated = gedungSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, message: validated.error.issues[0]?.message ?? "Data gedung tidak valid." };
  }

  try {
    await saveGedung(validated.data, `${formData.get("id") ?? ""}`.trim() || undefined);
    revalidatePath("/dashboard/master-data/gedung");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data gedung berhasil disimpan." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function deleteGedungAction(previousState: GedungActionState = initialState, formData: FormData): Promise<GedungActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.gedung", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data gedung tidak valid." };

  try {
    await deleteGedung(id);
    revalidatePath("/dashboard/master-data/gedung");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data gedung berhasil dihapus." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function restoreGedungAction(previousState: GedungActionState = initialState, formData: FormData): Promise<GedungActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.gedung", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data gedung tidak valid." };

  try {
    await restoreGedung(id);
    revalidatePath("/dashboard/master-data/gedung");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data gedung berhasil dipulihkan." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function hardDeleteGedungAction(previousState: GedungActionState = initialState, formData: FormData): Promise<GedungActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.gedung", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data gedung tidak valid." };

  try {
    await hardDeleteGedung(id);
    revalidatePath("/dashboard/master-data/gedung");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data gedung dihapus permanen." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function importGedungAction(previousState: GedungActionState = initialState, formData: FormData): Promise<GedungActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.gedung", ["Admin", "Prodi", "Staff"]);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "File CSV belum dipilih." };
  }

  try {
    const content = await file.text();
    const result = await importGedungFromCsv(content);
    revalidatePath("/dashboard/master-data/gedung");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${result.imported} data gedung berhasil diimport.` };
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

export async function bulkDeleteGedungAction(previousState: GedungActionState = initialState, formData: FormData): Promise<GedungActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.gedung", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkDeleteGedung(ids);
    revalidatePath("/dashboard/master-data/gedung");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data gedung berhasil dipindahkan ke sampah.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function bulkRestoreGedungAction(previousState: GedungActionState = initialState, formData: FormData): Promise<GedungActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.gedung", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkRestoreGedung(ids);
    revalidatePath("/dashboard/master-data/gedung");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data gedung berhasil dipulihkan.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function bulkHardDeleteGedungAction(previousState: GedungActionState = initialState, formData: FormData): Promise<GedungActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.gedung", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkHardDeleteGedung(ids);
    revalidatePath("/dashboard/master-data/gedung");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data gedung dihapus permanen.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}
