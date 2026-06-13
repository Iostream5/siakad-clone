# Phase 5 — Production Readiness

> **Prioritas:** 🔴 Wajib sebelum go-live  
> **Estimasi:** 2-3 hari  
> **Prasyarat:** Phase 0 s/d Phase 3 selesai (Phase 4 opsional)

---

## Tujuan

Memastikan aplikasi siap digunakan di lingkungan production kampus nyata. Phase ini bukan tentang fitur baru — melainkan tentang **stabilitas, keamanan, performa, dan operasional**.

---

## Checklist Perbaikan

### 1. Gate Teknis Wajib Hijau

> **Status saat ini:** ⚠️ Pernah lolos, perlu re-verifikasi setelah semua perubahan

- [ ] **Jalankan dan pastikan hijau:**
  ```bash
  npm ci                  # install bersih
  npm run type-check      # npx tsc --noEmit — 0 error
  npm run lint            # 0 error (warning dicatat)
  npm run build           # next build sukses
  ```

- [ ] **Fix semua error** yang muncul dari command di atas
- [ ] **Catat semua warning** lint — prioritaskan yang high severity

---

### 2. Konfigurasi Production Environment

- [ ] **Vercel Environment Variables**
  ```
  NEXT_PUBLIC_SUPABASE_URL       = [production project URL]
  NEXT_PUBLIC_SUPABASE_ANON_KEY  = [production anon key]
  SUPABASE_SERVICE_ROLE_KEY      = [production service role key]
  NEXT_PUBLIC_APP_URL            = https://siakad.kampus.ac.id
  SESSION_SECRET                 = [random 64-char string]
  MIDTRANS_SERVER_KEY            = [production server key]
  MIDTRANS_CLIENT_KEY            = [production client key]
  MIDTRANS_IS_PRODUCTION         = true
  ```

- [ ] **Pastikan `NEXT_PUBLIC_APP_URL` benar**
  - Supabase Auth callback menggunakan URL ini
  - Jika salah → login/reset password gagal

- [ ] **Pastikan `SESSION_SECRET` tersedia di production**
  - Tanpa ini, cookie tidak HMAC signed → security risk
  - Generate: `openssl rand -hex 32`

---

### 3. Database Production

- [ ] **Migrasi database production**
  - Apply semua migration dari `supabase/migrations/` ke project Supabase production
  - Urutan: 001 s/d 026 (atau file terakhir saat deploy)
  - **Backup sebelum apply migration**

- [ ] **Verifikasi RLS aktif di production**
  Tabel yang WAJIB RLS aktif:
  ```
  users, user_roles, menus, settings, audit_logs,
  pmb_pendaftaran, pmb_pembayaran,
  tagihan, pembayaran,
  mahasiswa, dosen,
  krs_header, krs_detail,
  nilai_akhir, nilai_komponen,
  lms_materi, lms_tugas, lms_pengumpulan,
  lms_forum_topik, lms_forum_komentar,
  notification_queue, notification_devices,
  edom_responses, edom_response_answers
  ```

- [ ] **Verifikasi policy `service_role`** ada di semua tabel sensitif
  - Tanpa policy ini, backend tidak bisa operasikan data

- [ ] **Seed data minimum production**
  - 1 kampus
  - Fakultas dan program studi aktif
  - 1 tahun akademik aktif
  - 1 user admin dengan role Admin
  - Menu sidebar default
  - Role menu permissions default

---

### 4. Security Final Audit

- [ ] **Demo auth dimatikan**
  ```typescript
  // src/lib/auth.ts — line 184
  if (process.env.NODE_ENV === "production") return null;
  ```
  Verifikasi: coba login dengan `admin/admin123` di production → harus gagal

- [ ] **Service role key tidak di-expose**
  - Grep: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` → harus 0 hasil
  - Cek: `src/supabase/admin.ts` menggunakan `SUPABASE_SERVICE_ROLE_KEY` (tanpa `NEXT_PUBLIC_`)

- [ ] **Tidak ada `.env.local` di git**
  ```bash
  git log --all -- .env.local    # harus kosong
  git log --all -- .env          # harus kosong
  ```
  Jika ditemukan: **rotasi semua secret segera**

- [ ] **Cookie secure di production**
  ```typescript
  // src/actions/auth.ts
  secure: process.env.NODE_ENV === "production"  // harus true di prod
  ```

- [ ] **Webhook URL production sudah diset**
  - Midtrans dashboard production:
    - PMB: `https://siakad.kampus.ac.id/api/payment-gateway/midtrans/pmb`
    - Finance: `https://siakad.kampus.ac.id/api/payment-gateway/midtrans/finance`

---

### 5. Backup Strategy

- [ ] **Backup manual sebelum deploy pertama**
  - Via Supabase dashboard: Settings > Database > Backups
  - Label: `backup_YYYYMMDD_pre_production_deploy`

- [ ] **Verifikasi auto-backup Supabase**
  - Tier Pro: daily auto-backup, 7 hari retention
  - Tier Free: tidak ada auto-backup — harus manual

- [ ] **Dokumentasikan prosedur restore**
  ```text
  1. Buka Supabase dashboard
  2. Settings > Database > Backups
  3. Pilih backup yang diinginkan
  4. Klik Restore
  5. Tunggu proses selesai
  6. Verifikasi data di aplikasi
  ```

---

### 6. Smoke Test Per Role

> **Wajib dilakukan di preview deployment sebelum production**

#### Admin
- [ ] Login berhasil
- [ ] Dashboard tampil dengan data
- [ ] Sidebar dari database, bukan hardcode
- [ ] CRUD user berfungsi
- [ ] CRUD role/permission berfungsi
- [ ] Menu builder berfungsi
- [ ] CRUD semua master data (kampus, fakultas, prodi, dll)
- [ ] Audit log tercatat
- [ ] Import/export Excel berfungsi
- [ ] Settings bisa diupdate

#### Prodi
- [ ] Login berhasil
- [ ] Dashboard tampil
- [ ] Lihat data akademik prodi
- [ ] Approve/reject KRS
- [ ] Lihat laporan

#### Dosen
- [ ] Login berhasil
- [ ] Lihat kelas yang diajar
- [ ] Input nilai
- [ ] Akses LMS: materi, tugas, forum
- [ ] Grade submission

#### Mahasiswa
- [ ] Login berhasil
- [ ] Mengisi KRS
- [ ] Melihat nilai/KHS
- [ ] Mengakses LMS: materi, tugas, submission, forum
- [ ] Melihat tagihan
- [ ] (Jika ada) Daftar ulang semester

#### Calon Mahasiswa
- [ ] Daftar PMB dari halaman publik
- [ ] Melihat status PMB
- [ ] Melakukan pembayaran (jika tersedia)

#### Keuangan
- [ ] Login berhasil
- [ ] Melihat tagihan
- [ ] Verifikasi pembayaran
- [ ] Generate tagihan massal
- [ ] Melihat laporan keuangan

#### Pimpinan
- [ ] Login berhasil
- [ ] Dashboard pimpinan tampil
- [ ] Melihat laporan ringkas

#### Staff
- [ ] Login berhasil
- [ ] Akses master data sesuai permission
- [ ] Mengelola pengumuman

---

### 7. Monitoring & Logging

- [ ] **Vercel Analytics** — aktifkan di Vercel dashboard
- [ ] **Supabase Dashboard** — pantau:
  - Database usage
  - API requests
  - Auth events
  - Storage usage
- [ ] **Error logging** — pastikan semua `console.error` muncul di Vercel logs
- [ ] **Webhook monitoring** — cek `webhook_events` table untuk status dan error

---

### 8. Rollback Plan

- [ ] **Dokumentasikan prosedur rollback:**
  ```text
  Jika ada masalah di production:
  1. Vercel: Deployments > pilih deployment sebelumnya > Promote to Production
  2. Database: restore backup terakhir jika migration merusak data
  3. Payment gateway: disable di Midtrans dashboard jika webhook bermasalah
  4. Catat incident di dokumen dan langkah yang diambil
  ```

---

### 9. Performance Check

- [ ] **Cek bundle size**
  ```bash
  npm run build
  # Lihat output: First Load JS harus < 200KB per route
  ```

- [ ] **Cek halaman lambat**
  - Dashboard: harus tampil dalam < 3 detik
  - Master data list: harus tampil dalam < 2 detik
  - Halaman publik PMB: harus tampil dalam < 1 detik

- [ ] **Optimasi jika perlu:**
  - Lazy load komponen besar
  - Pagination server-side (sudah ada, verifikasi)
  - Caching headers untuk static assets

---

## Kriteria Go-Live

```text
SEMUA item berikut harus ✅:

[  ] npm ci + type-check + lint + build = hijau
[  ] Env production lengkap dan benar di Vercel
[  ] Database production sudah dimigrate
[  ] RLS aktif untuk semua tabel sensitif
[  ] Demo auth dimatikan di production
[  ] Secrets tidak pernah di git
[  ] Cookie secure = true di production
[  ] Webhook URL production sudah diset di payment gateway
[  ] Backup database sebelum deploy
[  ] Smoke test semua role = PASS
[  ] Rollback plan terdokumentasi
[  ] Monitoring aktif (Vercel + Supabase dashboard)
```

---

## Setelah Go-Live

- [ ] Monitor Vercel logs 24 jam pertama
- [ ] Monitor Supabase dashboard: API errors, slow queries
- [ ] Siapkan on-call jika ada masalah
- [ ] Kumpulkan feedback dari user awal
- [ ] Jadwalkan review 1 minggu setelah go-live
