"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/supabase/admin";
import { requireAuthorizedUser } from "@/lib/auth";
import { logActivity } from "@/lib/admin/audit-logger";

export async function updateSettingAction(key: string, value: string | number | boolean | null) {
  await requireAuthorizedUser("pengaturan.settings", ["Admin"]);
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
      .update({ value: newValueObj, updated_at: new Date().toISOString() })
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
  await requireAuthorizedUser("pengaturan.settings", ["Admin"]);
  const supabase = createAdminClient();

  if (!supabase) {
    return { success: false, error: "Database client is not available." };
  }

  try {
    // Perform updates sequentially or in a transaction. We will do sequentially for simplicity and audit logging.
    for (const [key, value] of Object.entries(settingsMap)) {
      const { data: currentSetting, error: settingError } = await supabase
        .from("settings")
        .select("id, is_secret")
        .eq("key", key)
        .single();

      if (settingError) throw settingError;
        
      const cleanValue = typeof value === "string" ? value.trim() : value;
      const { error: updateError } = await supabase
        .from("settings")
        .update({ value: { value: cleanValue }, updated_at: new Date().toISOString() })
        .eq("key", key);

      if (updateError) throw updateError;

      await logActivity({
        modul: "Settings",
        aksi: "UPDATE",
        tableName: "settings",
        recordId: currentSetting.id,
        newData: currentSetting.is_secret ? { value: "***" } : { value: cleanValue },
      });
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
  
  const cleanedServerKey = serverKey.trim();

  if (!cleanedServerKey) {
    return { success: false, error: "Server Key tidak boleh kosong." };
  }

  const url = isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

  try {
    const dummyOrderId = `siakad-connection-check-${Date.now()}`;
    const response = await fetch(`${url}/${dummyOrderId}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${cleanedServerKey}:`).toString("base64")}`,
      },
    });

    const responseText = await response.text();

    // Midtrans API returns 401 if Server Key is invalid
    if (response.status === 401) {
      return { success: false, error: "Koneksi gagal. Server Key tidak valid atau lingkungan (Sandbox/Production) salah." };
    }

    if (!response.ok && response.status !== 404) {
      return {
        success: false,
        error: `Koneksi Midtrans gagal. Status ${response.status}: ${responseText || response.statusText}`,
      };
    }

    // 404 means auth was accepted, but the dummy order does not exist.
    return { success: true, message: "Koneksi berhasil! Server Key valid." };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Gagal terhubung ke server Midtrans." 
    };
  }
}

