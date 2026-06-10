"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteDosen, upsertDosen } from "@/lib/admin/dosen";
import { requireAuthorizedUser } from "@/lib/auth";
import { withToastParams } from "@/lib/toast-query";
import { dosenSchema } from "@/lib/validators";

export async function upsertDosenAction(formData: FormData) {
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
    redirect(
      withToastParams("/dashboard/master-data/dosen", {
        variant: "error",
        title: "Data dosen tidak valid",
        message: validated.error.issues[0]?.message,
      }),
    );
  }

  try {
    await upsertDosen({ ...validated.data, id });
  } catch (error) {
    redirect(
      withToastParams("/dashboard/master-data/dosen", {
        variant: "error",
        title: "Gagal menyimpan dosen",
        message: error instanceof Error ? error.message : "Terjadi kesalahan internal",
      }),
    );
  }

  revalidatePath("/dashboard/master-data/dosen");
  redirect(
    withToastParams("/dashboard/master-data/dosen", {
      variant: "success",
      title: "Berhasil",
      message: `Data dosen berhasil ${id ? "diperbarui" : "ditambahkan"}.`,
    }),
  );
}

export async function deleteDosenAction(formData: FormData) {
  await requireAuthorizedUser("master-data.dosen", ["Admin", "Prodi", "Staff"]);

  const id = formData.get("id")?.toString();

  if (!id) {
    redirect(
      withToastParams("/dashboard/master-data/dosen", {
        variant: "error",
        title: "ID dosen tidak valid",
      }),
    );
  }

  try {
    await deleteDosen(id);
  } catch (error) {
    redirect(
      withToastParams("/dashboard/master-data/dosen", {
        variant: "error",
        title: "Gagal menghapus dosen",
        message: error instanceof Error ? error.message : "Terjadi kesalahan internal",
      }),
    );
  }

  revalidatePath("/dashboard/master-data/dosen");
  redirect(
    withToastParams("/dashboard/master-data/dosen", {
      variant: "success",
      title: "Berhasil",
      message: "Data dosen berhasil dihapus.",
    }),
  );
}
