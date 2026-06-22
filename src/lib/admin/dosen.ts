import "server-only";

import { createAdminClient } from "@/supabase/admin";

export type DosenRow = {
  id: string;
  nidn: string | null;
  nip: string | null;
  gelar: string | null;
  status_dosen: string;
  homebase_prodi_id: string | null;
  updated_at: string;
  users: {
    id: string;
    full_name: string;
    email: string;
    is_active: boolean;
  } | null;
  program_studi: {
    id: string;
    nama: string;
  } | null;
};

type DosenQueryRow = {
  id: string;
  nidn: string | null;
  nip: string | null;
  gelar: string | null;
  status_dosen: string;
  homebase_prodi_id: string | null;
  updated_at: string;
  users: RelationOne<{
    id: string;
    full_name: string;
    email: string;
    is_active: boolean;
  }>;
  program_studi: RelationOne<{
    id: string;
    nama: string;
  }>;
};

type RelationOne<T> = T | T[] | null;

export type DosenListResult = {
  items: DosenRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
};

function normalizeQuery(value?: string) {
  return (value ?? "").trim();
}

function applySearch<T extends { or: (filters: string) => T }>(queryBuilder: T, query: string) {
  if (!query) return queryBuilder;
  const escaped = query.replace(/[%_,]/g, "");
  // Search in NIDN, NIP or via related user table (full_name)
  // Note: Complex nested search in Supabase might require raw filters or search on users first.
  // For simplicity here, we search NIDN and NIP. 
  return queryBuilder.or(`nidn.ilike.%${escaped}%,nip.ilike.%${escaped}%`);
}

function getRelationObject<T>(relation: RelationOne<T>) {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export async function getDosenIdByUserId(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("dosen")
    .select("id")
    .eq("user_id", userId)
    .single();

  return data?.id || null;
}

export async function listDosen(params: { query?: string; page?: number; pageSize?: number } = {}): Promise<DosenListResult> {
  const supabase = createAdminClient();
  if (!supabase) return { items: [], totalItems: 0, totalPages: 1, currentPage: 1, query: "" };

  const pageSize = Math.max(1, params.pageSize ?? 10);
  const currentPage = Math.max(1, params.page ?? 1);
  const query = normalizeQuery(params.query);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let countQuery = supabase.from("dosen").select("id", { count: "exact", head: true }).is("deleted_at", null);
  let dataQuery = supabase
    .from("dosen")
    .select(`
      id, nidn, nip, gelar, status_dosen, homebase_prodi_id, updated_at,
      users!dosen_user_id_fkey(id, full_name, email, is_active),
      program_studi!dosen_homebase_prodi_id_fkey(id, nama)
    `)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (query) {
    countQuery = applySearch(countQuery, query);
    dataQuery = applySearch(dataQuery, query);
  }

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);
  const totalItems = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const items = ((dataResult.data ?? []) as DosenQueryRow[]).map((item) => ({
    id: item.id,
    nidn: item.nidn,
    nip: item.nip,
    gelar: item.gelar,
    status_dosen: item.status_dosen,
    homebase_prodi_id: item.homebase_prodi_id,
    updated_at: item.updated_at,
    users: getRelationObject(item.users),
    program_studi: getRelationObject(item.program_studi),
  }));

  return {
    items,
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    query,
  };
}

export async function upsertDosen(values: {
  id?: string;
  fullName: string;
  email: string;
  nidn?: string;
  nip?: string;
  gelar?: string;
  homebaseProdiId: string;
  statusDosen: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  let userId: string;

  if (values.id) {
    const { data: dosenData, error: dosenError } = await supabase
      .from("dosen")
      .select("user_id")
      .eq("id", values.id)
      .single();

    if (dosenError || !dosenData) throw new Error("Dosen tidak ditemukan");
    userId = dosenData.user_id;

    const { error: userError } = await supabase.from("users").update({
      full_name: values.fullName,
      email: values.email,
    }).eq("id", userId);
    if (userError) throw userError;

    const { error: updateError } = await supabase.from("dosen").update({
      nidn: values.nidn || null,
      nip: values.nip || null,
      gelar: values.gelar || null,
      homebase_prodi_id: values.homebaseProdiId,
      status_dosen: values.statusDosen,
    }).eq("id", values.id);
    if (updateError) throw updateError;
  } else {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: values.email,
      password: "dosen123",
      email_confirm: true,
      user_metadata: { full_name: values.fullName, role: "Dosen" },
    });

    if (authError) throw authError;
    userId = authData.user.id;

    const { error: insertError } = await supabase.from("dosen").insert({
      user_id: userId,
      nidn: values.nidn || null,
      nip: values.nip || null,
      gelar: values.gelar || null,
      homebase_prodi_id: values.homebaseProdiId,
      status_dosen: values.statusDosen,
    });

    if (insertError) {
      await supabase.auth.admin.deleteUser(userId);
      throw insertError;
    }
  }
}

export async function deleteDosen(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");
  const { error } = await supabase.from("dosen").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function exportDosen(query?: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];
  
  let q = supabase
    .from("dosen")
    .select(`
      id, nidn, nip, gelar, status_dosen, updated_at,
      users!dosen_user_id_fkey(full_name, email),
      program_studi!dosen_homebase_prodi_id_fkey(nama)
    `)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (query) q = applySearch(q, normalizeQuery(query));
  const { data } = await q;

  return ((data ?? []) as DosenQueryRow[]).map(item => ({
    id: item.id,
    nidn: item.nidn,
    nip: item.nip,
    gelar: item.gelar,
    status_dosen: item.status_dosen,
    fullName: getRelationObject(item.users)?.full_name,
    email: getRelationObject(item.users)?.email,
    prodi: getRelationObject(item.program_studi)?.nama,
  }));
}
