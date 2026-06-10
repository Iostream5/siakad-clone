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
