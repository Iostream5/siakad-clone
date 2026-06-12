"use server";

import { revalidatePath } from "next/cache";
import { saveJadwalKuliah, deleteJadwalKuliah } from "@/lib/admin/jadwal-kuliah";
import { requireAuthorizedUser } from "@/lib/auth";
import { logActivity } from "@/lib/admin/audit-logger";

export async function saveJadwalKuliahAction(formData: FormData) {
  await requireAuthorizedUser("master-data.jadwal-kuliah", ["Admin", "Prodi"]);

  const id = formData.get("id")?.toString() || undefined;
  const data = {
    tahunAkademikId: formData.get("tahunAkademikId")?.toString() || "",
    mataKuliahId: formData.get("mataKuliahId")?.toString() || "",
    dosenId: formData.get("dosenId")?.toString() || "",
    namaKelas: formData.get("namaKelas")?.toString() || "",
    hari: formData.get("hari")?.toString() || "",
    jamMulai: formData.get("jamMulai")?.toString() || "",
    jamSelesai: formData.get("jamSelesai")?.toString() || "",
    ruangan: formData.get("ruangan")?.toString() || "",
    kapasitas: Number(formData.get("kapasitas") || 40),
  };

  try {
    await saveJadwalKuliah(data, id);
    await logActivity({
      modul: "Master Data - Jadwal Kuliah",
      aksi: id ? "UPDATE" : "CREATE",
      tableName: "jadwal_kuliah",
      newData: data,
    });
    revalidatePath("/dashboard/master-data/jadwal-kuliah");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteJadwalKuliahAction(formData: FormData) {
  await requireAuthorizedUser("master-data.jadwal-kuliah", ["Admin", "Prodi"]);

  const id = formData.get("id")?.toString() || "";
  try {
    await deleteJadwalKuliah(id);
    await logActivity({
      modul: "Master Data - Jadwal Kuliah",
      aksi: "DELETE",
      tableName: "jadwal_kuliah",
      recordId: id,
    });
    revalidatePath("/dashboard/master-data/jadwal-kuliah");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}