"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteRuangan, upsertRuangan } from "@/lib/admin/ruangan";
import { deleteGedung, saveGedung } from "@/lib/admin/gedung";
import { requireAuthorizedUser } from "@/lib/auth";
import { withToastParams } from "@/lib/toast-query";
import { gedungSchema, ruanganSchema } from "@/lib/validators";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan internal";
}

// GEDUNG ACTIONS
export async function upsertGedungAction(formData: FormData) {
  await requireAuthorizedUser("master-data.ruangan", ["Admin", "Prodi", "Staff"]);

  const id = formData.get("id")?.toString();
  const rawData = {
    kode: formData.get("kode"),
    nama: formData.get("nama"),
    jumlahLantai: Number(formData.get("jumlahLantai")),
    isAktif: formData.get("isAktif") === "on",
  };

  const validated = gedungSchema.safeParse(rawData);
  if (!validated.success) {
    redirect(
      withToastParams("/dashboard/master-data/ruangan", { 
        variant: "error", 
        title: "Data gedung tidak valid",
        message: validated.error.issues[0]?.message 
      })
    );
  }

  try {
    await saveGedung(validated.data, id);
  } catch (error) {
    redirect(withToastParams("/dashboard/master-data/ruangan", { variant: "error", title: "Gagal menyimpan gedung", message: getErrorMessage(error) }));
  }

  revalidatePath("/dashboard/master-data/ruangan");
  redirect(withToastParams("/dashboard/master-data/ruangan", { variant: "success", title: "Gedung disimpan" }));
}

export async function deleteGedungAction(formData: FormData) {
  await requireAuthorizedUser("master-data.ruangan", ["Admin", "Prodi", "Staff"]);

  const id = formData.get("id")?.toString();
  if (!id) return;
  try {
    await deleteGedung(id);
  } catch (error) {
    redirect(withToastParams("/dashboard/master-data/ruangan", { variant: "error", title: "Gagal menghapus gedung", message: getErrorMessage(error) }));
  }
  revalidatePath("/dashboard/master-data/ruangan");
  redirect(withToastParams("/dashboard/master-data/ruangan", { variant: "success", title: "Gedung dihapus" }));
}

// RUANGAN ACTIONS
export async function upsertRuanganAction(formData: FormData) {
  await requireAuthorizedUser("master-data.ruangan", ["Admin", "Prodi", "Staff"]);

  const id = formData.get("id")?.toString();
  const rawData = {
    kode: formData.get("kode"),
    nama: formData.get("nama"),
    gedungId: formData.get("gedungId"),
    lantai: Number(formData.get("lantai")),
    jenisRuangan: formData.get("jenisRuangan"),
    kapasitas: Number(formData.get("kapasitas")),
    isAktif: formData.get("isAktif") === "on",
  };

  const validated = ruanganSchema.safeParse(rawData);
  if (!validated.success) {
    redirect(
      withToastParams("/dashboard/master-data/ruangan", { 
        variant: "error", 
        title: "Data ruangan tidak valid",
        message: validated.error.issues[0]?.message 
      })
    );
  }

  try {
    await upsertRuangan({ ...validated.data, id });
  } catch (error) {
    redirect(withToastParams("/dashboard/master-data/ruangan", { variant: "error", title: "Gagal menyimpan ruangan", message: getErrorMessage(error) }));
  }

  revalidatePath("/dashboard/master-data/ruangan");
  redirect(withToastParams("/dashboard/master-data/ruangan", { variant: "success", title: "Ruangan disimpan" }));
}

export async function deleteRuanganAction(formData: FormData) {
  await requireAuthorizedUser("master-data.ruangan", ["Admin", "Prodi", "Staff"]);

  const id = formData.get("id")?.toString();
  if (!id) return;
  try {
    await deleteRuangan(id);
  } catch (error) {
    redirect(withToastParams("/dashboard/master-data/ruangan", { variant: "error", title: "Gagal menghapus", message: getErrorMessage(error) }));
  }
  revalidatePath("/dashboard/master-data/ruangan");
  redirect(withToastParams("/dashboard/master-data/ruangan", { variant: "success", title: "Berhasil dihapus" }));
}
