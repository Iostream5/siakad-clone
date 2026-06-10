import "server-only";
import { createAdminClient } from "@/supabase/admin";

export async function getMasterBiayaList() {
  const supabase = createAdminClient();
  if (!supabase) return [];
  const { data } = await supabase.from("master_biaya").select(`
    *,
    program_studi:prodi_id(nama),
    tahun_akademik:tahun_akademik_id(nama)
  `).order("created_at", { ascending: false });
  return data || [];
}
