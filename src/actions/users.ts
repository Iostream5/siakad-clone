"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/supabase/admin";
import { withToastParams } from "@/lib/toast-query";
import { logActivity } from "@/lib/admin/audit-logger";
import { requireAuthorizedUser } from "@/lib/auth";
import { createClient } from "@/supabase/server";

export async function updateUserAction(prevState: any, formData: FormData) {
  await requireAuthorizedUser("master-data.pengguna", ["Admin"]);

  const id = formData.get("id")?.toString();
  const fullName = formData.get("fullName")?.toString();
  const email = formData.get("email")?.toString();
  const role = formData.get("role")?.toString();
  const isActive = formData.get("isActive") === "on";

  if (!id || !fullName || !email || !role) {
    redirect(withToastParams("/dashboard/master-data/pengguna", { variant: "error", title: "Data tidak lengkap" }));
  }

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  // Fetch old data for audit log
  const { data: oldUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("users")
    .update({ full_name: fullName, email, role, is_active: isActive })
    .eq("id", id);

  if (error) {
    redirect(withToastParams("/dashboard/master-data/pengguna", { variant: "error", title: "Gagal update", message: error.message }));
  }

  // Log the activity
  await logActivity({
    modul: "Master Pengguna",
    aksi: "UPDATE",
    tableName: "users",
    recordId: id,
    oldData: oldUser,
    newData: { full_name: fullName, email, role, is_active: isActive }
  });

  revalidatePath("/dashboard/master-data/pengguna");
  redirect(withToastParams("/dashboard/master-data/pengguna", { variant: "success", title: "Berhasil diperbarui" }));
}

export async function deleteUserAction(prevState: any, formData: FormData) {
  await requireAuthorizedUser("master-data.pengguna", ["Admin"]);

  const id = formData.get("id")?.toString();
  if (!id) redirect(withToastParams("/dashboard/master-data/pengguna", { variant: "error", title: "ID tidak valid" }));

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  // Fetch old data for audit log
  const { data: oldUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("users").update({ deleted_at: new Date().toISOString() }).eq("id", id);

  if (error) {
    redirect(withToastParams("/dashboard/master-data/pengguna", { variant: "error", title: "Gagal menghapus", message: error.message }));
  }

  // Log the activity
  await logActivity({
    modul: "Master Pengguna",
    aksi: "DELETE",
    tableName: "users",
    recordId: id,
    oldData: oldUser,
    newData: { deleted_at: new Date().toISOString() }
  });

  revalidatePath("/dashboard/master-data/pengguna");
  redirect(withToastParams("/dashboard/master-data/pengguna", { variant: "success", title: "Berhasil dihapus" }));
}

export async function resetUserPasswordAction(formData: FormData) {
  await requireAuthorizedUser("master-data.pengguna", ["Admin"]);

  const id = formData.get("id")?.toString();
  if (!id) redirect(withToastParams("/dashboard/master-data/pengguna", { variant: "error", title: "ID tidak valid" }));

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const newPassword = "stai12345";

  const { error } = await supabase.auth.admin.updateUserById(id, {
    password: newPassword,
  });

  if (error) {
    redirect(withToastParams("/dashboard/master-data/pengguna", { variant: "error", title: "Gagal reset password", message: error.message }));
  }

  await logActivity({
    modul: "Master Pengguna",
    aksi: "UPDATE",
    tableName: "users",
    recordId: id,
    newData: { password_reset: true },
  });

  revalidatePath("/dashboard/master-data/pengguna");
  redirect(withToastParams("/dashboard/master-data/pengguna", { variant: "success", title: "Password berhasil direset ke default" }));
}
