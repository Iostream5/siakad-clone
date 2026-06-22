import "server-only";

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

export type FinanceNotificationEvent =
  | "billing.created"
  | "billing.bulk_created"
  | "billing.manual_reminder"
  | "billing.overdue"
  | "payment.success"
  | "payment.rejected";

type FinanceNotificationVariables = Record<string, string | number | null | undefined>;

type EnqueueFinanceNotificationInput = {
  userId: string;
  event: FinanceNotificationEvent;
  relatedType: string;
  relatedId: string;
  href?: string | null;
  variables?: FinanceNotificationVariables;
  idempotencyKey?: string;
};

const fallbackFinanceTemplates: Record<FinanceNotificationEvent, { subject: string; body: string }> = {
  "billing.created": {
    subject: "Tagihan baru tersedia",
    body: "Tagihan {{jenis_tagihan}} sebesar {{nominal}} jatuh tempo {{jatuh_tempo}}.",
  },
  "billing.bulk_created": {
    subject: "Tagihan baru tersedia",
    body: "{{jumlah_tagihan}} tagihan {{jenis_tagihan}} telah dibuat untuk periode {{tahun_akademik}}.",
  },
  "billing.manual_reminder": {
    subject: "Pengingat pembayaran tagihan",
    body: "Tagihan {{jenis_tagihan}} sebesar {{nominal}} masih perlu dibayar sebelum {{jatuh_tempo}}.",
  },
  "billing.overdue": {
    subject: "Tagihan sudah lewat tempo",
    body: "Tagihan {{jenis_tagihan}} sebesar {{nominal}} telah melewati jatuh tempo {{jatuh_tempo}}.",
  },
  "payment.success": {
    subject: "Pembayaran diverifikasi",
    body: "Pembayaran {{jenis_tagihan}} sebesar {{nominal}} telah diverifikasi pada {{tanggal_bayar}}.",
  },
  "payment.rejected": {
    subject: "Pembayaran ditolak",
    body: "Pembayaran {{jenis_tagihan}} sebesar {{nominal}} ditolak. Silakan cek kembali bukti pembayaran.",
  },
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
      .select("id, judul, pesan, is_read, created_at, href")
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
      href: item.href ?? "/dashboard/notifikasi",
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

export async function markAllNotificationsRead(userId: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Supabase admin client belum dikonfigurasi.");
  }

  const { error } = await supabase
    .from("notifikasi")
    .update({ is_read: true })
    .eq("id_user", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }
}

function renderTemplate(template: string, variables: FinanceNotificationVariables = {}) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key];
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
  });
}

function uniqueViolation(error: { code?: string; message?: string } | null) {
  return error?.code === "23505" || error?.message?.toLowerCase().includes("duplicate key");
}

export async function enqueueFinanceNotification(input: EnqueueFinanceNotificationInput) {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new Error("Supabase admin client belum dikonfigurasi.");
  }

  const idempotencyKey =
    input.idempotencyKey || `${input.event}:${input.userId}:${input.relatedType}:${input.relatedId}`;

  const { data: existing } = await supabase
    .from("notifikasi")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    return { success: true, skipped: true, notificationId: existing.id as string };
  }

  const { data: template } = await supabase
    .from("notification_templates")
    .select("subject, body")
    .eq("channel", "in_app")
    .eq("trigger_event", input.event)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fallback = fallbackFinanceTemplates[input.event];
  const subject = renderTemplate(template?.subject ?? fallback.subject, input.variables);
  const body = renderTemplate(template?.body ?? fallback.body, input.variables);
  const href = input.href ?? "/dashboard/keuangan?tab=tagihan";
  const payload = {
    event: input.event,
    related_type: input.relatedType,
    related_id: input.relatedId,
    variables: input.variables ?? {},
  };

  const { data: notification, error: notificationError } = await supabase
    .from("notifikasi")
    .insert({
      id_user: input.userId,
      judul: subject,
      pesan: body,
      href,
      type: "finance",
      related_type: input.relatedType,
      related_id: input.relatedId,
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();

  if (notificationError && !uniqueViolation(notificationError)) {
    throw notificationError;
  }

  const { error: queueError } = await supabase.from("notification_queue").insert({
    user_id: input.userId,
    channel: "in_app",
    event: input.event,
    subject,
    body,
    href,
    payload,
    status: "sent",
    attempts: 1,
    run_at: new Date().toISOString(),
    sent_at: new Date().toISOString(),
    idempotency_key: idempotencyKey,
  });

  if (queueError && !uniqueViolation(queueError)) {
    throw queueError;
  }

  return {
    success: true,
    skipped: Boolean(notificationError),
    notificationId: notification?.id as string | undefined,
  };
}
