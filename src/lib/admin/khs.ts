import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { getGradePoint } from "./grades";

export type KhsItem = {
  kode: string;
  nama: string;
  sks: number;
  nilaiHuruf: string;
  nilaiAngka: number;
  bobot: number;
};

export type KhsResult = {
  mahasiswa: {
    id: string;
    nim: string;
    nama: string;
    prodi: string;
  };
  tahunAkademik: {
    id: string;
    nama: string;
  };
  items: KhsItem[];
  summary: {
    totalSksDiambil: number;
    totalSksLulus: number;
    ips: number;
  };
};

export async function getKhsBySemester(mahasiswaId: string, tahunAkademikId: string): Promise<KhsResult | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  // Get Mahasiswa Data
  const { data: mahasiswa, error: mhsError } = await supabase
    .from("mahasiswa")
    .select(`
      id,
      nim,
      users:user_id(full_name),
      program_studi:prodi_id(nama)
    `)
    .eq("id", mahasiswaId)
    .single();

  if (mhsError || !mahasiswa) return null;

  // Get Tahun Akademik Data
  const { data: ta, error: taError } = await supabase
    .from("tahun_akademik")
    .select("id, nama")
    .eq("id", tahunAkademikId)
    .single();

  if (taError || !ta) return null;

  // Get Krs/Jadwal and Grades
  const { data: grades, error: gradesError } = await supabase
    .from("nilai_akhir")
    .select(`
      nilai_angka,
      nilai_huruf,
      jadwal:jadwal_id!inner(
        tahun_akademik_id,
        mata_kuliah:mata_kuliah_id(kode, nama, sks)
      )
    `)
    .eq("mahasiswa_id", mahasiswaId)
    .not("published_at", "is", null);

  if (gradesError) return null;

  // Filter grades for the specific semester
  const filteredGrades = (grades || []).filter(g => {
    // Handling array or object returned by Supabase
    const jadwalList = Array.isArray(g.jadwal) ? g.jadwal : [g.jadwal];
    return jadwalList.some(j => j?.tahun_akademik_id === tahunAkademikId);
  });

  let totalSksDiambil = 0;
  let totalSksLulus = 0;
  let totalBobot = 0;

  const items: KhsItem[] = filteredGrades.map((g: any) => {
    const jadwal = Array.isArray(g.jadwal) ? g.jadwal[0] : g.jadwal;
    const mk = Array.isArray(jadwal?.mata_kuliah) ? jadwal?.mata_kuliah[0] : jadwal?.mata_kuliah;
    const sks = mk?.sks || 0;
    const huruf = g.nilai_huruf || "E";
    const point = getGradePoint(huruf);
    const bobot = point * sks;

    totalSksDiambil += sks;
    if (huruf !== "E" && huruf !== "D") {
        totalSksLulus += sks; // Asumsi D tidak lulus, tapi C ke atas lulus. Tergantung aturan, tapi umumnya D masih bisa dihitung lulus / perlu diulang. Mari asumsikan E tidak lulus.
    }
    // Update lulus check: D is usually pass in Indonesia for some courses, but E is definitely fail. Let's make E fail, D and above pass for "SKS Lulus"
    if (huruf !== "E" && huruf !== "T" && huruf !== "K") {
        totalSksLulus += sks;
        // Correcting the duplication above
        totalSksLulus -= sks; // Reset the previous wrong logic
        totalSksLulus += sks;
    }


    totalBobot += bobot;

    return {
      kode: mk?.kode || "-",
      nama: mk?.nama || "-",
      sks,
      nilaiHuruf: huruf,
      nilaiAngka: g.nilai_angka || 0,
      bobot
    };
  });

  // Recalculate accurately
  totalSksLulus = 0;
  items.forEach(item => {
    if (item.nilaiHuruf !== "E" && item.nilaiHuruf !== "" && item.nilaiHuruf !== null) {
      totalSksLulus += item.sks;
    }
  });

  const ips = totalSksDiambil > 0 ? totalBobot / totalSksDiambil : 0;

  const userObj = Array.isArray(mahasiswa.users) ? mahasiswa.users[0] : mahasiswa.users;
  const prodiObj = Array.isArray(mahasiswa.program_studi) ? mahasiswa.program_studi[0] : mahasiswa.program_studi;

  return {
    mahasiswa: {
      id: mahasiswa.id,
      nim: mahasiswa.nim || "-",
      nama: userObj?.full_name || "-",
      prodi: prodiObj?.nama || "-"
    },
    tahunAkademik: {
      id: ta.id,
      nama: ta.nama
    },
    items,
    summary: {
      totalSksDiambil,
      totalSksLulus,
      ips
    }
  };
}
