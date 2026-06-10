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
