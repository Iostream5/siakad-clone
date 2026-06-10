import "server-only";

import { createAdminClient } from "@/supabase/admin";

export type RuanganRow = {
  id: string;
  kode: string;
  nama: string;
  gedung_id: string | null;
  lantai: number;
  jenis_ruangan: string;
  kapasitas: number;
  is_active: boolean;
  gedung?: {
    nama: string;
  };
};

export async function listRuangan(params: { query?: string; page?: number; pageSize?: number } = {}) {
  const supabase = createAdminClient();
  if (!supabase) return { items: [], totalItems: 0, totalPages: 1, currentPage: 1 };

  const pageSize = params.pageSize || 10;
  const currentPage = params.page || 1;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("ruangan")
    .select("*, gedung:gedung_id(nama)", { count: "exact" })
    .is("deleted_at", null)
    .order("nama", { ascending: true })
    .range(from, to);

  if (params.query) {
    query = query.or(`kode.ilike.%${params.query}%,nama.ilike.%${params.query}%`);
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("Error listing ruangan:", error);
    return { items: [], totalItems: 0, totalPages: 1, currentPage: 1 };
  }

  return {
    items: data || [],
    totalItems: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
    currentPage
  };
}

export async function upsertRuangan(values: any) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const payload = {
    kode: values.kode,
    nama: values.nama,
    gedung_id: values.gedungId,
    lantai: values.lantai,
    jenis_ruangan: values.jenisRuangan,
    kapasitas: values.kapasitas,
    is_active: values.isAktif,
  };

  let result;
  if (values.id) {
    result = await supabase.from("ruangan").update(payload).eq("id", values.id);
  } else {
    result = await supabase.from("ruangan").insert(payload);
  }

  if (result.error) {
    console.error("Supabase error in upsertRuangan:", result.error);
    throw new Error(result.error.message);
  }
}

export async function deleteRuangan(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");
  const { error } = await supabase.from("ruangan").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}
