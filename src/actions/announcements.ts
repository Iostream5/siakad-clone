"use server";

import { revalidatePath } from "next/cache";

import { deleteAnnouncement, upsertAnnouncement } from "@/lib/admin/announcements";
import { requireAuthorizedUser } from "@/lib/auth";

export type AnnouncementActionState = {
  success: boolean;
  message: string | null;
};

const initialState: AnnouncementActionState = {
  success: false,
  message: null,
};

export async function saveAnnouncementAction(
  prevState: AnnouncementActionState = initialState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  void prevState;

  try {
    await requireAuthorizedUser("pengumuman", ["Admin", "Staff", "Prodi"]);

    const id = formData.get("id")?.toString();
    const values = {
      id: id || undefined,
      judul: formData.get("judul")?.toString() || "",
      isi: formData.get("isi")?.toString() || "",
      targetRole: formData.get("targetRole")?.toString() || "Semua",
      isActive: formData.get("isActive") === "on",
    };

    if (!values.judul || !values.isi) {
      return { success: false, message: "Judul dan isi wajib diisi" };
    }

    await upsertAnnouncement(values);
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/pengumuman");
    
    return { success: true, message: "Pengumuman berhasil disimpan" };
  } catch (error) {
    console.error("Error saving announcement:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Gagal menyimpan pengumuman" 
    };
  }
}

export async function deleteAnnouncementAction(
  prevState: AnnouncementActionState = initialState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  void prevState;

  try {
    await requireAuthorizedUser("pengumuman", ["Admin", "Staff", "Prodi"]);

    const id = formData.get("id")?.toString();
    if (!id) {
      return { success: false, message: "ID tidak ditemukan" };
    }

    await deleteAnnouncement(id);
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/pengumuman");
    
    return { success: true, message: "Pengumuman berhasil dihapus" };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Gagal menghapus pengumuman" 
    };
  }
}
