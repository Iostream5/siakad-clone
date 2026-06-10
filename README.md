# SIAKAD STAI

SIAKAD universitas berbasis Next.js App Router + TypeScript + Supabase. Project ini sudah disusun langsung di folder ini agar bisa dijalankan lokal sebagai baseline production-ready dengan dashboard per role, auth fallback demo, dan schema SQL lengkap.

## Yang Sudah Dibuat

- Landing page dan login multi-role berbasis username atau email.
- Middleware proteksi route `/dashboard`.
- Dashboard per role untuk `Admin`, `Prodi`, `Dosen`, `Mahasiswa`, `Staff`, `Keuangan`, dan `Pimpinan`.
- Modul baseline untuk master data, PMB, registrasi semester, KRS, nilai, keuangan, dan laporan.
- Integrasi utilitas Supabase client/server yang siap dihubungkan ke env.
- Migration SQL lengkap dan `seed.sql`.
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
migrations/
  001_init.sql     Schema utama
seed.sql           Seed data awal
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

1. Jalankan `migrations/001_init.sql` di SQL Editor Supabase.
2. Jalankan `seed.sql`.
3. Buat user auth dan isi metadata `role` serta `full_name` bila ingin memakai trigger profile otomatis.
4. Simpan file upload pembayaran pada bucket storage pilihan Anda, lalu sambungkan field `bukti_url`.

Contoh variabel Supabase bila tetap memakai hosted Supabase:

- `NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_dari_supabase_dashboard`
- `SUPABASE_SERVICE_ROLE_KEY=isi_dari_supabase_dashboard`

## PostgreSQL Docker

Project ini bisa disiapkan untuk PostgreSQL lokal/Docker. Supabase yang dipakai saat ini juga berbasis PostgreSQL, tetapi aplikasi masih memakai Supabase API/Auth untuk sebagian besar akses data. Artinya, container PostgreSQL lokal sudah bisa dipakai untuk migrasi SQL dan pengembangan data layer, sementara perpindahan penuh dari Supabase API ke query PostgreSQL langsung perlu dilakukan bertahap.

1. Salin contoh env Docker:

```bash
copy docker.env.example docker.env
```

2. Jalankan PostgreSQL lokal:

```bash
docker compose --env-file docker.env up -d postgres
```

3. Jalankan migrasi SQL ke PostgreSQL lokal:

```bash
cmd /c npm run db:migrate
```

Pastikan `.env.local` atau environment terminal berisi:

```env
DATABASE_URL=postgresql://siakad:siakad_password@localhost:5432/siakad
DIRECT_URL=postgresql://siakad:siakad_password@localhost:5432/siakad
DATABASE_SSL=false
```

4. Build image aplikasi:

```bash
docker compose --env-file docker.env --profile app build app
```

5. Jalankan aplikasi container:

```bash
docker compose --env-file docker.env --profile app up -d
```

Catatan: untuk deployment self-contained tanpa Supabase, modul data perlu dimigrasi dari `src/supabase/*` ke query PostgreSQL langsung, misalnya lewat Drizzle atau `postgres`. File Docker ini menyiapkan infrastrukturnya dulu.

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
