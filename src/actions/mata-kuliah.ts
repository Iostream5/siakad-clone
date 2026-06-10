"use server";

import { revalidatePath } from "next/cache";

import { deleteMataKuliah, importMataKuliahFromCsv, saveMataKuliah } from "@/lib/admin/mata-kuliah";
import { requireAuthorizedUser } from "@/lib/auth";

export type MataKuliahActionState = {
  success: boolean;
  message: string | null;
};

const initialState: MataKuliahActionState = {
  success: false,
  message: null,
};

function toBool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function toNumber(value: FormDataEntryValue | null) {
  const parsed = Number(`${value ?? ""}`.trim());
  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function saveMataKuliahAction(
  previousState: MataKuliahActionState = initialState,
  formData: FormData,
): Promise<MataKuliahActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.mata-kuliah");

  try {
    await saveMataKuliah(
      {
        kode: `${formData.get("kode") ?? ""}`.trim(),
        nama: `${formData.get("nama") ?? ""}`.trim(),
        sks: toNumber(formData.get("sks")),
        semester: toNumber(formData.get("semester")),
        jenis: `${formData.get("jenis") ?? ""}`.trim() || "Wajib",
        prodiId: `${formData.get("prodiId") ?? ""}`.trim(),
        isAktif: toBool(formData.get("isAktif")),
      },
      `${formData.get("id") ?? ""}`.trim() || undefined,
    );

    revalidatePath("/dashboard/master-data/mata-kuliah");
    revalidatePath("/dashboard/master-data");
    return {
      success: true,
      message: "Data mata kuliah berhasil disimpan.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menyimpan mata kuliah.",
    };
  }
}

export async function deleteMataKuliahAction(
  previousState: MataKuliahActionState = initialState,
  formData: FormData,
): Promise<MataKuliahActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.mata-kuliah");

  const id = `${formData.get("id") ?? ""}`.trim();

  if (!id) {
    return {
      success: false,
      message: "Data mata kuliah tidak valid.",
    } satisfies MataKuliahActionState;
  }

  try {
    await deleteMataKuliah(id);
    revalidatePath("/dashboard/master-data/mata-kuliah");
    revalidatePath("/dashboard/master-data");

    return {
      success: true,
      message: "Data mata kuliah berhasil dihapus.",
    } satisfies MataKuliahActionState;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menghapus mata kuliah.",
    } satisfies MataKuliahActionState;
  }
}

export async function importMataKuliahAction(
  previousState: MataKuliahActionState = initialState,
  formData: FormData,
): Promise<MataKuliahActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.mata-kuliah");

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      success: false,
      message: "File CSV belum dipilih.",
    };
  }

  try {
    const content = await file.text();
    const result = await importMataKuliahFromCsv(content);

    revalidatePath("/dashboard/master-data/mata-kuliah");
    revalidatePath("/dashboard/master-data");
    return {
      success: true,
      message: `${result.imported} data mata kuliah berhasil diimport.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengimport mata kuliah.",
    };
  }
}

