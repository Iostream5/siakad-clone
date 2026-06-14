import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { getGradePoint } from "./grades";

export type TranskripItem = {
  id: string;
  semester: number;
  kode: string;
  nama: string;
  sks: number;
  nilaiHuruf: string;
  nilaiAngka: number;
  bobot: number;
};

export type TranskripResult = {
  mahasiswa: {
    id: string;
    nim: string;
    nama: string;
    prodi: string;
    angkatan: string;
  };
  items: TranskripItem[];
  summary: {
    totalSksLulus: number;
    totalSksWajib: number;
    ipk: number;
    predikat: string;
  };
};

export async function getTranscript(mahasiswaId: string): Promise<TranskripResult | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  // 1. Get Mahasiswa Data
  const { data: mahasiswa, error: mhsError } = await supabase
    .from("mahasiswa")
    .select(`
      id,
      nim,
      angkatan,
      users:user_id(full_name),
      program_studi:prodi_id(id, nama)
    `)
    .eq("id", mahasiswaId)
    .single();

  if (mhsError || !mahasiswa) return null;

  // 2. Get Grades
  const { data: grades, error: gradesError } = await supabase
    .from("nilai_akhir")
    .select(`
      id,
      nilai_angka,
      nilai_huruf,
      jadwal:jadwal_id!inner(
        mata_kuliah:mata_kuliah_id(kode, nama, sks, semester)
      )
    `)
    .eq("mahasiswa_id", mahasiswaId)
    .not("published_at", "is", null);

  if (gradesError) return null;

  // Process items
  let totalSksKumulatif = 0;
  let totalBobotKumulatif = 0;

  // Get best grade per course if retaken (Assuming course code is unique identifier)
  const bestGradesMap = new Map<string, any>();

  (grades || []).forEach(g => {
      const jadwal = Array.isArray(g.jadwal) ? g.jadwal[0] : g.jadwal;
      const mk = Array.isArray(jadwal?.mata_kuliah) ? jadwal?.mata_kuliah[0] : jadwal?.mata_kuliah;

      if (!mk) return;

      const currentGrade = bestGradesMap.get(mk.kode);
      const newScore = g.nilai_angka || 0;

      if (!currentGrade || newScore > (currentGrade.nilai_angka || 0)) {
          bestGradesMap.set(mk.kode, g);
      }
  });

  const items: TranskripItem[] = [];

  bestGradesMap.forEach((g) => {
    const jadwal = Array.isArray(g.jadwal) ? g.jadwal[0] : g.jadwal;
    const mk = Array.isArray(jadwal?.mata_kuliah) ? jadwal?.mata_kuliah[0] : jadwal?.mata_kuliah;

    const sks = mk?.sks || 0;
    const huruf = g.nilai_huruf || "E";
    const point = getGradePoint(huruf);
    const bobot = point * sks;

    if (huruf !== "E" && huruf !== "" && huruf !== null) {
        totalSksKumulatif += sks;
        totalBobotKumulatif += bobot;
    }

    items.push({
      id: g.id,
      semester: mk?.semester || 1,
      kode: mk?.kode || "-",
      nama: mk?.nama || "-",
      sks,
      nilaiHuruf: huruf,
      nilaiAngka: g.nilai_angka || 0,
      bobot
    });
  });

  // Sort by semester, then course code
  items.sort((a, b) => {
      if (a.semester === b.semester) {
          return a.kode.localeCompare(b.kode);
      }
      return a.semester - b.semester;
  });

  const ipk = totalSksKumulatif > 0 ? totalBobotKumulatif / totalSksKumulatif : 0;

  // Calculate predicate
  let predikat = "Memuaskan";
  if (ipk >= 3.51) predikat = "Dengan Pujian (Cum Laude)";
  else if (ipk >= 3.01) predikat = "Sangat Memuaskan";

  // Get Target SKS (Hardcoded for now or fetch from program studi / kurikulum)
  // Standard is usually 144 for S1
  const totalSksWajib = 144;

  const userObj = Array.isArray(mahasiswa.users) ? mahasiswa.users[0] : mahasiswa.users;
  const prodiObj = Array.isArray(mahasiswa.program_studi) ? mahasiswa.program_studi[0] : mahasiswa.program_studi;

  return {
    mahasiswa: {
      id: mahasiswa.id,
      nim: mahasiswa.nim || "-",
      nama: userObj?.full_name || "-",
      prodi: prodiObj?.nama || "-",
      angkatan: String(mahasiswa.angkatan || "-")
    },
    items,
    summary: {
      totalSksLulus: totalSksKumulatif,
      totalSksWajib,
      ipk,
      predikat
    }
  };
}

export function calculateIpk(allGrades: any[]) {
    let totalPoints = 0;
    let totalSks = 0;

    allGrades.forEach(item => {
        if (item.nilai_huruf && item.jadwal?.mata_kuliah?.sks) {
            const point = getGradePoint(item.nilai_huruf);
            const sks = item.jadwal.mata_kuliah.sks;
            if (item.nilai_huruf !== "E") {
                totalPoints += point * sks;
                totalSks += sks;
            }
        }
    });

    return totalSks > 0 ? totalPoints / totalSks : 0;
}
