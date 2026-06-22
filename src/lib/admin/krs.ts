import "server-only";

import { listRegistrasi } from "@/lib/admin/registrasi";
import type { KrsSubmissionItem } from "@/types/domain";
import { createAdminClient } from "@/supabase/admin";

const MAX_SKS = 24;
const RESERVED_KRS_STATUSES = ["Diajukan", "Disetujui"];

export type JadwalRow = {
  id: string;
  tahun_akademik_id: string;
  mata_kuliah_id: string;
  dosen_id: string;
  nama_kelas: string | null;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
  kapasitas: number;
  peserta: number;
  seats_left: number;
  mata_kuliah: {
    id: string;
    kode: string;
    nama: string;
    sks: number;
    semester: number;
    prodi_id: string;
    prasyarat_mk_id: string | null;
  } | null;
  dosen: {
    id?: string;
    users: {
      full_name: string;
    } | null;
  } | null;
};

export type KrsSubmitEligibility = {
  allowed: boolean;
  reason: string | null;
  registrasiStatus: string | null;
  isKrsOpen: boolean;
};

export type DosenWaliCandidate = {
  id: string;
  full_name: string;
  prodi_id: string | null;
};

type TahunAkademikRow = {
  id: string;
  semester: string | null;
  is_aktif: boolean;
  is_krs_open: boolean;
};

type MahasiswaKrsContextRow = {
  id: string;
  prodi_id: string;
  status_mahasiswa: string;
};

type JadwalQueryRow = {
  id: string;
  tahun_akademik_id: string;
  mata_kuliah_id: string;
  dosen_id: string;
  nama_kelas: string | null;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
  kapasitas: number;
  mata_kuliah: {
    id: string;
    kode: string;
    nama: string;
    sks: number;
    semester: number;
    prodi_id: string;
    is_active?: boolean;
  } | Array<{
    id: string;
    kode: string;
    nama: string;
    sks: number;
    semester: number;
    prodi_id: string;
    is_active?: boolean;
  }> | null;
  dosen: {
    id: string;
    users: { full_name: string } | { full_name: string }[] | null;
  } | Array<{
    id: string;
    users: { full_name: string } | { full_name: string }[] | null;
  }> | null;
};

type JadwalValidationRow = JadwalQueryRow;

type KrsDetailScheduleRow = {
  id_jadwal: string;
  krs_header?: {
    id_mahasiswa: string;
    id_tahun_akademik: string;
    status: string;
  } | Array<{
    id_mahasiswa: string;
    id_tahun_akademik: string;
    status: string;
  }> | null;
};

type PrasyaratRow = {
  id_mk: string;
  id_mk_prasyarat: string;
};

type PassedGradeRow = {
  jadwal: { mata_kuliah_id: string } | Array<{ mata_kuliah_id: string }> | null;
};

type DosenAdvisorCandidateRow = {
  id: string;
  homebase_prodi_id: string | null;
  users: { full_name: string } | Array<{ full_name: string }> | null;
};

function getRelationObject<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

function schedulesOverlap(left: JadwalValidationRow, right: JadwalValidationRow) {
  if (left.hari !== right.hari) return false;
  return normalizeTime(left.jam_mulai) < normalizeTime(right.jam_selesai)
    && normalizeTime(left.jam_selesai) > normalizeTime(right.jam_mulai);
}

function semesterMatchesPeriode(tahunAkademikSemester: string | null, mataKuliahSemester: number) {
  const normalized = (tahunAkademikSemester ?? "").toLowerCase();
  if (normalized.includes("pendek")) return true;
  if (normalized.includes("genap")) return mataKuliahSemester % 2 === 0;
  if (normalized.includes("ganjil")) return mataKuliahSemester % 2 === 1;
  return true;
}

async function getTahunAkademik(supabase: NonNullable<ReturnType<typeof createAdminClient>>, tahunAkademikId: string) {
  const { data, error } = await supabase
    .from("tahun_akademik")
    .select("id, semester, is_aktif, is_krs_open")
    .eq("id", tahunAkademikId)
    .maybeSingle();

  if (error) throw error;
  return data as TahunAkademikRow | null;
}

async function getMahasiswaKrsContext(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  mahasiswaId: string,
) {
  const { data, error } = await supabase
    .from("mahasiswa")
    .select("id, prodi_id, status_mahasiswa")
    .eq("id", mahasiswaId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data as MahasiswaKrsContextRow | null;
}

export async function getJadwalSeatUsage(params: {
  tahunAkademikId?: string;
  jadwalIds?: string[];
  excludeMahasiswaId?: string;
} = {}) {
  const supabase = createAdminClient();
  if (!supabase) return new Map<string, number>();

  let query = supabase
    .from("krs_detail")
    .select(`
      id_jadwal,
      krs_header!inner(id_mahasiswa, id_tahun_akademik, status)
    `)
    .in("krs_header.status", RESERVED_KRS_STATUSES);

  if (params.tahunAkademikId) {
    query = query.eq("krs_header.id_tahun_akademik", params.tahunAkademikId);
  }

  if (params.jadwalIds?.length) {
    query = query.in("id_jadwal", params.jadwalIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  const usage = new Map<string, number>();
  ((data ?? []) as unknown as KrsDetailScheduleRow[]).forEach((detail) => {
    const header = getRelationObject(detail.krs_header);
    if (!header) return;
    if (params.excludeMahasiswaId && header.id_mahasiswa === params.excludeMahasiswaId) return;
    usage.set(detail.id_jadwal, (usage.get(detail.id_jadwal) ?? 0) + 1);
  });

  return usage;
}

async function getPrasyaratByMataKuliah(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  mataKuliahIds: string[],
) {
  const { data, error } = mataKuliahIds.length
    ? await supabase
        .from("mata_kuliah_prasyarat")
        .select("id_mk, id_mk_prasyarat")
        .in("id_mk", mataKuliahIds)
    : { data: [], error: null };

  if (error) throw error;

  const byMk = new Map<string, string[]>();
  ((data ?? []) as PrasyaratRow[]).forEach((row) => {
    byMk.set(row.id_mk, [...(byMk.get(row.id_mk) ?? []), row.id_mk_prasyarat]);
  });

  return byMk;
}

async function getPassedMataKuliahIds(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  mahasiswaId: string,
) {
  const { data, error } = await supabase
    .from("nilai_akhir")
    .select(`
      jadwal:jadwal_id!inner(mata_kuliah_id)
    `)
    .eq("mahasiswa_id", mahasiswaId)
    .not("nilai_huruf", "in", '("D","E")')
    .not("published_at", "is", null);

  if (error) throw error;

  return new Set(
    ((data ?? []) as unknown as PassedGradeRow[])
      .map((item) => getRelationObject(item.jadwal)?.mata_kuliah_id)
      .filter((id): id is string => Boolean(id)),
  );
}

async function mapJadwalRows(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  rows: JadwalQueryRow[],
  options: { tahunAkademikId?: string; excludeMahasiswaId?: string } = {},
): Promise<JadwalRow[]> {
  const mataKuliahIds = rows
    .map((row) => getRelationObject(row.mata_kuliah)?.id ?? row.mata_kuliah_id)
    .filter((id): id is string => Boolean(id));
  const prasyaratByMk = await getPrasyaratByMataKuliah(supabase, [...new Set(mataKuliahIds)]);
  const seatUsage = await getJadwalSeatUsage({
    tahunAkademikId: options.tahunAkademikId,
    jadwalIds: rows.map((row) => row.id),
    excludeMahasiswaId: options.excludeMahasiswaId,
  });

  return rows.map((row) => {
    const mataKuliah = getRelationObject(row.mata_kuliah);
    const dosen = getRelationObject(row.dosen);
    const usedSeats = seatUsage.get(row.id) ?? 0;
    const firstPrasyarat = mataKuliah ? prasyaratByMk.get(mataKuliah.id)?.[0] ?? null : null;

    return {
      id: row.id,
      tahun_akademik_id: row.tahun_akademik_id,
      mata_kuliah_id: row.mata_kuliah_id,
      dosen_id: row.dosen_id,
      nama_kelas: row.nama_kelas,
      hari: row.hari,
      jam_mulai: row.jam_mulai,
      jam_selesai: row.jam_selesai,
      ruangan: row.ruangan,
      kapasitas: Number(row.kapasitas) || 0,
      peserta: usedSeats,
      seats_left: Math.max((Number(row.kapasitas) || 0) - usedSeats, 0),
      mata_kuliah: mataKuliah
        ? {
            id: mataKuliah.id,
            kode: mataKuliah.kode,
            nama: mataKuliah.nama,
            sks: Number(mataKuliah.sks) || 0,
            semester: Number(mataKuliah.semester) || 0,
            prodi_id: mataKuliah.prodi_id,
            prasyarat_mk_id: firstPrasyarat,
          }
        : null,
      dosen: dosen
        ? {
            id: dosen.id,
            users: getRelationObject(dosen.users),
          }
        : null,
    };
  });
}

export async function getAvailableJadwal(tahunAkademikId: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("jadwal_kuliah")
    .select(`
      id,
      tahun_akademik_id,
      mata_kuliah_id,
      dosen_id,
      nama_kelas,
      hari,
      jam_mulai,
      jam_selesai,
      ruangan,
      kapasitas,
      mata_kuliah:mata_kuliah_id(id, kode, nama, sks, semester, prodi_id, is_active),
      dosen:dosen_id(id, users:user_id(full_name))
    `)
    .eq("tahun_akademik_id", tahunAkademikId);

  if (error) {
    console.error("Error fetching jadwal:", {
      code: error.code,
      message: error.message,
      hint: error.hint,
    });
    return [];
  }

  return mapJadwalRows(supabase, (data ?? []) as unknown as JadwalQueryRow[], { tahunAkademikId });
}

export async function getKrsEligibleJadwal({
  mahasiswaId,
  tahunAkademikId,
}: {
  mahasiswaId: string;
  tahunAkademikId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const [mahasiswa, tahunAkademik] = await Promise.all([
    getMahasiswaKrsContext(supabase, mahasiswaId),
    getTahunAkademik(supabase, tahunAkademikId),
  ]);

  if (!mahasiswa || !tahunAkademik) return [];

  const { data, error } = await supabase
    .from("jadwal_kuliah")
    .select(`
      id,
      tahun_akademik_id,
      mata_kuliah_id,
      dosen_id,
      nama_kelas,
      hari,
      jam_mulai,
      jam_selesai,
      ruangan,
      kapasitas,
      mata_kuliah:mata_kuliah_id!inner(id, kode, nama, sks, semester, prodi_id, is_active),
      dosen:dosen_id(id, users:user_id(full_name))
    `)
    .eq("tahun_akademik_id", tahunAkademikId)
    .eq("mata_kuliah.prodi_id", mahasiswa.prodi_id)
    .eq("mata_kuliah.is_active", true);

  if (error) {
    console.error("Error fetching eligible jadwal:", {
      code: error.code,
      message: error.message,
      hint: error.hint,
    });
    return [];
  }

  const filteredRows = ((data ?? []) as unknown as JadwalQueryRow[]).filter((row) => {
    const mataKuliah = getRelationObject(row.mata_kuliah);
    return Boolean(mataKuliah && semesterMatchesPeriode(tahunAkademik.semester, mataKuliah.semester));
  });

  return mapJadwalRows(supabase, filteredRows, { tahunAkademikId, excludeMahasiswaId: mahasiswaId });
}

export async function getStudentKrs(mahasiswaId: string, tahunAkademikId: string) {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("krs_header")
    .select(`
      id,
      status,
      total_sks,
      catatan_dosen,
      krs_detail(
        id,
        jadwal:id_jadwal(
          *,
          mata_kuliah:mata_kuliah_id(id, kode, nama, sks, semester, prodi_id),
          dosen:dosen_id(id, users:user_id(full_name))
        )
      )
    `)
    .eq("id_mahasiswa", mahasiswaId)
    .eq("id_tahun_akademik", tahunAkademikId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function canSubmitKrs(mahasiswaId: string, tahunAkademikId: string): Promise<KrsSubmitEligibility> {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      allowed: false,
      reason: "Koneksi database belum tersedia.",
      registrasiStatus: null,
      isKrsOpen: false,
    };
  }

  const [mahasiswa, tahunAkademik] = await Promise.all([
    getMahasiswaKrsContext(supabase, mahasiswaId),
    getTahunAkademik(supabase, tahunAkademikId),
  ]);

  if (!mahasiswa) {
    return {
      allowed: false,
      reason: "Data mahasiswa tidak ditemukan.",
      registrasiStatus: null,
      isKrsOpen: false,
    };
  }

  if (!tahunAkademik) {
    return {
      allowed: false,
      reason: "Tahun akademik tidak valid.",
      registrasiStatus: null,
      isKrsOpen: false,
    };
  }

  if (!tahunAkademik.is_aktif) {
    return {
      allowed: false,
      reason: "Tahun akademik ini belum aktif.",
      registrasiStatus: null,
      isKrsOpen: Boolean(tahunAkademik.is_krs_open),
    };
  }

  if (!tahunAkademik.is_krs_open) {
    return {
      allowed: false,
      reason: "Periode KRS belum dibuka.",
      registrasiStatus: null,
      isKrsOpen: false,
    };
  }

  const registrasi = (await listRegistrasi({ mahasiswaId, tahunAkademikId }))[0] ?? null;
  const registrasiStatus = registrasi?.status ?? null;
  const isRegistered = registrasiStatus === "LUNAS" || registrasiStatus === "DISPENSASI";

  if (!isRegistered) {
    return {
      allowed: false,
      reason: registrasi
        ? "Daftar ulang harus LUNAS atau DISPENSASI sebelum isi KRS."
        : "Registrasi semester belum dibuat.",
      registrasiStatus,
      isKrsOpen: true,
    };
  }

  return {
    allowed: true,
    reason: null,
    registrasiStatus,
    isKrsOpen: true,
  };
}

export async function validateKrsSelection({
  mahasiswaId,
  tahunAkademikId,
  jadwalIds,
}: {
  mahasiswaId: string;
  tahunAkademikId: string;
  jadwalIds: string[];
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Koneksi database belum tersedia.");

  const uniqueJadwalIds = Array.from(new Set(jadwalIds));
  if (uniqueJadwalIds.length === 0) throw new Error("Pilih minimal satu mata kuliah.");
  if (uniqueJadwalIds.length !== jadwalIds.length) throw new Error("Ada jadwal yang dipilih lebih dari satu kali.");

  const [eligibility, mahasiswa, tahunAkademik] = await Promise.all([
    canSubmitKrs(mahasiswaId, tahunAkademikId),
    getMahasiswaKrsContext(supabase, mahasiswaId),
    getTahunAkademik(supabase, tahunAkademikId),
  ]);

  if (!eligibility.allowed) throw new Error(eligibility.reason ?? "KRS belum bisa diajukan.");
  if (!mahasiswa) throw new Error("Data mahasiswa tidak ditemukan.");
  if (!tahunAkademik) throw new Error("Tahun akademik tidak valid.");

  const { data, error } = await supabase
    .from("jadwal_kuliah")
    .select(`
      id,
      tahun_akademik_id,
      mata_kuliah_id,
      dosen_id,
      nama_kelas,
      hari,
      jam_mulai,
      jam_selesai,
      ruangan,
      kapasitas,
      mata_kuliah:mata_kuliah_id!inner(id, kode, nama, sks, semester, prodi_id, is_active),
      dosen:dosen_id(id, users:user_id(full_name))
    `)
    .eq("tahun_akademik_id", tahunAkademikId)
    .in("id", uniqueJadwalIds);

  if (error) throw error;
  const jadwals = (data ?? []) as unknown as JadwalValidationRow[];
  if (jadwals.length !== uniqueJadwalIds.length) {
    throw new Error("Pilihan jadwal tidak valid untuk tahun akademik ini.");
  }

  let totalSks = 0;
  const selectedMataKuliahIds = new Set<string>();

  for (const jadwal of jadwals) {
    const mataKuliah = getRelationObject(jadwal.mata_kuliah);
    if (!mataKuliah) throw new Error("Data mata kuliah pada jadwal tidak lengkap.");
    if (mataKuliah.prodi_id !== mahasiswa.prodi_id) {
      throw new Error("Ada mata kuliah yang bukan dari program studi Anda.");
    }
    if (mataKuliah.is_active === false) {
      throw new Error("Ada mata kuliah yang sudah tidak aktif.");
    }
    if (!semesterMatchesPeriode(tahunAkademik.semester, mataKuliah.semester)) {
      throw new Error("Ada mata kuliah yang tidak sesuai semester akademik aktif.");
    }
    if (selectedMataKuliahIds.has(jadwal.mata_kuliah_id)) {
      throw new Error("Satu mata kuliah hanya boleh dipilih satu kelas.");
    }

    selectedMataKuliahIds.add(jadwal.mata_kuliah_id);
    totalSks += Number(mataKuliah.sks) || 0;
  }

  if (totalSks > MAX_SKS) {
    throw new Error(`Total SKS (${totalSks}) melebihi batas maksimal (${MAX_SKS} SKS).`);
  }

  for (let leftIndex = 0; leftIndex < jadwals.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < jadwals.length; rightIndex += 1) {
      if (schedulesOverlap(jadwals[leftIndex], jadwals[rightIndex])) {
        throw new Error("Ada jadwal kuliah yang bentrok. Silakan pilih kelas lain.");
      }
    }
  }

  const usage = await getJadwalSeatUsage({
    jadwalIds: uniqueJadwalIds,
    tahunAkademikId,
    excludeMahasiswaId: mahasiswaId,
  });

  for (const jadwal of jadwals) {
    const usedSeats = usage.get(jadwal.id) ?? 0;
    if (usedSeats >= jadwal.kapasitas) {
      throw new Error("Terdapat mata kuliah yang kelasnya sudah penuh.");
    }
  }

  const prasyaratByMk = await getPrasyaratByMataKuliah(supabase, [...selectedMataKuliahIds]);
  const prasyaratIds = [...new Set([...prasyaratByMk.values()].flat())];

  if (prasyaratIds.length > 0) {
    const passedMkIds = await getPassedMataKuliahIds(supabase, mahasiswaId);
    for (const requiredId of prasyaratIds) {
      if (!passedMkIds.has(requiredId)) {
        throw new Error("Anda belum lulus mata kuliah prasyarat untuk beberapa mata kuliah yang dipilih.");
      }
    }
  }

  return {
    jadwals,
    totalSks,
    uniqueJadwalIds,
  };
}

export async function ensureAutoDosenWaliForMahasiswa(mahasiswaId: string) {
  const supabase = createAdminClient();
  if (!supabase) return { assigned: false, reason: "NO_CLIENT" };

  const { data: existing, error: existingError } = await supabase
    .from("dosen_wali")
    .select("id, id_dosen")
    .eq("id_mahasiswa", mahasiswaId)
    .limit(1);

  if (existingError) {
    console.error("Error checking dosen wali:", {
      code: existingError.code,
      message: existingError.message,
      hint: existingError.hint,
    });
    return { assigned: false, reason: "CHECK_FAILED" };
  }

  if ((existing ?? []).length > 0) {
    return { assigned: false, reason: "ALREADY_ASSIGNED", dosenId: existing?.[0]?.id_dosen ?? null };
  }

  const mahasiswa = await getMahasiswaKrsContext(supabase, mahasiswaId);
  if (!mahasiswa?.prodi_id) {
    return { assigned: false, reason: "NO_PRODI" };
  }

  const { data: candidates, error: dosenError } = await supabase
    .from("dosen")
    .select("id")
    .eq("homebase_prodi_id", mahasiswa.prodi_id)
    .eq("status_dosen", "AKTIF")
    .is("deleted_at", null);

  if (dosenError) {
    console.error("Error fetching dosen wali candidates:", {
      code: dosenError.code,
      message: dosenError.message,
      hint: dosenError.hint,
    });
    return { assigned: false, reason: "DOSEN_QUERY_FAILED" };
  }

  const activeDosen = (candidates ?? []) as Array<{ id: string }>;
  if (activeDosen.length !== 1) {
    return { assigned: false, reason: activeDosen.length === 0 ? "NO_ACTIVE_DOSEN" : "MULTIPLE_ACTIVE_DOSEN" };
  }

  const dosenId = activeDosen[0].id;
  const { error: insertError } = await supabase
    .from("dosen_wali")
    .insert({
      id_dosen: dosenId,
      id_mahasiswa: mahasiswaId,
    });

  if (insertError) {
    console.error("Error assigning dosen wali:", {
      code: insertError.code,
      message: insertError.message,
      hint: insertError.hint,
    });
    return { assigned: false, reason: "INSERT_FAILED" };
  }

  return { assigned: true, reason: "ASSIGNED", dosenId };
}

export async function assignDosenWali({
  mahasiswaId,
  dosenId,
}: {
  mahasiswaId: string;
  dosenId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Koneksi database belum tersedia.");

  const [mahasiswa, dosenResult] = await Promise.all([
    getMahasiswaKrsContext(supabase, mahasiswaId),
    supabase
      .from("dosen")
      .select("id, homebase_prodi_id, status_dosen")
      .eq("id", dosenId)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  if (!mahasiswa) throw new Error("Mahasiswa tidak ditemukan.");
  if (dosenResult.error) throw dosenResult.error;
  const dosen = dosenResult.data as { id: string; homebase_prodi_id: string | null; status_dosen: string } | null;
  if (!dosen || dosen.status_dosen !== "AKTIF") throw new Error("Dosen wali tidak valid atau tidak aktif.");
  if (dosen.homebase_prodi_id !== mahasiswa.prodi_id) {
    throw new Error("Dosen wali harus berasal dari prodi yang sama dengan mahasiswa.");
  }

  const { error: deleteError } = await supabase
    .from("dosen_wali")
    .delete()
    .eq("id_mahasiswa", mahasiswaId);
  if (deleteError) throw deleteError;

  const { data, error: insertError } = await supabase
    .from("dosen_wali")
    .insert({ id_mahasiswa: mahasiswaId, id_dosen: dosenId })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return data;
}

export async function listDosenWaliCandidates(prodiId?: string | null): Promise<DosenWaliCandidate[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("dosen")
    .select("id, homebase_prodi_id, users:user_id(full_name)")
    .eq("status_dosen", "AKTIF")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (prodiId) {
    query = query.eq("homebase_prodi_id", prodiId);
  }

  const { data, error } = await query;
  if (error) return [];

  return ((data ?? []) as unknown as DosenAdvisorCandidateRow[]).map((item) => ({
    id: item.id,
    prodi_id: item.homebase_prodi_id,
    full_name: getRelationObject(item.users)?.full_name ?? "Tanpa Nama",
  }));
}

export async function submitKrs(mahasiswaId: string, tahunAkademikId: string, jadwalIds: string[]) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Koneksi database belum tersedia.");

  const validation = await validateKrsSelection({ mahasiswaId, tahunAkademikId, jadwalIds });

  const { data: krsHead, error: headError } = await supabase
    .from("krs_header")
    .upsert({
      id_mahasiswa: mahasiswaId,
      id_tahun_akademik: tahunAkademikId,
      status: "Diajukan",
      total_sks: validation.totalSks,
      approved_by: null,
      approved_at: null,
      catatan_dosen: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id_mahasiswa,id_tahun_akademik" })
    .select("id")
    .single();

  if (headError) throw headError;

  const { error: deleteError } = await supabase.from("krs_detail").delete().eq("id_krs_header", krsHead.id);
  if (deleteError) throw deleteError;

  const details = validation.uniqueJadwalIds.map((id) => ({
    id_krs_header: krsHead.id,
    id_jadwal: id,
  }));

  const { error: detailError } = await supabase.from("krs_detail").insert(details);
  if (detailError) throw detailError;

  await ensureAutoDosenWaliForMahasiswa(mahasiswaId);

  return { success: true, krsId: krsHead.id };
}

export async function canDosenApproveKrs(krsId: string, userId: string) {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const { data: dosen } = await supabase
    .from("dosen")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!dosen?.id) return false;

  const { data: krs } = await supabase
    .from("krs_header")
    .select("id_mahasiswa")
    .eq("id", krsId)
    .maybeSingle();

  if (!krs?.id_mahasiswa) return false;

  const { data: wali } = await supabase
    .from("dosen_wali")
    .select("id")
    .eq("id_dosen", dosen.id)
    .eq("id_mahasiswa", krs.id_mahasiswa)
    .maybeSingle();

  return Boolean(wali?.id);
}

export async function canProdiApproveKrs(krsId: string, userId: string) {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const { data: prodi } = await supabase
    .from("program_studi")
    .select("id")
    .eq("kaprodi_id", userId)
    .maybeSingle();

  if (!prodi?.id) return false;

  const { data: krs } = await supabase
    .from("krs_header")
    .select("mahasiswa:id_mahasiswa(prodi_id)")
    .eq("id", krsId)
    .maybeSingle();

  const mahasiswa = getRelationObject(krs?.mahasiswa as { prodi_id: string } | Array<{ prodi_id: string }> | null | undefined);
  return mahasiswa?.prodi_id === prodi.id;
}

export async function updateKrsStatus(
  krsId: string,
  status: "Disetujui" | "Ditolak",
  adminUserId: string,
  catatan?: string,
) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Koneksi database belum tersedia.");

  const { data: current, error: currentError } = await supabase
    .from("krs_header")
    .select("id, status")
    .eq("id", krsId)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!current) throw new Error("KRS tidak ditemukan.");
  if (current.status !== "Diajukan") {
    throw new Error("Hanya KRS berstatus Diajukan yang bisa diproses.");
  }

  const { error } = await supabase
    .from("krs_header")
    .update({
      status,
      approved_by: adminUserId,
      approved_at: new Date().toISOString(),
      catatan_dosen: catatan || null,
    })
    .eq("id", krsId);

  if (error) throw error;

  return { success: true };
}

export async function listKrsSubmissions(params: {
  tahunAkademikId: string;
  dosenId?: string;
  prodiId?: string;
}): Promise<KrsSubmissionItem[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("krs_header")
    .select(`
      id,
      status,
      total_sks,
      catatan_dosen,
      updated_at,
      mahasiswa:id_mahasiswa!inner(
        id,
        nim,
        prodi_id,
        users:user_id(full_name),
        program_studi:prodi_id(id, nama)
      ),
      krs_detail(
        id,
        jadwal:id_jadwal(
          id,
          hari,
          jam_mulai,
          jam_selesai,
          ruangan,
          mata_kuliah:mata_kuliah_id(kode, nama, sks),
          dosen:dosen_id(users:user_id(full_name))
        )
      )
    `)
    .eq("id_tahun_akademik", params.tahunAkademikId);

  if (params.prodiId) {
    query = query.eq("mahasiswa.prodi_id", params.prodiId);
  }

  if (params.dosenId) {
    const { data: students } = await supabase
      .from("dosen_wali")
      .select("id_mahasiswa")
      .eq("id_dosen", params.dosenId);

    const studentIds = (students || []).map((student) => student.id_mahasiswa);
    if (studentIds.length === 0) return [];
    query = query.in("id_mahasiswa", studentIds);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) return [];

  const items = (data ?? []) as Array<Record<string, unknown> & { mahasiswa?: unknown }>;
  const mahasiswaIds = items
    .map((item) => getRelationObject(item.mahasiswa as { id: string } | Array<{ id: string }> | null | undefined)?.id)
    .filter((id): id is string => Boolean(id));

  const { data: waliRows } = mahasiswaIds.length
    ? await supabase
        .from("dosen_wali")
        .select("id_mahasiswa, id_dosen, dosen:id_dosen(users:user_id(full_name))")
        .in("id_mahasiswa", mahasiswaIds)
    : { data: [] };

  const waliByMahasiswa = new Map<string, unknown>();
  (waliRows ?? []).forEach((wali) => {
    waliByMahasiswa.set(wali.id_mahasiswa, {
      id_dosen: wali.id_dosen,
      dosen: wali.dosen,
    });
  });

  return items.map((item) => {
    const mahasiswa = getRelationObject(item.mahasiswa as { id: string } | Array<{ id: string }> | null | undefined);
    return {
      ...item,
      dosen_wali: mahasiswa?.id ? waliByMahasiswa.get(mahasiswa.id) ?? null : null,
    };
  }) as KrsSubmissionItem[];
}
