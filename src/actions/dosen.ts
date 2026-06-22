"use server";

import { revalidatePath } from "next/cache";

import { deleteDosen, upsertDosen } from "@/lib/admin/dosen";
import { requireAuthorizedUser } from "@/lib/auth";
import { dosenSchema } from "@/lib/validators";

export type DosenActionState = {
  success: boolean;
  message: string | null;
};

const initialState: DosenActionState = {
  success: false,
  message: null,
};

export async function upsertDosenAction(
  previousState: DosenActionState = initialState,
  formData: FormData,
): Promise<DosenActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.dosen", ["Admin", "Prodi", "Staff"]);

  const id = formData.get("id")?.toString();
  const rawData = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    nidn: formData.get("nidn"),
    nip: formData.get("nip"),
    gelar: formData.get("gelar"),
    homebaseProdiId: formData.get("homebaseProdiId"),
    statusDosen: formData.get("statusDosen"),
  };

  const validated = dosenSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message ?? "Data dosen tidak valid.",
    };
  }

  try {
    await upsertDosen({ ...validated.data, id });
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan internal",
    };
  }

  revalidatePath("/dashboard/master-data/dosen");
  return {
    success: true,
    message: `Data dosen berhasil ${id ? "diperbarui" : "ditambahkan"}.`,
  };
}

export async function deleteDosenAction(
  previousState: DosenActionState = initialState,
  formData: FormData,
): Promise<DosenActionState> {
  void previousState;
  await requireAuthorizedUser("master-data.dosen", ["Admin", "Prodi", "Staff"]);

  const id = formData.get("id")?.toString();

  if (!id) {
    return {
      success: false,
      message: "ID dosen tidak valid.",
    };
  }

  try {
    await deleteDosen(id);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan internal",
    };
  }

  revalidatePath("/dashboard/master-data/dosen");
  return {
    success: true,
    message: "Data dosen berhasil dihapus.",
  };
}
