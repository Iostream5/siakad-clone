"use server";

import { revalidatePath } from "next/cache";

import { bulkDeleteKurikulum, bulkHardDeleteKurikulum, bulkRestoreKurikulum, deleteKurikulum, hardDeleteKurikulum, importKurikulumFromCsv, restoreKurikulum, saveKurikulum } from "@/lib/admin/kurikulum";
import { requireAuthorizedUser } from "@/lib/auth";
import { kurikulumSchema } from "@/lib/validators";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan internal";
}

export type KurikulumActionState = {
  success: boolean;
  message: string | null;
};

const initialState: KurikulumActionState = { success: false, message: null };

export async function saveKurikulumAction(previousState: KurikulumActionState = initialState, formData: FormData): Promise<KurikulumActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kurikulum", ["Admin", "Prodi", "Staff"]);

  const rawData = {
    kode: `${formData.get("kode") ?? ""}`.trim(),
    nama: `${formData.get("nama") ?? ""}`.trim(),
    prodiId: `${formData.get("prodiId") ?? ""}`.trim(),
    tahunMulai: Number(formData.get("tahunMulai")),
    totalSks: Number(formData.get("totalSks")),
    deskripsi: `${formData.get("deskripsi") ?? ""}`.trim(),
    isAktif: formData.get("isAktif") === "on",
  };

  const validated = kurikulumSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, message: validated.error.issues[0]?.message ?? "Data kurikulum tidak valid." };
  }

  try {
    await saveKurikulum(validated.data, `${formData.get("id") ?? ""}`.trim() || undefined);
    revalidatePath("/dashboard/master-data/kurikulum");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kurikulum berhasil disimpan." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function deleteKurikulumAction(previousState: KurikulumActionState = initialState, formData: FormData): Promise<KurikulumActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kurikulum", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data kurikulum tidak valid." };

  try {
    await deleteKurikulum(id);
    revalidatePath("/dashboard/master-data/kurikulum");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kurikulum berhasil dihapus." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function restoreKurikulumAction(previousState: KurikulumActionState = initialState, formData: FormData): Promise<KurikulumActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kurikulum", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data kurikulum tidak valid." };

  try {
    await restoreKurikulum(id);
    revalidatePath("/dashboard/master-data/kurikulum");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kurikulum berhasil dipulihkan." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function hardDeleteKurikulumAction(previousState: KurikulumActionState = initialState, formData: FormData): Promise<KurikulumActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kurikulum", ["Admin", "Prodi", "Staff"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Data kurikulum tidak valid." };

  try {
    await hardDeleteKurikulum(id);
    revalidatePath("/dashboard/master-data/kurikulum");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: "Data kurikulum dihapus permanen." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function importKurikulumAction(previousState: KurikulumActionState = initialState, formData: FormData): Promise<KurikulumActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kurikulum", ["Admin", "Prodi", "Staff"]);

  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false, message: "File CSV belum dipilih." };

  try {
    const content = await file.text();
    const result = await importKurikulumFromCsv(content);
    revalidatePath("/dashboard/master-data/kurikulum");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${result.imported} data kurikulum berhasil diimport.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

function getIds(formData: FormData) {
  return formData.getAll("ids").map((value) => `${value}`.trim()).filter(Boolean);
}

export async function bulkDeleteKurikulumAction(previousState: KurikulumActionState = initialState, formData: FormData): Promise<KurikulumActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kurikulum", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkDeleteKurikulum(ids);
    revalidatePath("/dashboard/master-data/kurikulum");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data kurikulum berhasil dipindahkan ke sampah.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function bulkRestoreKurikulumAction(previousState: KurikulumActionState = initialState, formData: FormData): Promise<KurikulumActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kurikulum", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkRestoreKurikulum(ids);
    revalidatePath("/dashboard/master-data/kurikulum");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data kurikulum berhasil dipulihkan.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function bulkHardDeleteKurikulumAction(previousState: KurikulumActionState = initialState, formData: FormData): Promise<KurikulumActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.kurikulum", ["Admin", "Prodi", "Staff"]);
  const ids = getIds(formData);
  if (ids.length === 0) return { success: false, message: "Pilih minimal satu data." };
  try {
    await bulkHardDeleteKurikulum(ids);
    revalidatePath("/dashboard/master-data/kurikulum");
    revalidatePath("/dashboard/master-data");
    return { success: true, message: `${ids.length} data kurikulum dihapus permanen.` };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}
