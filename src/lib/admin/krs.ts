import "server-only";

import { createAdminClient } from "@/supabase/admin";

export type JadwalRow = {
  id: string;
  tahun_akademik_id: string;
  mata_kuliah_id: string;
  dosen_id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
  kapasitas: number;
  peserta: number;
  mata_kuliah: {
    kode: string;
    nama: string;
    sks: number;
    semester: number;
    prasyarat_mk_id: string | null;
  };
  dosen: {
    users: {
      full_name: string;
    };
  };
};

type JadwalSksRow = {
  id: string;
  peserta: number;
  kapasitas: number;
  mata_kuliah: { sks: number, prasyarat_mk_id: string | null } | Array<{ sks: number, prasyarat_mk_id: string | null }> | null;
};

function getRelationObject<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getAvailableJadwal(tahunAkademikId: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("jadwal_kuliah")
    .select(`
      *,
      mata_kuliah:mata_kuliah_id(id, kode, nama, sks, semester, prodi_id, prasyarat_mk_id),
      dosen:dosen_id(users:user_id(full_name))
    `)
    .eq("tahun_akademik_id", tahunAkademikId);

  if (error) {
    console.error("Error fetching jadwal:", error);
    return [];
  }
  return data as unknown as JadwalRow[];
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
      krs_detail(
        id,
        jadwal:id_jadwal(
          *,
          mata_kuliah:mata_kuliah_id(kode, nama, sks, semester),
          dosen:dosen_id(users:user_id(full_name))
        )
      )
    `)
    .eq("id_mahasiswa", mahasiswaId)
    .eq("id_tahun_akademik", tahunAkademikId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function submitKrs(mahasiswaId: string, tahunAkademikId: string, jadwalIds: string[]) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const uniqueJadwalIds = Array.from(new Set(jadwalIds));

  // 1. Fetch selected jadwals
  const { data: jadwals, error: jadwalError } = await supabase
    .from("jadwal_kuliah")
    .select("id, peserta, kapasitas, mata_kuliah:mata_kuliah_id(sks, prasyarat_mk_id)")
    .eq("tahun_akademik_id", tahunAkademikId)
    .in("id", uniqueJadwalIds);

  if (jadwalError) throw jadwalError;
  if ((jadwals ?? []).length !== uniqueJadwalIds.length) {
    throw new Error("Pilihan jadwal tidak valid untuk tahun akademik ini.");
  }

  let totalSks = 0;

  // 2. Validate Capacities and collect SKS and Prasyarat MK IDs
  const prasyaratIdsToCheck = new Set<string>();

  for (const j of (jadwals as unknown as JadwalSksRow[])) {
      if (j.peserta >= j.kapasitas) {
          throw new Error("Terdapat mata kuliah yang kelasnya sudah penuh.");
      }

      const mk = getRelationObject(j.mata_kuliah);
      if (mk) {
          totalSks += Number(mk.sks) || 0;
          if (mk.prasyarat_mk_id) {
              prasyaratIdsToCheck.add(mk.prasyarat_mk_id);
          }
      }
  }

  // 3. Validate Maksimal SKS (Hardcoded limit 24 for now)
  // TODO(Phase 4): Get MAX_SKS from configuration or student's IPS from previous semester
  const MAX_SKS = 24;
  if (totalSks > MAX_SKS) {
      throw new Error(`Total SKS (${totalSks}) melebihi batas maksimal (${MAX_SKS} SKS).`);
  }

  // 4. Validate Prerequisite Courses (Prasyarat)
  if (prasyaratIdsToCheck.size > 0) {
      // Fetch passed courses by student
      const { data: passedGrades, error: gradesError } = await supabase
          .from("nilai_akhir")
          .select(`
             nilai_huruf,
             jadwal:jadwal_id!inner(mata_kuliah_id)
          `)
          .eq("mahasiswa_id", mahasiswaId)
          .not("nilai_huruf", "in", '("D","E")') // assuming A,B,C are passing grades
          .not("published_at", "is", null);

      if (gradesError) throw gradesError;

      const passedMkIds = new Set();
      (passedGrades || []).forEach(g => {
          const j = Array.isArray(g.jadwal) ? g.jadwal[0] : g.jadwal;
          if (j && j.mata_kuliah_id) passedMkIds.add(j.mata_kuliah_id);
      });

      for (const reqId of prasyaratIdsToCheck) {
          if (!passedMkIds.has(reqId)) {
               throw new Error("Anda belum lulus mata kuliah prasyarat untuk beberapa mata kuliah yang dipilih.");
          }
      }
  }

  // 5. Upsert head KRS
  const { data: krsHead, error: headError } = await supabase
    .from("krs_header")
    .upsert({
      id_mahasiswa: mahasiswaId,
      id_tahun_akademik: tahunAkademikId,
      status: "Diajukan",
      total_sks: totalSks,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id_mahasiswa,id_tahun_akademik' })
    .select("id")
    .single();

  if (headError) throw headError;

  // 6. Clear old details
  await supabase.from("krs_detail").delete().eq("id_krs_header", krsHead.id);

  // 7. Insert new details
  const details = uniqueJadwalIds.map(id => ({
    id_krs_header: krsHead.id,
    id_jadwal: id
  }));

  const { error: detailError } = await supabase.from("krs_detail").insert(details);
  if (detailError) throw detailError;

  return { success: true };
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

export async function updateKrsStatus(krsId: string, status: "Disetujui" | "Ditolak", adminUserId: string, catatan?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { error } = await supabase
    .from("krs_header")
    .update({ 
      status, 
      approved_by: adminUserId,
      approved_at: new Date().toISOString(),
      catatan_dosen: catatan || null
    })
    .eq("id", krsId);

  if (error) throw error;

  // NOTE: If status is 'Disetujui', we might need to increment 'peserta' on jadwal_kuliah,
  // but it usually better to calculate peserta directly from krs_detail dynamically
  // or use database triggers to avoid consistency issues.

  return { success: true };
}

export async function listKrsSubmissions(params: {
  tahunAkademikId: string;
  dosenId?: string; // For advisor view
  prodiId?: string; // For prodi view
}) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("krs_header")
    .select(`
      id,
      status,
      total_sks,
      updated_at,
      mahasiswa:id_mahasiswa(
        id,
        nim,
        users:user_id(full_name),
        program_studi:prodi_id(nama)
      )
    `)
    .eq("id_tahun_akademik", params.tahunAkademikId);

  if (params.dosenId) {
    // Join with dosen_wali to filter students of this advisor
    const { data: students } = await supabase
      .from("dosen_wali")
      .select("id_mahasiswa")
      .eq("id_dosen", params.dosenId);
    
    const studentIds = (students || []).map(s => s.id_mahasiswa);
    query = query.in("id_mahasiswa", studentIds);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) return [];
  return data;
}
