# Detail Phase 6 - Production Readiness

Dokumen ini merinci Phase 6 untuk project SIAKAD STAI Al-Ittihad. Fokusnya adalah membuat aplikasi siap production: aman, bisa deploy, bisa dipantau, bisa dibackup, dan bisa dites ulang. Ini phase "jangan bikin malu di depan user beneran".

PRD utama tetap `docs/PRD-SIAKAD.md`. Dokumen ini dipakai sebagai checklist final sebelum production.

## Tujuan Phase 6

Phase 6 bertujuan memastikan:

- Build production stabil.
- CI/CD berjalan.
- Environment production aman.
- Supabase production siap.
- RLS dan policy aman.
- Auth production memakai Supabase Auth.
- Demo auth mati di production.
- Payment gateway production siap jika dipakai.
- Backup dan restore jelas.
- Monitoring dan logging tersedia.
- Smoke test semua role lolos.

Output akhir Phase 6 adalah aplikasi yang layak deploy, bukan aplikasi yang "jalan di laptop saya" lalu production ikut jadi korban.

## Scope Phase 6

Masuk scope:

- Audit env.
- Audit secret.
- Audit auth production.
- Audit RLS dan policy.
- Audit Server Actions.
- Audit payment gateway production.
- CI/CD.
- Vercel deployment.
- Supabase production setup.
- Backup dan restore.
- Monitoring.
- Smoke test role.
- Dokumentasi deploy dan rollback.

Tidak masuk scope:

- Rebuild arsitektur besar.
- Ganti stack.
- Migrasi ke Prisma/NestJS.
- Rewrite UI.
- Fitur baru besar.
- Multi-tenant penuh jika belum diputuskan.

## Area File Utama

- Env example: `.env.example`
- Next config: `next.config.ts`
- Proxy: `src/proxy.ts`
- Auth: `src/lib/auth.ts`, `src/actions/auth.ts`
- Supabase clients: `src/supabase/client.ts`, `src/supabase/server.ts`, `src/supabase/admin.ts`
- Migrations: `supabase/migrations/`
- Package scripts: `package.json`
- Docker files: `Dockerfile`, `docker-compose.yml`, `docker.env.example`
- Payment routes: `src/app/api/payment-gateway/midtrans/...`
- Docs: `docs/`

## Phase 6.1 - Freeze Scope dan Baseline

Tujuan:

- Production readiness tidak dicampur fitur baru.

Task:

- Bekukan fitur besar.
- Catat commit terakhir yang menjadi release candidate.
- Pastikan worktree bersih atau perubahan jelas.
- Pastikan semua migration sudah berurutan.
- Pastikan semua docs phase sudah sesuai kondisi final.
- Buat daftar known issues.

Acceptance criteria:

- Release candidate jelas.
- Tidak ada perubahan liar yang tidak diketahui.
- Known issues terdokumentasi.

## Phase 6.2 - Audit Environment dan Secret

Tujuan:

- Tidak ada secret bocor dan env production lengkap.

Task:

- Audit `.env.example`.
- Pastikan `.env.local` tidak tracked.
- Pastikan file custom seperti `env` tidak tracked.
- Pastikan `.gitignore` menolak file env secret.
- Pastikan semua env production tersedia:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
  - `SESSION_SECRET`
  - Midtrans env/settings jika production payment aktif
  - FCM env jika push aktif
- Pastikan service role key tidak pernah dipakai di client.
- Rotasi secret yang pernah muncul di git/chat/log.

Acceptance criteria:

- Tidak ada secret di file tracked.
- Env production lengkap.
- `SESSION_SECRET` tersedia.
- Secret yang pernah bocor sudah dirotasi.

Command:

```bash
git ls-files | findstr /i env
git log --all -- .env.local
```

## Phase 6.3 - Auth Production Hardening

Tujuan:

- Production hanya memakai auth yang aman.

Task:

- Pastikan demo auth mati di `NODE_ENV=production`.
- Pastikan Supabase Auth aktif.
- Pastikan user production ada di `auth.users` dan `public.users`.
- Pastikan role user benar.
- Pastikan session cookie signed.
- Pastikan cookie secure di production.
- Pastikan logout membersihkan session.
- Pastikan user nonaktif/deleted tidak bisa login.

Acceptance criteria:

- Admin production bisa login via Supabase Auth.
- Demo credential tidak bisa login di production.
- Cookie secure aktif.
- User nonaktif ditolak.

Test:

- Login admin production/staging.
- Coba demo login production.
- Nonaktifkan user test, coba login.

## Phase 6.4 - RLS dan Policy Review

Tujuan:

- Database production tidak terbuka sembarangan.

Task:

- Audit RLS untuk tabel sensitif:
  - `users`
  - `user_roles`
  - `menus`
  - `settings`
  - `audit_logs`
  - `pmb_pendaftaran`
  - `pmb_pembayaran`
  - `tagihan`
  - `pembayaran`
  - `mahasiswa`
  - `dosen`
  - `krs_header`
  - `krs_detail`
  - `nilai_akhir`
  - `lms_*`
  - `notification_*`
  - `edom_*`
- Pastikan policy service role tersedia untuk backend.
- Pastikan client/browser tidak bisa membaca data sensitif lintas user.
- Pastikan tabel publik yang memang boleh public dibatasi kolom/aksi.
- Jalankan Supabase advisors security.

Acceptance criteria:

- RLS aktif untuk tabel sensitif.
- Tidak ada tabel sensitif terbuka ke anon tanpa alasan.
- Advisors security tidak punya blocker kritis.

MCP:

- Gunakan MCP sesuai `STATUS_PROJECT`.
- Jika `DEV`, pakai `siakad_dev`.
- Jika production, pakai `siakad`.

## Phase 6.5 - Server Action dan API Security Review

Tujuan:

- Mutasi data tidak bisa ditembak bebas.

Task:

- Audit semua file `src/actions/*.ts`.
- Pastikan action mutasi punya `requireUser` atau `requireAuthorizedUser`.
- Pastikan action publik hanya untuk flow publik yang memang aman.
- Pastikan input divalidasi Zod atau validasi setara.
- Audit route handler API.
- Pastikan webhook payment validasi signature.
- Pastikan webhook idempotent.
- Pastikan error response tidak membocorkan secret.

Acceptance criteria:

- Tidak ada mutasi dashboard tanpa authorization.
- Webhook invalid ditolak.
- Error aman untuk user.

Command:

```bash
rg -n "export async function" src/actions
rg -n "insert\\(|update\\(|delete\\(|upsert\\(|\\.rpc\\(" src/actions src/lib/admin
```

## Phase 6.6 - Migration dan Supabase Production Setup

Tujuan:

- Database production sama dengan schema yang diharapkan.

Task:

- Pastikan migration SQL berurutan.
- Pastikan migration dev sudah diuji.
- Backup database production sebelum migration.
- Apply migration ke production dengan kontrol.
- Jalankan seed minimal production jika diperlukan:
  - roles
  - permissions
  - menus
  - settings dasar
  - admin user jika prosedur aman tersedia
- Pastikan tidak seed data dummy ke production.

Acceptance criteria:

- Migration production sukses.
- Tabel utama tersedia.
- Data master dasar tersedia.
- Tidak ada dummy data yang nyasar.

## Phase 6.7 - Payment Gateway Production Readiness

Tujuan:

- Payment gateway aman untuk uang beneran. Uang beneran, bukan saldo monopoli.

Task:

- Pastikan Midtrans production key benar.
- Pastikan mode production aktif hanya di production.
- Pastikan callback/webhook URL production benar.
- Pastikan signature validation aktif.
- Pastikan idempotency aktif.
- Pastikan order id unik.
- Pastikan webhook log tersedia.
- Pastikan manual reconciliation bisa dilakukan.
- Test sandbox sebelum production switch.

Acceptance criteria:

- Checkout production/sandbox sesuai environment.
- Webhook valid memproses pembayaran.
- Webhook invalid ditolak.
- Webhook berulang tidak membuat transaksi ganda.
- Keuangan bisa menelusuri transaksi.

## Phase 6.8 - CI/CD

Tujuan:

- Merge/deploy tidak bergantung ingatan manusia.

Task:

- Setup GitHub Actions atau pipeline setara.
- Job minimal:
  - install dependencies
  - type-check
  - lint
  - build
- Cache npm jika stabil.
- Pastikan env build tersedia untuk CI.
- Pastikan CI gagal jika build gagal.
- Tambahkan branch protection jika memakai GitHub.

Acceptance criteria:

- Pull request menjalankan CI.
- CI merah jika type/lint/build gagal.
- Main branch terlindungi dari merge rusak.

Command wajib CI:

```bash
npm ci
npm run type-check
npm run lint
npm run build
```

## Phase 6.9 - Deployment Vercel

Tujuan:

- Aplikasi bisa deploy stabil ke Vercel.

Task:

- Hubungkan repo ke Vercel.
- Set env production di Vercel.
- Pastikan build command benar.
- Pastikan output Next sesuai target Vercel.
- Pastikan domain production benar.
- Pastikan redirect/callback Supabase Auth memakai domain production.
- Pastikan `NEXT_PUBLIC_APP_URL` production benar.
- Test deployment preview dulu.

Acceptance criteria:

- Preview deployment sukses.
- Production deployment sukses.
- Login production bekerja.
- Dashboard production terbuka.

## Phase 6.10 - Backup dan Restore

Tujuan:

- Data bisa diselamatkan kalau ada masalah.

Task:

- Tentukan strategi backup Supabase.
- Dokumentasikan cara restore.
- Pastikan backup sebelum migration production.
- Simpan jadwal backup.
- Test restore di environment non-production jika memungkinkan.
- Dokumentasikan siapa yang boleh restore.

Acceptance criteria:

- Backup strategy tertulis.
- Restore procedure tertulis.
- Backup sebelum release tersedia.

## Phase 6.11 - Monitoring dan Logging

Tujuan:

- Error production bisa dilihat, bukan hilang seperti chat yang belum dibalas.

Task:

- Aktifkan Vercel logs/analytics jika tersedia.
- Gunakan Supabase logs/advisors.
- Pastikan route webhook punya log.
- Pastikan auth error bisa dilacak.
- Pastikan audit log aplikasi berjalan.
- Tentukan prosedur cek error harian/mingguan.

Acceptance criteria:

- Error aplikasi bisa dilihat.
- Query/database issue bisa dilihat.
- Webhook failure bisa ditelusuri.
- Audit log tersedia.

## Phase 6.12 - Performance dan UX Final Check

Tujuan:

- Production tidak lambat atau pecah tampilan.

Task:

- Cek halaman utama:
  - landing
  - login
  - dashboard
  - master data
  - PMB
  - keuangan
  - KRS
  - nilai
  - LMS
  - laporan
- Cek mobile layout role utama.
- Cek query lambat.
- Cek tabel besar punya pagination.
- Cek loading dan empty state.
- Cek error state.

Acceptance criteria:

- Halaman utama bisa dibuka.
- Tidak ada layout mobile yang rusak parah.
- Tabel besar tidak mengambil semua data tanpa batas.
- Error state tidak bocor stack.

## Phase 6.13 - Smoke Test Semua Role

Tujuan:

- Role utama benar-benar bisa pakai sistem.

Role minimal:

- Admin
- Prodi
- Dosen
- Mahasiswa
- Calon Mahasiswa
- Keuangan
- Pimpinan

Checklist admin:

- Login.
- Buka dashboard.
- Kelola user.
- Kelola role/access.
- Kelola menu.
- Kelola master data.
- Lihat audit log.

Checklist prodi:

- Login.
- Buka dashboard.
- Lihat data akademik sesuai scope.
- Approve KRS jika role diberi akses.
- Lihat laporan prodi.

Checklist dosen:

- Login.
- Lihat kelas.
- Kelola LMS.
- Input nilai.
- Approve KRS jika jadi dosen wali.

Checklist mahasiswa:

- Login.
- Isi KRS.
- Lihat KHS/nilai.
- Akses LMS.
- Submit tugas.
- Lihat tagihan.

Checklist calon mahasiswa:

- Daftar PMB.
- Lihat status PMB.
- Lakukan pembayaran jika flow tersedia.

Checklist keuangan:

- Login.
- Lihat tagihan.
- Verifikasi pembayaran.
- Lihat laporan keuangan.

Checklist pimpinan:

- Login.
- Lihat dashboard pimpinan.
- Lihat laporan ringkas.

Acceptance criteria:

- Semua role bisa login.
- Route utama tiap role bisa dibuka.
- Aksi utama tiap role berjalan.
- Akses terlarang ditolak.

## Phase 6.14 - Release dan Rollback Plan

Tujuan:

- Release production punya rencana mundur kalau ada masalah.

Task:

- Catat versi release.
- Catat migration yang diaplikasikan.
- Catat env production.
- Backup database sebelum release.
- Deploy preview.
- Deploy production.
- Smoke test production.
- Siapkan rollback:
  - rollback deployment Vercel
  - restore database jika migration merusak data
  - disable payment gateway jika webhook bermasalah

Acceptance criteria:

- Release note tersedia.
- Rollback plan tersedia.
- Smoke test production selesai.

## Gate Wajib Phase 6

Command wajib:

```bash
npm ci
npm run type-check
npm run lint
npm run build
```

Supabase wajib:

- Security advisors dicek.
- Performance advisors dicek.
- RLS tabel sensitif aktif.
- Backup tersedia.

Production smoke:

- Landing page.
- Login.
- Dashboard admin.
- Dashboard role lain.
- PMB.
- Keuangan.
- Akademik/LMS.
- Laporan.
- Webhook sandbox/production sesuai mode.

## Definisi Selesai Phase 6

Phase 6 dianggap selesai jika:

- CI/CD hijau.
- Build production sukses.
- Env production aman.
- Secret tidak ada di repo.
- Demo auth mati di production.
- Supabase Auth production berjalan.
- RLS dan policy production aman.
- Migration production sukses.
- Payment gateway siap atau dinonaktifkan dengan jelas.
- Backup dan restore terdokumentasi.
- Monitoring/logging tersedia.
- Smoke test semua role lolos.
- Release dan rollback plan tersedia.

Kalau belum ada backup, jangan bilang production-ready. Itu namanya production-nekat.
