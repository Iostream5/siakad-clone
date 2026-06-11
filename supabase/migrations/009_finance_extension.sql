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
