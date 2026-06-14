-- 027_registrasi_semester.sql
-- Alter registrasi_semester to match Phase 2 PRD requirements

-- 1. Rename existing columns
alter table public.registrasi_semester rename column id_mahasiswa to mahasiswa_id;
alter table public.registrasi_semester rename column id_tahun_akademik to tahun_akademik_id;

-- 2. Drop the existing status constraint
alter table public.registrasi_semester drop constraint registrasi_semester_status_check;

-- 3. Add new columns
alter table public.registrasi_semester
add column if not exists tagihan_id uuid references public.tagihan(id),
add column if not exists catatan text,
add column if not exists verified_by uuid references public.users(id),
add column if not exists verified_at timestamptz,
add column if not exists updated_at timestamptz not null default now();

-- 4. Update existing status values to match the new constraint (if any data exists, although it's unlikely)
update public.registrasi_semester set status = 'BELUM' where status = 'Belum';
update public.registrasi_semester set status = 'MENUNGGU' where status = 'Proses';
update public.registrasi_semester set status = 'LUNAS' where status = 'Selesai';

-- 5. Add new status constraint
alter table public.registrasi_semester
add constraint registrasi_semester_status_check
check (status in ('BELUM', 'MENUNGGU', 'LUNAS', 'DISPENSASI'));

-- 6. Set default status
alter table public.registrasi_semester alter column status set default 'BELUM';

-- 7. Add trigger for updated_at
create trigger trg_registrasi_semester_updated
before update on public.registrasi_semester
for each row execute procedure public.set_updated_at();
