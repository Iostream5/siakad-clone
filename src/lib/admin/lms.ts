import "server-only";

import { createAdminClient } from "@/supabase/admin";

type LmsAccessRole = "Admin" | "Prodi" | "Dosen" | "Mahasiswa" | string;
type SupabaseAdmin = NonNullable<ReturnType<typeof createAdminClient>>;

export type LmsMaterialFileType = "pdf" | "doc" | "video" | "link" | "other";

export type LmsParticipant = {
  id: string;
  nim: string | null;
  full_name: string;
  prodi_name: string | null;
};

type Relation<T> = T | T[] | null | undefined;

type JadwalAccessRow = {
  id: string;
  dosen_id: string;
  mata_kuliah: Relation<{ prodi_id: string | null }>;
};

type LmsClassRow = {
  id: string;
  nama_kelas: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
  peserta?: number;
  mata_kuliah: Relation<{
    nama: string;
    kode: string;
    sks: number;
    prodi_id?: string | null;
  }>;
  tahun_akademik?: Relation<{
    nama: string;
    is_aktif: boolean;
  }>;
  dosen?: Relation<{
    users: Relation<{ full_name: string }>;
  }>;
  materi?: Array<{ count: number }>;
  tugas?: Array<{ count: number }>;
  forum?: Array<{ count: number }>;
};

type TugasDetailRow = {
  id: string;
  jadwal_id: string;
  judul: string;
  instruksi: string | null;
  deadline: string;
  poin_max: number;
  file_url: string | null;
  jadwal?: Relation<{
    id: string;
    nama_kelas: string;
    mata_kuliah: Relation<{ nama: string; kode: string }>;
  }>;
};

type ForumTopikRow = {
  id: string;
  jadwal_id: string;
  user_id: string;
  judul: string;
  konten: string;
  is_pinned: boolean;
  created_at: string;
  users?: Relation<{ full_name: string; role: string; avatar_url: string | null }>;
  jadwal?: Relation<{ id: string; mata_kuliah: Relation<{ nama: string }> }>;
};

type SubmissionRow = {
  id: string;
  tugas_id: string;
  mahasiswa_id: string;
  konten_teks: string | null;
  file_url: string | null;
  nilai: number | null;
  umpan_balik: string | null;
  graded_by: string | null;
  graded_at: string | null;
  submitted_at: string;
  mahasiswa?: Relation<{
    id: string;
    nim: string | null;
    users: Relation<{ full_name: string; avatar_url: string | null }>;
  }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeClassRow(row: LmsClassRow, participantCount?: number) {
  const dosen = firstRelation(row.dosen);
  const dosenUser = firstRelation(dosen?.users);

  return {
    ...row,
    peserta: participantCount ?? row.peserta ?? 0,
    mata_kuliah: firstRelation(row.mata_kuliah),
    tahun_akademik: firstRelation(row.tahun_akademik),
    dosen: dosen
      ? {
          ...dosen,
          users: dosenUser,
        }
      : null,
  };
}

function normalizeTugas(row: TugasDetailRow) {
  const jadwal = firstRelation(row.jadwal);
  return {
    ...row,
    jadwal: jadwal
      ? {
          ...jadwal,
          mata_kuliah: firstRelation(jadwal.mata_kuliah),
        }
      : null,
  };
}

function normalizeTopik(row: ForumTopikRow) {
  const jadwal = firstRelation(row.jadwal);
  return {
    ...row,
    users: firstRelation(row.users),
    jadwal: jadwal
      ? {
          ...jadwal,
          mata_kuliah: firstRelation(jadwal.mata_kuliah),
        }
      : null,
  };
}

function normalizeSubmission(row: SubmissionRow) {
  const mahasiswa = firstRelation(row.mahasiswa);
  return {
    ...row,
    mahasiswa: mahasiswa
      ? {
          ...mahasiswa,
          users: firstRelation(mahasiswa.users),
        }
      : null,
  };
}

async function getActiveTahunAkademikId(supabase: SupabaseAdmin) {
  const { data, error } = await supabase
    .from("tahun_akademik")
    .select("id")
    .eq("is_aktif", true)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

async function getDosenIdByUserId(supabase: SupabaseAdmin, userId: string) {
  const { data, error } = await supabase
    .from("dosen")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

async function getProdiIdByKaprodiUserId(supabase: SupabaseAdmin, userId: string) {
  const { data, error } = await supabase
    .from("program_studi")
    .select("id")
    .eq("kaprodi_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

async function getMahasiswaIdByUserId(supabase: SupabaseAdmin, userId: string) {
  const { data, error } = await supabase
    .from("mahasiswa")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

async function getJadwalAccessRow(supabase: SupabaseAdmin, jadwalId: string) {
  const { data, error } = await supabase
    .from("jadwal_kuliah")
    .select("id, dosen_id, mata_kuliah:mata_kuliah_id(prodi_id)")
    .eq("id", jadwalId)
    .maybeSingle();

  if (error) throw error;
  return data as JadwalAccessRow | null;
}

async function mahasiswaHasApprovedKrsForJadwal(supabase: SupabaseAdmin, mahasiswaId: string, jadwalId: string) {
  const { data, error } = await supabase
    .from("krs_detail")
    .select("id, krs_header!inner(id_mahasiswa, status)")
    .eq("id_jadwal", jadwalId)
    .eq("krs_header.id_mahasiswa", mahasiswaId)
    .eq("krs_header.status", "Disetujui")
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
}

export async function canReadLmsClass({
  userId,
  role,
  jadwalId,
}: {
  userId: string;
  role: LmsAccessRole;
  jadwalId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase || !jadwalId) return false;
  if (role === "Admin") return true;

  const jadwal = await getJadwalAccessRow(supabase, jadwalId);
  if (!jadwal) return false;

  if (role === "Dosen") {
    const dosenId = await getDosenIdByUserId(supabase, userId);
    return Boolean(dosenId && dosenId === jadwal.dosen_id);
  }

  if (role === "Prodi") {
    const prodiId = await getProdiIdByKaprodiUserId(supabase, userId);
    const mataKuliah = firstRelation(jadwal.mata_kuliah);
    return Boolean(prodiId && mataKuliah?.prodi_id === prodiId);
  }

  if (role === "Mahasiswa") {
    const mahasiswaId = await getMahasiswaIdByUserId(supabase, userId);
    return Boolean(mahasiswaId && await mahasiswaHasApprovedKrsForJadwal(supabase, mahasiswaId, jadwalId));
  }

  return false;
}

export async function canManageLmsClass({
  userId,
  role,
  jadwalId,
}: {
  userId: string;
  role: LmsAccessRole;
  jadwalId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase || !jadwalId) return false;
  if (role === "Admin") return true;
  if (role !== "Dosen") return false;

  const [jadwal, dosenId] = await Promise.all([
    getJadwalAccessRow(supabase, jadwalId),
    getDosenIdByUserId(supabase, userId),
  ]);

  return Boolean(jadwal?.dosen_id && dosenId && jadwal.dosen_id === dosenId);
}

export async function canAccessLmsJadwal(params: {
  userId: string;
  role: LmsAccessRole;
  jadwalId: string;
}) {
  return canReadLmsClass(params);
}

export async function getLmsClassContext({
  userId,
  role,
  jadwalId,
}: {
  userId: string;
  role: LmsAccessRole;
  jadwalId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const [jadwal, canRead, canManage] = await Promise.all([
    getJadwalDetails(jadwalId),
    canReadLmsClass({ userId, role, jadwalId }),
    canManageLmsClass({ userId, role, jadwalId }),
  ]);

  return { jadwal, canRead, canManage };
}

async function getTugasJadwalId(supabase: SupabaseAdmin, tugasId: string) {
  const { data, error } = await supabase
    .from("lms_tugas")
    .select("jadwal_id")
    .eq("id", tugasId)
    .maybeSingle();

  if (error) throw error;
  return data?.jadwal_id ?? null;
}

export async function canAccessLmsTugas({
  userId,
  role,
  tugasId,
}: {
  userId: string;
  role: LmsAccessRole;
  tugasId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase || !tugasId) return false;

  const jadwalId = await getTugasJadwalId(supabase, tugasId);
  if (!jadwalId) return false;
  return canReadLmsClass({ userId, role, jadwalId });
}

export async function canAccessLmsTopik({
  userId,
  role,
  topikId,
}: {
  userId: string;
  role: LmsAccessRole;
  topikId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase || !topikId) return false;

  const { data: topik, error } = await supabase
    .from("lms_forum_topik")
    .select("jadwal_id")
    .eq("id", topikId)
    .maybeSingle();

  if (error) throw error;
  if (!topik?.jadwal_id) return false;
  return canReadLmsClass({ userId, role, jadwalId: topik.jadwal_id });
}

export async function canGradeLmsSubmission({
  userId,
  role,
  submissionId,
}: {
  userId: string;
  role: LmsAccessRole;
  submissionId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase || !submissionId) return false;

  const { data: submission, error } = await supabase
    .from("lms_pengumpulan")
    .select("tugas:lms_tugas!inner(jadwal_id)")
    .eq("id", submissionId)
    .maybeSingle();

  if (error) throw error;
  const tugas = firstRelation((submission as { tugas?: Relation<{ jadwal_id: string }> } | null)?.tugas);
  if (!tugas?.jadwal_id) return false;

  return canManageLmsClass({ userId, role, jadwalId: tugas.jadwal_id });
}

export async function getLmsParticipants(jadwalId: string): Promise<LmsParticipant[]> {
  const supabase = createAdminClient();
  if (!supabase || !jadwalId) return [];

  const { data: details, error } = await supabase
    .from("krs_detail")
    .select("krs_header!inner(id_mahasiswa, status)")
    .eq("id_jadwal", jadwalId)
    .eq("krs_header.status", "Disetujui");

  if (error) throw error;

  const mahasiswaIds = Array.from(new Set((details ?? [])
    .map((detail) => firstRelation((detail as { krs_header?: Relation<{ id_mahasiswa: string }> }).krs_header)?.id_mahasiswa)
    .filter((id): id is string => Boolean(id))));

  if (mahasiswaIds.length === 0) return [];

  const { data: mahasiswa, error: mahasiswaError } = await supabase
    .from("mahasiswa")
    .select("id, nim, users:user_id(full_name), program_studi:prodi_id(nama)")
    .in("id", mahasiswaIds);

  if (mahasiswaError) throw mahasiswaError;

  return ((mahasiswa ?? []) as Array<{
    id: string;
    nim: string | null;
    users: Relation<{ full_name: string }>;
    program_studi: Relation<{ nama: string }>;
  }>).map((item) => ({
    id: item.id,
    nim: item.nim,
    full_name: firstRelation(item.users)?.full_name ?? "Mahasiswa",
    prodi_name: firstRelation(item.program_studi)?.nama ?? null,
  }));
}

async function getApprovedParticipantCounts(supabase: SupabaseAdmin, jadwalIds: string[]) {
  if (jadwalIds.length === 0) return new Map<string, number>();

  const { data, error } = await supabase
    .from("krs_detail")
    .select("id_jadwal, krs_header!inner(status)")
    .in("id_jadwal", jadwalIds)
    .eq("krs_header.status", "Disetujui");

  if (error) throw error;

  const counts = new Map<string, number>();
  (data ?? []).forEach((item) => {
    const jadwalId = (item as { id_jadwal: string }).id_jadwal;
    counts.set(jadwalId, (counts.get(jadwalId) ?? 0) + 1);
  });

  return counts;
}

async function withParticipantCounts(supabase: SupabaseAdmin, rows: LmsClassRow[]) {
  const counts = await getApprovedParticipantCounts(supabase, rows.map((row) => row.id));
  return rows.map((row) => normalizeClassRow(row, counts.get(row.id)));
}

export async function getLmsClassesForLecturer(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const dosenId = await getDosenIdByUserId(supabase, userId);
  if (!dosenId) return [];

  const activeYearId = await getActiveTahunAkademikId(supabase);

  let query = supabase
    .from("jadwal_kuliah")
    .select(`
      id,
      nama_kelas,
      hari,
      jam_mulai,
      jam_selesai,
      ruangan,
      mata_kuliah:mata_kuliah_id(nama, kode, sks, prodi_id),
      tahun_akademik:tahun_akademik_id(nama, is_aktif),
      materi:lms_materi(count),
      tugas:lms_tugas(count),
      forum:lms_forum_topik(count)
    `)
    .eq("dosen_id", dosenId);

  if (activeYearId) query = query.eq("tahun_akademik_id", activeYearId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  return withParticipantCounts(supabase, (data ?? []) as LmsClassRow[]);
}

export async function getLmsClassesForStudent(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const [activeYearId, mahasiswaId] = await Promise.all([
    getActiveTahunAkademikId(supabase),
    getMahasiswaIdByUserId(supabase, userId),
  ]);

  if (!activeYearId || !mahasiswaId) return [];

  const { data, error } = await supabase
    .from("krs_header")
    .select(`
      krs_detail(
        jadwal:id_jadwal(
          id,
          nama_kelas,
          hari,
          jam_mulai,
          jam_selesai,
          ruangan,
          mata_kuliah:mata_kuliah_id(nama, kode, sks, prodi_id),
          dosen:dosen_id(users:user_id(full_name)),
          materi:lms_materi(count),
          tugas:lms_tugas(count),
          forum:lms_forum_topik(count)
        )
      )
    `)
    .eq("id_mahasiswa", mahasiswaId)
    .eq("id_tahun_akademik", activeYearId)
    .eq("status", "Disetujui")
    .maybeSingle();

  if (error || !data) return [];

  const rows = ((data.krs_detail ?? []) as Array<{ jadwal?: Relation<LmsClassRow> }>)
    .map((detail) => firstRelation(detail.jadwal))
    .filter((jadwal): jadwal is LmsClassRow => Boolean(jadwal));

  return withParticipantCounts(supabase, rows);
}

export async function getJadwalDetails(jadwalId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("jadwal_kuliah")
    .select(`
      *,
      mata_kuliah:mata_kuliah_id(nama, kode, sks, prodi_id),
      dosen:dosen_id(users:user_id(full_name, avatar_url))
    `)
    .eq("id", jadwalId)
    .single();

  if (error) throw error;
  const row = data as LmsClassRow & Record<string, unknown>;
  const normalized = normalizeClassRow(row);
  return normalized;
}

export async function getTugasDetails(tugasId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_tugas")
    .select(`
      *,
      jadwal:jadwal_id(
        id,
        nama_kelas,
        mata_kuliah:mata_kuliah_id(nama, kode)
      )
    `)
    .eq("id", tugasId)
    .single();

  if (error) throw error;
  return normalizeTugas(data as TugasDetailRow);
}

export async function getSubmissionForStudent(tugasId: string, mahasiswaId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_pengumpulan")
    .select("*")
    .eq("tugas_id", tugasId)
    .eq("mahasiswa_id", mahasiswaId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getLmsForumTopikDetails(topikId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_forum_topik")
    .select(`
      *,
      users(full_name, role, avatar_url),
      jadwal:jadwal_id(id, mata_kuliah:mata_kuliah_id(nama))
    `)
    .eq("id", topikId)
    .single();

  if (error) throw error;
  return normalizeTopik(data as ForumTopikRow);
}

export async function getLmsForumKomentar(topikId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_forum_komentar")
    .select(`
      *,
      users(full_name, role, avatar_url)
    `)
    .eq("topik_id", topikId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as Array<{
    id: string;
    topik_id: string;
    user_id: string;
    konten: string;
    file_url: string | null;
    created_at: string;
    users?: Relation<{ full_name: string; role: string; avatar_url: string | null }>;
  }>).map((item) => ({
    ...item,
    users: firstRelation(item.users),
  }));
}

export async function getSubmissionsForGrading(tugasId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_pengumpulan")
    .select(`
      *,
      mahasiswa:mahasiswa_id(
        id,
        nim,
        users:user_id(full_name, avatar_url)
      )
    `)
    .eq("tugas_id", tugasId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as SubmissionRow[]).map(normalizeSubmission);
}

export async function getLmsMateriByJadwal(
  jadwalId: string,
  options: { includeHidden?: boolean } = {},
) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  let query = supabase
    .from("lms_materi")
    .select("*")
    .eq("jadwal_id", jadwalId);

  if (!options.includeHidden) {
    query = query.eq("is_visible", true);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createLmsMateri(values: {
  jadwalId: string;
  judul: string;
  deskripsi?: string;
  fileUrl?: string;
  fileType?: LmsMaterialFileType;
  isVisible?: boolean;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_materi")
    .insert({
      jadwal_id: values.jadwalId,
      judul: values.judul,
      deskripsi: values.deskripsi || null,
      file_url: values.fileUrl || null,
      file_type: values.fileType || null,
      is_visible: values.isVisible ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLmsMateri(values: {
  id: string;
  judul: string;
  deskripsi?: string;
  fileUrl?: string;
  fileType?: LmsMaterialFileType;
  isVisible: boolean;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_materi")
    .update({
      judul: values.judul,
      deskripsi: values.deskripsi || null,
      file_url: values.fileUrl || null,
      file_type: values.fileType || null,
      is_visible: values.isVisible,
    })
    .eq("id", values.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLmsTugasByJadwal(jadwalId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_tugas")
    .select("*, lms_pengumpulan(id, mahasiswa_id, submitted_at, nilai)")
    .eq("jadwal_id", jadwalId)
    .order("deadline", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createLmsTugas(values: {
  jadwalId: string;
  judul: string;
  instruksi?: string;
  deadline: string;
  poinMax?: number;
  fileUrl?: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_tugas")
    .insert({
      jadwal_id: values.jadwalId,
      judul: values.judul,
      instruksi: values.instruksi || null,
      deadline: values.deadline,
      poin_max: values.poinMax ?? 100,
      file_url: values.fileUrl || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function validateLmsSubmission({
  userId,
  tugasId,
  kontenTeks,
  fileUrl,
}: {
  userId: string;
  tugasId: string;
  kontenTeks?: string;
  fileUrl?: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  if (!kontenTeks?.trim() && !fileUrl?.trim()) {
    throw new Error("Isi jawaban atau link tugas wajib diisi.");
  }

  const [mahasiswaId, tugas] = await Promise.all([
    getMahasiswaIdByUserId(supabase, userId),
    getTugasDetails(tugasId),
  ]);

  if (!mahasiswaId) throw new Error("Data mahasiswa tidak ditemukan.");
  if (!tugas?.jadwal_id) throw new Error("Tugas tidak ditemukan.");

  const allowed = await mahasiswaHasApprovedKrsForJadwal(supabase, mahasiswaId, tugas.jadwal_id);
  if (!allowed) throw new Error("Anda tidak terdaftar pada kelas tugas ini.");

  return { mahasiswaId, tugas };
}

export async function submitLmsTugas(values: {
  tugasId: string;
  mahasiswaId: string;
  kontenTeks?: string;
  fileUrl?: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_pengumpulan")
    .upsert({
      tugas_id: values.tugasId,
      mahasiswa_id: values.mahasiswaId,
      konten_teks: values.kontenTeks || null,
      file_url: values.fileUrl || null,
      submitted_at: new Date().toISOString(),
    }, { onConflict: "tugas_id,mahasiswa_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLmsForumByJadwal(jadwalId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_forum_topik")
    .select("*, users(full_name, role), lms_forum_komentar(count)")
    .eq("jadwal_id", jadwalId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as Array<ForumTopikRow & { lms_forum_komentar?: Array<{ count: number }> }>).map((item) => ({
    ...normalizeTopik(item),
    lms_forum_komentar: item.lms_forum_komentar ?? [],
  }));
}

export async function createLmsForumTopik(values: {
  jadwalId: string;
  userId: string;
  judul: string;
  konten: string;
  isPinned?: boolean;
  fileUrl?: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_forum_topik")
    .insert({
      jadwal_id: values.jadwalId,
      user_id: values.userId,
      judul: values.judul,
      konten: values.konten,
      is_pinned: values.isPinned ?? false,
      file_url: values.fileUrl || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLmsForumTopik(values: {
  id: string;
  judul: string;
  konten: string;
  fileUrl?: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_forum_topik")
    .update({
      judul: values.judul,
      konten: values.konten,
      file_url: values.fileUrl || null,
    })
    .eq("id", values.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLmsForumTopik(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { error } = await supabase
    .from("lms_forum_topik")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return { success: true };
}

export async function deleteLmsForumKomentar(values: {
  komentarId: string;
  userId: string;
  userRole: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  // Get comment details
  const { data: komentar, error: fetchError } = await supabase
    .from("lms_forum_komentar")
    .select("user_id")
    .eq("id", values.komentarId)
    .single();

  if (fetchError) throw fetchError;
  if (!komentar) throw new Error("Komentar tidak ditemukan");

  // Check permission: Mahasiswa can only delete their own, Dosen can delete any
  const isOwner = komentar.user_id === values.userId;
  const isDosen = values.userRole === "Dosen";
  
  if (!isOwner && !isDosen) {
    throw new Error("Anda tidak memiliki akses untuk menghapus komentar ini");
  }

  // Soft delete by updating konten to indicate deletion
  const { data, error } = await supabase
    .from("lms_forum_komentar")
    .update({
      konten: `[Komentar ini dihapus oleh ${values.userRole === 'Dosen' ? 'Dosen' : 'Mahasiswa'}]`,
    })
    .eq("id", values.komentarId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLmsForumKomentar(values: {
  komentarId: string;
  userId: string;
  konten: string;
  fileUrl?: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  // Get comment details to check ownership
  const { data: komentar, error: fetchError } = await supabase
    .from("lms_forum_komentar")
    .select("user_id")
    .eq("id", values.komentarId)
    .single();

  if (fetchError) throw fetchError;
  if (!komentar) throw new Error("Komentar tidak ditemukan");

  // Only owner can edit their comment
  if (komentar.user_id !== values.userId) {
    throw new Error("Anda hanya dapat mengedit komentar Anda sendiri");
  }

  // Update comment
  const { data, error } = await supabase
    .from("lms_forum_komentar")
    .update({
      konten: values.konten,
      file_url: values.fileUrl || null,
    })
    .eq("id", values.komentarId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLmsClassesForAdmin(options: { prodiId?: string; tahunAkademikId?: string } = {}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  let query = supabase
    .from("jadwal_kuliah")
    .select(`
      id,
      nama_kelas,
      hari,
      jam_mulai,
      jam_selesai,
      ruangan,
      peserta,
      mata_kuliah:mata_kuliah_id(nama, kode, sks, prodi_id),
      tahun_akademik:tahun_akademik_id(nama, is_aktif),
      dosen:dosen_id(users:user_id(full_name)),
      materi:lms_materi(count),
      tugas:lms_tugas(count),
      forum:lms_forum_topik(count)
    `);

  if (options.tahunAkademikId) {
    query = query.eq("tahun_akademik_id", options.tahunAkademikId);
  } else {
    const activeYearId = await getActiveTahunAkademikId(supabase);
    if (activeYearId) query = query.eq("tahun_akademik_id", activeYearId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  let rows = (data ?? []) as LmsClassRow[];
  if (options.prodiId) {
    rows = rows.filter((item) => firstRelation(item.mata_kuliah)?.prodi_id === options.prodiId);
  }

  return withParticipantCounts(supabase, rows);
}
