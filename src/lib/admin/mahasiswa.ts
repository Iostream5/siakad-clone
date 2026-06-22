import "server-only";

import { createAdminClient } from "@/supabase/admin";

export type MahasiswaRow = {
  id: string;
  nim: string | null;
  angkatan: number;
  status_mahasiswa: string;
  ips: number;
  ipk: number;
  prodi_id: string;
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

type MahasiswaQueryRow = {
  id: string;
  nim: string | null;
  angkatan: number;
  status_mahasiswa: string;
  ips: number;
  ipk: number;
  prodi_id: string;
  updated_at: string;
  users: Array<{
    id: string;
    full_name: string;
    email: string;
    is_active: boolean;
  }> | null;
  program_studi: Array<{
    id: string;
    nama: string;
  }> | null;
};

export type MahasiswaListResult = {
  items: MahasiswaRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
};

function normalizeQuery(value?: string) {
  return (value ?? "").trim();
}

function applySearch(queryBuilder: any, query: string) {
  if (!query) return queryBuilder;
  const escaped = query.replace(/[%_,]/g, "");
  // Using or filter with nested join syntax for users.full_name
  return queryBuilder.or(`nim.ilike.%${escaped}%,users.full_name.ilike.%${escaped}%`);
}

export async function searchMahasiswaDynamic(query: string) {
  const supabase = createAdminClient();
  if (!supabase || !query || query.length < 2) return [];

  const escaped = query.trim().replace(/[%_,]/g, "");

  const { data, error } = await supabase
    .from("mahasiswa")
    .select(`
      id, nim, 
      users!mahasiswa_user_id_fkey(full_name, avatar_url)
    `)
    .or(`nim.ilike.%${escaped}%,users.full_name.ilike.%${escaped}%`)
    .is("deleted_at", null)
    .limit(5);

  if (error || !data) return [];

  return (data as any[]).map(item => ({
    id: item.id,
    nim: item.nim,
    name: item.users?.[0]?.full_name || "Tanpa Nama",
    avatar: item.users?.[0]?.avatar_url
  }));
}

export async function getMahasiswaByUserId(userId: string): Promise<MahasiswaRow | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("mahasiswa")
    .select(`
      id, nim, angkatan, status_mahasiswa, ips, ipk, prodi_id, updated_at,
      users!mahasiswa_user_id_fkey(id, full_name, email, is_active),
      program_studi!mahasiswa_prodi_id_fkey(id, nama)
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  const item = data as MahasiswaQueryRow;
  return {
    id: item.id,
    nim: item.nim,
    angkatan: item.angkatan,
    status_mahasiswa: item.status_mahasiswa,
    ips: Number(item.ips),
    ipk: Number(item.ipk),
    prodi_id: item.prodi_id,
    updated_at: item.updated_at,
    users: Array.isArray(item.users) ? (item.users[0] ?? null) : (item.users ?? null),
    program_studi: Array.isArray(item.program_studi) ? (item.program_studi[0] ?? null) : (item.program_studi ?? null),
  };
}

export async function listMahasiswa(params: { query?: string; page?: number; pageSize?: number } = {}): Promise<MahasiswaListResult> {
  const supabase = createAdminClient();
  if (!supabase) return { items: [], totalItems: 0, totalPages: 1, currentPage: 1, query: "" };

  const pageSize = Math.max(1, params.pageSize ?? 10);
  const currentPage = Math.max(1, params.page ?? 1);
  const query = normalizeQuery(params.query);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let countQuery = supabase.from("mahasiswa").select("id", { count: "exact", head: true }).is("deleted_at", null);
  let dataQuery = supabase
    .from("mahasiswa")
    .select(`
      id, nim, angkatan, status_mahasiswa, ips, ipk, prodi_id, updated_at,
      users!mahasiswa_user_id_fkey(id, full_name, email, is_active),
      program_studi!mahasiswa_prodi_id_fkey(id, nama)
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

  const items = ((dataResult.data ?? []) as MahasiswaQueryRow[]).map((item) => ({
    id: item.id,
    nim: item.nim,
    angkatan: item.angkatan,
    status_mahasiswa: item.status_mahasiswa,
    ips: Number(item.ips),
    ipk: Number(item.ipk),
    prodi_id: item.prodi_id,
    updated_at: item.updated_at,
    users: Array.isArray(item.users) ? (item.users[0] ?? null) : (item.users ?? null),
    program_studi: Array.isArray(item.program_studi) ? (item.program_studi[0] ?? null) : (item.program_studi ?? null),
  }));

  return {
    items,
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    query,
  };
}

export async function upsertMahasiswa(values: {
  id?: string;
  fullName: string;
  email: string;
  nim?: string;
  angkatan: number;
  prodiId: string;
  statusMahasiswa: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  let userId: string;

  if (values.id) {
    const { data: mhsData, error: mhsError } = await supabase
      .from("mahasiswa")
      .select("user_id")
      .eq("id", values.id)
      .single();

    if (mhsError || !mhsData) throw new Error("Mahasiswa tidak ditemukan");
    userId = mhsData.user_id;

    await supabase.from("users").update({ full_name: values.fullName, email: values.email }).eq("id", userId);
    await supabase.from("mahasiswa").update({
      nim: values.nim || null,
      angkatan: values.angkatan,
      prodi_id: values.prodiId,
      status_mahasiswa: values.statusMahasiswa as any,
    }).eq("id", values.id);
  } else {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: values.email,
      password: "mhs12345",
      email_confirm: true,
      user_metadata: { full_name: values.fullName, role: "Mahasiswa" },
    });

    if (authError) throw authError;
    userId = authData.user.id;

    await supabase.from("mahasiswa").insert({
      user_id: userId,
      nim: values.nim || null,
      angkatan: values.angkatan,
      prodi_id: values.prodiId,
      status_mahasiswa: values.statusMahasiswa as any,
    });
  }
}

export async function deleteMahasiswa(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");
  await supabase.from("mahasiswa").update({ deleted_at: new Date().toISOString() }).eq("id", id);
}
