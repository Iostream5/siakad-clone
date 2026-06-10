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
  };
  dosen: {
    users: {
      full_name: string;
    };
  };
};

type JadwalSksRow = {
  id: string;
  mata_kuliah: { sks: number } | Array<{ sks: number }> | null;
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
      mata_kuliah:mata_kuliah_id(id, kode, nama, sks, semester, prodi_id),
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

  // Calculate total SKS
  const { data: jadwals, error: jadwalError } = await supabase
    .from("jadwal_kuliah")
    .select("id, mata_kuliah:mata_kuliah_id(sks)")
    .eq("tahun_akademik_id", tahunAkademikId)
    .in("id", uniqueJadwalIds);

  if (jadwalError) throw jadwalError;
  if ((jadwals ?? []).length !== uniqueJadwalIds.length) {
    throw new Error("Pilihan jadwal tidak valid untuk tahun akademik ini.");
  }

  const totalSks = ((jadwals ?? []) as JadwalSksRow[]).reduce((acc, curr) => {
    const mataKuliah = getRelationObject(curr.mata_kuliah);
    return acc + (Number(mataKuliah?.sks) || 0);
  }, 0);

  // 1. Upsert head KRS
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

  // 2. Clear old details
  await supabase.from("krs_detail").delete().eq("id_krs_header", krsHead.id);

  // 3. Insert new details
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
