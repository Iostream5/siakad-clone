create table if not exists public.pmb_biaya (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik_id uuid not null references public.tahun_akademik(id) on delete cascade,
  prodi_id uuid references public.program_studi(id) on delete set null,
  nama text not null default 'Biaya Pendaftaran PMB',
  jalur_pendaftaran text not null default 'Reguler',
  jenis_pendaftaran text not null default 'Baru',
  gelombang text,
  nominal numeric(14,2) not null check (nominal >= 0),
  tanggal_mulai date,
  tanggal_selesai date,
  due_days integer not null default 3 check (due_days > 0 and due_days <= 60),
  is_active boolean not null default true,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pmb_pendaftaran
  add column if not exists pmb_biaya_id uuid references public.pmb_biaya(id) on delete set null;

create index if not exists idx_pmb_biaya_tahun_active on public.pmb_biaya(tahun_akademik_id, is_active);
create index if not exists idx_pmb_biaya_lookup on public.pmb_biaya(jalur_pendaftaran, jenis_pendaftaran, prodi_id);
create index if not exists idx_pmb_pendaftaran_biaya on public.pmb_pendaftaran(pmb_biaya_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_pmb_biaya_updated') then
    create trigger trg_pmb_biaya_updated
    before update on public.pmb_biaya
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.pmb_biaya enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pmb_biaya' and policyname = 'Service role manage pmb_biaya'
  ) then
    create policy "Service role manage pmb_biaya"
    on public.pmb_biaya
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

insert into public.pmb_biaya (
  tahun_akademik_id,
  nama,
  jalur_pendaftaran,
  jenis_pendaftaran,
  nominal,
  due_days,
  is_active,
  catatan
)
select
  ta.id,
  'Biaya Pendaftaran PMB',
  'Semua',
  'Semua',
  250000,
  3,
  true,
  'Tarif default hasil migrasi awal PMB.'
from public.tahun_akademik ta
where not exists (select 1 from public.pmb_biaya)
order by ta.is_aktif desc, ta.tanggal_mulai desc
limit 1;
