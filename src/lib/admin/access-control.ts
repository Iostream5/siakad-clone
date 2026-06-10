import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { applyMenuOverrides, menuDefinitions } from "@/lib/access-control";
import { roles } from "@/lib/constants";
import type { SidebarItem, UserRole } from "@/types/domain";
import { getMenuRowsForAccess, type MenuRow } from "@/lib/admin/menus";

type RolePermissionRow = {
  menu_key: string;
  is_allowed: boolean;
};

type UserRoleRow = {
  role: UserRole;
};

type MenuTreeItem = {
  key: string;
  href: string;
  label: string;
  roles: UserRole[];
  children?: MenuTreeItem[];
};

export type ManagedUserRow = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  availableRoles: UserRole[];
};

export type RoleAccessContext = {
  resolvedRole: UserRole;
  allowedMenuKeys: string[];
  sidebarItems: SidebarItem[];
  roleOverrides: RolePermissionRow[];
};

export type AccountAccessPageData = {
  users: ManagedUserRow[];
  selectedUser: ManagedUserRow | null;
  selectedRole: UserRole;
  roleOverrides: RolePermissionRow[];
  allowedMenuKeys: string[];
  error: string | null;
};

function uniqueRoles(values: UserRole[]) {
  return Array.from(new Set(values)).filter((value): value is UserRole => roles.includes(value));
}

function getFallbackMenuRows(): MenuRow[] {
  return menuDefinitions.map((item, index) => ({
    id: `fallback-${item.key}`,
    key: item.key,
    label: item.label,
    href: item.href,
    icon: null,
    parent_key: item.parentKey,
    sort_order: index * 10,
    roles: item.roles,
    is_active: true,
    updated_at: new Date().toISOString(),
  }));
}

function resolveMenuRows(rows: MenuRow[]) {
  return rows.length > 0 ? rows : getFallbackMenuRows();
}

function buildSidebarTree(rows: MenuRow[]): MenuTreeItem[] {
  const activeRows = rows.filter((row) => row.is_active);
  const byParent = new Map<string | null, MenuRow[]>();

  activeRows.forEach((row) => {
    const parentKey = row.parent_key ?? null;
    const bucket = byParent.get(parentKey) ?? [];
    bucket.push(row);
    byParent.set(parentKey, bucket);
  });

  const sortRows = (items: MenuRow[]) => [...items].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));

  const build = (parentKey: string | null): MenuTreeItem[] =>
    sortRows(byParent.get(parentKey) ?? []).map((row) => {
      const children = build(row.key);
      const rolesResolved = row.roles.length > 0 ? row.roles : menuDefinitions.find((item) => item.key === row.key)?.roles ?? roles;

      return {
        key: row.key,
        href: row.href,
        label: row.label,
        roles: rolesResolved,
        children: children.length > 0 ? children : undefined,
      };
    });

  return build(null);
}

function filterSidebarTreeByAccess(items: MenuTreeItem[], allowedKeys: Set<string>): MenuTreeItem[] {
  return items.flatMap((item) => {
    const visibleChildren = item.children ? filterSidebarTreeByAccess(item.children, allowedKeys) : [];

    if (!allowedKeys.has(item.key) && visibleChildren.length === 0) {
      return [];
    }

    const nextItem: MenuTreeItem = {
      key: item.key,
      href: item.href,
      label: item.label,
      roles: item.roles,
      ...(visibleChildren.length > 0 ? { children: visibleChildren } : {}),
    };

    return [nextItem];
  });
}

function getDefaultMenuKeysFromRows(rows: MenuRow[], role: UserRole) {
  return new Set(
    rows
      .filter((item) => item.is_active)
      .filter((item) => (item.roles.length > 0 ? item.roles : menuDefinitions.find((entry) => entry.key === item.key)?.roles ?? []).includes(role))
      .map((item) => item.key),
  );
}

async function getUserRolesMap(userIds: string[]) {
  const supabase = createAdminClient();

  if (!supabase || userIds.length === 0) {
    return new Map<string, UserRole[]>();
  }

  const result = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);

  if (result.error?.code === "42P01") {
    return new Map<string, UserRole[]>();
  }

  const map = new Map<string, UserRole[]>();

  (result.data ?? []).forEach((row) => {
    const userId = `${row.user_id ?? ""}`;
    const role = row.role as UserRole;

    if (!userId || !roles.includes(role)) {
      return;
    }

    const current = map.get(userId) ?? [];
    current.push(role);
    map.set(userId, current);
  });

  return map;
}

async function getRolePermissionOverrides(role: UserRole) {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      data: [] as RolePermissionRow[],
      error: "Konfigurasi service role Supabase belum tersedia di server.",
    };
  }

  const result = await supabase
    .from("role_menu_permissions")
    .select("menu_key, is_allowed")
    .eq("role", role);

  if (result.error?.code === "42P01") {
    return {
      data: [] as RolePermissionRow[],
      error: null,
    };
  }

  return {
    data: (result.data ?? []) as RolePermissionRow[],
    error: result.error?.message ?? null,
  };
}

export async function getAssignedRoles(userId: string, fallbackRole: UserRole) {
  const supabase = createAdminClient();

  if (!supabase) {
    return [fallbackRole];
  }

  const result = await supabase.from("user_roles").select("role").eq("user_id", userId);

  if (result.error?.code === "42P01") {
    return [fallbackRole];
  }

  const assignedRoles = uniqueRoles(((result.data ?? []) as UserRoleRow[]).map((item) => item.role));
  return assignedRoles.length > 0 ? assignedRoles : [fallbackRole];
}

export async function getRoleAccessContext(role: UserRole): Promise<RoleAccessContext> {
  const menuRows = resolveMenuRows(await getMenuRowsForAccess());
  const permissionResult = await getRolePermissionOverrides(role);
  const allowedMenuKeys = Array.from(applyMenuOverrides(getDefaultMenuKeysFromRows(menuRows, role), permissionResult.data));

  return {
    resolvedRole: role,
    allowedMenuKeys,
    sidebarItems: filterSidebarTreeByAccess(buildSidebarTree(menuRows), new Set(allowedMenuKeys)) as SidebarItem[],
    roleOverrides: permissionResult.data,
  };
}

export async function getUserAccessContext(userId: string, fallbackRole: UserRole): Promise<RoleAccessContext> {
  const supabase = createAdminClient();
  const menuRows = resolveMenuRows(await getMenuRowsForAccess());

  if (!supabase) {
    return getRoleAccessContext(fallbackRole);
  }

  const userResult = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  const baseRole = roles.includes(userResult.data?.role as UserRole)
    ? (userResult.data?.role as UserRole)
    : fallbackRole;
  const assignedRoles = await getAssignedRoles(userId, baseRole);
  const resolvedRole = assignedRoles.includes(fallbackRole) ? fallbackRole : assignedRoles[0];
  const accessContext = await getRoleAccessContext(resolvedRole);

  return {
    ...accessContext,
    sidebarItems: filterSidebarTreeByAccess(buildSidebarTree(menuRows), new Set(accessContext.allowedMenuKeys)) as SidebarItem[],
  };
}

export async function getManagedUserById(userId: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    return null;
  }

  const result = await supabase
    .from("users")
    .select("id, full_name, email, role, is_active, created_at")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!result.data) {
    return null;
  }

  const availableRoles = await getAssignedRoles(result.data.id, result.data.role as UserRole);

  return {
    ...(result.data as Omit<ManagedUserRow, "availableRoles">),
    availableRoles,
  } satisfies ManagedUserRow;
}

export async function getAccountAccessPageData(selectedUserId?: string, selectedRoleParam?: string): Promise<AccountAccessPageData> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      users: [],
      selectedUser: null,
      selectedRole: "Admin",
      roleOverrides: [],
      allowedMenuKeys: [],
      error: "Konfigurasi service role Supabase belum tersedia di server.",
    };
  }

  const usersResult = await supabase
    .from("users")
    .select("id, full_name, email, role, is_active, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const baseUsers = (usersResult.data ?? []) as Array<Omit<ManagedUserRow, "availableRoles">>;
  const rolesMap = await getUserRolesMap(baseUsers.map((item) => item.id));
  const users = baseUsers.map((item) => ({
    ...item,
    availableRoles: uniqueRoles([...(rolesMap.get(item.id) ?? []), item.role]),
  }));

  const selectedUser = users.find((item) => item.id === selectedUserId) ?? users[0] ?? null;
  const selectedRole = roles.includes(selectedRoleParam as UserRole)
    ? (selectedRoleParam as UserRole)
    : selectedUser?.role ?? "Admin";
  const accessContext = await getRoleAccessContext(selectedRole);

  return {
    users,
    selectedUser,
    selectedRole,
    roleOverrides: accessContext.roleOverrides,
    allowedMenuKeys: accessContext.allowedMenuKeys,
    error: usersResult.error?.message ?? null,
  };
}

export async function saveUserRoles(userId: string, activeRole: UserRole, selectedRoles: UserRole[]) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const assignedRoles = uniqueRoles(selectedRoles);

  if (assignedRoles.length === 0) {
    throw new Error("Pilih minimal satu role untuk pengguna.");
  }

  if (!assignedRoles.includes(activeRole)) {
    throw new Error("Role aktif harus termasuk dalam daftar role pengguna.");
  }

  const updateUserResult = await supabase.from("users").update({ role: activeRole }).eq("id", userId);

  if (updateUserResult.error) {
    throw new Error(updateUserResult.error.message);
  }

  const deleteResult = await supabase.from("user_roles").delete().eq("user_id", userId);

  if (deleteResult.error && deleteResult.error.code !== "42P01") {
    throw new Error(deleteResult.error.message);
  }

  const insertResult = await supabase.from("user_roles").insert(
    assignedRoles.map((role) => ({
      user_id: userId,
      role,
    })),
  );

  if (insertResult.error) {
    throw new Error(insertResult.error.message);
  }
}

export async function saveRoleAccessConfig(role: UserRole, selectedMenuKeys: string[]) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const menuRows = resolveMenuRows(await getMenuRowsForAccess());
  const menuKeys = menuRows.map((item) => item.key);
  const selected = new Set(selectedMenuKeys);
  const defaultKeys = getDefaultMenuKeysFromRows(menuRows, role);

  const overrides = menuKeys
    .filter((menuKey) => selected.has(menuKey) !== defaultKeys.has(menuKey))
    .map((menuKey) => ({
      role,
      menu_key: menuKey,
      is_allowed: selected.has(menuKey),
    }));

  const deleteResult = await supabase.from("role_menu_permissions").delete().eq("role", role);

  if (deleteResult.error && deleteResult.error.code !== "42P01") {
    throw new Error(deleteResult.error.message);
  }

  if (overrides.length === 0) {
    return;
  }

  const insertResult = await supabase.from("role_menu_permissions").insert(overrides);

  if (insertResult.error) {
    throw new Error(insertResult.error.message);
  }
}

export function getRoleAccessSummary(role: UserRole) {
  return menuDefinitions.filter((item) => item.roles.includes(role)).length;
}
