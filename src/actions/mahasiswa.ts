"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteMahasiswa, upsertMahasiswa, searchMahasiswaDynamic } from "@/lib/admin/mahasiswa";
import { requireAuthorizedUser } from "@/lib/auth";
import { withToastParams } from "@/lib/toast-query";
import { mahasiswaSchema } from "@/lib/validators";

export async function searchMahasiswaAction(query: string) {
  await requireAuthorizedUser("master-data.mahasiswa"); // Basic check
  try {
    return await searchMahasiswaDynamic(query);
  } catch (error) {
    console.error("Search Action Error:", error);
    return [];
  }
}

export async function upsertMahasiswaAction(formData: FormData) {
  await requireAuthorizedUser("master-data.mahasiswa", ["Admin", "Prodi", "Staff"]);

  const id = formData.get("id")?.toString();
  const rawData = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    nim: formData.get("nim"),
    namaIbuKandung: formData.get("namaIbuKandung"),
    tempatLahir: formData.get("tempatLahir"),
    tanggalLahir: formData.get("tanggalLahir"),
    angkatan: Number(formData.get("angkatan")),
    prodiId: formData.get("prodiId"),
    statusMahasiswa: formData.get("statusMahasiswa"),
  };

  const validated = mahasiswaSchema.safeParse(rawData);

  if (!validated.success) {
    redirect(
      withToastParams("/dashboard/master-data/mahasiswa", {
        variant: "error",
        title: "Data mahasiswa tidak valid",
        message: validated.error.issues[0]?.message,
      }),
    );
  }

  try {
    await upsertMahasiswa({ ...validated.data, id });
  } catch (error) {
    redirect(
      withToastParams("/dashboard/master-data/mahasiswa", {
        variant: "error",
        title: "Gagal menyimpan mahasiswa",
        message: error instanceof Error ? error.message : "Terjadi kesalahan internal",
      }),
    );
  }

  revalidatePath("/dashboard/master-data/mahasiswa");
  redirect(
    withToastParams("/dashboard/master-data/mahasiswa", {
      variant: "success",
      title: "Berhasil",
      message: `Data mahasiswa berhasil ${id ? "diperbarui" : "ditambahkan"}.`,
    }),
  );
}

export async function deleteMahasiswaAction(formData: FormData) {
  await requireAuthorizedUser("master-data.mahasiswa", ["Admin", "Prodi", "Staff"]);

  const id = formData.get("id")?.toString();

  if (!id) {
    redirect(
      withToastParams("/dashboard/master-data/mahasiswa", {
        variant: "error",
        title: "ID mahasiswa tidak valid",
      }),
    );
  }

  try {
    await deleteMahasiswa(id);
  } catch (error) {
    redirect(
      withToastParams("/dashboard/master-data/mahasiswa", {
        variant: "error",
        title: "Gagal menghapus mahasiswa",
        message: error instanceof Error ? error.message : "Terjadi kesalahan internal",
      }),
    );
  }

  revalidatePath("/dashboard/master-data/mahasiswa");
  redirect(
    withToastParams("/dashboard/master-data/mahasiswa", {
      variant: "success",
      title: "Berhasil",
      message: "Data mahasiswa berhasil dihapus.",
    }),
  );
}
