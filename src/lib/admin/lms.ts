import "server-only";

import { createAdminClient } from "@/supabase/admin";

/**
 * LMS: Dashboard & Class Lists
 */

export async function getLmsClassesForLecturer(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data: dosen } = await supabase
    .from("dosen")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!dosen) return [];

  const { data, error } = await supabase
    .from("jadwal_kuliah")
    .select(`
      id,
      nama_kelas,
      hari,
      jam_mulai,
      jam_selesai,
      ruangan,
      mata_kuliah:mata_kuliah_id(nama, kode, sks),
      tahun_akademik:tahun_akademik_id(nama, is_aktif)
    `)
    .eq("dosen_id", dosen.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getLmsClassesForStudent(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data: activeYear } = await supabase
    .from("tahun_akademik")
    .select("id")
    .eq("is_aktif", true)
    .maybeSingle();

  if (!activeYear) return [];

  const { data: mahasiswa } = await supabase
    .from("mahasiswa")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!mahasiswa) return [];

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
          mata_kuliah:mata_kuliah_id(nama, kode, sks),
          dosen:dosen_id(users:user_id(full_name))
        )
      )
    `)
    .eq("id_mahasiswa", mahasiswa.id)
    .eq("id_tahun_akademik", activeYear.id)
    .eq("status", "Disetujui")
    .maybeSingle();

  if (error || !data) return [];

  return (data.krs_detail || [])
    .map((detail: any) => detail.jadwal)
    .filter(Boolean);
}

export async function getJadwalDetails(jadwalId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("jadwal_kuliah")
    .select(`
      *,
      mata_kuliah:mata_kuliah_id(nama, kode, sks, deskripsi),
      dosen:dosen_id(users:user_id(full_name, avatar_url))
    `)
    .eq("id", jadwalId)
    .single();

  if (error) throw error;
  return data;
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
  return data;
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
  return data;
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
  return data;
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
  return data;
}

/**
 * LMS: Materi Kuliah
 */

export async function getLmsMateriByJadwal(jadwalId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_materi")
    .select("*")
    .eq("jadwal_id", jadwalId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createLmsMateri(values: {
  jadwalId: string;
  judul: string;
  deskripsi?: string;
  fileUrl?: string;
  fileType?: "pdf" | "doc" | "video" | "link" | "other";
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_materi")
    .insert({
      jadwal_id: values.jadwalId,
      judul: values.judul,
      deskripsi: values.deskripsi,
      file_url: values.fileUrl,
      file_type: values.fileType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * LMS: Tugas & Pengumpulan
 */

export async function getLmsTugasByJadwal(jadwalId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data, error } = await supabase
    .from("lms_tugas")
    .select("*, lms_pengumpulan(id, mahasiswa_id, submitted_at, nilai)")
    .eq("jadwal_id", jadwalId)
    .order(" deadline", { ascending: true });

  if (error) throw error;
  return data;
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
      instruksi: values.instruksi,
      deadline: values.deadline,
      poin_max: values.poinMax ?? 100,
      file_url: values.fileUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
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
      konten_teks: values.kontenTeks,
      file_url: values.fileUrl,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * LMS: Forum Diskusi
 */

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
  return data;
}

export async function createLmsForumTopik(values: {
  jadwalId: string;
  userId: string;
  judul: string;
  konten: string;
  isPinned?: boolean;
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
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLmsClassesForAdmin(options: { prodiId?: string, tahunAkademikId?: string } = {}) {
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
    // Default to active year if not provided
    const { data: activeYear } = await supabase
      .from("tahun_akademik")
      .select("id")
      .eq("is_aktif", true)
      .maybeSingle();

    if (activeYear) {
        query = query.eq("tahun_akademik_id", activeYear.id);
    }
  }

  // NOTE: Supabase PostgREST might not support filtering on inner joined tables directly easily in one query without inner join
  // For simplicity we fetch all and filter in memory for Prodi if needed, or use inner joins properly

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;

  let result = data;

  if (options.prodiId) {
      result = result.filter((item: any) => {
         const mk = Array.isArray(item.mata_kuliah) ? item.mata_kuliah[0] : item.mata_kuliah;
         return mk?.prodi_id === options.prodiId;
      });
  }

  return result;
}
