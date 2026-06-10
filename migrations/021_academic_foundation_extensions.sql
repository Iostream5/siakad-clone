create table if not exists public.kampus (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama text not null,
  alamat text,
  kota text,
  telepon text,
  email text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kelas (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama text not null,
  prodi_id uuid references public.program_studi(id),
  angkatan integer,
  tingkat text,
  kapasitas integer not null default 40,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kurikulum (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama text not null,
  prodi_id uuid not null references public.program_studi(id),
  tahun_mulai integer not null,
  total_sks integer not null default 0,
  deskripsi text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kampus_active on public.kampus(is_active);
create index if not exists idx_kelas_prodi on public.kelas(prodi_id);
create index if not exists idx_kelas_active on public.kelas(is_active);
create index if not exists idx_kurikulum_prodi on public.kurikulum(prodi_id);
create index if not exists idx_kurikulum_active on public.kurikulum(is_active);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_kampus_updated') then
    create trigger trg_kampus_updated
    before update on public.kampus
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_kelas_updated') then
    create trigger trg_kelas_updated
    before update on public.kelas
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_kurikulum_updated') then
    create trigger trg_kurikulum_updated
    before update on public.kurikulum
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.kampus enable row level security;
alter table public.kelas enable row level security;
alter table public.kurikulum enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'kampus' and policyname = 'Service role manage kampus'
  ) then
    create policy "Service role manage kampus"
    on public.kampus
    for all
    to service_role
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'kelas' and policyname = 'Service role manage kelas'
  ) then
    create policy "Service role manage kelas"
    on public.kelas
    for all
    to service_role
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'kurikulum' and policyname = 'Service role manage kurikulum'
  ) then
    create policy "Service role manage kurikulum"
    on public.kurikulum
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

