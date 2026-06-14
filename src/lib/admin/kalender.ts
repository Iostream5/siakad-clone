import "server-only";

import { createAdminClient } from "@/supabase/admin";

export type KalenderEvent = {
  id: string;
  tahun_akademik_id: string;
  judul: string;
  deskripsi: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  kategori: "KRS" | "UTS" | "UAS" | "LIBUR" | "WISUDA" | "LAINNYA";
  is_active: boolean;
};

export async function getKalenderEvents(tahunAkademikId?: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("kalender_akademik")
    .select("*")
    .eq("is_active", true)
    .order("tanggal_mulai", { ascending: true });

  if (tahunAkademikId) {
    query = query.eq("tahun_akademik_id", tahunAkademikId);
  }

  const { data, error } = await query;

  // NOTE: PostgrestError doesn't exist table unless migrated, so catch error and return empty to avoid throwing
  if (error) {
     console.error("Failed fetching kalender_akademik:", error.message);
     return [];
  }

  return data as KalenderEvent[];
}

export async function getActiveTahunAkademik() {
    const supabase = createAdminClient();
    if (!supabase) return null;

    const { data } = await supabase
        .from("tahun_akademik")
        .select("*")
        .eq("is_aktif", true)
        .maybeSingle();

    return data;
}
