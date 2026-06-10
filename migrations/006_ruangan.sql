-- Create table for Rooms
create table if not exists public.ruangan (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama text not null,
  lokasi text,
  kapasitas integer not null default 40,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add trigger for updated_at
create trigger set_updated_at_ruangan
before update on public.ruangan
for each row execute function public.set_updated_at();

-- Note: In a real migration, we would migrate data from jadwal_kuliah.ruangan string to this table
-- For now, we just create the table as requested to be managed as Master Data.
