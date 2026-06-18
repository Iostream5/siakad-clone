import { createAdminClient } from "@/supabase/admin";
import { getResolvedSessionUser } from "@/lib/auth";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT" | "APPROVE" | "REJECT";

interface AuditLogParams {
  modul: string;
  aksi: AuditAction;
  tableName: string;
  recordId?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Enterprise Audit Logger
 * Mencatat aktivitas pengguna ke tabel audit_logs dengan user context yang akurat.
 */
export async function logActivity({
  modul,
  aksi,
  tableName,
  recordId,
  oldData,
  newData,
  metadata
}: AuditLogParams) {
  try {
    const user = await getResolvedSessionUser();
    const supabase = createAdminClient();

    if (!supabase) return { error: "Supabase client not initialized" };

    const { error } = await supabase.from("audit_logs").insert({
      id_user: user?.id ?? null,
      modul,
      aksi,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      // Metadata bisa disimpan di new_data atau kolom khusus jika ada migrasi selanjutnya
      metadata: metadata 
    });

    if (error) {
      console.error("Failed to log activity:", error);
      return { error };
    }

    return { success: true };
  } catch (err) {
    console.error("Audit log critical error:", err);
    return { error: err };
  }
}
