import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { facultySchema } from "@/lib/validators";

export type FacultyRow = {
  id: string;
  kode: string;
  nama: string;
  dekan: string | null;
  deskripsi: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type FacultyListResult = {
  items: FacultyRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
};

export type FacultyInput = {
  kode: string;
  nama: string;
  dekan?: string;
  deskripsi?: string;
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
  return queryBuilder.or(`kode.ilike.%${escaped}%,nama.ilike.%${escaped}%,dekan.ilike.%${escaped}%`);
}

export async function listFaculties(params: { query?: string; page?: number; pageSize?: number } = {}): Promise<FacultyListResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      items: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      query: normalizeQuery(params.query),
    };
  }

  const pageSize = Math.max(1, params.pageSize ?? 10);
  const currentPage = Math.max(1, params.page ?? 1);
  const query = normalizeQuery(params.query);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const countQuery = applySearch(
    supabase.from("fakultas").select("id", { count: "exact", head: true }),
    query,
  );

  const dataQuery = applySearch(
    supabase
      .from("fakultas")
      .select("id, kode, nama, dekan, deskripsi, is_active, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .range(from, to),
    query,
  );

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);
  const totalItems = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: (dataResult.data ?? []) as FacultyRow[],
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    query,
  };
}

export async function saveFaculty(input: FacultyInput, id?: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const parsed = facultySchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data fakultas tidak valid.");
  }

  const payload = {
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    dekan: parsed.data.dekan || null,
    deskripsi: parsed.data.deskripsi || null,
    is_active: parsed.data.isAktif,
  };

  if (id) {
    const result = await supabase.from("fakultas").update(payload).eq("id", id);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return;
  }

  const result = await supabase.from("fakultas").insert(payload);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function deleteFaculty(id: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const result = await supabase.from("fakultas").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function importFacultiesFromCsv(content: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    throw new Error("File import kosong atau hanya berisi header.");
  }

  const headers = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const requiredHeaders = ["kode", "nama", "dekan", "deskripsi", "is_active"];

  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error("Header CSV tidak valid. Gunakan: kode,nama,dekan,deskripsi,is_active");
  }

  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(",").map((item) => item.trim());
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    const parsed = facultySchema.safeParse({
      kode: record.kode,
      nama: record.nama,
      dekan: record.dekan,
      deskripsi: record.deskripsi,
      isAktif: ["1", "true", "ya", "yes"].includes((record.is_active ?? "").toLowerCase()),
    });

    if (!parsed.success) {
      throw new Error(`Baris ${index + 2}: ${parsed.error.issues[0]?.message ?? "Data tidak valid"}`);
    }

    return {
      kode: parsed.data.kode,
      nama: parsed.data.nama,
      dekan: parsed.data.dekan || null,
      deskripsi: parsed.data.deskripsi || null,
      is_active: parsed.data.isAktif,
    };
  });

  const result = await supabase.from("fakultas").upsert(rows, {
    onConflict: "kode",
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    imported: rows.length,
  };
}

export async function exportFaculties(query?: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    return [];
  }

  const result = await applySearch(
    supabase
      .from("fakultas")
      .select("id, kode, nama, dekan, deskripsi, is_active, created_at, updated_at")
      .order("updated_at", { ascending: false }),
    normalizeQuery(query),
  );

  return (result.data ?? []) as FacultyRow[];
}
