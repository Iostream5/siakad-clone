import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { academicYearSchema } from "@/lib/validators";

export type AcademicYearRow = {
  id: string;
  kode: string;
  nama: string;
  semester: "Ganjil" | "Genap" | "Pendek";
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_aktif: boolean;
  is_krs_open: boolean;
  created_at: string;
  updated_at: string;
};

export type AcademicYearListParams = {
  query?: string;
  page?: number;
  pageSize?: number;
};

export type AcademicYearListResult = {
  items: AcademicYearRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  query: string;
};

export type AcademicYearInput = {
  kode: string;
  nama: string;
  semester: "Ganjil" | "Genap" | "Pendek";
  tanggalMulai: string;
  tanggalSelesai: string;
  isAktif: boolean;
  isKrsOpen: boolean;
};

function normalizeQuery(value?: string) {
  return (value ?? "").trim();
}

function applySearch<T extends { or: (filters: string) => T }>(queryBuilder: T, query: string) {
  if (!query) {
    return queryBuilder;
  }

  const escaped = query.replace(/[%_,]/g, "");
  return queryBuilder.or(`kode.ilike.%${escaped}%,nama.ilike.%${escaped}%,semester.ilike.%${escaped}%`);
}

export async function listAcademicYears(params: AcademicYearListParams = {}): Promise<AcademicYearListResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      items: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize: params.pageSize ?? 10,
      query: normalizeQuery(params.query),
    };
  }

  const pageSize = Math.max(1, params.pageSize ?? 10);
  const currentPage = Math.max(1, params.page ?? 1);
  const query = normalizeQuery(params.query);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const countQuery = applySearch(
    supabase.from("tahun_akademik").select("id", { count: "exact", head: true }),
    query,
  );

  const dataQuery = applySearch(
    supabase
      .from("tahun_akademik")
      .select("id, kode, nama, semester, tanggal_mulai, tanggal_selesai, is_aktif, is_krs_open, created_at, updated_at")
      .order("tanggal_mulai", { ascending: false })
      .range(from, to),
    query,
  );

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  const totalItems = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: (dataResult.data ?? []) as AcademicYearRow[],
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    pageSize,
    query,
  };
}

export async function getActiveAcademicYear() {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("tahun_akademik")
    .select("*")
    .eq("is_aktif", true)
    .maybeSingle();

  return data as AcademicYearRow | null;
}

export async function saveAcademicYear(input: AcademicYearInput, id?: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const parsed = academicYearSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tahun akademik tidak valid.");
  }

  const payload = {
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    semester: parsed.data.semester,
    tanggal_mulai: parsed.data.tanggalMulai,
    tanggal_selesai: parsed.data.tanggalSelesai,
    is_aktif: parsed.data.isAktif,
    is_krs_open: parsed.data.isKrsOpen,
  };

  if (id) {
    const result = await supabase
      .from("tahun_akademik")
      .update({
        ...payload,
        is_aktif: parsed.data.isAktif ? false : payload.is_aktif,
      })
      .eq("id", id);

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (parsed.data.isAktif) {
      await setActiveAcademicYear(id);
    }

    return;
  }

  const result = await supabase
    .from("tahun_akademik")
    .insert({
      ...payload,
      is_aktif: false,
    })
    .select("id")
    .single();

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (parsed.data.isAktif) {
    await setActiveAcademicYear(result.data.id);
  }
}

export async function deleteAcademicYear(id: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const result = await supabase.from("tahun_akademik").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function setActiveAcademicYear(id: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const deactivateResult = await supabase
    .from("tahun_akademik")
    .update({ is_aktif: false, is_krs_open: false })
    .neq("id", id)
    .eq("is_aktif", true);

  if (deactivateResult.error) {
    throw new Error(deactivateResult.error.message);
  }

  const activateResult = await supabase
    .from("tahun_akademik")
    .update({ is_aktif: true })
    .eq("id", id);

  if (activateResult.error) {
    throw new Error(activateResult.error.message);
  }
}

export async function setAcademicYearKrsOpen(id: string, open: boolean) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Konfigurasi service role Supabase belum tersedia di server.");
  }

  const targetResult = await supabase
    .from("tahun_akademik")
    .select("id, is_aktif")
    .eq("id", id)
    .maybeSingle();

  if (targetResult.error) {
    throw new Error(targetResult.error.message);
  }

  if (!targetResult.data) {
    throw new Error("Data tahun akademik tidak ditemukan.");
  }

  if (open && !targetResult.data.is_aktif) {
    throw new Error("KRS hanya bisa dibuka pada tahun akademik yang sedang aktif.");
  }

  if (open) {
    const resetResult = await supabase
      .from("tahun_akademik")
      .update({ is_krs_open: false })
      .neq("id", id)
      .eq("is_krs_open", true);

    if (resetResult.error) {
      throw new Error(resetResult.error.message);
    }
  }

  const updateResult = await supabase
    .from("tahun_akademik")
    .update({ is_krs_open: open })
    .eq("id", id);

  if (updateResult.error) {
    throw new Error(updateResult.error.message);
  }
}

function parseBoolean(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "ya" || normalized === "yes";
}

export async function importAcademicYearsFromCsv(content: string) {
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
  const requiredHeaders = ["kode", "nama", "semester", "tanggal_mulai", "tanggal_selesai", "is_aktif", "is_krs_open"];

  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error("Header CSV tidak valid. Gunakan: kode,nama,semester,tanggal_mulai,tanggal_selesai,is_aktif,is_krs_open");
  }

  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(",").map((item) => item.trim());
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));

    const parsed = academicYearSchema.safeParse({
      kode: record.kode,
      nama: record.nama,
      semester: record.semester,
      tanggalMulai: record.tanggal_mulai,
      tanggalSelesai: record.tanggal_selesai,
      isAktif: parseBoolean(record.is_aktif),
      isKrsOpen: parseBoolean(record.is_krs_open),
    });

    if (!parsed.success) {
      throw new Error(`Baris ${index + 2}: ${parsed.error.issues[0]?.message ?? "Data tidak valid"}`);
    }

    return {
      kode: parsed.data.kode,
      nama: parsed.data.nama,
      semester: parsed.data.semester,
      tanggal_mulai: parsed.data.tanggalMulai,
      tanggal_selesai: parsed.data.tanggalSelesai,
      is_aktif: parsed.data.isAktif,
      is_krs_open: parsed.data.isKrsOpen,
    };
  });

  const result = await supabase.from("tahun_akademik").upsert(rows, {
    onConflict: "kode",
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const activeRows = rows.filter((row) => row.is_aktif);

  if (activeRows.length > 0) {
    const latestActive = activeRows[activeRows.length - 1];
    const activeRecord = await supabase
      .from("tahun_akademik")
      .select("id")
      .eq("kode", latestActive.kode)
      .maybeSingle();

    if (activeRecord.error) {
      throw new Error(activeRecord.error.message);
    }

    if (activeRecord.data?.id) {
      await setActiveAcademicYear(activeRecord.data.id);
    }
  }

  return {
    imported: rows.length,
  };
}

export async function exportAcademicYears(query?: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    return [];
  }

  const result = await applySearch(
    supabase
      .from("tahun_akademik")
      .select("id, kode, nama, semester, tanggal_mulai, tanggal_selesai, is_aktif, is_krs_open, created_at, updated_at")
      .order("tanggal_mulai", { ascending: false }),
    normalizeQuery(query),
  );

  return (result.data ?? []) as AcademicYearRow[];
}
