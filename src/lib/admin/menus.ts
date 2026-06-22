import "server-only";

import { createAdminClient } from "@/supabase/admin";

import { menuDefinitions } from "@/lib/access-control";
import type { UserRole } from "@/types/domain";

export type MenuRow = {
  id: string;
  key: string;
  label: string;
  href: string;
  icon: string | null;
  parent_key: string | null;
  sort_order: number;
  roles: UserRole[];
  is_active: boolean;
  updated_at: string;
};

export type MenuInput = {
  key: string;
  label: string;
  href: string;
  icon?: string;
  parentKey?: string;
  sortOrder: number;
  roles: UserRole[];
  isActive: boolean;
};

type MenuDatabaseRow = {
  id: string;
  key: string;
  label: string;
  href: string;
  icon?: string | null;
  parent_key?: string | null;
  sort_order?: number | null;
  roles?: unknown;
  is_active: boolean;
  updated_at: string;
};

export type MenuListResult = {
  items: MenuRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
  source: "database" | "fallback";
};

function normalizeQuery(value?: string) {
  return (value ?? "").trim();
}

function applySearch<T extends { or: (filters: string) => T }>(queryBuilder: T, query: string) {
  if (!query) return queryBuilder;
  const escaped = query.replace(/[%_,]/g, "");
  return queryBuilder.or(`key.ilike.%${escaped}%,label.ilike.%${escaped}%,href.ilike.%${escaped}%`);
}

function toMenuRows(rows: MenuDatabaseRow[]): MenuRow[] {
  return rows.map((item) => ({
    id: item.id,
    key: item.key,
    label: item.label,
    href: item.href,
    icon: item.icon ?? null,
    parent_key: item.parent_key ?? null,
    sort_order: item.sort_order ?? 0,
    roles: Array.isArray(item.roles) ? item.roles as UserRole[] : [],
    is_active: item.is_active,
    updated_at: item.updated_at,
  }));
}

function getFallbackRows(): MenuRow[] {
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

function mergeMissingFallbackRows(rows: MenuRow[]): MenuRow[] {
  const existingKeys = new Set(rows.map((item) => item.key));
  const missingRows = getFallbackRows().filter((item) => !existingKeys.has(item.key));

  return [...rows, ...missingRows].sort((left, right) => {
    return left.sort_order - right.sort_order || left.label.localeCompare(right.label);
  });
}

export async function listMenus(params: { query?: string; page?: number; pageSize?: number } = {}): Promise<MenuListResult> {
  const supabase = createAdminClient();
  const query = normalizeQuery(params.query);
  const pageSize = Math.max(1, params.pageSize ?? 50);
  const currentPage = Math.max(1, params.page ?? 1);

  if (!supabase) {
    return {
      items: getFallbackRows(),
      totalItems: menuDefinitions.length,
      totalPages: 1,
      currentPage: 1,
      query,
      source: "fallback",
    };
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const countQuery = applySearch(
    supabase.from("menus").select("id", { count: "exact", head: true }).is("deleted_at", null),
    query,
  );
  const dataQuery = applySearch(
    supabase
      .from("menus")
      .select("id, key, label, href, icon, parent_key, sort_order, roles, is_active, updated_at")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true })
      .range(from, to),
    query,
  );

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  if (countResult.error?.code === "42P01" || dataResult.error?.code === "42P01") {
    return {
      items: getFallbackRows(),
      totalItems: menuDefinitions.length,
      totalPages: 1,
      currentPage: 1,
      query,
      source: "fallback",
    };
  }

  const totalItems = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: toMenuRows((dataResult.data ?? []) as MenuDatabaseRow[]),
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    query,
    source: "database",
  };
}

export async function getMenuRowsForAccess(): Promise<MenuRow[]> {
  const result = await listMenus({ pageSize: 1000 });
  return result.items.length > 0 ? mergeMissingFallbackRows(result.items) : getFallbackRows();
}

export async function saveMenu(input: MenuInput, id?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");

  const payload = {
    key: input.key.trim(),
    label: input.label.trim(),
    href: input.href.trim(),
    icon: input.icon?.trim() || null,
    parent_key: input.parentKey?.trim() || null,
    sort_order: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    roles: input.roles,
    is_active: input.isActive,
  };

  const result = id
    ? await supabase.from("menus").update(payload).eq("id", id)
    : await supabase.from("menus").insert(payload);

  if (result.error) throw new Error(result.error.message);
}

export async function deleteMenu(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("menus").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (result.error) throw new Error(result.error.message);
}

export async function moveMenu(id: string, direction: "up" | "down") {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");

  const { data: current, error: currentError } = await supabase
    .from("menus")
    .select("id, sort_order, parent_key")
    .eq("id", id)
    .maybeSingle();

  if (currentError) throw new Error(currentError.message);
  if (!current) throw new Error("Menu tidak ditemukan.");

  let neighborQuery = supabase
    .from("menus")
    .select("id, sort_order")
    .is("deleted_at", null)
    .eq("parent_key", current.parent_key)
    .neq("id", current.id);

  if (direction === "up") {
    neighborQuery = neighborQuery.lt("sort_order", current.sort_order).order("sort_order", { ascending: false }).limit(1);
  } else {
    neighborQuery = neighborQuery.gt("sort_order", current.sort_order).order("sort_order", { ascending: true }).limit(1);
  }

  const { data: neighbor } = await neighborQuery.maybeSingle();

  if (!neighbor) return;

  const [currentUpdate, neighborUpdate] = await Promise.all([
    supabase.from("menus").update({ sort_order: neighbor.sort_order }).eq("id", current.id),
    supabase.from("menus").update({ sort_order: current.sort_order }).eq("id", neighbor.id),
  ]);

  if (currentUpdate.error) throw new Error(currentUpdate.error.message);
  if (neighborUpdate.error) throw new Error(neighborUpdate.error.message);
}
