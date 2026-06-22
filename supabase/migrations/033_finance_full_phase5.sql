-- Restore finance page logic: soft delete, setup tables, and in-app notification queue.
-- Additive and idempotent. Intended to be applied to DEV before production review.

create table if not exists public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app', 'push', 'email', 'whatsapp')),
  event text not null,
  subject text not null,
  body text not null,
  href text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'waiting' check (status in ('waiting', 'processing', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  run_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tagihan
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.users(id) on delete set null,
  add column if not exists updated_by uuid references public.users(id) on delete set null;

alter table public.master_biaya
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.users(id) on delete set null,
  add column if not exists updated_by uuid references public.users(id) on delete set null;

alter table public.notifikasi
  add column if not exists href text,
  add column if not exists type text not null default 'system',
  add column if not exists related_type text,
  add column if not exists related_id uuid,
  add column if not exists idempotency_key text;

alter table public.notification_queue
  add column if not exists idempotency_key text;

alter table public.kategori_keuangan
  add column if not exists coa_id uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.users(id) on delete set null,
  add column if not exists updated_by uuid references public.users(id) on delete set null;

create table if not exists public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  kode text not null,
  nama text not null,
  tipe text not null check (tipe in ('Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban')),
  parent_id uuid references public.chart_of_accounts(id) on delete set null,
  deskripsi text,
  is_active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  deleted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.campus_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  branch text,
  coa_id uuid references public.chart_of_accounts(id) on delete set null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  catatan text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  deleted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.payment_bank_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  bank_code text not null,
  bank_name text not null,
  mode text not null default 'sandbox' check (mode in ('sandbox', 'production')),
  public_config jsonb not null default '{}'::jsonb,
  secret_setting_keys text[] not null default '{}',
  is_active boolean not null default true,
  catatan text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  deleted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  kode text not null,
  nama text not null,
  tipe text not null check (tipe in ('Manual Transfer', 'Payment Gateway', 'VA Bank')),
  fee_type text not null default 'none' check (fee_type in ('none', 'fixed', 'percent')),
  fee_amount numeric(14,2) not null default 0,
  instruksi text,
  bank_account_id uuid references public.campus_bank_accounts(id) on delete set null,
  integration_id uuid references public.payment_bank_integrations(id) on delete set null,
  is_active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  deleted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.beasiswa_diskon (
  id uuid primary key default gen_random_uuid(),
  kode text not null,
  nama text not null,
  tipe text not null check (tipe in ('Beasiswa', 'Diskon')),
  nilai numeric(14,2) not null check (nilai >= 0),
  satuan text not null check (satuan in ('Nominal', 'Persen')),
  tahun_akademik_id uuid references public.tahun_akademik(id) on delete set null,
  prodi_id uuid references public.program_studi(id) on delete set null,
  angkatan integer,
  kuota integer,
  is_active boolean not null default true,
  keterangan text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  deleted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'chart_of_accounts' and constraint_name = 'chart_of_accounts_kode_key'
  ) then
    alter table public.chart_of_accounts add constraint chart_of_accounts_kode_key unique (kode);
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'payment_methods' and constraint_name = 'payment_methods_kode_key'
  ) then
    alter table public.payment_methods add constraint payment_methods_kode_key unique (kode);
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'beasiswa_diskon' and constraint_name = 'beasiswa_diskon_kode_key'
  ) then
    alter table public.beasiswa_diskon add constraint beasiswa_diskon_kode_key unique (kode);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'kategori_keuangan' and constraint_name = 'kategori_keuangan_coa_id_fkey'
  ) then
    alter table public.kategori_keuangan
      add constraint kategori_keuangan_coa_id_fkey foreign key (coa_id) references public.chart_of_accounts(id) on delete set null;
  end if;
end
$$;

create index if not exists idx_tagihan_active_created_at on public.tagihan(created_at desc) where deleted_at is null;
create index if not exists idx_tagihan_active_mahasiswa_ta on public.tagihan(mahasiswa_id, tahun_akademik_id) where deleted_at is null;
create index if not exists idx_tagihan_active_due_status on public.tagihan(jatuh_tempo, status) where deleted_at is null;
create index if not exists idx_master_biaya_active on public.master_biaya(created_at desc) where deleted_at is null;
create index if not exists idx_notifikasi_user_created_at on public.notifikasi(id_user, created_at desc);
create unique index if not exists idx_notifikasi_idempotency_key on public.notifikasi(idempotency_key) where idempotency_key is not null;
create unique index if not exists idx_notification_queue_idempotency_key on public.notification_queue(idempotency_key) where idempotency_key is not null;
create index if not exists idx_notification_queue_status_run_at on public.notification_queue(status, run_at);
create unique index if not exists idx_campus_bank_accounts_active_unique on public.campus_bank_accounts(bank_name, account_number) where deleted_at is null;
create unique index if not exists idx_payment_bank_integrations_active_unique on public.payment_bank_integrations(provider, bank_code, mode) where deleted_at is null;
create index if not exists idx_payment_methods_active on public.payment_methods(is_active, created_at desc) where deleted_at is null;
create index if not exists idx_beasiswa_diskon_active on public.beasiswa_diskon(is_active, created_at desc) where deleted_at is null;
create index if not exists idx_chart_of_accounts_active on public.chart_of_accounts(is_active, kode) where deleted_at is null;
create index if not exists idx_campus_bank_accounts_active on public.campus_bank_accounts(is_active, created_at desc) where deleted_at is null;
create index if not exists idx_payment_bank_integrations_active on public.payment_bank_integrations(is_active, created_at desc) where deleted_at is null;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_notification_queue_updated') then
    create trigger trg_notification_queue_updated
    before update on public.notification_queue
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_kategori_keuangan_updated') then
    create trigger trg_kategori_keuangan_updated
    before update on public.kategori_keuangan
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_chart_of_accounts_updated') then
    create trigger trg_chart_of_accounts_updated
    before update on public.chart_of_accounts
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_campus_bank_accounts_updated') then
    create trigger trg_campus_bank_accounts_updated
    before update on public.campus_bank_accounts
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_payment_bank_integrations_updated') then
    create trigger trg_payment_bank_integrations_updated
    before update on public.payment_bank_integrations
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_payment_methods_updated') then
    create trigger trg_payment_methods_updated
    before update on public.payment_methods
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_beasiswa_diskon_updated') then
    create trigger trg_beasiswa_diskon_updated
    before update on public.beasiswa_diskon
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.notification_queue enable row level security;
alter table public.chart_of_accounts enable row level security;
alter table public.campus_bank_accounts enable row level security;
alter table public.payment_bank_integrations enable row level security;
alter table public.payment_methods enable row level security;
alter table public.beasiswa_diskon enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifikasi' and policyname = 'Service role manage notifikasi'
  ) then
    create policy "Service role manage notifikasi"
    on public.notifikasi for all to service_role
    using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notification_queue' and policyname = 'Service role manage notification_queue'
  ) then
    create policy "Service role manage notification_queue"
    on public.notification_queue for all to service_role
    using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'chart_of_accounts' and policyname = 'Service role manage chart_of_accounts'
  ) then
    create policy "Service role manage chart_of_accounts"
    on public.chart_of_accounts for all to service_role
    using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'campus_bank_accounts' and policyname = 'Service role manage campus_bank_accounts'
  ) then
    create policy "Service role manage campus_bank_accounts"
    on public.campus_bank_accounts for all to service_role
    using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_bank_integrations' and policyname = 'Service role manage payment_bank_integrations'
  ) then
    create policy "Service role manage payment_bank_integrations"
    on public.payment_bank_integrations for all to service_role
    using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_methods' and policyname = 'Service role manage payment_methods'
  ) then
    create policy "Service role manage payment_methods"
    on public.payment_methods for all to service_role
    using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'beasiswa_diskon' and policyname = 'Service role manage beasiswa_diskon'
  ) then
    create policy "Service role manage beasiswa_diskon"
    on public.beasiswa_diskon for all to service_role
    using (true) with check (true);
  end if;
end
$$;

insert into public.notification_templates (code, name, channel, trigger_event, subject, body, variables, is_active)
values
  ('billing.created.in_app', 'Tagihan Baru', 'in_app', 'billing.created', 'Tagihan baru tersedia', 'Tagihan {{jenis_tagihan}} sebesar {{nominal}} jatuh tempo {{jatuh_tempo}}.', ARRAY['jenis_tagihan','nominal','jatuh_tempo'], true),
  ('billing.bulk_created.in_app', 'Tagihan Massal', 'in_app', 'billing.bulk_created', 'Tagihan baru tersedia', '{{jumlah_tagihan}} tagihan {{jenis_tagihan}} telah dibuat untuk periode {{tahun_akademik}}.', ARRAY['jumlah_tagihan','jenis_tagihan','tahun_akademik'], true),
  ('billing.manual_reminder.in_app', 'Pengingat Tagihan', 'in_app', 'billing.manual_reminder', 'Pengingat pembayaran tagihan', 'Tagihan {{jenis_tagihan}} sebesar {{nominal}} masih perlu dibayar sebelum {{jatuh_tempo}}.', ARRAY['jenis_tagihan','nominal','jatuh_tempo'], true),
  ('billing.overdue.in_app', 'Tagihan Lewat Tempo', 'in_app', 'billing.overdue', 'Tagihan sudah lewat tempo', 'Tagihan {{jenis_tagihan}} sebesar {{nominal}} telah melewati jatuh tempo {{jatuh_tempo}}.', ARRAY['jenis_tagihan','nominal','jatuh_tempo'], true),
  ('payment.success.in_app', 'Pembayaran Berhasil', 'in_app', 'payment.success', 'Pembayaran diverifikasi', 'Pembayaran {{jenis_tagihan}} sebesar {{nominal}} telah diverifikasi pada {{tanggal_bayar}}.', ARRAY['jenis_tagihan','nominal','tanggal_bayar'], true),
  ('payment.rejected.in_app', 'Pembayaran Ditolak', 'in_app', 'payment.rejected', 'Pembayaran ditolak', 'Pembayaran {{jenis_tagihan}} sebesar {{nominal}} ditolak. Silakan cek kembali bukti pembayaran.', ARRAY['jenis_tagihan','nominal'], true)
on conflict (code) do update set
  name = excluded.name,
  channel = excluded.channel,
  trigger_event = excluded.trigger_event,
  subject = excluded.subject,
  body = excluded.body,
  variables = excluded.variables,
  is_active = excluded.is_active;
