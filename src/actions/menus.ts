"use server";

import { revalidatePath } from "next/cache";

import { deleteMenu, moveMenu, saveMenu } from "@/lib/admin/menus";
import { requireAuthorizedUser } from "@/lib/auth";
import { logActivity } from "@/lib/admin/audit-logger";
import type { UserRole } from "@/types/domain";

const validRoles: UserRole[] = ["Admin", "Prodi", "Dosen", "Mahasiswa", "Calon Mahasiswa", "Staff", "Keuangan", "Bendahara", "Pimpinan"];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? "Terjadi kesalahan sistem. Permintaan gagal diproses." : "Terjadi kesalahan internal";
}

export type MenuActionState = {
  success: boolean;
  message: string | null;
};

const initialState: MenuActionState = { success: false, message: null };

export async function saveMenuAction(previousState: MenuActionState = initialState, formData: FormData): Promise<MenuActionState> {
  void previousState;
  await requireAuthorizedUser("pengaturan.menu-builder", ["Admin"]);

  const roles = formData.getAll("roles").map((value) => `${value}`.trim()).filter((role): role is UserRole => validRoles.includes(role as UserRole));

  if (roles.length === 0) {
    return { success: false, message: "Pilih minimal satu role yang berhak mengakses menu." };
  }

  try {
    const input = {
      key: `${formData.get("key") ?? ""}`.trim(),
      label: `${formData.get("label") ?? ""}`.trim(),
      href: `${formData.get("href") ?? ""}`.trim(),
      icon: `${formData.get("icon") ?? ""}`.trim(),
      parentKey: `${formData.get("parentKey") ?? ""}`.trim(),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      roles,
      isActive: formData.get("isActive") === "on",
    };
    const menuId = `${formData.get("id") ?? ""}`.trim() || undefined;

    await saveMenu(input, menuId);

    await logActivity({
      modul: "Menu Builder",
      aksi: menuId ? "UPDATE" : "CREATE",
      tableName: "menus",
      recordId: menuId,
      newData: input,
    });

    revalidatePath("/dashboard/pengaturan/menu-builder");
    revalidatePath("/dashboard/pengaturan/akun-akses");
    return { success: true, message: "Menu berhasil disimpan." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function deleteMenuAction(previousState: MenuActionState = initialState, formData: FormData): Promise<MenuActionState> {
  void previousState;
  await requireAuthorizedUser("pengaturan.menu-builder", ["Admin"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  if (!id) return { success: false, message: "Menu tidak valid." };

  try {
    await deleteMenu(id);

    await logActivity({
      modul: "Menu Builder",
      aksi: "DELETE",
      tableName: "menus",
      recordId: id,
    });

    revalidatePath("/dashboard/pengaturan/menu-builder");
    revalidatePath("/dashboard/pengaturan/akun-akses");
    return { success: true, message: "Menu berhasil dihapus." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function moveMenuAction(formData: FormData) {
  await requireAuthorizedUser("pengaturan.menu-builder", ["Admin"]);

  const id = `${formData.get("id") ?? ""}`.trim();
  const direction = `${formData.get("direction") ?? ""}`.trim() as "up" | "down";

  if (!id || (direction !== "up" && direction !== "down")) {
    return;
  }

  try {
    await moveMenu(id, direction);

    await logActivity({
      modul: "Menu Builder",
      aksi: "UPDATE",
      tableName: "menus",
      recordId: id,
      metadata: { direction }
    });

    revalidatePath("/dashboard/pengaturan/menu-builder");
    revalidatePath("/dashboard/pengaturan/akun-akses");
  } catch (error) {
    console.error(getErrorMessage(error));
  }
}
