# Ringkasan Project

## Identitas Singkat

- Nama aplikasi: SIAKAD STAI Al-Ittihad
- Domain bisnis: Sistem informasi akademik perguruan tinggi
- Status pengembangan: DEV
- Snapshot tanggal dokumentasi: 10 Juni 2026
- Target MCP Supabase saat perlu validasi live: `siakad_dev`

## Gambaran Umum

SIAKAD STAI Al-Ittihad adalah aplikasi Sistem Informasi Akademik untuk mengelola proses utama kampus dalam satu platform: penerimaan mahasiswa baru, data akademik, KRS, nilai, LMS, keuangan, laporan, pengumuman, pengaturan sistem, role, permission, dan menu.

Masalah utama yang diselesaikan aplikasi ini adalah pemecahan data dan workflow akademik yang biasanya tersebar di banyak alat. Sistem ini menyatukan data mahasiswa, dosen, program studi, mata kuliah, pembayaran, PMB, dan akses pengguna agar operasional kampus lebih mudah dipantau, diaudit, dan dikembangkan.

Pengguna sistem meliputi:

- Admin, sebagai pengelola utama master data, PMB, konfigurasi, akses, dan dashboard operasional.
- Prodi, sebagai pengawas proses akademik program studi.
- Dosen, sebagai pengguna untuk aktivitas akademik, kelas, LMS, KRS, dan nilai.
- Mahasiswa, sebagai pengguna untuk KRS, nilai, LMS, registrasi, dan tagihan.
- Calon Mahasiswa, sebagai pengguna alur PMB dan pembayaran pendaftaran.
- Staff, sebagai operator data dan administrasi.
- Keuangan dan Bendahara, sebagai pengelola tagihan, pembayaran, dan laporan finansial.
- Pimpinan, sebagai pengguna ringkasan eksekutif dan laporan.

Nilai utama aplikasi adalah menyediakan fondasi SIAKAD yang terpusat, multi-role, auditable, dan siap dikembangkan bertahap tanpa mengulang fondasi dari nol setiap modul baru ditambahkan.

## Tujuan Sistem

Tujuan bisnis sistem ini adalah mendukung operasional akademik dan administrasi kampus dari fase calon mahasiswa sampai mahasiswa aktif, termasuk pengelolaan data akademik, pembayaran, pembelajaran, dan pelaporan.

Tujuan operasionalnya:

- Menyediakan dashboard dan navigasi sesuai role.
- Menyederhanakan pengelolaan master data kampus.
- Mendukung workflow PMB, registrasi, KRS, penilaian, dan keuangan.
- Menyimpan jejak audit untuk aktivitas penting.
- Mengurangi hardcoded akses lewat role, permission, dan menu builder.
- Menyiapkan struktur database dan modul agar pengembangan lanjutan tidak berantakan. Ya, ini bagian pentingnya.

Tujuan teknisnya:

- Menggunakan Next.js App Router sebagai fullstack application.
- Menggunakan Supabase PostgreSQL sebagai sumber data utama.
- Memisahkan route, Server Actions, service/query helper, module UI, dan client Supabase.
- Menjaga struktur project cukup modular untuk developer baru dan AI coding agent.
- Menjaga arah pengembangan tetap sesuai PRD aktif, bukan prompt lama yang sudah sebagian tidak dipakai.

## Teknologi yang Digunakan

Frontend:

- Next.js App Router `16.2.4`
- React `19.2.4`
- TypeScript
- Tailwind CSS v4
- shadcn-style reusable components
- Radix UI primitives
- Framer Motion
- lucide-react
- Recharts

Backend:

- Next.js fullstack
- Server Actions di `src/actions`
- API Routes untuk endpoint tertentu, termasuk webhook payment gateway
- Service/query helper di `src/lib/admin`

Database dan data layer:

- Supabase PostgreSQL sebagai database utama
- SQL migration files di `supabase/migrations/`
- Supabase client/server/admin utilities di `src/supabase`
- Tidak memakai ORM; akses data aplikasi diarahkan lewat Supabase client

Authentication dan authorization:

- Supabase Auth sebagai target integrasi auth
- Session cookie internal `siakad_session`
- Demo fallback lokal untuk development
- Role-based access control melalui role user, user roles, permission, dan menu access

Storage:

- Supabase Storage menjadi target untuk upload file production.
- Beberapa alur upload dan dokumen masih perlu pengembangan lanjutan agar sepenuhnya end-to-end.

Deployment dan tooling:

- Vercel sebagai target deployment aplikasi.
- Docker Compose tersedia untuk PostgreSQL lokal dan opsi container app.
- ESLint, TypeScript, tsx, dotenv, dan Supabase CLI tersedia di tooling project.

Library penting:

- Zod untuk validasi.
- React Hook Form untuk form.
- TanStack Table untuk tabel.
- xlsx untuk import/export Excel.
- jsPDF dan jspdf-autotable untuk PDF.
- Zustand untuk UI state ringan.
- date-fns untuk utilitas tanggal.

## Arsitektur Saat Ini

Arsitektur saat ini memakai pendekatan Next.js App Router dengan module-based organization. Folder `src/app` berisi route dan thin page wrapper. Logika mutasi berada di Server Actions. Query dan operasi data yang lebih detail ditempatkan di helper `src/lib/admin`. UI fitur besar ditempatkan di `src/modules`.

Pola besarnya:

- `src/app` menangani routing, layout, loading state, API route, dan entry page.
- `src/actions` menjadi boundary mutasi dari UI ke backend.
- `src/lib/admin` berisi operasi data per domain seperti PMB, finance, KRS, LMS, master data, dan access control.
- `src/modules` berisi komponen UI besar per domain.
- `src/components` berisi layout dan komponen UI reusable.
- `src/supabase` berisi client browser, server, admin, migration runner, seed, dan reset.
- `migrations` menjadi sumber perubahan schema database.

Struktur utama project:

```text
src/
  app/
    api/
    dashboard/
    login/
    pmb/
    layout.tsx
    page.tsx
  actions/
    auth.ts
    access-control.ts
    pmb.ts
    finance.ts
    krs.ts
    lms.ts
    users.ts
    ...
  components/
    layout/
    ui/
  db/
    load-env.ts
    postgres-options.ts
  hooks/
  lib/
    admin/
    auth.ts
    constants.ts
    validators.ts
    utils.ts
  modules/
    dashboard/
    finance/
    grades/
    krs/
    lms/
    master-data/
    payment-gateway/
    pmb/
    reports/
    settings/
    shared/
  supabase/
    admin.ts
    client.ts
    server.ts
    migrate.ts
    seed.ts
    reset.ts
  types/
    domain.ts
supabase/migrations/
  001_init.sql
  ...
  022_dynamic_menu_builder.sql
docs/
  PRD-SIAKAD.md
  Ringkasan Project.md
prompt aplikasi/
  prompt-full.md
  prompt-phase1-optimized.md
  prompt-ke1.md
  ...
  prompt-ke15.md
```

## Modul dan Fitur Utama

Landing page dan auth:

- Landing page kampus berada di root aplikasi.
- Login berada di `/login`.
- Login mendukung akun demo lokal dan integrasi Supabase ketika environment tersedia.
- Middleware melindungi route dashboard.

Dashboard:

- Dashboard utama berada di `/dashboard`.
- Konten dan menu dipengaruhi role aktif.
- Layout dashboard memakai sidebar, topbar, command search, dan komponen UI internal.

Master data:

- Kampus
- Fakultas
- Program Studi
- Ruangan
- Kelas
- Tahun Akademik
- Kurikulum
- Mata Kuliah
- Dosen
- Mahasiswa
- Pengguna

PMB:

- Halaman publik PMB tersedia di `/pmb` dan `/pmb/daftar`.
- Dashboard PMB tersedia di `/dashboard/pmb`.
- Modul PMB mencakup pendaftar, seleksi, registrasi/NIM, pembayaran, dan tarif PMB.

Akademik:

- KRS tersedia di `/dashboard/krs`.
- Nilai tersedia di `/dashboard/nilai`.
- Registrasi tersedia di `/dashboard/registrasi`.
- LMS tersedia di `/dashboard/akademik/lms` beserta detail kelas, forum, tugas, submission, dan grading.

Keuangan:

- Dashboard keuangan tersedia di `/dashboard/keuangan`.
- Modul mencakup setup biaya, tagihan, pembayaran, pembayaran PMB, ringkasan, dan laporan.
- API payment gateway Midtrans tersedia untuk finance dan PMB.

Pengaturan:

- Akun dan akses.
- Menu builder.
- System settings.
- Payment gateway.
- Template notifikasi.
- Audit login.
- Audit aktivitas.
- Developer tools.

Laporan dan pengumuman:

- Laporan tersedia di `/dashboard/laporan`.
- Pengumuman tersedia di `/dashboard/pengumuman`.

## Role dan Hak Akses

Role yang dikenal oleh aplikasi saat ini:

- Admin
- Prodi
- Dosen
- Mahasiswa
- Calon Mahasiswa
- Staff
- Keuangan
- Pimpinan
- Bendahara

Role digunakan untuk:

- Menentukan akses dashboard dan menu.
- Menentukan fitur yang terlihat di sidebar.
- Menentukan konteks operasi di Server Actions dan halaman dashboard.
- Mendukung multi-role user melalui tabel `user_roles`.

Permission dan menu access dikembangkan untuk mengurangi hardcoded akses. Namun sebagian navigasi masih memiliki daftar role di `src/lib/constants.ts`, sehingga dynamic menu builder adalah area yang perlu terus dirapikan agar benar-benar database-driven.

## Alur Data Utama

Alur login:

1. Pengguna masuk melalui `/login`.
2. Server Action auth memvalidasi credential.
3. Jika Supabase tersedia, sistem mencoba memakai data Supabase.
4. Untuk development, akun demo lokal tetap tersedia.
5. Session user disimpan sebagai cookie internal.
6. Dashboard membaca user aktif dan role yang resolved.

Alur dashboard dan akses:

1. User membuka route `/dashboard`.
2. Middleware dan helper auth memeriksa session.
3. Access context mengambil role dan menu yang boleh diakses.
4. UI dashboard menampilkan modul sesuai role dan permission.

Alur master data:

1. UI manager di `src/modules/master-data` menampilkan tabel dan form.
2. Aksi create/update/delete dikirim ke `src/actions`.
3. Server Action memanggil helper domain di `src/lib/admin`.
4. Data disimpan ke Supabase PostgreSQL.
5. Aktivitas penting diarahkan untuk dicatat ke audit log.

Alur PMB:

1. Calon mahasiswa membuka halaman PMB publik.
2. Data pendaftaran masuk ke tabel PMB.
3. Dashboard PMB mengelola status pendaftar, pembayaran, seleksi, dan registrasi.
4. Integrasi pembayaran PMB diarahkan melalui modul payment gateway.

Alur keuangan:

1. Admin/Keuangan mengatur master biaya dan tagihan.
2. Mahasiswa atau calon mahasiswa melakukan pembayaran.
3. Webhook payment gateway memperbarui status pembayaran.
4. Dashboard keuangan membaca tagihan, transaksi, dan ringkasan.

Alur LMS dan akademik:

1. Jadwal/kegiatan akademik menjadi basis kelas LMS.
2. Dosen mengelola materi, tugas, forum, dan penilaian.
3. Mahasiswa mengakses kelas, mengirim tugas, dan melihat hasil.
4. Nilai dan KRS dihubungkan dengan modul akademik.

## Database dan Migration

Database utama project adalah Supabase PostgreSQL. Schema dikelola melalui file SQL di folder `supabase/migrations/`, bukan Prisma migration.

Migration yang tersedia mencakup:

- Schema awal user, akademik, PMB, tagihan, pembayaran, nilai, audit, dan notifikasi.
- Penambahan user menu permissions dan role access.
- Fakultas, program studi, ruangan, gedung, kelas, kurikulum, dan master akademik.
- Ekstensi finance, master biaya, dan pembayaran.
- PMB enhancement dan portal pembayaran kandidat.
- LMS initial schema.
- Payment gateway settings dan integrasi finance.
- Academic foundation extension.
- Dynamic menu builder.

Konvensi penting:

- Tabel memakai `snake_case`.
- ID utama umumnya `uuid`.
- Banyak entity memiliki `created_at`, `updated_at`, dan `deleted_at`.
- Soft delete digunakan pada entity bisnis tertentu.
- Trigger `set_updated_at` digunakan untuk menjaga timestamp update.
- Trigger profile Supabase Auth tersedia untuk membuat profile user di `public.users`.

Kondisi aktif project dibaca sebagai Supabase PostgreSQL + Supabase client + SQL migrations di `supabase/migrations/`.

## Autentikasi dan Otorisasi

Auth aktif menggabungkan beberapa pendekatan:

- Supabase Auth untuk integrasi user production.
- Cookie session internal untuk state aplikasi.
- HMAC signature pada session cookie bila secret tersedia.
- Fallback JSON session hanya untuk non-production ketika secret tidak tersedia.
- Demo users lokal untuk pengembangan cepat.

Otorisasi menggunakan:

- Role utama pada `users.role`.
- Role tambahan pada `user_roles`.
- Access context di `src/lib/admin/access-control`.
- Guard helper seperti `requireUser` dan `requireAuthorizedUser`.
- Menu key dan allowed menu keys untuk membatasi akses halaman tertentu.

Catatan penting: project ini bukan Better Auth aktif, meskipun prompt awal menyebut Better Auth. Implementasi aktual memakai Supabase Auth dan session internal. Jangan salah baca, nanti debug-nya muter-muter tidak lucu.

## Status Implementasi Saat Ini

Berdasarkan README, PRD, TODO progress, migration, dan struktur repo, project saat ini berada pada kondisi baseline SIAKAD yang sudah memiliki banyak fondasi dan beberapa modul operasional.

Yang sudah tersedia:

- Landing page.
- Login dan logout.
- Proteksi route dashboard.
- Dashboard multi-role.
- Master data akademik dasar.
- PMB dashboard dan pendaftaran publik.
- KRS.
- Nilai.
- LMS.
- Keuangan dan payment gateway settings.
- Pengaturan akun akses, menu builder, template notifikasi, audit login, dan audit aktivitas.
- SQL migrations sampai dynamic menu builder.
- Docker/PostgreSQL support sebagai opsi lokal.

Yang masih perlu dilihat sebagai pengembangan lanjutan:

- CRUD penuh dan konsisten untuk semua modul sampai level production.
- Upload file end-to-end ke Supabase Storage.
- Import/export yang merata di semua master data.
- Workflow approval lengkap lintas role.
- FCM push notification real.
- Payment gateway production hardening untuk Midtrans/Xendit.
- Dynamic sidebar yang sepenuhnya database-driven.
- Validasi build, lint, type-check, dan smoke test sebelum klaim production-ready.

## Gap dari Prompt Awal

Folder `prompt aplikasi/` berisi prompt desain dan implementasi bertahap untuk SIAKAD Enterprise. Prompt tersebut adalah sumber visi, tetapi tidak semuanya menggambarkan kondisi repo saat ini.

Perbedaan penting:

| Area | Prompt awal | Kondisi repo aktual |
| --- | --- | --- |
| Next.js | Next.js 15 | Next.js 16.2.4 |
| Database development | SQLite | Supabase PostgreSQL |
| ORM utama | Prisma | Tidak memakai ORM; akses data lewat Supabase client dan SQL migrations |
| Auth | Better Auth / NextAuth | Supabase Auth + session cookie internal + demo fallback |
| Struktur ideal | `application/domain/infrastructure/modules/shared` | `app/actions/lib/modules/components/supabase` |
| Role naming | `SUPER_ADMIN`, `ADMIN_AKADEMIK`, dll | `Admin`, `Prodi`, `Dosen`, `Mahasiswa`, dll |
| Multi-tenant | Full multi-tenant sejak awal | Fokus saat ini lebih ke role, permission, menu, dan modul akademik/keuangan |
| Payment | Midtrans + Xendit | Midtrans route/settings terlihat; Xendit masih target lanjutan |
| Notification | FCM | Template notifikasi tersedia; FCM real masih lanjutan |

Kesimpulan: prompt lama berguna untuk memahami arah produk, tetapi implementasi harus mengikuti PRD aktif dan repo aktual. Jangan memaksa balik ke Prisma/SQLite kecuali ada keputusan arsitektur baru yang eksplisit.

## Cara Menjalankan Project

Setup lokal dasar:

```bash
npm install
```

Buat env lokal dari contoh:

```bash
copy .env.example .env.local
```

Jalankan aplikasi:

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

Script penting:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:migrate
npm run db:seed
npm run db:reset
npm run db:studio
```

Akun demo lokal dari README:

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Prodi | `prodi` | `prodi123` |
| Dosen | `dosen` | `dosen123` |
| Mahasiswa | `mahasiswa` | `mhs12345` |
| Staff | `staff` | `staff123` |
| Keuangan | `keuangan` | `keu12345` |
| Pimpinan | `pimpinan` | `pimpinan123` |

Untuk setup database Supabase:

1. Jalankan migration SQL dari folder `supabase/migrations/`.
2. Jalankan seed sesuai kebutuhan.
3. Pastikan Auth user dan profile public sinkron.
4. Jangan commit secret Supabase atau service role key.

## Catatan untuk Developer dan AI Agent

Hal yang wajib diperhatikan:

- Baca `AGENTS.md` sebelum mengubah project.
- Jika perlu validasi Supabase live, cek `STATUS_PROJECT` di env.
- Karena status saat ini `DEV`, gunakan MCP `siakad_dev`.
- Jangan memakai MCP production untuk project ini kecuali status env berubah ke production.
- Jangan bocorkan isi secret env ke dokumen, issue, PR, atau chat.
- Next.js yang dipakai adalah 16.2.4; jika mengubah API Next.js, baca docs lokal di `node_modules/next/dist/docs/` sesuai instruksi project.
- Jangan menganggap prompt lama sebagai kebenaran teknis final.
- PRD aktif berada di `docs/PRD-SIAKAD.md`.
- Source of truth implementasi adalah repo aktual, migration SQL, dan PRD aktif.
- Untuk perubahan UI, ikuti pola existing di `src/modules` dan komponen `src/components/ui`.
- Untuk perubahan data, ikuti pola `src/actions` -> `src/lib/admin` -> Supabase.
- Untuk schema database, tambah migration SQL baru; jangan diam-diam membuat schema Prisma.
- Untuk audit readiness, gunakan bukti dari lint/type/build/runtime, bukan feeling.

## Risiko dan Pekerjaan Lanjutan

Risiko utama:

- Sebagian fitur sudah terlihat di UI tetapi bisa saja belum lengkap end-to-end.
- Prompt lama dan repo aktual punya perbedaan stack besar, sehingga agent baru mudah salah arah.
- Dynamic menu builder belum tentu sepenuhnya menggantikan sidebar hardcoded.
- Payment gateway dan storage perlu hardening sebelum production.
- Role dan permission perlu konsistensi lintas UI, Server Actions, API routes, dan database.
- Build/lint/type-check perlu dijadikan gate sebelum klaim siap deploy.

Pekerjaan lanjutan yang disarankan:

- Audit semua route dashboard terhadap role dan permission.
- Pastikan semua mutasi penting mencatat audit log.
- Lengkapi import/export/template Excel secara konsisten pada master data yang ditargetkan.
- Lengkapi upload dokumen PMB dan bukti pembayaran ke Supabase Storage.
- Hardening webhook payment gateway: signature validation, idempotency, logging, dan retry.
- Rapikan dynamic menu agar sumber sidebar utama berasal dari database.
- Tambahkan smoke test manual per role utama.
- Dokumentasikan env wajib dan perbedaan dev/production tanpa menyertakan secret.

## Audit Sumber Dokumen

Dokumen ini disusun dari audit terhadap:

- Seluruh file di `prompt aplikasi/`, termasuk `prompt-full.md`, `prompt-phase1-optimized.md`, dan `prompt-ke1.md` sampai `prompt-ke15.md`.
- `docs/PRD-SIAKAD.md` sebagai PRD aktif.
- `README.md` untuk setup, fitur baseline, dan akun demo.
- `TODO-PROGRESS.md` untuk status fase pengembangan.
- `package.json` untuk stack dan script aktual.
- `supabase/migrations/*.sql` untuk kondisi schema database.
- Struktur aktual `src/app`, `src/actions`, `src/lib`, `src/modules`, `src/supabase`, dan `src/db`.

Dokumen ini sengaja menulis kondisi aktual project, bukan sekadar menyalin prompt. Prompt itu niat awal; repo adalah kenyataan. Keduanya penting, tapi yang jalan di mesin ya repo.
