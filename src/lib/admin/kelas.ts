import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { kelasSchema } from "@/lib/validators";

export type KelasRow = {
  id: string;
  kode: string;
  nama: string;
  angkatan: number | null;
  tingkat: string | null;
  kapasitas: number;
  is_active: boolean;
  updated_at: string;
  program_studi: {
    id: string;
    kode: string;
    nama: string;
  } | null;
};

export type KelasListResult = {
  items: KelasRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
};

export type KelasInput = {
  kode: string;
  nama: string;
  prodiId?: string;
  angkatan?: number | null;
  tingkat?: string;
  kapasitas: number;
  isAktif: boolean;
};

function normalizeQuery(value?: string) {
  return (value ?? "").trim();
}

function applySearch<T extends { or: (filters: string) => T }>(queryBuilder: T, query: string) {
  if (!query) return queryBuilder;
  const escaped = query.replace(/[%_,]/g, "");
  return queryBuilder.or(`kode.ilike.%${escaped}%,nama.ilike.%${escaped}%,tingkat.ilike.%${escaped}%`);
}

export async function listKelas(params: { query?: string; page?: number; pageSize?: number; deletedMode?: "active" | "trash" | "all" } = {}): Promise<KelasListResult> {
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

  let countBuilder = supabase.from("kelas").select("id", { count: "exact", head: true });
  let dataBuilder = supabase
    .from("kelas")
    .select("id, kode, nama, angkatan, tingkat, kapasitas, is_active, updated_at, program_studi:prodi_id(id, kode, nama)")
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
  const dataQuery = applySearch(dataBuilder, query);

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);
  const totalItems = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: ((dataResult.data ?? []) as Array<any>).map((item) => ({
      id: item.id,
      kode: item.kode,
      nama: item.nama,
      angkatan: item.angkatan,
      tingkat: item.tingkat,
      kapasitas: item.kapasitas,
      is_active: item.is_active,
      updated_at: item.updated_at,
      program_studi: item.program_studi?.[0] ?? null,
    })),
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    query,
  };
}

export async function saveKelas(input: KelasInput, id?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");

  const parsed = kelasSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Data kelas tidak valid.");

  const payload = {
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    prodi_id: parsed.data.prodiId || null,
    angkatan: parsed.data.angkatan ?? null,
    tingkat: parsed.data.tingkat || null,
    kapasitas: parsed.data.kapasitas,
    is_active: parsed.data.isAktif,
  };

  const result = id
    ? await supabase.from("kelas").update(payload).eq("id", id)
    : await supabase.from("kelas").insert(payload);

  if (result.error) throw new Error(result.error.message);
}

export async function deleteKelas(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kelas").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (result.error) throw new Error(result.error.message);
}

export async function restoreKelas(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kelas").update({ deleted_at: null }).eq("id", id);
  if (result.error) throw new Error(result.error.message);
}

export async function hardDeleteKelas(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kelas").delete().eq("id", id);
  if (result.error) throw new Error(result.error.message);
}

export async function bulkDeleteKelas(ids: string[]) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kelas").update({ deleted_at: new Date().toISOString() }).in("id", ids);
  if (result.error) throw new Error(result.error.message);
}

export async function bulkRestoreKelas(ids: string[]) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kelas").update({ deleted_at: null }).in("id", ids);
  if (result.error) throw new Error(result.error.message);
}

export async function bulkHardDeleteKelas(ids: string[]) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kelas").delete().in("id", ids);
  if (result.error) throw new Error(result.error.message);
}

export async function importKelasFromCsv(content: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");

  const prodiResult = await supabase.from("program_studi").select("id, kode").is("deleted_at", null);
  if (prodiResult.error) throw new Error(prodiResult.error.message);

  const prodiMap = new Map((prodiResult.data ?? []).map((item) => [item.kode, item.id]));
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) throw new Error("File import kosong atau hanya berisi header.");

  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const requiredHeaders = ["kode", "nama", "prodi_kode", "angkatan", "tingkat", "kapasitas", "is_active"];

  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error("Header CSV tidak valid. Gunakan: kode,nama,prodi_kode,angkatan,tingkat,kapasitas,is_active");
  }

  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(",").map((item) => item.trim());
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    const prodiId = record.prodi_kode ? prodiMap.get(record.prodi_kode) : null;
    const parsed = kelasSchema.safeParse({
      kode: record.kode,
      nama: record.nama,
      prodiId: prodiId ?? "",
      angkatan: record.angkatan ? Number(record.angkatan) : null,
      tingkat: record.tingkat,
      kapasitas: Number(record.kapasitas),
      isAktif: ["1", "true", "ya", "yes"].includes((record.is_active ?? "").toLowerCase()),
    });

    if (!parsed.success) {
      throw new Error(`Baris ${index + 2}: ${parsed.error.issues[0]?.message ?? "Data tidak valid"}`);
    }

    return {
      kode: parsed.data.kode,
      nama: parsed.data.nama,
      prodi_id: parsed.data.prodiId || null,
      angkatan: parsed.data.angkatan ?? null,
      tingkat: parsed.data.tingkat || null,
      kapasitas: parsed.data.kapasitas,
      is_active: parsed.data.isAktif,
    };
  });

  const result = await supabase.from("kelas").upsert(rows, { onConflict: "kode" });
  if (result.error) throw new Error(result.error.message);

  return { imported: rows.length };
}

export async function exportKelas(query?: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const result = await applySearch(
    supabase
      .from("kelas")
      .select("id, kode, nama, angkatan, tingkat, kapasitas, is_active, updated_at, program_studi:prodi_id(id, kode, nama)")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    normalizeQuery(query),
  );

  return ((result.data ?? []) as Array<any>).map((item) => ({
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    angkatan: item.angkatan,
    tingkat: item.tingkat,
    kapasitas: item.kapasitas,
    is_active: item.is_active,
    updated_at: item.updated_at,
    program_studi: item.program_studi?.[0] ?? null,
  })) as KelasRow[];
}
