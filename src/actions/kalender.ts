"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/supabase/admin";
import { withToastParams } from "@/lib/toast-query";
import { requireAuthorizedUser } from "@/lib/auth";

export async function addKalenderEventAction(formData: FormData) {
  const user = await requireAuthorizedUser("akademik.kalender", ["Admin", "Prodi"]);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase client not available");

  const judul = formData.get("judul")?.toString() || "";
  const deskripsi = formData.get("deskripsi")?.toString() || "";
  const tanggal_mulai = formData.get("tanggal_mulai")?.toString() || "";
  const tanggal_selesai = formData.get("tanggal_selesai")?.toString() || "";
  const kategori = formData.get("kategori")?.toString() || "LAINNYA";
  const tahun_akademik_id = formData.get("tahun_akademik_id")?.toString() || "";

  if (!judul || !tanggal_mulai || !tanggal_selesai || !tahun_akademik_id) {
    redirect(withToastParams("/dashboard/kalender", { variant: "error", title: "Data tidak lengkap" }));
  }

  const { error } = await supabase.from("kalender_akademik").insert({
    judul,
    deskripsi,
    tanggal_mulai,
    tanggal_selesai,
    kategori,
    tahun_akademik_id,
    is_active: true
  });

  if (error) {
    redirect(withToastParams("/dashboard/kalender", { variant: "error", title: "Gagal menyimpan", message: error.message }));
  }

  revalidatePath("/dashboard/kalender");
  redirect(withToastParams("/dashboard/kalender", { variant: "success", title: "Event berhasil ditambahkan" }));
}

export async function deleteKalenderEventAction(formData: FormData) {
  await requireAuthorizedUser("akademik.kalender", ["Admin", "Prodi"]);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase client not available");

  const id = formData.get("id")?.toString();
  if (!id) redirect(withToastParams("/dashboard/kalender", { variant: "error", title: "ID tidak valid" }));

  const { error } = await supabase.from("kalender_akademik").delete().eq("id", id);

  if (error) {
    redirect(withToastParams("/dashboard/kalender", { variant: "error", title: "Gagal menghapus", message: error.message }));
  }

  revalidatePath("/dashboard/kalender");
  redirect(withToastParams("/dashboard/kalender", { variant: "success", title: "Event berhasil dihapus" }));
}
