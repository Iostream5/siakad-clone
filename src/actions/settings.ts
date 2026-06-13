"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/supabase/admin";
import { requireAuthorizedUser } from "@/lib/auth";
import { logActivity } from "@/lib/admin/audit-logger";

export async function updateSettingAction(key: string, value: string | number | boolean | null) {
  const user = await requireAuthorizedUser("pengaturan.settings", ["Admin"]);
  const supabase = createAdminClient();
  
  if (!supabase) {
    return { success: false, error: "Database client is not available." };
  }

  try {
    const { data: currentSetting } = await supabase
      .from("settings")
      .select("id, is_secret, value")
      .eq("key", key)
      .single();

    if (!currentSetting) {
      return { success: false, error: "Setting not found." };
    }

    const newValueObj = { value };

    const { error } = await supabase
      .from("settings")
      .update({ value: newValueObj, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) throw error;

    await logActivity({
      modul: "Settings",
      aksi: "UPDATE",
      tableName: "settings",
      recordId: currentSetting.id,
      newData: currentSetting.is_secret ? { value: "***" } : { value }, // Mask secret values in audit log
    });

    revalidatePath("/dashboard/pengaturan/payment-gateway");
    revalidatePath("/dashboard/pengaturan/settings");
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan pengaturan." 
    };
  }
}

export async function updateMultipleSettingsAction(settingsMap: Record<string, string | number | boolean | null>) {
  const user = await requireAuthorizedUser("pengaturan.settings", ["Admin"]);
  const supabase = createAdminClient();

  if (!supabase) {
    return { success: false, error: "Database client is not available." };
  }

  try {
    // Perform updates sequentially or in a transaction. We will do sequentially for simplicity and audit logging.
    for (const [key, value] of Object.entries(settingsMap)) {
      const { data: currentSetting } = await supabase
        .from("settings")
        .select("id, is_secret")
        .eq("key", key)
        .single();
        
      if (currentSetting) {
        await supabase
          .from("settings")
          .update({ value: { value }, updated_by: user.id, updated_at: new Date().toISOString() })
          .eq("key", key);
          
        await logActivity({
          modul: "Settings",
          aksi: "UPDATE",
          tableName: "settings",
          recordId: currentSetting.id,
          newData: currentSetting.is_secret ? { value: "***" } : { value },
        });
      }
    }

    revalidatePath("/dashboard/pengaturan/payment-gateway");
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan pengaturan masal." 
    };
  }
}

export async function checkMidtransConnectionAction(serverKey: string, isProduction: boolean) {
  await requireAuthorizedUser("pengaturan.settings", ["Admin"]);
  
  if (!serverKey) {
    return { success: false, error: "Server Key tidak boleh kosong." };
  }

  const url = isProduction
    ? "https://api.midtrans.com/v2/transactions" // Just a dummy endpoint to test auth
    : "https://api.sandbox.midtrans.com/v2/transactions";

  try {
    const response = await fetch(`${url}/status`, { // Invalid order ID, but if auth is right, it returns 404 (not found order) instead of 401 (unauthorized)
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      },
    });

    await response.json();

    // Midtrans API returns 401 if Server Key is invalid
    if (response.status === 401) {
      return { success: false, error: "Koneksi gagal. Server Key tidak valid atau lingkungan (Sandbox/Production) salah." };
    }

    // Any other status (like 404 for order not found) means the Server Key was accepted
    return { success: true, message: "Koneksi berhasil! Server Key valid." };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Gagal terhubung ke server Midtrans." 
    };
  }
}

