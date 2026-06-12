import { createAdminClient } from "@/supabase/admin";

export type ActivityAuditRow = {
  id: string;
  created_at: string;
  id_user: string | null;
  modul: string;
  aksi: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  user_full_name?: string;
  user_role?: string;
};

export async function getActivityLogs(limit = 100, filters?: { modul?: string, aksi?: string }) {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      rows: [] as ActivityAuditRow[],
      error: "Konfigurasi service role Supabase belum tersedia di server.",
    };
  }

  // Melakukan join dengan tabel users untuk mendapatkan nama pelaku
  let query = supabase
    .from("audit_logs")
    .select(`
      id, 
      created_at, 
      id_user, 
      modul, 
      aksi, 
      table_name, 
      record_id, 
      old_data, 
      new_data,
      users:id_user (full_name, role)
    `)
    .neq("modul", "auth") // Kecualikan log login agar tidak duplikat dengan audit login
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters?.modul && filters.modul !== "all") {
    query = query.eq("modul", filters.modul);
  }
  if (filters?.aksi && filters.aksi !== "all") {
    query = query.eq("aksi", filters.aksi);
  }

  const { data, error } = await query;

  const formattedRows = (data ?? []).map((item: any) => ({
    ...item,
    user_full_name: item.users?.full_name ?? "System/Unknown",
    user_role: item.users?.role ?? "-",
  }));

  return {
    rows: formattedRows as ActivityAuditRow[],
    error: error?.message ?? null,
  };
}
