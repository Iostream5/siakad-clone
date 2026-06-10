-- 1. Create Master Biaya (Configuration for automated billing)
create table if not exists public.master_biaya (
  id uuid primary key default gen_random_uuid(),
  nama text not null, -- e.g., 'UKT Semester Ganjil'
  kategori_id uuid references public.kategori_keuangan(id),
  prodi_id uuid references public.program_studi(id),
  angkatan integer, -- NULL means all batches
  nominal numeric(15,2) not null,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Add 'Bendahara' to allowed roles in users table check constraint
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check 
  check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara'));

-- 3. Menu & Access Control for Bendahara (Based on user_menu_permissions)
-- We will handle this through the application logic, but we can seed some defaults if needed.
-- Note: Tabel 'menus' tidak ada, yang ada adalah 'user_menu_permissions' per user.
-- Untuk global role access, kita cek 003_role_access_multi_role.sql

-- 4. Initial Master Biaya example
insert into public.master_biaya (nama, nominal, angkatan)
select 'UKT Standar', 2500000, 2024
where not exists (
  select 1
  from public.master_biaya
  where nama = 'UKT Standar'
    and nominal = 2500000
    and angkatan = 2024
);
