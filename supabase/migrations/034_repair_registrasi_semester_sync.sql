-- 034_repair_registrasi_semester_sync.sql
-- Repair schema drift and backfill semester registration from paid finance bills.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'registrasi_semester'
      and column_name = 'id_mahasiswa'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'registrasi_semester'
      and column_name = 'mahasiswa_id'
  ) then
    alter table public.registrasi_semester rename column id_mahasiswa to mahasiswa_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'registrasi_semester'
      and column_name = 'id_tahun_akademik'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'registrasi_semester'
      and column_name = 'tahun_akademik_id'
  ) then
    alter table public.registrasi_semester rename column id_tahun_akademik to tahun_akademik_id;
  end if;
end $$;

alter table public.registrasi_semester
  add column if not exists tagihan_id uuid references public.tagihan(id),
  add column if not exists catatan text,
  add column if not exists verified_by uuid references public.users(id),
  add column if not exists verified_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.registrasi_semester
  drop constraint if exists registrasi_semester_status_check;

update public.registrasi_semester
set status = case status
  when 'Belum' then 'BELUM'
  when 'Proses' then 'MENUNGGU'
  when 'Selesai' then 'LUNAS'
  else status
end;

alter table public.registrasi_semester
  add constraint registrasi_semester_status_check
  check (status in ('BELUM', 'MENUNGGU', 'LUNAS', 'DISPENSASI'));

alter table public.registrasi_semester
  alter column status set default 'BELUM';

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join unnest(con.conkey) with ordinality as cols(attnum, ord) on true
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = cols.attnum
    where nsp.nspname = 'public'
      and rel.relname = 'registrasi_semester'
      and con.contype = 'u'
    group by con.oid
    having array_agg(att.attname::text order by cols.ord) = array['mahasiswa_id', 'tahun_akademik_id']
  ) then
    alter table public.registrasi_semester
      add constraint registrasi_semester_mahasiswa_tahun_akademik_key
      unique (mahasiswa_id, tahun_akademik_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_registrasi_semester_updated'
  ) and to_regprocedure('public.set_updated_at()') is not null then
    create trigger trg_registrasi_semester_updated
    before update on public.registrasi_semester
    for each row execute function public.set_updated_at();
  end if;
end $$;

with paid_bills as (
  select distinct on (t.mahasiswa_id, t.tahun_akademik_id)
    t.mahasiswa_id,
    t.tahun_akademik_id,
    t.id as tagihan_id
  from public.tagihan t
  where t.deleted_at is null
    and t.status = 'Lunas'
    and t.mahasiswa_id is not null
    and t.tahun_akademik_id is not null
  order by t.mahasiswa_id, t.tahun_akademik_id, t.created_at desc
)
insert into public.registrasi_semester (
  mahasiswa_id,
  tahun_akademik_id,
  status,
  tagihan_id,
  verified_at,
  updated_at
)
select
  mahasiswa_id,
  tahun_akademik_id,
  'LUNAS',
  tagihan_id,
  now(),
  now()
from paid_bills
on conflict (mahasiswa_id, tahun_akademik_id) do update
set
  status = 'LUNAS',
  tagihan_id = coalesce(public.registrasi_semester.tagihan_id, excluded.tagihan_id),
  verified_at = coalesce(public.registrasi_semester.verified_at, excluded.verified_at),
  updated_at = now();
