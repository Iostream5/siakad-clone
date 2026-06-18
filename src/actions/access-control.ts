"use server";

import { redirect } from "next/navigation";

import { saveRoleAccessConfig, saveUserRoles } from "@/lib/admin/access-control";
import { requireAuthorizedUser } from "@/lib/auth";
import { logActivity } from "@/lib/admin/audit-logger";
import { roles } from "@/lib/constants";
import { withToastParams } from "@/lib/toast-query";
import type { UserRole } from "@/types/domain";

export async function saveUserRolesAction(formData: FormData) {
  await requireAuthorizedUser("pengaturan.akun-akses", ["Admin"]);

  const userId = `${formData.get("userId") ?? ""}`.trim();
  const activeRole = `${formData.get("activeRole") ?? ""}`.trim() as UserRole;
  const selectedRoles = formData.getAll("roles").map((value) => `${value}`.trim() as UserRole);

  if (!userId) {
    redirect(
      withToastParams("/dashboard/pengaturan/akun-akses", {
        variant: "error",
        title: "Pengguna belum dipilih",
      }),
    );
  }

  if (!roles.includes(activeRole)) {
    redirect(
      withToastParams(`/dashboard/pengaturan/akun-akses?user=${userId}`, {
        variant: "error",
        title: "Role aktif tidak valid",
      }),
    );
  }

  try {
    await saveUserRoles(userId, activeRole, selectedRoles);

    await logActivity({
      modul: "Akun & Akses",
      aksi: "UPDATE",
      tableName: "user_roles",
      recordId: userId,
      newData: { activeRole, selectedRoles },
    });
  } catch (error) {
    const message = "Terjadi kesalahan sistem. Permintaan gagal diproses.";
    redirect(
      withToastParams(`/dashboard/pengaturan/akun-akses?user=${userId}`, {
        variant: "error",
        title: "Role pengguna gagal disimpan",
        message,
      }),
    );
  }

  redirect(
    withToastParams(`/dashboard/pengaturan/akun-akses?user=${userId}`, {
      variant: "success",
      title: "Role pengguna diperbarui",
      message: "Multi-role dan role aktif berhasil disimpan.",
    }),
  );
}

export async function saveRoleAccessAction(formData: FormData) {
  await requireAuthorizedUser("pengaturan.akun-akses", ["Admin"]);

  const role = `${formData.get("role") ?? ""}`.trim() as UserRole;
  const selectedMenuKeys = formData.getAll("menuKeys").map(String);
  const selectedUserId = `${formData.get("selectedUserId") ?? ""}`.trim();

  if (!roles.includes(role)) {
    const userQuery = selectedUserId ? `user=${selectedUserId}&` : "";
    redirect(
      withToastParams(`/dashboard/pengaturan/akun-akses?${userQuery}`.replace(/[?&]$/, ""), {
        variant: "error",
        title: "Role konfigurasi tidak valid",
      }),
    );
  }

  try {
    await saveRoleAccessConfig(role, selectedMenuKeys);

    await logActivity({
      modul: "Akun & Akses",
      aksi: "UPDATE",
      tableName: "role_menu_permissions",
      newData: { role, selectedMenuKeys },
    });
  } catch (error) {
    const message = "Terjadi kesalahan sistem. Permintaan gagal diproses.";
    const userQuery = selectedUserId ? `user=${selectedUserId}&` : "";
    redirect(
      withToastParams(`/dashboard/pengaturan/akun-akses?${userQuery}role=${role}`, {
        variant: "error",
        title: "Akses role gagal disimpan",
        message,
      }),
    );
  }

  const userQuery = selectedUserId ? `user=${selectedUserId}&` : "";
  redirect(
    withToastParams(`/dashboard/pengaturan/akun-akses?${userQuery}role=${role}`, {
      variant: "success",
      title: "Akses role diperbarui",
      message: `Hak akses menu untuk role ${role} berhasil disimpan.`,
    }),
  );
}
