import "server-only";

import { createAdminClient } from "@/supabase/admin";

type ProgramStudiRow = {
  id: string;
  kode: string;
  nama: string;
  jenjang: string;
  is_active: boolean;
  updated_at: string;
};

type FakultasRow = {
  id: string;
  kode: string;
  nama: string;
  dekan: string | null;
  deskripsi: string | null;
  is_active: boolean;
  updated_at: string;
};

type TahunAkademikRow = {
  id: string;
  kode: string;
  nama: string;
  semester: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_aktif: boolean;
  is_krs_open: boolean;
};

type KampusRow = {
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

type KelasRow = {
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

type KurikulumRow = {
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

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

type MataKuliahRow = {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  jenis: string;
  is_active: boolean;
  program_studi: {
    kode: string;
    nama: string;
  } | null;
};

type DosenRow = {
  id: string;
  nidn: string | null;
  status_dosen: string;
  users: null | {
    full_name: string;
    email: string;
  };
  program_studi: null | {
    kode: string;
    nama: string;
  };
};

type MahasiswaRow = {
  id: string;
  nim: string | null;
  angkatan: number;
  status_mahasiswa: string;
  ips: number;
  ipk: number;
  users: null | {
    full_name: string;
  };
  program_studi: {
    kode: string;
    nama: string;
  } | null;
};

type DosenQueryRow = {
  id: string;
  nidn: string | null;
  status_dosen: string;
  users: Array<{
    full_name: string;
    email: string;
  }> | null;
  program_studi: Array<{
    kode: string;
    nama: string;
  }> | null;
};

type MahasiswaQueryRow = {
  id: string;
  nim: string | null;
  angkatan: number;
  status_mahasiswa: string;
  ips: number;
  ipk: number;
  users: Array<{
    full_name: string;
  }> | null;
  program_studi: Array<{
    kode: string;
    nama: string;
  }> | null;
};

type MataKuliahQueryRow = {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  jenis: string;
  is_active: boolean;
  program_studi: Array<{
    kode: string;
    nama: string;
  }> | null;
};

export type MasterDataSnapshot = {
  counts: {
    kampus: number;
    users: number;
    fakultas: number;
    programStudi: number;
    mataKuliah: number;
    dosen: number;
    mahasiswa: number;
    kelas: number;
    ruangan: number;
    tahunAkademik: number;
    kurikulum: number;
  };
  kampus: KampusRow[];
  fakultas: FakultasRow[];
  programStudi: ProgramStudiRow[];
  mataKuliah: MataKuliahRow[];
  tahunAkademik: TahunAkademikRow[];
  kelas: KelasRow[];
  kurikulum: KurikulumRow[];
  users: UserRow[];
  dosen: DosenRow[];
  mahasiswa: MahasiswaRow[];
  error: string | null;
};

const emptySnapshot: MasterDataSnapshot = {
  counts: {
    kampus: 0,
    users: 0,
    fakultas: 0,
    programStudi: 0,
    mataKuliah: 0,
    dosen: 0,
    mahasiswa: 0,
    kelas: 0,
    ruangan: 0,
    tahunAkademik: 0,
    kurikulum: 0,
  },
  kampus: [],
  fakultas: [],
  programStudi: [],
  mataKuliah: [],
  tahunAkademik: [],
  kelas: [],
  kurikulum: [],
  users: [],
  dosen: [],
  mahasiswa: [],
  error: null,
};

export async function getMasterDataSnapshot(): Promise<MasterDataSnapshot> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ...emptySnapshot,
      error: "Konfigurasi service role Supabase belum tersedia di server.",
    };
  }

  const [
    usersCountResult,
    kampusCountResult,
    fakultasCountResult,
    programStudiCountResult,
    mataKuliahCountResult,
    dosenCountResult,
    mahasiswaCountResult,
    kelasCountResult,
    ruanganCountResult,
    tahunAkademikCountResult,
    kurikulumCountResult,
    kampusResult,
    fakultasResult,
    programStudiResult,
    mataKuliahResult,
    tahunAkademikResult,
    kelasResult,
    kurikulumResult,
    usersResult,
    dosenResult,
    mahasiswaResult,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("kampus").select("id", { count: "exact", head: true }),
    supabase.from("fakultas").select("id", { count: "exact", head: true }),
    supabase.from("program_studi").select("id", { count: "exact", head: true }),
    supabase.from("mata_kuliah").select("id", { count: "exact", head: true }),
    supabase.from("dosen").select("id", { count: "exact", head: true }),
    supabase.from("mahasiswa").select("id", { count: "exact", head: true }),
    supabase.from("kelas").select("id", { count: "exact", head: true }),
    supabase.from("ruangan").select("id", { count: "exact", head: true }),
    supabase.from("tahun_akademik").select("id", { count: "exact", head: true }),
    supabase.from("kurikulum").select("id", { count: "exact", head: true }),
    supabase
      .from("kampus")
      .select("id, kode, nama, alamat, kota, telepon, email, is_active, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("fakultas")
      .select("id, kode, nama, dekan, deskripsi, is_active, updated_at")
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("program_studi")
      .select("id, kode, nama, jenjang, is_active, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("mata_kuliah")
      .select("id, kode, nama, sks, semester, jenis, is_active, program_studi!mata_kuliah_prodi_id_fkey(kode, nama)")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("tahun_akademik")
      .select("id, kode, nama, semester, tanggal_mulai, tanggal_selesai, is_aktif, is_krs_open")
      .order("tanggal_mulai", { ascending: false })
      .limit(6),
    supabase
      .from("kelas")
      .select("id, kode, nama, angkatan, tingkat, kapasitas, is_active, updated_at, program_studi!kelas_prodi_id_fkey(id, kode, nama)")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("kurikulum")
      .select("id, kode, nama, tahun_mulai, total_sks, deskripsi, is_active, updated_at, program_studi!kurikulum_prodi_id_fkey(id, kode, nama)")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("users")
      .select("id, full_name, email, role, is_active, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("dosen")
      .select("id, nidn, status_dosen, users!dosen_user_id_fkey(full_name, email), program_studi!dosen_homebase_prodi_id_fkey(kode, nama)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("mahasiswa")
      .select("id, nim, angkatan, status_mahasiswa, ips, ipk, users!mahasiswa_user_id_fkey(full_name), program_studi!mahasiswa_prodi_id_fkey(kode, nama)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const errors = [
    usersCountResult.error,
    kampusCountResult.error,
    fakultasCountResult.error,
    programStudiCountResult.error,
    mataKuliahCountResult.error,
    dosenCountResult.error,
    mahasiswaCountResult.error,
    kelasCountResult.error,
    ruanganCountResult.error,
    tahunAkademikCountResult.error,
    kurikulumCountResult.error,
    kampusResult.error,
    fakultasResult.error,
    programStudiResult.error,
    mataKuliahResult.error,
    tahunAkademikResult.error,
    kelasResult.error,
    kurikulumResult.error,
    usersResult.error,
    dosenResult.error,
    mahasiswaResult.error,
  ].filter(Boolean);

  const dosenRows = ((dosenResult.data ?? []) as DosenQueryRow[]).map((item) => ({
    id: item.id,
    nidn: item.nidn,
    status_dosen: item.status_dosen,
    users: item.users?.[0] ?? null,
    program_studi: item.program_studi?.[0] ?? null,
  }));

  const mahasiswaRows = ((mahasiswaResult.data ?? []) as MahasiswaQueryRow[]).map((item) => ({
    id: item.id,
    nim: item.nim,
    angkatan: item.angkatan,
    status_mahasiswa: item.status_mahasiswa,
    ips: item.ips,
    ipk: item.ipk,
    users: item.users?.[0] ?? null,
    program_studi: item.program_studi?.[0] ?? null,
  }));

  const mataKuliahRows = ((mataKuliahResult.data ?? []) as MataKuliahQueryRow[]).map((item) => ({
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    sks: item.sks,
    semester: item.semester,
    jenis: item.jenis,
    is_active: item.is_active,
    program_studi: item.program_studi?.[0] ?? null,
  }));

  return {
    counts: {
      kampus: kampusCountResult.count ?? 0,
      users: usersCountResult.count ?? 0,
      fakultas: fakultasCountResult.count ?? 0,
      programStudi: programStudiCountResult.count ?? 0,
      mataKuliah: mataKuliahCountResult.count ?? 0,
      dosen: dosenCountResult.count ?? 0,
      mahasiswa: mahasiswaCountResult.count ?? 0,
      kelas: kelasCountResult.count ?? 0,
      ruangan: ruanganCountResult.count ?? 0,
      tahunAkademik: tahunAkademikCountResult.count ?? 0,
      kurikulum: kurikulumCountResult.count ?? 0,
    },
    kampus: (kampusResult.data ?? []) as KampusRow[],
    fakultas: (fakultasResult.data ?? []) as FakultasRow[],
    programStudi: (programStudiResult.data ?? []) as ProgramStudiRow[],
    mataKuliah: mataKuliahRows,
    tahunAkademik: (tahunAkademikResult.data ?? []) as TahunAkademikRow[],
    kelas: ((kelasResult.data ?? []) as Array<any>).map((item) => ({
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
    kurikulum: ((kurikulumResult.data ?? []) as Array<any>).map((item) => ({
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
    users: (usersResult.data ?? []) as UserRow[],
    dosen: dosenRows,
    mahasiswa: mahasiswaRows,
    error: errors[0]?.message ?? null,
  };
}

export type UserListResult = {
  items: UserRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
};

export async function listUsers(params: { query?: string; page?: number; pageSize?: number } = {}): Promise<UserListResult> {
  const supabase = createAdminClient();
  if (!supabase) return { items: [], totalItems: 0, totalPages: 1, currentPage: 1, query: "" };

  const pageSize = Math.max(1, params.pageSize ?? 10);
  const currentPage = Math.max(1, params.page ?? 1);
  const query = (params.query ?? "").trim();
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let countQuery = supabase.from("users").select("id", { count: "exact", head: true }).is("deleted_at", null);
  let dataQuery = supabase
    .from("users")
    .select("id, full_name, email, role, is_active, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query) {
    const escaped = query.replace(/[%_,]/g, "");
    countQuery = countQuery.or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
    dataQuery = dataQuery.or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);
  const totalItems = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: (dataResult.data ?? []) as UserRow[],
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    query,
  };
}
