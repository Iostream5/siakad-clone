# Tahapan Phase Pengerjaan SIAKAD STAI Al-Ittihad

Dokumen ini menjadi panduan urutan kerja praktis untuk melanjutkan project SIAKAD. PRD utama tetap `docs/PRD-SIAKAD.md`; file ini adalah versi operasionalnya biar kerja tidak loncat-loncat seperti kucing lihat laser.

## Prinsip Kerja

- Kerjakan dari fondasi ke fitur, bukan dari fitur yang paling kelihatan dulu.
- Satu task kecil selesai, test, baru lanjut. Jangan minta satu prompt bikin satu kampus digital, nanti nangis pelan-pelan.
- Stack final: Next.js 16.2.4, React 19, Supabase Auth, Supabase PostgreSQL, SQL migrations, Tailwind CSS v4.
- Jangan pakai Prisma, SQLite, Better Auth, NextAuth, atau `middleware.ts` untuk route protection.
- Karena status project saat ini `DEV`, validasi Supabase live memakai MCP `siakad_dev`.
- Setiap phase wajib punya bukti: type-check, lint, build, smoke test, dan cek database jika menyentuh Supabase.

## Phase 0 - Production Safety dan Stabilitas Dasar

Status awal: sebagian sudah dikerjakan, tapi tetap wajib dijadikan gate sebelum fitur baru.

Tujuan phase ini adalah memastikan project aman untuk dikembangkan dan tidak membawa masalah fatal seperti secret bocor, route guard rusak, atau database sensitif terbuka.

Pekerjaan utama:

- Pastikan secret env tidak masuk git.
- Pastikan `.env.local` dipakai untuk konfigurasi lokal dan tidak di-commit.
- Rotasi Supabase key jika secret pernah masuk repo, chat, log, atau file tracked.
- Gunakan `src/proxy.ts` untuk route protection Next.js 16.
- Pastikan demo auth tidak aktif di production.
- Pastikan semua Server Action mutasi punya authorization server-side.
- Pastikan webhook payment gateway validasi signature.
- Aktifkan RLS untuk tabel sensitif.
- Tambahkan dan jalankan gate teknis: `npm run type-check`, `npm run lint`, `npm run build`.

Acceptance criteria:

- `npm run type-check` sukses.
- `npm run lint` selesai tanpa error.
- `npm run build` sukses.
- `/login` bisa dibuka.
- `/dashboard` tanpa session redirect ke `/login`.
- RLS aktif untuk minimal: `users`, `user_roles`, `menus`, `settings`, `audit_logs`, `pmb_pendaftaran`, `pmb_pembayaran`, `tagihan`, `pembayaran`.

## Phase 1 - Fondasi Admin dan Access Control

Tujuan phase ini adalah membuat admin bisa mengelola sistem inti: user, role, permission, menu, master data, dan audit.

Prioritas P0:

- Login email/username via Supabase Auth.
- Session management stabil.
- Route protection via `src/proxy.ts`.
- Dynamic RBAC: roles, permissions, role access.
- Dynamic menu/sidebar dari database.
- Guard server-side di semua mutasi admin.

Prioritas P1:

- CRUD users dengan search, filter, pagination.
- CRUD role dan permission.
- CRUD menu builder nested.
- CRUD master data utama:
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
- Audit log untuk login dan CRUD penting.

Prioritas P2:

- Import/export Excel untuk master data.
- Soft delete, restore, dan hard delete yang konsisten.
- Dashboard admin dengan statistik real dari database.
- Dokumentasi admin flow.

Acceptance criteria:

- Admin bisa login via Supabase Auth.
- Admin bisa melihat sidebar/menu sesuai akses database.
- CRUD user, role, permission, menu, dan master data berjalan.
- Audit log tercatat.
- `npm run type-check`, `npm run lint`, dan `npm run build` sukses.

## Phase 2 - PMB dan Keuangan

Tujuan phase ini adalah membuat alur calon mahasiswa dan pembayaran berjalan end-to-end.

PMB:

- Pendaftaran publik calon mahasiswa.
- Verifikasi data pendaftar.
- Upload dan validasi dokumen PMB.
- Status seleksi.
- Generate NIM untuk pendaftar lulus.
- Sinkronisasi pendaftar menjadi user dan mahasiswa.

Keuangan:

- Master biaya.
- Generate tagihan bulk.
- Pembayaran manual.
- Verifikasi pembayaran.
- Riwayat pembayaran.
- Sinkronisasi status mahasiswa berdasarkan pembayaran.

Payment gateway:

- Midtrans untuk PMB dan tagihan mahasiswa.
- Xendit jika benar-benar dibutuhkan.
- Webhook dengan signature validation.
- Idempotency agar webhook berulang tidak membuat transaksi ganda.
- Log webhook dan error handling yang bisa diaudit.

Acceptance criteria:

- Calon mahasiswa bisa daftar dari halaman publik.
- Admin bisa verifikasi pendaftaran dan pembayaran.
- Pendaftar lulus bisa dibuatkan NIM.
- Tagihan bisa dibuat dan dibayar.
- Webhook valid tidak membuat transaksi dobel.
- Data pembayaran masuk ke laporan keuangan.

## Phase 3 - Akademik Inti dan LMS

Tujuan phase ini adalah membuat proses akademik mahasiswa dan dosen berjalan rapi.

Akademik:

- Jadwal kuliah.
- KRS mahasiswa.
- Approval KRS oleh dosen/prodi.
- Input nilai oleh dosen.
- KHS dan transkrip.
- Validasi tahun akademik aktif dan periode KRS.

LMS:

- Kelas virtual berbasis jadwal.
- Materi kuliah.
- Tugas.
- Submission mahasiswa.
- Penilaian tugas.
- Forum diskusi.
- Sinkronisasi nilai LMS ke akademik jika diperlukan.

Acceptance criteria:

- Mahasiswa bisa mengisi KRS sesuai periode.
- Dosen/prodi bisa approve KRS.
- Dosen bisa input nilai.
- Mahasiswa bisa melihat KHS.
- LMS berjalan untuk dosen dan mahasiswa.
- Akses data sesuai role, bukan asal semua bisa lihat semua. Ya masa kampus jadi warung bebas ambil.

## Phase 4 - Laporan, Pimpinan, dan Monitoring

Tujuan phase ini adalah membuat sistem berguna untuk pengambilan keputusan dan kontrol operasional.

Pekerjaan utama:

- Dashboard pimpinan.
- Laporan akademik.
- Laporan PMB.
- Laporan keuangan.
- Export PDF/Excel yang konsisten.
- Audit aktivitas lengkap.
- Monitoring error aplikasi.
- Monitoring webhook/payment.
- Dokumentasi smoke test per role.

Acceptance criteria:

- Pimpinan bisa melihat ringkasan operasional.
- Admin bisa export laporan penting.
- Aktivitas penting tercatat di audit log.
- Error operasional punya log yang cukup untuk debug.

## Phase 5 - Notifikasi, EDOM, dan Fitur Lanjutan

Tujuan phase ini adalah menambah fitur pendukung setelah flow utama stabil.

Pekerjaan utama:

- Template notifikasi.
- Queue notifikasi.
- In-app notification.
- Push notification via FCM jika diperlukan.
- EDOM atau evaluasi dosen oleh mahasiswa.
- Reminder pembayaran, PMB, KRS, dan tugas.
- Hardening UX untuk mobile.

Acceptance criteria:

- Notifikasi muncul untuk event penting.
- Template notifikasi bisa dikelola admin.
- EDOM berjalan end-to-end.
- Tidak ada fitur lanjutan yang merusak flow utama.

## Phase 6 - Production Readiness

Tujuan phase ini adalah memastikan aplikasi siap deploy dan dirawat.

Pekerjaan utama:

- Audit env production.
- Matikan demo auth di production.
- Pastikan service role hanya server-side.
- Review RLS dan policy.
- Review semua Server Action mutasi.
- Setup CI/CD: type-check, lint, build.
- Setup Vercel deployment.
- Setup Supabase production project.
- Backup dan restore strategy.
- Dokumentasi deployment.
- Smoke test semua role.

Acceptance criteria:

- Production build sukses.
- CI hijau.
- Tidak ada secret di repo.
- Login production memakai Supabase Auth.
- RLS aktif untuk tabel sensitif.
- Smoke test role utama lolos:
  - Admin
  - Prodi
  - Dosen
  - Mahasiswa
  - Calon Mahasiswa
  - Keuangan
  - Pimpinan

## Urutan Task yang Disarankan Setelah Phase 0

Mulai dari task kecil berikut:

1. Rapikan warning lint paling dekat dengan area admin.
2. Audit dan finalisasi CRUD users.
3. Audit dan finalisasi role/permission.
4. Audit dan finalisasi menu builder.
5. Audit master data satu per satu.
6. Baru masuk PMB dan keuangan.

Jangan mulai dari payment gateway production sebelum master data, user, role, dan tagihan rapi. Itu seperti pasang gerbang tol sebelum jalannya ada. Keren, tapi ya buat apa.

## Checklist Tiap Selesai Task

- Kode mengikuti pola existing `src/app`, `src/actions`, `src/lib/admin`, `src/modules`.
- Mutasi data punya authorization server-side.
- Input form divalidasi.
- Error user-facing jelas.
- Audit log dibuat untuk aksi penting.
- Tidak ada secret baru di git.
- `npm run type-check` sukses.
- `npm run lint` sukses atau warning dicatat.
- `npm run build` sukses untuk perubahan besar.
- Smoke test manual dilakukan untuk route yang diubah.

## Catatan Status Saat Ini

Berdasarkan stabilisasi terakhir:

- `npm run type-check` sudah sukses.
- `npm run lint` sudah sukses dengan warning.
- `npm run build` sudah sukses.
- `src/proxy.ts` sudah dipakai dan terdeteksi build.
- `/dashboard` tanpa session redirect ke `/login`.
- RLS tabel sensitif di Supabase dev sudah aktif.
- Masih ada warning lint cukup banyak, terutama `any`, unused imports, dan aturan React Compiler. Ini perlu dibersihkan bertahap, bukan sekali sapu pakai sapu ijuk raksasa.
