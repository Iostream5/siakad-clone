# SIAKAD STAI

SIAKAD universitas berbasis Next.js App Router + TypeScript + Supabase. Project ini sudah disusun langsung di folder ini agar bisa dijalankan lokal sebagai baseline production-ready dengan dashboard per role, auth fallback demo, dan schema SQL lengkap.

## Yang Sudah Dibuat

- Landing page dan login multi-role berbasis username atau email.
- Middleware proteksi route `/dashboard`.
- Dashboard per role untuk `Admin`, `Prodi`, `Dosen`, `Mahasiswa`, `Staff`, `Keuangan`, dan `Pimpinan`.
- Modul baseline untuk master data, PMB, registrasi semester, KRS, nilai, keuangan, dan laporan.
- Integrasi utilitas Supabase client/server yang siap dihubungkan ke env.
- Migration SQL lengkap di `supabase/migrations/` dan seed di `supabase/seed.sql`.
- Konfigurasi `shadcn/ui` (`components.json`) dan komponen UI dasar.

## Struktur Project

```text
src/
  app/             App Router pages dan dashboard
  components/      Layout dan UI components
  modules/         Modul bisnis per domain
  lib/             Constants, auth helpers, validators, utils
  hooks/           Disiapkan untuk custom hooks
  types/           Tipe domain
  actions/         Server actions
  supabase/        Browser/server Supabase client
supabase/
  migrations/      Schema migration Supabase CLI
  seed.sql         Seed data awal
```

## Setup Lokal

1. Install dependency:

```bash
npm install
```

2. Buat env:

```bash
copy .env.example .env.local
```

3. Isi `SUPABASE_SERVICE_ROLE_KEY` jika ingin koneksi Supabase penuh.

4. Jalankan aplikasi:

```bash
npm run dev
```

5. Buka `http://localhost:3000`.

## Akun Demo Lokal

- `admin / admin123`
- `prodi / prodi123`
- `dosen / dosen123`
- `mahasiswa / mhs12345`
- `staff / staff123`
- `keuangan / keu12345`
- `pimpinan / pimpinan123`

Auth demo ini disimpan lewat cookie lokal agar aplikasi tetap bisa dijalankan tanpa koneksi Supabase. Jika env Supabase terisi dan user ada di `auth.users`, server action login akan mencoba `signInWithPassword` ke Supabase juga.

## Setup Database Supabase

1. Install dan login Supabase CLI.
2. Link project Supabase bila belum:

```bash
supabase link
```

3. Jalankan migration dari folder `supabase/migrations/`:

```bash
npm run db:migrate
```

4. Untuk reset database lokal Supabase sekaligus seed dari `supabase/seed.sql`:

```bash
npm run db:reset
```

5. Buat user auth dan isi metadata `role` serta `full_name` bila ingin memakai trigger profile otomatis.
6. Simpan file upload pembayaran pada bucket storage pilihan Anda, lalu sambungkan field `bukti_url`.

Contoh variabel Supabase bila tetap memakai hosted Supabase:

- `NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_dari_supabase_dashboard`
- `SUPABASE_SERVICE_ROLE_KEY=isi_dari_supabase_dashboard`

## Docker App

1. Salin contoh env Docker:

```bash
copy docker.env.example docker.env
```

2. Isi env Supabase di `docker.env`.

3. Build image aplikasi:

```bash
docker compose --env-file docker.env build app
```

4. Jalankan aplikasi container:

```bash
docker compose --env-file docker.env up -d
```

Catatan: container hanya menjalankan Next.js. Database, Auth, dan Storage tetap melalui Supabase.

## Fitur Jalan vs Stub

Fitur baseline yang sudah jalan di UI:

- Login, logout, proteksi route, redirect per role.
- Dashboard operasional dan navigasi per role.
- Ringkasan PMB, KRS, registrasi, nilai, keuangan, dan laporan.

Masih berupa stub baseline dan perlu pengembangan lanjutan:

- CRUD penuh ke database untuk semua modul.
- Upload file ke Supabase Storage.
- Export Excel/PDF real memakai `xlsx` dan `jspdf`.
- Workflow approval end-to-end ke database.
- Import Excel dan notifikasi realtime.

## Catatan Teknis

- Project memakai Tailwind CSS v4.
- `bootstrap-app/` adalah folder sementara hasil bootstrap awal; tidak dipakai oleh aplikasi utama di root.
