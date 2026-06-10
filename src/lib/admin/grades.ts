import { createAdminClient } from "@/supabase/admin";

export type GradeRow = {
  id: string;
  mahasiswa_id: string;
  jadwal_id: string;
  nilai_angka: number | null;
  nilai_huruf: string | null;
  published_at: string | null;
  finalized_at: string | null;
  jadwal: {
    mata_kuliah: {
      kode: string;
      nama: string;
      sks: number;
    } | null;
  } | null;
};

/**
 * Konversi nilai angka ke huruf sesuai standar akademik STAI
 */
export function calculateLetterGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}

/**
 * Konversi huruf ke bobot (point) untuk perhitungan IPK/IPS
 */
export function getGradePoint(letter: string): number {
  switch (letter) {
    case "A": return 4.0;
    case "B": return 3.0;
    case "C": return 2.0;
    case "D": return 1.0;
    case "E": return 0.0;
    default: return 0.0;
  }
}

export async function getStudentGrades(mahasiswaId: string, options: { publishedOnly?: boolean } = {}) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("nilai_akhir")
    .select(`
      *,
      jadwal:jadwal_id (
        mata_kuliah:mata_kuliah_id (
          kode,
          nama,
          sks
        )
      )
    `)
    .eq("mahasiswa_id", mahasiswaId);

  if (options.publishedOnly) {
    query = query.not("published_at", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching grades:", error);
    return [];
  }

  return data as any[];
}

export async function getLecturerIdByUserId(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("dosen")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.id || null;
}

export async function getLecturerClasses(dosenId: string, tahunAkademikId: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("jadwal_kuliah")
    .select(`
      id,
      nama_kelas,
      hari,
      jam_mulai,
      jam_selesai,
      peserta,
      mata_kuliah:mata_kuliah_id(kode, nama, sks)
    `)
    .eq("dosen_id", dosenId)
    .eq("tahun_akademik_id", tahunAkademikId);

  if (error) {
    console.error("Error fetching lecturer classes:", error);
    return [];
  }

  return data;
}

export async function canDosenAccessJadwal(jadwalId: string, userId: string) {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const { data: dosen } = await supabase
    .from("dosen")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!dosen?.id) return false;

  const { data: jadwal } = await supabase
    .from("jadwal_kuliah")
    .select("id")
    .eq("id", jadwalId)
    .eq("dosen_id", dosen.id)
    .maybeSingle();

  return Boolean(jadwal?.id);
}

export async function getClassStudentsWithGrades(jadwalId: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("krs_detail")
    .select(`
      id,
      krs_header!inner (
        id_mahasiswa,
        mahasiswa:id_mahasiswa (
          nim,
          users:user_id (
            full_name
          )
        )
      )
    `)
    .eq("id_jadwal", jadwalId);

  if (error) {
    console.error("Error fetching class students:", error);
    return [];
  }

  // Fetch grades for these students in this class
  const { data: grades } = await supabase
    .from("nilai_akhir")
    .select("*")
    .eq("jadwal_id", jadwalId);

  return (data || []).map((item: any) => {
    const student = item.krs_header?.mahasiswa;
    const grade = grades?.find(g => g.mahasiswa_id === item.krs_header?.id_mahasiswa);
    return {
      mahasiswa_id: item.krs_header?.id_mahasiswa,
      nim: student?.nim,
      full_name: student?.users?.[0]?.full_name,
      nilai_angka: grade?.nilai_angka || null,
      nilai_huruf: grade?.nilai_huruf || null,
      published_at: grade?.published_at || null,
    };
  });
}

/**
 * Update nilai mahasiswa dan otomatis hitung IPK/IPS
 */
export async function updateStudentGrade(mahasiswaId: string, jadwalId: string, score: number, publish = false) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase client not available");

  const letterGrade = calculateLetterGrade(score);
  
  const { error } = await supabase
    .from("nilai_akhir")
    .upsert({
      mahasiswa_id: mahasiswaId,
      jadwal_id: jadwalId,
      nilai_angka: score,
      nilai_huruf: letterGrade,
      published_at: publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'mahasiswa_id,jadwal_id' });

  if (error) throw error;

  // Recalculate GPA (IPK/IPS)
  await recalculateStudentGPA(mahasiswaId);

  return { success: true };
}

/**
 * Menghitung ulang IPK dan IPS mahasiswa
 */
export async function recalculateStudentGPA(mahasiswaId: string) {
  const supabase = createAdminClient();
  if (!supabase) return;

  const grades = await getStudentGrades(mahasiswaId);
  
  let totalPoints = 0;
  let totalSks = 0;

  grades.forEach((item: any) => {
    if (item.nilai_huruf && item.jadwal?.mata_kuliah?.sks) {
      const point = getGradePoint(item.nilai_huruf);
      const sks = item.jadwal.mata_kuliah.sks;
      totalPoints += point * sks;
      totalSks += sks;
    }
  });

  const gpa = totalSks > 0 ? totalPoints / totalSks : 0;

  // Update tabel mahasiswa (sementara kita set IPS & IPK sama karena modul per-semester belum terpisah penuh)
  await supabase
    .from("mahasiswa")
    .update({ 
      ipk: gpa,
      ips: gpa 
    })
    .eq("id", mahasiswaId);
}
