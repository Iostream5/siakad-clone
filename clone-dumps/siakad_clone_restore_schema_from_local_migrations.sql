-- SIAKAD restore schema skeleton from local migrations.
-- Apply to fresh Supabase target before running data dump output.
begin;
create extension if not exists "pgcrypto" with schema "extensions";
create extension if not exists "uuid-ossp" with schema "extensions";
create extension if not exists "pg_stat_statements" with schema "extensions";
create extension if not exists "supabase_vault" with schema "vault";

-- >>> 001_init.sql

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email, role, full_name, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'Mahasiswa'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan')),
  phone text,
  avatar_url text,
  last_login_at timestamptz,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.program_studi (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama text not null,
  jenjang text not null,
  kaprodi_id uuid references public.users(id),
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tahun_akademik (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama text not null,
  semester text not null check (semester in ('Ganjil', 'Genap', 'Pendek')),
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  is_aktif boolean not null default false,
  is_krs_open boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dosen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id),
  nidn text unique,
  nip text,
  gelar text,
  homebase_prodi_id uuid references public.program_studi(id),
  status_dosen text not null default 'AKTIF',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mahasiswa (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id),
  nim text unique,
  nama_ibu_kandung text,
  tempat_lahir text,
  tanggal_lahir date,
  angkatan integer not null,
  prodi_id uuid not null references public.program_studi(id),
  status_mahasiswa text not null default 'CALON' check (status_mahasiswa in ('CALON', 'AKTIF', 'NON-AKTIF', 'CUTI', 'LULUS', 'DO')),
  ips numeric(4,2) not null default 0,
  ipk numeric(4,2) not null default 0,
  saldo_tunggakan numeric(14,2) not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mata_kuliah (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama text not null,
  sks integer not null check (sks > 0),
  semester integer not null,
  jenis text not null default 'Wajib',
  prodi_id uuid not null references public.program_studi(id),
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mata_kuliah_prasyarat (
  id uuid primary key default gen_random_uuid(),
  id_mk uuid not null references public.mata_kuliah(id) on delete cascade,
  id_mk_prasyarat uuid not null references public.mata_kuliah(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (id_mk, id_mk_prasyarat)
);

create table if not exists public.jadwal_kuliah (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik_id uuid not null references public.tahun_akademik(id),
  mata_kuliah_id uuid not null references public.mata_kuliah(id),
  dosen_id uuid not null references public.dosen(id),
  nama_kelas text not null,
  hari text not null,
  jam_mulai time not null,
  jam_selesai time not null,
  ruangan text not null,
  kapasitas integer not null default 40,
  peserta integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dosen_wali (
  id uuid primary key default gen_random_uuid(),
  id_dosen uuid not null references public.dosen(id) on delete cascade,
  id_mahasiswa uuid not null references public.mahasiswa(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (id_dosen, id_mahasiswa)
);

create table if not exists public.registrasi_semester (
  id uuid primary key default gen_random_uuid(),
  id_mahasiswa uuid not null references public.mahasiswa(id) on delete cascade,
  id_tahun_akademik uuid not null references public.tahun_akademik(id),
  status text not null check (status in ('Belum', 'Proses', 'Selesai')) default 'Belum',
  tanggal timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id_mahasiswa, id_tahun_akademik)
);

create table if not exists public.krs_header (
  id uuid primary key default gen_random_uuid(),
  id_mahasiswa uuid not null references public.mahasiswa(id) on delete cascade,
  id_tahun_akademik uuid not null references public.tahun_akademik(id),
  total_sks integer not null default 0,
  status text not null check (status in ('Draft', 'Diajukan', 'Disetujui', 'Ditolak')) default 'Draft',
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id_mahasiswa, id_tahun_akademik)
);

create table if not exists public.krs_detail (
  id uuid primary key default gen_random_uuid(),
  id_krs_header uuid not null references public.krs_header(id) on delete cascade,
  id_jadwal uuid not null references public.jadwal_kuliah(id),
  status text not null default 'Aktif',
  catatan text,
  created_at timestamptz not null default now(),
  unique (id_krs_header, id_jadwal)
);

create table if not exists public.riwayat_status_mahasiswa (
  id uuid primary key default gen_random_uuid(),
  id_mahasiswa uuid not null references public.mahasiswa(id) on delete cascade,
  status_lama text,
  status_baru text not null,
  tanggal timestamptz not null default now()
);

create table if not exists public.pmb_pendaftaran (
  id uuid primary key default gen_random_uuid(),
  nomor_pendaftaran text not null unique,
  nama_lengkap text not null,
  email text not null,
  no_hp text,
  prodi_pilihan_id uuid references public.program_studi(id),
  status_seleksi text not null default 'BARU' check (status_seleksi in ('BARU', 'VERIFIKASI', 'LULUS', 'DITOLAK')),
  skor_seleksi numeric(5,2),
  generated_nim text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tagihan (
  id uuid primary key default gen_random_uuid(),
  mahasiswa_id uuid not null references public.mahasiswa(id),
  tahun_akademik_id uuid not null references public.tahun_akademik(id),
  jenis text not null,
  nominal numeric(14,2) not null,
  jatuh_tempo date not null,
  status text not null default 'Belum Lunas' check (status in ('Belum Lunas', 'Lunas', 'Dispensasi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pembayaran (
  id uuid primary key default gen_random_uuid(),
  tagihan_id uuid not null references public.tagihan(id) on delete cascade,
  tanggal_bayar timestamptz not null default now(),
  nominal numeric(14,2) not null,
  metode text not null,
  bukti_url text,
  verified_by uuid references public.users(id),
  verified_at timestamptz,
  status text not null default 'Menunggu' check (status in ('Menunggu', 'Terverifikasi', 'Ditolak')),
  created_at timestamptz not null default now()
);

create table if not exists public.dispensasi (
  id uuid primary key default gen_random_uuid(),
  tagihan_id uuid not null references public.tagihan(id) on delete cascade,
  alasan text not null,
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  status text not null default 'Menunggu' check (status in ('Menunggu', 'Disetujui', 'Ditolak')),
  created_at timestamptz not null default now()
);

create table if not exists public.nilai_komponen (
  id uuid primary key default gen_random_uuid(),
  mahasiswa_id uuid not null references public.mahasiswa(id),
  jadwal_id uuid not null references public.jadwal_kuliah(id),
  komponen text not null check (komponen in ('Tugas', 'UTS', 'UAS', 'Praktikum', 'Kehadiran')),
  bobot numeric(5,2) not null,
  nilai numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nilai_akhir (
  id uuid primary key default gen_random_uuid(),
  mahasiswa_id uuid not null references public.mahasiswa(id),
  jadwal_id uuid not null references public.jadwal_kuliah(id),
  nilai_angka numeric(5,2),
  nilai_huruf text,
  published_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mahasiswa_id, jadwal_id)
);

create table if not exists public.surat_pengajuan (
  id uuid primary key default gen_random_uuid(),
  mahasiswa_id uuid not null references public.mahasiswa(id),
  jenis text not null,
  keperluan text not null,
  status text not null default 'Diajukan' check (status in ('Diajukan', 'Diproses', 'Disetujui', 'Ditolak')),
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.kuesioner (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  target_role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.kuesioner_jawaban (
  id uuid primary key default gen_random_uuid(),
  kuesioner_id uuid not null references public.kuesioner(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  jawaban jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.approval_logs (
  id uuid primary key default gen_random_uuid(),
  modul text not null,
  id_ref uuid not null,
  step integer not null default 1,
  status text not null,
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  catatan text
);

create table if not exists public.notifikasi (
  id uuid primary key default gen_random_uuid(),
  id_user uuid not null references public.users(id) on delete cascade,
  judul text not null,
  pesan text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.pengumuman (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  isi text not null,
  target_role text not null default 'Semua',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  id_user uuid references public.users(id),
  modul text not null,
  aksi text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.generate_nim(p_pendaftaran_id uuid, p_angkatan integer)
returns text
language plpgsql
as $$
declare
  v_current text;
  v_sequence integer;
begin
  select generated_nim into v_current
  from public.pmb_pendaftaran
  where id = p_pendaftaran_id
  for update;

  if v_current is not null then
    return v_current;
  end if;

  select coalesce(max(right(nim, 4)::integer), 0) + 1
    into v_sequence
  from public.mahasiswa
  where angkatan = p_angkatan
    and nim is not null;

  v_current := p_angkatan::text || lpad(v_sequence::text, 4, '0');

  update public.pmb_pendaftaran
  set generated_nim = v_current
  where id = p_pendaftaran_id;

  return v_current;
end;
$$;

create or replace function public.handle_user_audit()
returns trigger
language plpgsql
as $$
begin
  insert into public.audit_logs (id_user, modul, aksi, table_name, record_id, old_data, new_data)
  values (
    null,
    tg_table_name,
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    to_jsonb(old),
    to_jsonb(new)
  );
  return coalesce(new, old);
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_profile();

create trigger trg_users_updated before update on public.users for each row execute procedure public.set_updated_at();
create trigger trg_program_studi_updated before update on public.program_studi for each row execute procedure public.set_updated_at();
create trigger trg_tahun_akademik_updated before update on public.tahun_akademik for each row execute procedure public.set_updated_at();
create trigger trg_dosen_updated before update on public.dosen for each row execute procedure public.set_updated_at();
create trigger trg_mahasiswa_updated before update on public.mahasiswa for each row execute procedure public.set_updated_at();
create trigger trg_mata_kuliah_updated before update on public.mata_kuliah for each row execute procedure public.set_updated_at();
create trigger trg_jadwal_updated before update on public.jadwal_kuliah for each row execute procedure public.set_updated_at();
create trigger trg_krs_updated before update on public.krs_header for each row execute procedure public.set_updated_at();
create trigger trg_tagihan_updated before update on public.tagihan for each row execute procedure public.set_updated_at();
create trigger trg_nilai_komponen_updated before update on public.nilai_komponen for each row execute procedure public.set_updated_at();
create trigger trg_nilai_akhir_updated before update on public.nilai_akhir for each row execute procedure public.set_updated_at();
create trigger trg_pmb_updated before update on public.pmb_pendaftaran for each row execute procedure public.set_updated_at();

create trigger trg_audit_krs
after insert or update or delete on public.krs_header
for each row execute procedure public.handle_user_audit();

create trigger trg_audit_pembayaran
after insert or update or delete on public.pembayaran
for each row execute procedure public.handle_user_audit();

alter table public.users enable row level security;
alter table public.notifikasi enable row level security;
alter table public.pengumuman enable row level security;

create policy "users read own profile or admin"
on public.users
for select
using (auth.uid() = id or exists (
  select 1 from public.users u
  where u.id = auth.uid() and u.role = 'Admin'
));

create policy "notifikasi read own"
on public.notifikasi
for select
using (auth.uid() = id_user);

create policy "pengumuman read active"
on public.pengumuman
for select
using (is_active = true);

-- >>> 002_user_menu_permissions.sql

create table if not exists public.user_menu_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  menu_key text not null,
  is_allowed boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, menu_key)
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_user_menu_permissions_updated'
  ) then
    create trigger trg_user_menu_permissions_updated
    before update on public.user_menu_permissions
    for each row execute procedure public.set_updated_at();
  end if;
end
$$;

alter table public.user_menu_permissions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_menu_permissions'
      and policyname = 'user menu permissions admin read'
  ) then
    create policy "user menu permissions admin read"
    on public.user_menu_permissions
    for select
    using (exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'Admin'
    ));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_menu_permissions'
      and policyname = 'user menu permissions admin write'
  ) then
    create policy "user menu permissions admin write"
    on public.user_menu_permissions
    for all
    using (exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'Admin'
    ))
    with check (exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'Admin'
    ));
  end if;
end
$$;

-- >>> 003_role_access_multi_role.sql

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_user_roles_updated'
  ) then
    create trigger trg_user_roles_updated
    before update on public.user_roles
    for each row execute function public.set_updated_at();
  end if;
end
$$;

create table if not exists public.role_menu_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara')),
  menu_key text not null,
  is_allowed boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role, menu_key)
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_role_menu_permissions_updated'
  ) then
    create trigger trg_role_menu_permissions_updated
    before update on public.role_menu_permissions
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara'));

alter table public.role_menu_permissions drop constraint if exists role_menu_permissions_role_check;
alter table public.role_menu_permissions add constraint role_menu_permissions_role_check
  check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara'));

insert into public.user_roles (user_id, role)
select u.id, u.role
from public.users u
where u.deleted_at is null
on conflict (user_id, role) do nothing;

alter table public.user_roles enable row level security;
alter table public.role_menu_permissions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Service role manage user_roles'
  ) then
    create policy "Service role manage user_roles"
    on public.user_roles
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'role_menu_permissions' and policyname = 'Service role manage role_menu_permissions'
  ) then
    create policy "Service role manage role_menu_permissions"
    on public.role_menu_permissions
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

-- >>> 004_faculties.sql

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

-- >>> 005_program_studi_faculty.sql

alter table public.program_studi
add column if not exists fakultas_id uuid references public.fakultas(id);

create index if not exists idx_program_studi_fakultas_id
on public.program_studi(fakultas_id);

with first_faculty as (
  select id
  from public.fakultas
  order by created_at asc
  limit 1
)
update public.program_studi
set fakultas_id = (select id from first_faculty)
where fakultas_id is null
  and exists (select 1 from first_faculty);

-- >>> 006_ruangan.sql

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

-- >>> 007_gedung_refactor.sql

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

-- >>> 009_finance_extension.sql

-- 1. Create Finance Categories
create table if not exists public.kategori_keuangan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  tipe text not null check (tipe in ('Pemasukan', 'Pengeluaran')),
  deskripsi text,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- 2. Create Cash Flow (Arus Kas) table
create table if not exists public.arus_kas (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null default current_date,
  kategori_id uuid references public.kategori_keuangan(id),
  tipe text not null check (tipe in ('Masuk', 'Keluar')),
  judul text not null,
  deskripsi text,
  nominal numeric(15,2) not null,
  referensi_id uuid, -- Bisa ID pembayaran mahasiswa atau ID lainnya
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Add triggers
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_arus_kas'
  ) then
    create trigger set_updated_at_arus_kas
    before update on public.arus_kas
    for each row execute function public.set_updated_at();
  end if;
end
$$;

-- 4. Initial categories
insert into public.kategori_keuangan (nama, tipe)
select v.nama, v.tipe
from (
  values
    ('SPP / UKT Mahasiswa', 'Pemasukan'),
    ('Biaya Pendaftaran PMB', 'Pemasukan'),
    ('Gaji Dosen & Staff', 'Pengeluaran'),
    ('Operasional Kampus', 'Pengeluaran'),
    ('Pemeliharaan Gedung', 'Pengeluaran')
) as v(nama, tipe)
where not exists (
  select 1
  from public.kategori_keuangan k
  where k.nama = v.nama and k.tipe = v.tipe
);

-- >>> 010_finance_master_role.sql

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

-- >>> 011_add_year_to_master_biaya.sql

-- Add tahun_akademik_id to master_biaya
alter table public.master_biaya 
add column if not exists tahun_akademik_id uuid references public.tahun_akademik(id);

-- Update some existing data if necessary (optional)

-- >>> 012_advanced_master_biaya.sql

-- Update master_biaya to match advanced reference
alter table public.master_biaya 
add column if not exists tingkat_kelas text[], -- Array of strings (e.g., ['X', 'XI'])
add column if not exists jurusan text[],       -- Array of strings
add column if not exists jenis_kelamin text default 'Semua',
add column if not exists gelombang text,
add column if not exists jalur text,
add column if not exists terbit text default 'Sekali', -- Sekali / Rutin
add column if not exists boleh_angsur boolean default false,
add column if not exists is_mutasi boolean default false,
add column if not exists is_boarding boolean default false,
add column if not exists keterangan text,
add column if not exists status boolean default true;

-- >>> 013_add_krs_header_catatan_dosen.sql

alter table public.krs_header
add column if not exists catatan_dosen text;

-- >>> 014_phase1_admin_extensions.sql

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

-- >>> 015_pmb_enhancements.sql

alter table public.pmb_pendaftaran
  add column if not exists jalur_pendaftaran text not null default 'Reguler',
  add column if not exists jenis_pendaftaran text not null default 'Baru',
  add column if not exists tempat_lahir text,
  add column if not exists tanggal_lahir date,
  add column if not exists jenis_kelamin text,
  add column if not exists alamat text,
  add column if not exists kota_asal text,
  add column if not exists pendidikan_terakhir text,
  add column if not exists asal_sekolah text,
  add column if not exists jurusan_sekolah text,
  add column if not exists tahun_lulus integer,
  add column if not exists nama_ayah text,
  add column if not exists pekerjaan_ayah text,
  add column if not exists nama_ibu text,
  add column if not exists pekerjaan_ibu text,
  add column if not exists no_hp_orang_tua text,
  add column if not exists dokumen jsonb not null default '{}'::jsonb,
  add column if not exists status_pendaftaran text not null default 'Waiting Payment',
  add column if not exists status_pembayaran text not null default 'pending',
  add column if not exists invoice_number text unique,
  add column if not exists invoice_amount numeric(14,2) not null default 250000,
  add column if not exists invoice_due_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists registered_at timestamptz,
  add column if not exists catatan_panitia text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pmb_pendaftaran_jenis_kelamin_check'
  ) then
    alter table public.pmb_pendaftaran
      add constraint pmb_pendaftaran_jenis_kelamin_check
      check (jenis_kelamin is null or jenis_kelamin in ('Laki-laki', 'Perempuan'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pmb_pendaftaran_status_pendaftaran_check'
  ) then
    alter table public.pmb_pendaftaran
      add constraint pmb_pendaftaran_status_pendaftaran_check
      check (status_pendaftaran in ('Draft', 'Submitted', 'Waiting Payment', 'Verified', 'Accepted', 'Rejected', 'Registered'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pmb_pendaftaran_status_pembayaran_check'
  ) then
    alter table public.pmb_pendaftaran
      add constraint pmb_pendaftaran_status_pembayaran_check
      check (status_pembayaran in ('pending', 'paid', 'expired', 'failed', 'refund', 'manual_review'));
  end if;
end
$$;

update public.pmb_pendaftaran
set
  status_pendaftaran = case
    when generated_nim is not null then 'Registered'
    when status_seleksi = 'LULUS' then 'Accepted'
    when status_seleksi = 'DITOLAK' then 'Rejected'
    when status_seleksi = 'VERIFIKASI' then 'Verified'
    else status_pendaftaran
  end,
  invoice_number = coalesce(invoice_number, 'INV-' || nomor_pendaftaran),
  invoice_due_at = coalesce(invoice_due_at, created_at + interval '3 days');

create index if not exists idx_pmb_status_pendaftaran on public.pmb_pendaftaran(status_pendaftaran);
create index if not exists idx_pmb_status_pembayaran on public.pmb_pendaftaran(status_pembayaran);
create index if not exists idx_pmb_invoice_number on public.pmb_pendaftaran(invoice_number);

-- >>> 016_pmb_fee_master.sql

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

-- >>> 017_pmb_candidate_payment_portal.sql

alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Calon Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara'));

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Calon Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara'));

alter table public.role_menu_permissions drop constraint if exists role_menu_permissions_role_check;
alter table public.role_menu_permissions add constraint role_menu_permissions_role_check
  check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Calon Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara'));

alter table public.pmb_pendaftaran
  add column if not exists user_id uuid references public.users(id) on delete set null,
  add column if not exists login_email text,
  add column if not exists login_created_at timestamptz;

create index if not exists idx_pmb_pendaftaran_user_id on public.pmb_pendaftaran(user_id);
create index if not exists idx_pmb_pendaftaran_login_email on public.pmb_pendaftaran(login_email);

create table if not exists public.pmb_pembayaran (
  id uuid primary key default gen_random_uuid(),
  pmb_pendaftaran_id uuid not null references public.pmb_pendaftaran(id) on delete cascade,
  tanggal_bayar timestamptz not null default now(),
  nominal numeric(14,2) not null check (nominal > 0),
  metode text not null check (metode in ('Transfer Bank', 'Payment Gateway')),
  bank_pengirim text,
  nama_pengirim text,
  bukti_url text,
  provider text,
  provider_reference text,
  checkout_url text,
  status text not null default 'Menunggu' check (status in ('Menunggu', 'Terverifikasi', 'Ditolak', 'Kadaluarsa', 'Gagal')),
  catatan text,
  verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pmb_pembayaran_pendaftaran on public.pmb_pembayaran(pmb_pendaftaran_id);
create index if not exists idx_pmb_pembayaran_status on public.pmb_pembayaran(status);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_pmb_pembayaran_updated') then
    create trigger trg_pmb_pembayaran_updated
    before update on public.pmb_pembayaran
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.pmb_pembayaran enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pmb_pembayaran' and policyname = 'Service role manage pmb_pembayaran'
  ) then
    create policy "Service role manage pmb_pembayaran"
    on public.pmb_pembayaran
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

-- >>> 018_lms_initial.sql

-- LMS: Learning Management System Extension

-- 1. Tabel Materi Kuliah
create table if not exists public.lms_materi (
  id uuid primary key default gen_random_uuid(),
  jadwal_id uuid not null references public.jadwal_kuliah(id) on delete cascade,
  judul text not null,
  deskripsi text,
  file_url text,
  file_type text check (file_type in ('pdf', 'doc', 'video', 'link', 'other')),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabel Tugas
create table if not exists public.lms_tugas (
  id uuid primary key default gen_random_uuid(),
  jadwal_id uuid not null references public.jadwal_kuliah(id) on delete cascade,
  judul text not null,
  instruksi text,
  deadline timestamptz not null,
  poin_max numeric(5,2) not null default 100,
  file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tabel Pengumpulan Tugas (Submissions)
create table if not exists public.lms_pengumpulan (
  id uuid primary key default gen_random_uuid(),
  tugas_id uuid not null references public.lms_tugas(id) on delete cascade,
  mahasiswa_id uuid not null references public.mahasiswa(id) on delete cascade,
  konten_teks text,
  file_url text,
  nilai numeric(5,2),
  umpan_balik text,
  graded_by uuid references public.users(id),
  graded_at timestamptz,
  submitted_at timestamptz not null default now(),
  unique (tugas_id, mahasiswa_id)
);

-- 4. Tabel Forum Diskusi
create table if not exists public.lms_forum_topik (
  id uuid primary key default gen_random_uuid(),
  jadwal_id uuid not null references public.jadwal_kuliah(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  judul text not null,
  konten text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Tabel Komentar Forum
create table if not exists public.lms_forum_komentar (
  id uuid primary key default gen_random_uuid(),
  topik_id uuid not null references public.lms_forum_topik(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  konten text not null,
  created_at timestamptz not null default now()
);

-- Indexing
create index if not exists idx_lms_materi_jadwal on public.lms_materi(jadwal_id);
create index if not exists idx_lms_tugas_jadwal on public.lms_tugas(jadwal_id);
create index if not exists idx_lms_pengumpulan_tugas on public.lms_pengumpulan(tugas_id);
create index if not exists idx_lms_forum_topik_jadwal on public.lms_forum_topik(jadwal_id);

-- Updated At Triggers
create trigger trg_lms_materi_updated before update on public.lms_materi for each row execute procedure public.set_updated_at();
create trigger trg_lms_tugas_updated before update on public.lms_tugas for each row execute procedure public.set_updated_at();
create trigger trg_lms_forum_topik_updated before update on public.lms_forum_topik for each row execute procedure public.set_updated_at();

-- RLS
alter table public.lms_materi enable row level security;
alter table public.lms_tugas enable row level security;
alter table public.lms_pengumpulan enable row level security;
alter table public.lms_forum_topik enable row level security;
alter table public.lms_forum_komentar enable row level security;

-- Audit Logs Integration
create trigger trg_audit_lms_materi after insert or update or delete on public.lms_materi for each row execute procedure public.handle_user_audit();
create trigger trg_audit_lms_tugas after insert or update or delete on public.lms_tugas for each row execute procedure public.handle_user_audit();
create trigger trg_audit_lms_pengumpulan after insert or update or delete on public.lms_pengumpulan for each row execute procedure public.handle_user_audit();

-- >>> 019_payment_gateway_settings.sql

-- 019_payment_gateway_settings.sql
-- Seed default payment gateway configurations

insert into public.settings (key, label, description, category, value, is_secret, is_active)
values
  ('payment.midtrans.enabled', 'Midtrans Gateway', 'Mengaktifkan metode pembayaran via Midtrans.', 'payment', '{"value": false}'::jsonb, false, true),
  ('payment.midtrans.is_production', 'Midtrans Environment (Production)', 'Gunakan true untuk production, false untuk sandbox.', 'payment', '{"value": false}'::jsonb, false, true),
  ('payment.midtrans.server_key', 'Midtrans Server Key', 'Kunci rahasia server Midtrans.', 'payment', '{"value": ""}'::jsonb, true, true),
  ('payment.midtrans.client_key', 'Midtrans Client Key', 'Kunci publik client Midtrans.', 'payment', '{"value": ""}'::jsonb, false, true),
  
  ('payment.bjb.enabled', 'Bank BJB Gateway', 'Mengaktifkan metode pembayaran via Bank BJB.', 'payment', '{"value": false}'::jsonb, false, true),
  ('payment.bjb.api_key', 'BJB API Key', 'Kunci rahasia API Bank BJB.', 'payment', '{"value": ""}'::jsonb, true, true),
  ('payment.bjb.merchant_id', 'BJB Merchant ID', 'ID Merchant Bank BJB.', 'payment', '{"value": ""}'::jsonb, false, true)
on conflict (key) do update
set 
  label = excluded.label,
  description = excluded.description,
  category = excluded.category,
  is_secret = excluded.is_secret;

-- >>> 020_finance_payment_gateway.sql

-- 020_finance_payment_gateway.sql
-- Extension for payment gateway support in finance billing

alter table public.pembayaran
add column if not exists provider text,
add column if not exists provider_reference text,
add column if not exists checkout_url text;

-- Add new status options if needed (but we already have check constraint)
-- Let's drop the check constraint and recreate it to allow gateway statuses
alter table public.pembayaran drop constraint if exists pembayaran_status_check;
alter table public.pembayaran add constraint pembayaran_status_check check (status in ('Menunggu', 'Terverifikasi', 'Ditolak', 'Kadaluarsa', 'Gagal'));

-- Ensure `metode` can be 'Payment Gateway' (it's text, so it's fine, no constraint)

-- >>> 021_academic_foundation_extensions.sql

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


-- >>> 022_dynamic_menu_builder.sql

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  href text not null,
  icon text,
  parent_key text,
  sort_order integer not null default 0,
  roles text[] not null default '{}',
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menus_parent_key on public.menus(parent_key);
create index if not exists idx_menus_sort_order on public.menus(sort_order);
create index if not exists idx_menus_active on public.menus(is_active);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_menus_updated') then
    create trigger trg_menus_updated
    before update on public.menus
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.menus enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'menus' and policyname = 'Service role manage menus'
  ) then
    create policy "Service role manage menus"
    on public.menus
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;


commit;
