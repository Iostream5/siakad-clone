import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { z } from "zod";

export const jadwalKuliahSchema = z.object({
  tahunAkademikId: z.string().uuid("Tahun Akademik tidak valid"),
  mataKuliahId: z.string().uuid("Mata Kuliah tidak valid"),
  dosenId: z.string().uuid("Dosen tidak valid"),
  namaKelas: z.string().min(1, "Nama kelas wajib diisi"),
  hari: z.string().min(1, "Hari wajib diisi"),
  jamMulai: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Format jam mulai tidak valid (HH:MM)"),
  jamSelesai: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Format jam selesai tidak valid (HH:MM)"),
  ruangan: z.string().min(1, "Ruangan wajib diisi"),
  kapasitas: z.coerce.number().min(1, "Kapasitas minimal 1"),
});

export type JadwalKuliahInput = z.infer<typeof jadwalKuliahSchema>;

export type JadwalKuliahRow = {
  id: string;
  nama_kelas: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  kapasitas: number;
  peserta: number;
  ruangan: string;
  mata_kuliah: {
    id: string;
    kode: string;
    nama: string;
  };
  dosen: {
    id: string;
    users: {
      full_name: string;
    };
  };
  tahun_akademik: {
    id: string;
    nama: string;
  };
};

export async function listJadwalKuliah(params: { query?: string; page?: number; pageSize?: number; deletedMode?: "active" | "trash" }) {
  const supabase = createAdminClient();
  if (!supabase) return { items: [], totalItems: 0, totalPages: 1, currentPage: 1, query: "" };

  const pageSize = Math.max(1, params.pageSize ?? 10);
  const currentPage = Math.max(1, params.page ?? 1);
  const query = (params.query ?? "").trim();
  const deletedMode = params.deletedMode ?? "active";
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let countBuilder = supabase.from("jadwal_kuliah").select("id", { count: "exact", head: true });
  let dataBuilder = supabase
    .from("jadwal_kuliah")
    .select(`
      id,
      nama_kelas,
      hari,
      jam_mulai,
      jam_selesai,
      kapasitas,
      peserta,
      ruangan,
      mata_kuliah:mata_kuliah_id(id, kode, nama),
      dosen:dosen_id(id, users:user_id(full_name)),
      tahun_akademik:tahun_akademik_id(id, nama)
    `)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query) {
    const filter = `nama_kelas.ilike.%${query}%,ruangan.ilike.%${query}%`;
    countBuilder = countBuilder.or(filter);
    dataBuilder = dataBuilder.or(filter);
  }

  const [countResult, dataResult] = await Promise.all([countBuilder, dataBuilder]);
  const totalItems = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: ((dataResult.data ?? []) as any[]),
    totalItems,
    totalPages,
    currentPage,
    query,
  };
}

export async function saveJadwalKuliah(input: JadwalKuliahInput, id?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const parsed = jadwalKuliahSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  // Check for conflict
  const conflictCheck = await supabase
    .from("jadwal_kuliah")
    .select("id")
    .eq("tahun_akademik_id", parsed.data.tahunAkademikId)
    .eq("ruangan", parsed.data.ruangan)
    .eq("hari", parsed.data.hari)
    .lt("jam_mulai", parsed.data.jamSelesai)
    .gt("jam_selesai", parsed.data.jamMulai);

  if (conflictCheck.data && conflictCheck.data.length > 0) {
    const isConflict = id ? conflictCheck.data.some((row: any) => row.id !== id) : true;
    if (isConflict) throw new Error("Jadwal bentrok dengan kelas lain di ruangan yang sama pada waktu tersebut.");
  }

  const payload = {
    tahun_akademik_id: parsed.data.tahunAkademikId,
    mata_kuliah_id: parsed.data.mataKuliahId,
    dosen_id: parsed.data.dosenId,
    nama_kelas: parsed.data.namaKelas,
    hari: parsed.data.hari,
    jam_mulai: parsed.data.jamMulai,
    jam_selesai: parsed.data.jamSelesai,
    ruangan: parsed.data.ruangan,
    kapasitas: parsed.data.kapasitas,
  };

  const result = id
    ? await supabase.from("jadwal_kuliah").update(payload).eq("id", id)
    : await supabase.from("jadwal_kuliah").insert(payload);

  if (result.error) throw new Error(result.error.message);
}

export async function deleteJadwalKuliah(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");
  const result = await supabase.from("jadwal_kuliah").delete().eq("id", id);
  if (result.error) throw new Error(result.error.message);
}