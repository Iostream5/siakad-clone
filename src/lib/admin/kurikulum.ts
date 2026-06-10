import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { kurikulumSchema } from "@/lib/validators";

export type KurikulumRow = {
  id: string;
  kode: string;
  nama: string;
  tahun_mulai: number;
  total_sks: number;
  deskripsi: string | null;
  is_active: boolean;
  updated_at: string;
  program_studi: {
    id: string;
    kode: string;
    nama: string;
  } | null;
};

export type KurikulumListResult = {
  items: KurikulumRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
};

export type KurikulumInput = {
  kode: string;
  nama: string;
  prodiId: string;
  tahunMulai: number;
  totalSks: number;
  deskripsi?: string;
  isAktif: boolean;
};

function normalizeQuery(value?: string) {
  return (value ?? "").trim();
}

function applySearch<T extends { or: (filters: string) => T }>(queryBuilder: T, query: string) {
  if (!query) return queryBuilder;
  const escaped = query.replace(/[%_,]/g, "");
  return queryBuilder.or(`kode.ilike.%${escaped}%,nama.ilike.%${escaped}%,deskripsi.ilike.%${escaped}%`);
}

export async function listKurikulum(params: { query?: string; page?: number; pageSize?: number; deletedMode?: "active" | "trash" | "all" } = {}): Promise<KurikulumListResult> {
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

  let countBuilder = supabase.from("kurikulum").select("id", { count: "exact", head: true });
  let dataBuilder = supabase
    .from("kurikulum")
    .select("id, kode, nama, tahun_mulai, total_sks, deskripsi, is_active, updated_at, program_studi:prodi_id(id, kode, nama)")
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
      tahun_mulai: item.tahun_mulai,
      total_sks: item.total_sks,
      deskripsi: item.deskripsi,
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

export async function saveKurikulum(input: KurikulumInput, id?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");

  const parsed = kurikulumSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Data kurikulum tidak valid.");

  const payload = {
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    prodi_id: parsed.data.prodiId,
    tahun_mulai: parsed.data.tahunMulai,
    total_sks: parsed.data.totalSks,
    deskripsi: parsed.data.deskripsi || null,
    is_active: parsed.data.isAktif,
  };

  const result = id
    ? await supabase.from("kurikulum").update(payload).eq("id", id)
    : await supabase.from("kurikulum").insert(payload);

  if (result.error) throw new Error(result.error.message);
}

export async function deleteKurikulum(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kurikulum").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (result.error) throw new Error(result.error.message);
}

export async function restoreKurikulum(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kurikulum").update({ deleted_at: null }).eq("id", id);
  if (result.error) throw new Error(result.error.message);
}

export async function hardDeleteKurikulum(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kurikulum").delete().eq("id", id);
  if (result.error) throw new Error(result.error.message);
}

export async function bulkDeleteKurikulum(ids: string[]) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kurikulum").update({ deleted_at: new Date().toISOString() }).in("id", ids);
  if (result.error) throw new Error(result.error.message);
}

export async function bulkRestoreKurikulum(ids: string[]) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kurikulum").update({ deleted_at: null }).in("id", ids);
  if (result.error) throw new Error(result.error.message);
}

export async function bulkHardDeleteKurikulum(ids: string[]) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  const result = await supabase.from("kurikulum").delete().in("id", ids);
  if (result.error) throw new Error(result.error.message);
}

export async function importKurikulumFromCsv(content: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Konfigurasi service role Supabase belum tersedia di server.");

  const prodiResult = await supabase.from("program_studi").select("id, kode").is("deleted_at", null);
  if (prodiResult.error) throw new Error(prodiResult.error.message);

  const prodiMap = new Map((prodiResult.data ?? []).map((item) => [item.kode, item.id]));
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) throw new Error("File import kosong atau hanya berisi header.");

  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const requiredHeaders = ["kode", "nama", "prodi_kode", "tahun_mulai", "total_sks", "deskripsi", "is_active"];

  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error("Header CSV tidak valid. Gunakan: kode,nama,prodi_kode,tahun_mulai,total_sks,deskripsi,is_active");
  }

  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(",").map((item) => item.trim());
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    const prodiId = record.prodi_kode ? prodiMap.get(record.prodi_kode) : null;
    const parsed = kurikulumSchema.safeParse({
      kode: record.kode,
      nama: record.nama,
      prodiId: prodiId ?? "",
      tahunMulai: Number(record.tahun_mulai),
      totalSks: Number(record.total_sks),
      deskripsi: record.deskripsi,
      isAktif: ["1", "true", "ya", "yes"].includes((record.is_active ?? "").toLowerCase()),
    });

    if (!parsed.success) {
      throw new Error(`Baris ${index + 2}: ${parsed.error.issues[0]?.message ?? "Data tidak valid"}`);
    }

    return {
      kode: parsed.data.kode,
      nama: parsed.data.nama,
      prodi_id: parsed.data.prodiId,
      tahun_mulai: parsed.data.tahunMulai,
      total_sks: parsed.data.totalSks,
      deskripsi: parsed.data.deskripsi || null,
      is_active: parsed.data.isAktif,
    };
  });

  const result = await supabase.from("kurikulum").upsert(rows, { onConflict: "kode" });
  if (result.error) throw new Error(result.error.message);

  return { imported: rows.length };
}

export async function exportKurikulum(query?: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const result = await applySearch(
    supabase
      .from("kurikulum")
      .select("id, kode, nama, tahun_mulai, total_sks, deskripsi, is_active, updated_at, program_studi:prodi_id(id, kode, nama)")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    normalizeQuery(query),
  );

  return ((result.data ?? []) as Array<any>).map((item) => ({
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    tahun_mulai: item.tahun_mulai,
    total_sks: item.total_sks,
    deskripsi: item.deskripsi,
    is_active: item.is_active,
    updated_at: item.updated_at,
    program_studi: item.program_studi?.[0] ?? null,
  })) as KurikulumRow[];
}
