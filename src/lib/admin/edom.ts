import { createAdminClient } from "@/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getActiveQuestionnaires() {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("edom_questionnaires")
    .select(`
      id, judul, deskripsi, start_date, end_date, is_active,
      tahun_akademik:tahun_akademik_id(nama, is_active)
    `)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching questionnaires:", error);
    return [];
  }
  return data;
}

export async function getEdomResults(dosenId?: string, kelasId?: string) {
  // Placeholder implementation
  return [];
}

export async function checkStudentEdomEligibility(mahasiswaId: string, kelasId: string) {
  // Placeholder implementation
  return { eligible: true, hasSubmitted: false };
}
