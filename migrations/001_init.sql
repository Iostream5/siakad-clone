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
