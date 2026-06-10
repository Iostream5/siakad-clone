import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { kampusSchema } from "@/lib/validators";

export type KampusRow = {
  id: string;
  kode: string;
  nama: string;
  alamat: string | null;
  kota: string | null;
  telepon: string | null;
  email: string | null;
  is_active: boolean;
  updated_at: string;
};

export type KampusListResult = {
  items: KampusRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
};

export type KampusInput = {
  kode: string;
  nama: string;
  alamat?: string;
  kota?: string;
  telepon?: string;
  email?: string;
  isAktif: boolean;
};

function normalizeQuery(value?: string) {
  return (value ?? "").trim();
}

function applySearch<T extends { or: (filters: string) => T }>(queryBuilder: T, query: string) {
  if (!query) return queryBuilder;
  const escaped = query.replace(/[%_,]/g, "");
  return queryBuilder.or(`kode.ilike.%${escaped}%,nama.ilike.%${escaped}%,kota.ilike.%${escaped}%`);
}

export async function listKampus(params: { query?: string; page?: number; pageSize?: number; deletedMode?: "active" | "trash" | "all" } = {}): Promise<KampusListResult> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { items: [], totalItems: 0, totalPages: 1, currentPage: 1, query: normalizeQuery(params.query) };
  }

  const pageSize = Math.max(1, params.pageSize ?? 10);
  const currentPage = Math.max(1, params.page ?? 1);
  const query = normalizeQuery(params.query);
  const deletedMode = params.deletedMode ?? "active";
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let countBuilder = supabase.from("kampus").select("id", { count: "exact", head: true });
  let dataBuilder = supabase
    .from("kampus")
    .select("id, kode, nama, alamat, kota, telepon, email, is_active, updated_at")
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (deletedMode === "active") {
    countBuilder = countBuilder.is("deleted_at", null);
    dataBuilder = dataBuilder.is("deleted_at", null);
  } else if (deletedMode === "trash") {
    countBuilder = countBuilder.not("deleted_at", "is", null);
    dataBuilder = dataBuilder.not("deleted_at", "is", null);
  }

  const countQuery = applySearch(countBuilder, query);
  const dataQuery = applySearch(
    dataBuilder,
    query,
  );

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);
  const totalItems = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: (dataResult.data ?? []) as KampusRow[],
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    query,
  };
}

export async function saveKampus(input: KampusInput, id?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");

  const parsed = kampusSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data kampus tidak valid.");
  }

  const payload = {
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    alamat: parsed.data.alamat || null,
    kota: parsed.data.kota || null,
    telepon: parsed.data.telepon || null,
    email: parsed.data.email || null,
    is_active: parsed.data.isAktif,
  };

  const result = id
    ? await supabase.from("kampus").update(payload).eq("id", id)
    : await supabase.from("kampus").insert(payload);

  if (result.error) throw new Error(result.error.message);
}

export async function deleteKampus(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");

  const result = await supabase.from("kampus").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (result.error) throw new Error(result.error.message);
}

export async function restoreKampus(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");

  const result = await supabase.from("kampus").update({ deleted_at: null }).eq("id", id);
  if (result.error) throw new Error(result.error.message);
}

export async function hardDeleteKampus(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");

  const result = await supabase.from("kampus").delete().eq("id", id);
  if (result.error) throw new Error(result.error.message);
}

export async function bulkDeleteKampus(ids: string[]) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kampus").update({ deleted_at: new Date().toISOString() }).in("id", ids);
  if (result.error) throw new Error(result.error.message);
}

export async function bulkRestoreKampus(ids: string[]) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kampus").update({ deleted_at: null }).in("id", ids);
  if (result.error) throw new Error(result.error.message);
}

export async function bulkHardDeleteKampus(ids: string[]) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kampus").delete().in("id", ids);
  if (result.error) throw new Error(result.error.message);
}

export async function importKampusFromCsv(content: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");

  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) throw new Error("File import kosong atau hanya berisi header.");

  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const requiredHeaders = ["kode", "nama", "alamat", "kota", "telepon", "email", "is_active"];

  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error("Header CSV tidak valid. Gunakan: kode,nama,alamat,kota,telepon,email,is_active");
  }

  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(",").map((item) => item.trim());
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    const parsed = kampusSchema.safeParse({
      kode: record.kode,
      nama: record.nama,
      alamat: record.alamat,
      kota: record.kota,
      telepon: record.telepon,
      email: record.email,
      isAktif: ["1", "true", "ya", "yes"].includes((record.is_active ?? "").toLowerCase()),
    });

    if (!parsed.success) {
      throw new Error(`Baris ${index + 2}: ${parsed.error.issues[0]?.message ?? "Data tidak valid"}`);
    }

    return {
      kode: parsed.data.kode,
      nama: parsed.data.nama,
      alamat: parsed.data.alamat || null,
      kota: parsed.data.kota || null,
      telepon: parsed.data.telepon || null,
      email: parsed.data.email || null,
      is_active: parsed.data.isAktif,
    };
  });

  const result = await supabase.from("kampus").upsert(rows, { onConflict: "kode" });
  if (result.error) throw new Error(result.error.message);

  return { imported: rows.length };
}

export async function exportKampus(query?: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const result = await applySearch(
    supabase
      .from("kampus")
      .select("id, kode, nama, alamat, kota, telepon, email, is_active, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    normalizeQuery(query),
  );

  return (result.data ?? []) as KampusRow[];
}
