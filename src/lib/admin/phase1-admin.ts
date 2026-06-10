import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { createAdminClient } from "@/supabase/admin";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type SystemSettingRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  category: string;
  value: JsonValue;
  is_secret: boolean;
  is_active: boolean;
  updated_at: string;
};

export type NotificationTemplateRow = {
  id: string;
  code: string;
  name: string;
  channel: "in_app" | "email" | "whatsapp" | "push";
  trigger_event: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
  updated_at: string;
};

export type ApiLogRow = {
  id: string;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number | null;
  created_at: string;
};

export type QueueJobRow = {
  id: string;
  queue: string;
  name: string;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  attempts: number;
  run_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  created_at: string;
};

export type ScheduledJobRow = {
  id: string;
  name: string;
  handler: string;
  cron: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
};

type Source = "database" | "fallback";

type DataResult<T> = {
  rows: T[];
  error: string | null;
  source: Source;
};

export type DeveloperToolSnapshot = {
  apiLogs: DataResult<ApiLogRow>;
  queueJobs: DataResult<QueueJobRow>;
  scheduledJobs: DataResult<ScheduledJobRow>;
};

const fallbackSettings: SystemSettingRow[] = [
  {
    id: "fallback-campus-name",
    key: "campus.name",
    label: "Nama Kampus",
    description: "Nama resmi kampus yang ditampilkan di portal.",
    category: "kampus",
    value: { value: "STAI" },
    is_secret: false,
    is_active: true,
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  {
    id: "fallback-pmb-open",
    key: "campus.pmb_open",
    label: "PMB Dibuka",
    description: "Flag untuk mengaktifkan CTA dan alur pendaftaran PMB.",
    category: "kampus",
    value: { value: true },
    is_secret: false,
    is_active: true,
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  {
    id: "fallback-midtrans",
    key: "payment.midtrans.enabled",
    label: "Midtrans Aktif",
    description: "Kontrol kesiapan integrasi Midtrans pada fase payment gateway.",
    category: "payment",
    value: { value: false },
    is_secret: true,
    is_active: false,
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  {
    id: "fallback-fcm",
    key: "notification.fcm.enabled",
    label: "Firebase Cloud Messaging",
    description: "Kontrol pengiriman push notification mobile.",
    category: "notification",
    value: { value: false },
    is_secret: true,
    is_active: false,
    updated_at: "2026-06-05T00:00:00.000Z",
  },
];

const fallbackTemplates: NotificationTemplateRow[] = [
  {
    id: "fallback-billing-created",
    code: "billing.created.in_app",
    name: "Tagihan Baru",
    channel: "in_app",
    trigger_event: "billing.created",
    subject: "Tagihan baru tersedia",
    body: "Tagihan {{jenis_tagihan}} sebesar {{nominal}} telah dibuat dengan jatuh tempo {{jatuh_tempo}}.",
    variables: ["jenis_tagihan", "nominal", "jatuh_tempo"],
    is_active: true,
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  {
    id: "fallback-payment-success",
    code: "payment.success.in_app",
    name: "Pembayaran Berhasil",
    channel: "in_app",
    trigger_event: "payment.success",
    subject: "Pembayaran berhasil diverifikasi",
    body: "Pembayaran {{jenis_tagihan}} sebesar {{nominal}} telah diterima pada {{tanggal_bayar}}.",
    variables: ["jenis_tagihan", "nominal", "tanggal_bayar"],
    is_active: true,
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  {
    id: "fallback-grade-published",
    code: "grade.published.in_app",
    name: "Nilai Dipublish",
    channel: "in_app",
    trigger_event: "grade.published",
    subject: "Nilai {{mata_kuliah}} sudah tersedia",
    body: "Nilai akhir mata kuliah {{mata_kuliah}} telah dipublish dan dapat dilihat di portal mahasiswa.",
    variables: ["mata_kuliah"],
    is_active: true,
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  {
    id: "fallback-krs-approved",
    code: "krs.approved.in_app",
    name: "KRS Disetujui",
    channel: "in_app",
    trigger_event: "krs.approved",
    subject: "KRS semester {{semester}} disetujui",
    body: "KRS Anda untuk {{tahun_akademik}} telah disetujui oleh dosen wali.",
    variables: ["semester", "tahun_akademik"],
    is_active: true,
    updated_at: "2026-06-05T00:00:00.000Z",
  },
];

const fallbackApiLogs: ApiLogRow[] = [
  {
    id: "fallback-api-dashboard",
    method: "GET",
    path: "/dashboard",
    status_code: 200,
    duration_ms: 86,
    created_at: "2026-06-05T00:00:00.000Z",
  },
];

const fallbackQueueJobs: QueueJobRow[] = [
  {
    id: "fallback-queue-notification",
    queue: "notification",
    name: "seed-template-preview",
    status: "waiting",
    attempts: 0,
    run_at: "2026-06-05T00:00:00.000Z",
    finished_at: null,
    last_error: null,
    created_at: "2026-06-05T00:00:00.000Z",
  },
];

const fallbackScheduledJobs: ScheduledJobRow[] = [
  {
    id: "fallback-payment-reminder",
    name: "payment-reminder",
    handler: "jobs.paymentReminder",
    cron: "0 8 * * *",
    is_active: false,
    last_run_at: null,
    next_run_at: null,
  },
  {
    id: "fallback-krs-window",
    name: "krs-window-reminder",
    handler: "jobs.krsWindowReminder",
    cron: "0 7 * * *",
    is_active: false,
    last_run_at: null,
    next_run_at: null,
  },
];

function fallbackError(error: PostgrestError | null, tableName: string) {
  if (!error) {
    return "Konfigurasi service role Supabase belum tersedia di server.";
  }

  if (error.code === "42P01") {
    return `Tabel ${tableName} belum dimigrasikan. Jalankan npm run db:migrate untuk memakai data database.`;
  }

  return error.message;
}

export async function getSystemSettings(): Promise<DataResult<SystemSettingRow>> {
  const supabase = createAdminClient();

  if (!supabase) {
    return { rows: fallbackSettings, error: fallbackError(null, "settings"), source: "fallback" };
  }

  const result = await supabase
    .from("settings")
    .select("id, key, label, description, category, value, is_secret, is_active, updated_at")
    .order("category", { ascending: true })
    .order("key", { ascending: true });

  if (result.error) {
    return { rows: fallbackSettings, error: fallbackError(result.error, "settings"), source: "fallback" };
  }

  return {
    rows: (result.data ?? []) as unknown as SystemSettingRow[],
    error: null,
    source: "database",
  };
}

export async function getNotificationTemplates(): Promise<DataResult<NotificationTemplateRow>> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      rows: fallbackTemplates,
      error: fallbackError(null, "notification_templates"),
      source: "fallback",
    };
  }

  const result = await supabase
    .from("notification_templates")
    .select("id, code, name, channel, trigger_event, subject, body, variables, is_active, updated_at")
    .order("trigger_event", { ascending: true })
    .order("channel", { ascending: true });

  if (result.error) {
    return {
      rows: fallbackTemplates,
      error: fallbackError(result.error, "notification_templates"),
      source: "fallback",
    };
  }

  return {
    rows: (result.data ?? []) as unknown as NotificationTemplateRow[],
    error: null,
    source: "database",
  };
}

async function getApiLogs(): Promise<DataResult<ApiLogRow>> {
  const supabase = createAdminClient();

  if (!supabase) {
    return { rows: fallbackApiLogs, error: fallbackError(null, "api_logs"), source: "fallback" };
  }

  const result = await supabase
    .from("api_logs")
    .select("id, method, path, status_code, duration_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (result.error) {
    return { rows: fallbackApiLogs, error: fallbackError(result.error, "api_logs"), source: "fallback" };
  }

  return { rows: (result.data ?? []) as unknown as ApiLogRow[], error: null, source: "database" };
}

async function getQueueJobs(): Promise<DataResult<QueueJobRow>> {
  const supabase = createAdminClient();

  if (!supabase) {
    return { rows: fallbackQueueJobs, error: fallbackError(null, "queue_jobs"), source: "fallback" };
  }

  const result = await supabase
    .from("queue_jobs")
    .select("id, queue, name, status, attempts, run_at, finished_at, last_error, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (result.error) {
    return { rows: fallbackQueueJobs, error: fallbackError(result.error, "queue_jobs"), source: "fallback" };
  }

  return { rows: (result.data ?? []) as unknown as QueueJobRow[], error: null, source: "database" };
}

async function getScheduledJobs(): Promise<DataResult<ScheduledJobRow>> {
  const supabase = createAdminClient();

  if (!supabase) {
    return { rows: fallbackScheduledJobs, error: fallbackError(null, "scheduled_jobs"), source: "fallback" };
  }

  const result = await supabase
    .from("scheduled_jobs")
    .select("id, name, handler, cron, is_active, last_run_at, next_run_at")
    .order("name", { ascending: true });

  if (result.error) {
    return { rows: fallbackScheduledJobs, error: fallbackError(result.error, "scheduled_jobs"), source: "fallback" };
  }

  return { rows: (result.data ?? []) as unknown as ScheduledJobRow[], error: null, source: "database" };
}

export async function getDeveloperToolSnapshot(): Promise<DeveloperToolSnapshot> {
  const [apiLogs, queueJobs, scheduledJobs] = await Promise.all([
    getApiLogs(),
    getQueueJobs(),
    getScheduledJobs(),
  ]);

  return { apiLogs, queueJobs, scheduledJobs };
}
