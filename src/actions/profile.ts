"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin";

export async function updateProfileAction(formData: FormData) {
  const sessionUser = await requireUser();
  const fullName = formData.get("fullName")?.toString().trim();

  if (!fullName || fullName.length < 3) {
    return { error: "Nama lengkap minimal 3 karakter." };
  }

  const admin = createAdminClient();
  if (!admin) return { error: "Sistem tidak tersedia." };

  try {
    const { error } = await admin.from("users").update({ full_name: fullName }).eq("id", sessionUser.id);

    if (error) throw new Error(error.message);

    await admin.from("audit_logs").insert({
      id_user: sessionUser.id,
      modul: "profil",
      aksi: "UPDATE",
      table_name: "users",
      new_data: { id: sessionUser.id, full_name: fullName },
    });

    revalidatePath("/dashboard/profil");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal memperbarui profil" };
  }
}

export async function changePasswordAction(formData: FormData) {
  const sessionUser = await requireUser();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!password || password.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }

  if (password !== confirmPassword) {
    return { error: "Konfirmasi password tidak cocok." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  if (supabase && admin) {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { error: "Gagal mengganti password." };
    }

    await admin.from("audit_logs").insert({
      id_user: sessionUser.id,
      modul: "profil",
      aksi: "UPDATE",
      table_name: "users",
      new_data: { action: "CHANGE_PASSWORD" },
    });

    return { success: true };
  }

  return { error: "Sistem auth tidak tersedia." };
}
