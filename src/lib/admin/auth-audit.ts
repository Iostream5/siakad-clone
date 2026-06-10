import "server-only";

import { createAdminClient } from "@/supabase/admin";

export type AuthAuditRow = {
  id: string;
  created_at: string;
  aksi: string;
  id_user: string | null;
  new_data: {
    identifier?: string;
    message?: string;
  } | null;
};

export async function getAuthAuditLogs(limit = 100) {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      rows: [] as AuthAuditRow[],
      error: "Konfigurasi service role Supabase belum tersedia di server.",
    };
  }

  const result = await supabase
    .from("audit_logs")
    .select("id, created_at, aksi, id_user, new_data")
    .eq("modul", "auth")
    .in("aksi", ["LOGIN_SUCCESS", "LOGIN_FAILED"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    rows: (result.data ?? []) as AuthAuditRow[],
    error: result.error?.message ?? null,
  };
}
