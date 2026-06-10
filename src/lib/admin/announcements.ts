import "server-only";

import { createAdminClient } from "@/supabase/admin";
import type { PostgrestError } from "@supabase/supabase-js";

export type AnnouncementRow = {
  id: string;
  judul: string;
  isi: string;
  target_role: string;
  is_active: boolean;
  created_at: string;
};

function formatSupabaseError(error: PostgrestError | null) {
  if (!error) return "Unknown error";
  return {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  };
}

const ANNOUNCEMENTS_TIMEOUT_MS = 2000;
const ANNOUNCEMENTS_COOLDOWN_MS = 60000;
let announcementsCooldownUntil = 0;
let lastNetworkErrorAt = 0;

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error("ANNOUNCEMENTS_TIMEOUT")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function isNetworkDnsError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return message.includes("fetch failed") || message.includes("ENOTFOUND");
}

function isAnnouncementsTimeout(error: unknown) {
  return error instanceof Error && error.message.includes("ANNOUNCEMENTS_TIMEOUT");
}

function enterCooldown() {
  announcementsCooldownUntil = Date.now() + ANNOUNCEMENTS_COOLDOWN_MS;
}

export async function getActiveAnnouncements(role: string) {
  if (Date.now() < announcementsCooldownUntil) {
    return [];
  }

  const supabase = createAdminClient();
  if (!supabase) return [];

  try {
    const result = await withTimeout(
      supabase
        .from("pengumuman")
        .select("*")
        .eq("is_active", true)
        .or(`target_role.eq.Semua,target_role.eq.${role}`)
        .order("created_at", { ascending: false }),
      ANNOUNCEMENTS_TIMEOUT_MS,
    ) as { data: AnnouncementRow[] | null; error: PostgrestError | null };
    const { data, error } = result;

    if (error) {
      console.error("Error fetching announcements:", formatSupabaseError(error));
      if (isNetworkDnsError(error)) {
        enterCooldown();
      }
      return [];
    }

    return data || [];
  } catch (error) {
    if (isAnnouncementsTimeout(error)) {
      enterCooldown();
      return [];
    }

    if (isNetworkDnsError(error)) {
      enterCooldown();
      const now = Date.now();
      if (now - lastNetworkErrorAt > 5000) {
        lastNetworkErrorAt = now;
        console.error("Error fetching announcements: DNS/network Supabase unavailable, temporary cooldown enabled.");
      }
      return [];
    }

    console.error("Error fetching announcements:", error);
    return [];
  }
}

export async function listAllAnnouncements() {
  if (Date.now() < announcementsCooldownUntil) {
    return [];
  }

  const supabase = createAdminClient();
  if (!supabase) return [];

  try {
    const result = await withTimeout(
      supabase
        .from("pengumuman")
        .select("*")
        .order("created_at", { ascending: false }),
      ANNOUNCEMENTS_TIMEOUT_MS,
    ) as { data: AnnouncementRow[] | null; error: PostgrestError | null };
    const { data, error } = result;

    if (error) {
      console.error("Error listing announcements:", formatSupabaseError(error));
      if (isNetworkDnsError(error)) {
        enterCooldown();
      }
      return [];
    }
    return data || [];
  } catch (error) {
    if (isAnnouncementsTimeout(error)) {
      enterCooldown();
      return [];
    }

    if (isNetworkDnsError(error)) {
      enterCooldown();
      return [];
    }
    console.error("Error listing announcements:", error);
    return [];
  }
}

export async function upsertAnnouncement(values: {
  id?: string;
  judul: string;
  isi: string;
  targetRole: string;
  isActive: boolean;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const payload = {
    judul: values.judul,
    isi: values.isi,
    target_role: values.targetRole,
    is_active: values.isActive,
  };

  try {
    if (values.id) {
      const { error } = await withTimeout(
        supabase.from("pengumuman").update(payload).eq("id", values.id),
        ANNOUNCEMENTS_TIMEOUT_MS * 5 // Give more time for writes
      );
      if (error) {
        console.error("Error updating announcement:", formatSupabaseError(error));
        throw error;
      }
    } else {
      const { error } = await withTimeout(
        supabase.from("pengumuman").insert(payload),
        ANNOUNCEMENTS_TIMEOUT_MS * 5
      );
      if (error) {
        console.error("Error creating announcement:", formatSupabaseError(error));
        throw error;
      }
    }
  } catch (error) {
    if (isAnnouncementsTimeout(error)) {
      throw new Error("Koneksi ke Supabase timeout saat menyimpan data.");
    }
    throw error;
  }
}

export async function deleteAnnouncement(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");
  
  try {
    const { error } = await withTimeout(
      supabase.from("pengumuman").delete().eq("id", id),
      ANNOUNCEMENTS_TIMEOUT_MS * 5
    );
    if (error) {
      console.error("Error deleting announcement:", formatSupabaseError(error));
      throw error;
    }
  } catch (error) {
    if (isAnnouncementsTimeout(error)) {
      throw new Error("Koneksi ke Supabase timeout saat menghapus data.");
    }
    throw error;
  }
}
