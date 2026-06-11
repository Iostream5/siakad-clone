-- 1. Create Gedung table
create table if not exists public.gedung (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama text not null,
  jumlah_lantai integer default 1,
  keterangan text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Refactor Ruangan table to link to Gedung
-- First, add columns to ruangan
alter table public.ruangan add column if not exists gedung_id uuid references public.gedung(id);
alter table public.ruangan add column if not exists lantai integer default 1;
alter table public.ruangan add column if not exists jenis_ruangan text default 'Teori'; -- Teori, Lab, Workshop, dsb
alter table public.ruangan add column if not exists fasilitas jsonb default '[]'; -- ['AC', 'Proyektor']

-- 3. Add triggers for gedung
create trigger set_updated_at_gedung
before update on public.gedung
for each row execute function public.set_updated_at();
