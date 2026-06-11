create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  category text not null default 'system',
  value jsonb not null default '{}'::jsonb,
  is_secret boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  channel text not null check (channel in ('in_app', 'email', 'whatsapp', 'push')),
  trigger_event text not null,
  subject text not null,
  body text not null,
  variables text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_logs (
  id uuid primary key default gen_random_uuid(),
  method text not null,
  path text not null,
  status_code integer not null,
  duration_ms integer,
  user_id uuid references public.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.queue_jobs (
  id uuid primary key default gen_random_uuid(),
  queue text not null,
  name text not null,
  status text not null check (status in ('waiting', 'active', 'completed', 'failed', 'delayed')) default 'waiting',
  attempts integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  run_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  handler text not null,
  cron text not null,
  is_active boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_settings_category on public.settings(category);
create index if not exists idx_notification_templates_event on public.notification_templates(trigger_event);
create index if not exists idx_api_logs_created_at on public.api_logs(created_at desc);
create index if not exists idx_queue_jobs_status_run_at on public.queue_jobs(status, run_at);
create index if not exists idx_scheduled_jobs_active_next on public.scheduled_jobs(is_active, next_run_at);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_settings_updated') then
    create trigger trg_settings_updated
    before update on public.settings
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_notification_templates_updated') then
    create trigger trg_notification_templates_updated
    before update on public.notification_templates
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_queue_jobs_updated') then
    create trigger trg_queue_jobs_updated
    before update on public.queue_jobs
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_scheduled_jobs_updated') then
    create trigger trg_scheduled_jobs_updated
    before update on public.scheduled_jobs
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.settings enable row level security;
alter table public.notification_templates enable row level security;
alter table public.api_logs enable row level security;
alter table public.queue_jobs enable row level security;
alter table public.scheduled_jobs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'settings' and policyname = 'Service role manage settings'
  ) then
    create policy "Service role manage settings"
    on public.settings
    for all
    to service_role
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notification_templates' and policyname = 'Service role manage notification_templates'
  ) then
    create policy "Service role manage notification_templates"
    on public.notification_templates
    for all
    to service_role
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'api_logs' and policyname = 'Service role manage api_logs'
  ) then
    create policy "Service role manage api_logs"
    on public.api_logs
    for all
    to service_role
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'queue_jobs' and policyname = 'Service role manage queue_jobs'
  ) then
    create policy "Service role manage queue_jobs"
    on public.queue_jobs
    for all
    to service_role
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scheduled_jobs' and policyname = 'Service role manage scheduled_jobs'
  ) then
    create policy "Service role manage scheduled_jobs"
    on public.scheduled_jobs
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

insert into public.settings (key, label, description, category, value, is_secret, is_active)
values
  ('campus.name', 'Nama Kampus', 'Nama resmi kampus yang ditampilkan di portal.', 'kampus', '{"value":"STAI"}', false, true),
  ('campus.pmb_open', 'PMB Dibuka', 'Flag untuk mengaktifkan CTA dan alur pendaftaran PMB.', 'kampus', '{"value":true}', false, true),
  ('payment.midtrans.enabled', 'Midtrans Aktif', 'Kontrol kesiapan integrasi Midtrans pada fase payment gateway.', 'payment', '{"value":false}', true, false),
  ('payment.xendit.enabled', 'Xendit Aktif', 'Kontrol kesiapan integrasi Xendit pada fase payment gateway.', 'payment', '{"value":false}', true, false),
  ('notification.fcm.enabled', 'Firebase Cloud Messaging', 'Kontrol pengiriman push notification mobile.', 'notification', '{"value":false}', true, false)
on conflict (key) do update set
  label = excluded.label,
  description = excluded.description,
  category = excluded.category,
  is_secret = excluded.is_secret,
  is_active = excluded.is_active;

insert into public.notification_templates (code, name, channel, trigger_event, subject, body, variables, is_active)
values
  ('billing.created.in_app', 'Tagihan Baru', 'in_app', 'billing.created', 'Tagihan baru tersedia', 'Tagihan {{jenis_tagihan}} sebesar {{nominal}} telah dibuat dengan jatuh tempo {{jatuh_tempo}}.', ARRAY['jenis_tagihan','nominal','jatuh_tempo'], true),
  ('payment.success.in_app', 'Pembayaran Berhasil', 'in_app', 'payment.success', 'Pembayaran berhasil diverifikasi', 'Pembayaran {{jenis_tagihan}} sebesar {{nominal}} telah diterima pada {{tanggal_bayar}}.', ARRAY['jenis_tagihan','nominal','tanggal_bayar'], true),
  ('schedule.changed.push', 'Perubahan Jadwal', 'push', 'schedule.changed', 'Jadwal kuliah berubah', 'Jadwal {{mata_kuliah}} kelas {{kelas}} berubah menjadi {{jadwal_baru}}.', ARRAY['mata_kuliah','kelas','jadwal_baru'], false),
  ('grade.published.in_app', 'Nilai Dipublish', 'in_app', 'grade.published', 'Nilai {{mata_kuliah}} sudah tersedia', 'Nilai akhir mata kuliah {{mata_kuliah}} telah dipublish dan dapat dilihat di portal mahasiswa.', ARRAY['mata_kuliah'], true),
  ('krs.approved.in_app', 'KRS Disetujui', 'in_app', 'krs.approved', 'KRS semester {{semester}} disetujui', 'KRS Anda untuk {{tahun_akademik}} telah disetujui oleh dosen wali.', ARRAY['semester','tahun_akademik'], true),
  ('announcement.broadcast.in_app', 'Pengumuman Broadcast', 'in_app', 'announcement.broadcast', '{{judul}}', '{{isi}}', ARRAY['judul','isi'], true)
on conflict (code) do update set
  name = excluded.name,
  channel = excluded.channel,
  trigger_event = excluded.trigger_event,
  subject = excluded.subject,
  body = excluded.body,
  variables = excluded.variables,
  is_active = excluded.is_active;

insert into public.scheduled_jobs (name, handler, cron, is_active)
values
  ('payment-reminder', 'jobs.paymentReminder', '0 8 * * *', false),
  ('krs-window-reminder', 'jobs.krsWindowReminder', '0 7 * * *', false),
  ('audit-retention-check', 'jobs.auditRetentionCheck', '0 2 * * 0', false)
on conflict (name) do update set
  handler = excluded.handler,
  cron = excluded.cron,
  is_active = excluded.is_active;

insert into public.queue_jobs (queue, name, status, attempts, payload, run_at)
values
  ('notification', 'seed-template-preview', 'waiting', 0, '{"source":"phase1-admin-extension"}', now())
on conflict do nothing;
