create table if not exists public.fakultas (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama text not null,
  dekan text,
  deskripsi text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_fakultas_updated'
  ) then
    create trigger trg_fakultas_updated
    before update on public.fakultas
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.fakultas enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'fakultas' and policyname = 'Service role manage fakultas'
  ) then
    create policy "Service role manage fakultas"
    on public.fakultas
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

insert into public.fakultas (kode, nama, dekan, deskripsi, is_active)
values
  ('FAI', 'Fakultas Agama Islam', 'Dr. Ahmad Fauzi', 'Pengelolaan prodi keagamaan dan studi Islam.', true),
  ('FEB', 'Fakultas Ekonomi dan Bisnis', 'Dr. Siti Khadijah', 'Pembinaan prodi ekonomi, akuntansi, dan bisnis.', true)
on conflict (kode) do nothing;
