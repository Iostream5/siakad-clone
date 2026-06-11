import { createAdminClient } from "@/supabase/admin";

export type NotificationPreviewItem = {
  id: string;
  judul: string;
  pesan: string;
  is_read: boolean;
  created_at: string;
  href: string | null;
};

export type NotificationPreviewData = {
  unreadCount: number;
  items: NotificationPreviewItem[];
};

const emptyNotificationPreview: NotificationPreviewData = {
  unreadCount: 0,
  items: [],
};

export async function getNotificationPreview(userId: string): Promise<NotificationPreviewData> {
  const supabase = createAdminClient();

  if (!supabase) {
    return emptyNotificationPreview;
  }

  const [itemsResult, countResult] = await Promise.all([
    supabase
      .from("notifikasi")
      .select("id, judul, pesan, is_read, created_at")
      .eq("id_user", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notifikasi")
      .select("id", { count: "exact", head: true })
      .eq("id_user", userId)
      .eq("is_read", false),
  ]);

  if (itemsResult.error || countResult.error) {
    console.error("Failed to load notification preview", itemsResult.error ?? countResult.error);
    return emptyNotificationPreview;
  }

  return {
    unreadCount: countResult.count ?? 0,
    items: (itemsResult.data ?? []).map((item) => ({
      ...item,
      href: "/dashboard/notifikasi",
    })),
  };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Supabase admin client belum dikonfigurasi.");
  }

  const { error } = await supabase
    .from("notifikasi")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("id_user", userId);

  if (error) {
    throw new Error(error.message);
  }
}
