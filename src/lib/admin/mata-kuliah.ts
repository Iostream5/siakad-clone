import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { mataKuliahSchema } from "@/lib/validators";

export type ProgramStudiOption = {
  id: string;
  kode: string;
  nama: string;
};

export type MataKuliahRow = {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  jenis: string;
  is_active: boolean;
  updated_at: string;
  program_studi: null | {
    id: string;
    kode: string;
    nama: string;
  };
};

type MataKuliahQueryRow = {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  jenis: string;
  is_active: boolean;
  updated_at: string;
  program_studi: Array<{
    id: string;
    kode: string;
    nama: string;
  }> | null;
};

export type MataKuliahListResult = {
  items: MataKuliahRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
  studyPrograms: ProgramStudiOption[];
};

export type MataKuliahInput = {
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  jenis: string;
  prodiId: string;
  isAktif: boolean;
};

function normalizeQuery(value?: string) {
  return (value ?? "").trim();
}

function applySearch<T extends { or: (filters: string) => T }>(queryBuilder: T, query: string) {
  if (!query) {
    return queryBuilder;
  }

  const escaped = query.replace(/[%_,]/g, "");
  return queryBuilder.or(`kode.ilike.%${escaped}%,nama.ilike.%${escaped}%,jenis.ilike.%${escaped}%`);
}

export async function listMataKuliah(params: { query?: string; page?: number; pageSize?: number } = {}): Promise<MataKuliahListResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      items: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      query: normalizeQuery(params.query),
      studyPrograms: [],
    };
  }

  const pageSize = Math.max(1, params.pageSize ?? 10);
  const currentPage = Math.max(1, params.page ?? 1);
  const query = normalizeQuery(params.query);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const countQuery = applySearch(
    supabase.from("mata_kuliah").select("id", { count: "exact", head: true }).is("deleted_at", null),
    query,
  );

  const dataQuery = applySearch(
    supabase
      .from("mata_kuliah")
      .select(
        "id, kode, nama, sks, semester, jenis, is_active, updated_at, program_studi!mata_kuliah_prodi_id_fkey(id, kode, nama)",
      )
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .range(from, to),
    query,
  );

  const programStudiQuery = supabase
    .from("program_studi")
    .select("id, kode, nama")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("nama", { ascending: true });

  const [countResult, dataResult, programStudiResult] = await Promise.all([countQuery, dataQuery, programStudiQuery]);
  const totalItems = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const items = ((dataResult.data ?? []) as MataKuliahQueryRow[]).map((item) => ({
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    sks: item.sks,
    semester: item.semester,
    jenis: item.jenis,
    is_active: item.is_active,
    updated_at: item.updated_at,
    program_studi: item.program_studi?.[0] ?? null,
  }));

  return {
    items,
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    query,
    studyPrograms: (programStudiResult.data ?? []) as ProgramStudiOption[],
  };
}

export async function saveMataKuliah(input: MataKuliahInput, id?: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const parsed = mataKuliahSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data mata kuliah tidak valid.");
  }

  const payload = {
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    sks: parsed.data.sks,
    semester: parsed.data.semester,
    jenis: parsed.data.jenis,
    prodi_id: parsed.data.prodiId,
    is_active: parsed.data.isAktif,
  };

  if (id) {
    const result = await supabase.from("mata_kuliah").update(payload).eq("id", id);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return;
  }

  const result = await supabase.from("mata_kuliah").insert(payload);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function deleteMataKuliah(id: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const result = await supabase.from("mata_kuliah").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

function parseBoolean(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "ya" || normalized === "yes" || normalized === "on";
}

function parseNumberCell(value: string | undefined) {
  const normalized = (value ?? "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function importMataKuliahFromCsv(content: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const programStudiResult = await supabase.from("program_studi").select("id, kode").is("deleted_at", null);

  if (programStudiResult.error) {
    throw new Error(programStudiResult.error.message);
  }

  const prodiMap = new Map((programStudiResult.data ?? []).map((item) => [item.kode, item.id]));
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (lines.length <= 1) {
    throw new Error("File import kosong atau hanya berisi header.");
  }

  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const requiredHeaders = ["kode", "nama", "sks", "semester", "jenis", "prodi_kode", "is_active"];

  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error("Header CSV tidak valid. Gunakan: kode,nama,sks,semester,jenis,prodi_kode,is_active");
  }

  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(",").map((item) => item.trim());
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    const prodiId = prodiMap.get(record.prodi_kode);

    if (!prodiId) {
      throw new Error(`Baris ${index + 2}: kode prodi tidak ditemukan.`);
    }

    const sks = parseNumberCell(record.sks);
    const semester = parseNumberCell(record.semester);

    const parsed = mataKuliahSchema.safeParse({
      kode: record.kode,
      nama: record.nama,
      sks,
      semester,
      jenis: record.jenis || "Wajib",
      prodiId,
      isAktif: parseBoolean(record.is_active),
    });

    if (!parsed.success) {
      throw new Error(`Baris ${index + 2}: ${parsed.error.issues[0]?.message ?? "Data tidak valid"}`);
    }

    return {
      kode: parsed.data.kode,
      nama: parsed.data.nama,
      sks: parsed.data.sks,
      semester: parsed.data.semester,
      jenis: parsed.data.jenis,
      prodi_id: parsed.data.prodiId,
      is_active: parsed.data.isAktif,
    };
  });

  const result = await supabase.from("mata_kuliah").upsert(rows, {
    onConflict: "kode",
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    imported: rows.length,
  };
}

export async function exportMataKuliah(query?: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    return [];
  }

  const result = await applySearch(
    supabase
      .from("mata_kuliah")
      .select(
        "id, kode, nama, sks, semester, jenis, is_active, updated_at, program_studi!mata_kuliah_prodi_id_fkey(id, kode, nama)",
      )
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    normalizeQuery(query),
  );

  return ((result.data ?? []) as MataKuliahQueryRow[]).map((item) => ({
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    sks: item.sks,
    semester: item.semester,
    jenis: item.jenis,
    is_active: item.is_active,
    updated_at: item.updated_at,
    program_studi: item.program_studi?.[0] ?? null,
  }));
}

