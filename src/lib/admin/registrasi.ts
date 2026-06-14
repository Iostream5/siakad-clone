import "server-only";

import { createAdminClient } from "@/supabase/admin";
import { revalidatePath } from "next/cache";

export type RegistrasiStatus = "BELUM" | "MENUNGGU" | "LUNAS" | "DISPENSASI";

export type RegistrasiRow = {
  id: string;
  mahasiswa_id: string;
  tahun_akademik_id: string;
  status: RegistrasiStatus;
  tagihan_id: string | null;
  catatan: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  mahasiswa?: {
    nim: string | null;
    status_mahasiswa: string;
    users?: {
      full_name: string;
    } | null;
    program_studi?: {
      nama: string;
    } | null;
  } | null;
  tahun_akademik?: {
    kode: string;
    nama: string;
    semester: string;
  } | null;
  tagihan?: {
    nominal: number;
    status: string;
  } | null;
  verifier?: {
    full_name: string;
  } | null;
};

export async function listRegistrasi(params: {
  tahunAkademikId?: string;
  prodiId?: string;
  status?: RegistrasiStatus;
  query?: string;
} = {}) {
  const supabase = await createAdminClient();
  if (!supabase) throw new Error("Database error");

  let query = supabase
    .from("registrasi_semester")
    .select(`
      id,
      mahasiswa_id,
      tahun_akademik_id,
      status,
      tagihan_id,
      catatan,
      verified_by,
      verified_at,
      created_at,
      updated_at,
      mahasiswa:mahasiswa_id(
        nim,
        status_mahasiswa,
        prodi_id,
        users:user_id(full_name),
        program_studi:prodi_id(nama)
      ),
      tahun_akademik:tahun_akademik_id(kode, nama, semester),
      tagihan:tagihan_id(nominal, status),
      verifier:verified_by(full_name)
    `)
    .order("created_at", { ascending: false });

  if (params.tahunAkademikId) {
    query = query.eq("tahun_akademik_id", params.tahunAkademikId);
  }

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  let items = data as any[];

  if (params.prodiId) {
    items = items.filter(item => item.mahasiswa?.prodi_id === params.prodiId);
  }

  if (params.query) {
    const q = params.query.toLowerCase();
    items = items.filter(item =>
      item.mahasiswa?.users?.full_name?.toLowerCase().includes(q) ||
      item.mahasiswa?.nim?.toLowerCase().includes(q)
    );
  }

  return items as RegistrasiRow[];
}
