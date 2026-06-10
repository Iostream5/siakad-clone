"use server";

import { revalidatePath } from "next/cache";

import { deleteFaculty, importFacultiesFromCsv, saveFaculty } from "@/lib/admin/faculties";
import { requireAuthorizedUser } from "@/lib/auth";

export type FacultyActionState = {
  success: boolean;
  message: string | null;
};

const initialState: FacultyActionState = {
  success: false,
  message: null,
};

function toBool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

export async function saveFacultyAction(
  previousState: FacultyActionState = initialState,
  formData: FormData,
): Promise<FacultyActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.fakultas");

  try {
    await saveFaculty(
      {
        kode: `${formData.get("kode") ?? ""}`.trim(),
        nama: `${formData.get("nama") ?? ""}`.trim(),
        dekan: `${formData.get("dekan") ?? ""}`.trim(),
        deskripsi: `${formData.get("deskripsi") ?? ""}`.trim(),
        isAktif: toBool(formData.get("isAktif")),
      },
      `${formData.get("id") ?? ""}`.trim() || undefined,
    );

    revalidatePath("/dashboard/master-data/fakultas");
    revalidatePath("/dashboard/master-data");
    return {
      success: true,
      message: "Data fakultas berhasil disimpan.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menyimpan fakultas.",
    };
  }
}

export async function deleteFacultyAction(
  previousState: FacultyActionState = initialState,
  formData: FormData,
): Promise<FacultyActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.fakultas");

  const id = `${formData.get("id") ?? ""}`.trim();

  if (!id) {
    return {
      success: false,
      message: "Data fakultas tidak valid.",
    } satisfies FacultyActionState;
  }

  try {
    await deleteFaculty(id);
    revalidatePath("/dashboard/master-data/fakultas");
    revalidatePath("/dashboard/master-data");

    return {
      success: true,
      message: "Data fakultas berhasil dihapus.",
    } satisfies FacultyActionState;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menghapus fakultas.",
    } satisfies FacultyActionState;
  }
}

export async function importFacultiesAction(
  previousState: FacultyActionState = initialState,
  formData: FormData,
): Promise<FacultyActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.fakultas");

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      success: false,
      message: "File CSV belum dipilih.",
    };
  }

  try {
    const content = await file.text();
    const result = await importFacultiesFromCsv(content);

    revalidatePath("/dashboard/master-data/fakultas");
    revalidatePath("/dashboard/master-data");
    return {
      success: true,
      message: `${result.imported} data fakultas berhasil diimport.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengimport data fakultas.",
    };
  }
}
