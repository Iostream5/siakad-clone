-- Extra live tables detected through MCP that are not present in local migrations.
-- Run after siakad_clone_restore_schema_from_local_migrations.sql and before data inserts.

create table if not exists public.edom_questions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  category text not null default 'Pembelajaran'::text,
  question_text text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.edom_responses (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik_id uuid not null references public.tahun_akademik(id) on delete cascade,
  jadwal_id uuid not null references public.jadwal_kuliah(id) on delete cascade,
  dosen_id uuid not null references public.dosen(id) on delete cascade,
  mahasiswa_id uuid not null references public.mahasiswa(id) on delete cascade,
  average_score numeric(4,2) not null default 0 check (average_score >= 0 and average_score <= 5),
  comment text,
  submitted_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (tahun_akademik_id, jadwal_id, mahasiswa_id)
);

create table if not exists public.edom_response_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.edom_responses(id) on delete cascade,
  question_id uuid not null references public.edom_questions(id) on delete cascade,
  score integer not null check (score >= 1 and score <= 5),
  created_at timestamp with time zone not null default now(),
  unique (response_id, question_id)
);

create table if not exists public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  platform text not null default 'web'::text,
  user_agent text,
  last_seen_at timestamp with time zone not null default now(),
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  channel text not null default 'in_app'::text check (channel = any (array['in_app'::text, 'push'::text, 'email'::text, 'whatsapp'::text])),
  event text not null,
  subject text not null,
  body text not null,
  href text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'waiting'::text check (status = any (array['waiting'::text, 'processing'::text, 'sent'::text, 'failed'::text, 'skipped'::text])),
  attempts integer not null default 0,
  run_at timestamp with time zone not null default now(),
  sent_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create trigger trg_edom_questions_updated
before update on public.edom_questions
for each row execute function public.set_updated_at();

create trigger trg_edom_responses_updated
before update on public.edom_responses
for each row execute function public.set_updated_at();

create trigger trg_notification_devices_updated
before update on public.notification_devices
for each row execute function public.set_updated_at();

create trigger trg_notification_queue_updated
before update on public.notification_queue
for each row execute function public.set_updated_at();

alter table public.edom_questions enable row level security;
alter table public.edom_responses enable row level security;
alter table public.edom_response_answers enable row level security;
alter table public.notification_devices enable row level security;
alter table public.notification_queue enable row level security;

drop policy if exists "Service role manage edom_questions" on public.edom_questions;
create policy "Service role manage edom_questions" on public.edom_questions
as permissive for all to service_role using (true) with check (true);

drop policy if exists "Service role manage edom_responses" on public.edom_responses;
create policy "Service role manage edom_responses" on public.edom_responses
as permissive for all to service_role using (true) with check (true);

drop policy if exists "Service role manage edom_response_answers" on public.edom_response_answers;
create policy "Service role manage edom_response_answers" on public.edom_response_answers
as permissive for all to service_role using (true) with check (true);

drop policy if exists "Service role manage notification_devices" on public.notification_devices;
create policy "Service role manage notification_devices" on public.notification_devices
as permissive for all to service_role using (true) with check (true);

drop policy if exists "Service role manage notification_queue" on public.notification_queue;
create policy "Service role manage notification_queue" on public.notification_queue
as permissive for all to service_role using (true) with check (true);
