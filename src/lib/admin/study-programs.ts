import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { studyProgramSchema } from "@/lib/validators";

export type StudyProgramRow = {
  id: string;
  kode: string;
  nama: string;
  jenjang: string;
  is_active: boolean;
  updated_at: string;
  fakultas: null | {
    id: string;
    kode: string;
    nama: string;
  };
};

type StudyProgramQueryRow = {
  id: string;
  kode: string;
  nama: string;
  jenjang: string;
  is_active: boolean;
  updated_at: string;
  fakultas: Array<{
    id: string;
    kode: string;
    nama: string;
  }> | null;
};

export type FacultyOption = {
  id: string;
  kode: string;
  nama: string;
};

export type StudyProgramListResult = {
  items: StudyProgramRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
  faculties: FacultyOption[];
};

export type StudyProgramInput = {
  kode: string;
  nama: string;
  jenjang: string;
  fakultasId: string;
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
  return queryBuilder.or(`kode.ilike.%${escaped}%,nama.ilike.%${escaped}%,jenjang.ilike.%${escaped}%`);
}

export async function getStudyProgramList() {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("program_studi")
    .select("id, nama")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("nama", { ascending: true });

  return data || [];
}

export async function listStudyPrograms(params: { query?: string; page?: number; pageSize?: number } = {}): Promise<StudyProgramListResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      items: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      query: normalizeQuery(params.query),
      faculties: [],
    };
  }

  const pageSize = Math.max(1, params.pageSize ?? 10);
  const currentPage = Math.max(1, params.page ?? 1);
  const query = normalizeQuery(params.query);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const countQuery = applySearch(
    supabase.from("program_studi").select("id", { count: "exact", head: true }).is("deleted_at", null),
    query,
  );

  const dataQuery = applySearch(
    supabase
      .from("program_studi")
      .select("id, kode, nama, jenjang, is_active, updated_at, fakultas:fakultas_id(id, kode, nama)")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .range(from, to),
    query,
  );

  const facultiesQuery = supabase
    .from("fakultas")
    .select("id, kode, nama")
    .eq("is_active", true)
    .order("nama", { ascending: true });

  const [countResult, dataResult, facultiesResult] = await Promise.all([countQuery, dataQuery, facultiesQuery]);
  const totalItems = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const items = ((dataResult.data ?? []) as StudyProgramQueryRow[]).map((item) => ({
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    jenjang: item.jenjang,
    is_active: item.is_active,
    updated_at: item.updated_at,
    fakultas: Array.isArray(item.fakultas) ? item.fakultas[0] : item.fakultas,
  }));

  return {
    items,
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    query,
    faculties: (facultiesResult.data ?? []) as FacultyOption[],
  };
}

export async function saveStudyProgram(input: StudyProgramInput, id?: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const parsed = studyProgramSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data program studi tidak valid.");
  }

  const payload = {
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    jenjang: parsed.data.jenjang,
    fakultas_id: parsed.data.fakultasId,
    is_active: parsed.data.isAktif,
  };

  if (id) {
    const result = await supabase.from("program_studi").update(payload).eq("id", id);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return;
  }

  const result = await supabase.from("program_studi").insert(payload);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function deleteStudyProgram(id: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const result = await supabase.from("program_studi").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function importStudyProgramsFromCsv(content: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const facultiesResult = await supabase.from("fakultas").select("id, kode");

  if (facultiesResult.error) {
    throw new Error(facultiesResult.error.message);
  }

  const facultyMap = new Map((facultiesResult.data ?? []).map((item) => [item.kode, item.id]));
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (lines.length <= 1) {
    throw new Error("File import kosong atau hanya berisi header.");
  }

  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const requiredHeaders = ["kode", "nama", "jenjang", "fakultas_kode", "is_active"];

  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error("Header CSV tidak valid. Gunakan: kode,nama,jenjang,fakultas_kode,is_active");
  }

  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(",").map((item) => item.trim());
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    const fakultasId = facultyMap.get(record.fakultas_kode);

    if (!fakultasId) {
      throw new Error(`Baris ${index + 2}: kode fakultas tidak ditemukan.`);
    }

    const parsed = studyProgramSchema.safeParse({
      kode: record.kode,
      nama: record.nama,
      jenjang: record.jenjang,
      fakultasId,
      isAktif: ["1", "true", "ya", "yes"].includes((record.is_active ?? "").toLowerCase()),
    });

    if (!parsed.success) {
      throw new Error(`Baris ${index + 2}: ${parsed.error.issues[0]?.message ?? "Data tidak valid"}`);
    }

    return {
      kode: parsed.data.kode,
      nama: parsed.data.nama,
      jenjang: parsed.data.jenjang,
      fakultas_id: parsed.data.fakultasId,
      is_active: parsed.data.isAktif,
    };
  });

  const result = await supabase.from("program_studi").upsert(rows, {
    onConflict: "kode",
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    imported: rows.length,
  };
}

export async function exportStudyPrograms(query?: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    return [];
  }

  const result = await applySearch(
    supabase
      .from("program_studi")
      .select("id, kode, nama, jenjang, is_active, updated_at, fakultas:fakultas_id(id, kode, nama)")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    normalizeQuery(query),
  );

  return ((result.data ?? []) as any[]).map((item) => ({
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    jenjang: item.jenjang,
    is_active: item.is_active,
    updated_at: item.updated_at,
    fakultas: item.fakultas,
  }));
}
