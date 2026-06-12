---
description: SOP checklist final sebelum SIAKAD dinyatakan siap production. Mencakup audit env, RLS, secret, smoke test semua role, backup, dan rollback plan. Workflow ini adalah pintu terakhir sebelum sistem digunakan oleh user nyata.
---

# SOP Production Checklist — SIAKAD STAI Al-Ittihad

## Tujuan

Ini adalah checklist terakhir sebelum sistem dipakai oleh user nyata — mahasiswa, dosen, keuangan, dan pimpinan kampus. Satu item yang terlewat di sini bisa menjadi masalah besar di production. Tidak ada yang boleh di-skip dengan alasan "pasti sudah aman".

> Rujuk `docs/tahapan/DETAIL-PHASE-6-PRODUCTION-READINESS.md` untuk konteks lengkap.

---

## FASE 1: AUDIT ENVIRONMENT DAN SECRET

### Langkah-langkah

STEP 1: Audit semua environment variable production.

Buka Vercel dashboard → Settings → Environment Variables dan verifikasi:

```
WAJIB ADA DAN TERISI:
□ NEXT_PUBLIC_SUPABASE_URL          → URL Supabase production project
□ NEXT_PUBLIC_SUPABASE_ANON_KEY     → Anon key production
□ SUPABASE_SERVICE_ROLE_KEY         → Service role key production
□ NEXT_PUBLIC_APP_URL               → https://domain-production.com
□ SESSION_SECRET                    → String random min 32 karakter

PAYMENT (jika aktif di production):
□ MIDTRANS_SERVER_KEY               → Server key production Midtrans
□ MIDTRANS_CLIENT_KEY               → Client key production Midtrans
□ MIDTRANS_IS_PRODUCTION            → "true"

PAYMENT (jika masih sandbox):
□ MIDTRANS_IS_PRODUCTION            → "false"
□ Webhook URL di Midtrans dashboard → URL production yang benar

FCM (jika aktif):
□ FIREBASE_SERVICE_ACCOUNT          → JSON service account
```

STEP 2: Verifikasi tidak ada secret bocor.

```bash
# Tidak boleh ada hasil dari perintah ini
git log --all --full-history -- .env.local
git log --all --full-history -- .env.production
git ls-files | grep -iE "\.env$|\.env\.local"

# Verifikasi NEXT_PUBLIC_ tidak mengandung secret
# Cari di seluruh codebase
grep -rn "NEXT_PUBLIC_" src/ --include="*.ts" --include="*.tsx" | grep -i "secret\|service_role\|server_key"
# Tidak boleh ada hasil
```

STEP 3: Rotasi secret yang pernah bocor.

Jika ditemukan secret pernah masuk ke git history atau file tracked:
```
1. Buka Supabase dashboard → Settings → API → Regenerate service role key
2. Update nilai baru di Vercel environment variables
3. Redeploy agar nilai baru aktif
4. Pastikan kode tidak ada yang menyimpan secret lama
```

### Checklist

- [ ] Semua env production terisi dan benar
- [ ] `NEXT_PUBLIC_APP_URL` mengarah ke domain production (bukan localhost)
- [ ] `SESSION_SECRET` terisi dengan nilai yang kuat
- [ ] Tidak ada secret di git history atau tracked files
- [ ] Secret yang pernah bocor sudah dirotasi

---

## FASE 2: AUDIT AUTH DAN SESSION

### Langkah-langkah

STEP 1: Verifikasi demo auth tidak aktif di production.

```typescript
// Cari di src/actions/auth.ts atau src/lib/auth.ts
// Pastikan demo auth hanya aktif di development

// ✅ BENAR
if (process.env.NODE_ENV === "production") {
  // Demo auth tidak boleh jalan di sini
  return { error: "Demo auth tidak tersedia" };
}

// ✅ Atau menggunakan env flag
const isDemoEnabled = process.env.ENABLE_DEMO_AUTH === "true"
  && process.env.NODE_ENV !== "production";
```

```bash
# Verifikasi di codebase
grep -rn "demo\|DEMO\|demoUser\|admin123\|mhs12345" src/actions/auth.ts src/lib/auth.ts
# Pastikan semua dibungkus guard NODE_ENV !== production
```

STEP 2: Verifikasi user production ada di Supabase Auth.

Di Supabase production dashboard → Authentication → Users:
```
□ Admin production sudah terdaftar di auth.users
□ Data user admin ada di public.users dengan role yang benar
□ User test/dummy tidak ada di production
```

STEP 3: Test login production.

```
□ Login dengan akun admin production berhasil
□ Dashboard admin tampil setelah login
□ Logout membersihkan session
□ Akses /dashboard tanpa login redirect ke /login
□ Login dengan kredensial salah ditolak dengan pesan yang tepat
□ User nonaktif tidak bisa login
```

### Checklist

- [ ] Demo auth mati di `NODE_ENV=production`
- [ ] Kredensial demo tidak bisa dipakai di production
- [ ] Admin production bisa login via Supabase Auth
- [ ] Session dan redirect berjalan benar
- [ ] User nonaktif ditolak saat login

---

## FASE 3: AUDIT DATABASE PRODUCTION

### Langkah-langkah

STEP 1: Verifikasi semua migration sudah diapply di Supabase production.

```sql
-- Cek tabel-tabel utama sudah ada
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Bandingkan dengan daftar tabel dari migration terakhir
-- Semua tabel dari 001 sampai migration terbaru harus ada
```

Tabel minimum yang harus ada di production:

```
□ users, user_roles
□ roles, permissions, role_permissions
□ menus, settings, audit_logs
□ kampus, fakultas, program_studi (departments)
□ ruangan, kelas, tahun_akademik, kurikulum
□ notification_templates, notification_queue
□ pmb_pendaftaran, pmb_pembayaran, pmb_biaya
□ tagihan, pembayaran, arus_kas
□ mahasiswa, dosen, mata_kuliah, jadwal_kuliah
□ krs_header, krs_detail, nilai_akhir
□ lms_materi, lms_tugas, lms_pengumpulan
□ edom_questions, edom_responses
```

STEP 2: Verifikasi RLS aktif di semua tabel sensitif.

```sql
-- Cek tabel tanpa RLS
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- Tabel yang boleh tanpa RLS: hanya tabel publik seperti program_studi untuk PMB page
-- Semua tabel sensitif (lihat daftar di 08-sop-security-review.md) harus RLS = true
```

STEP 3: Verifikasi data seed minimum tersedia.

```sql
-- Data yang harus ada di production sebelum go-live
SELECT COUNT(*) FROM public.roles;           -- minimal default roles
SELECT COUNT(*) FROM public.permissions;     -- minimal default permissions
SELECT COUNT(*) FROM public.menus;           -- minimal sidebar admin
SELECT COUNT(*) FROM public.settings;        -- minimal campus.name, dsb
SELECT COUNT(*) FROM public.notification_templates; -- minimal template dasar
```

### Checklist

- [ ] Semua migration dari 001 sampai terbaru sudah diapply ke production
- [ ] Semua tabel minimum sudah ada
- [ ] RLS aktif untuk semua tabel sensitif
- [ ] Data seed minimum tersedia (roles, permissions, menus, settings)
- [ ] Tidak ada data dummy atau test di production

---

## FASE 4: BACKUP SEBELUM GO-LIVE

### Langkah-langkah

STEP 1: Buat backup database production sebelum go-live pertama.

```
Opsi 1 — Via Supabase Dashboard:
1. Buka Supabase production project
2. Settings → Database → Backups
3. Klik "Download backup" atau aktifkan scheduled backups
4. Simpan backup file di tempat yang aman (bukan di repo)

Opsi 2 — Via SQL export:
Jalankan script siakad_data_dump_generator.sql
(lihat clone-dumps/siakad_data_dump_generator.sql)
Simpan output sebagai backup manual.
```

STEP 2: Dokumentasikan backup yang ada.

```markdown
## Backup Log

| Tanggal | Tipe | Lokasi | Keterangan |
|---------|------|--------|------------|
| [tanggal] | Pre-launch backup | Supabase automated | Sebelum go-live pertama |
| [tanggal] | Pre-migration backup | Manual SQL dump | Sebelum migration 023 |
```

STEP 3: Verifikasi restore procedure.

Test restore di environment non-production:
```
□ Backup file bisa dibuka/diakses
□ Prosedur restore terdokumentasi (lihat clone-dumps/README.md)
□ Restore order dipahami: schema dulu → patch → data
□ Siapa yang berwenang melakukan restore sudah ditentukan
```

### Checklist

- [ ] Backup production tersedia sebelum go-live
- [ ] Backup file disimpan di lokasi yang aman dan bukan di repo
- [ ] Restore procedure terdokumentasi dan dipahami
- [ ] Jadwal backup rutin sudah diaktifkan di Supabase

---

## FASE 5: SMOKE TEST SEMUA ROLE

### Langkah-langkah

STEP 1: Jalankan smoke test untuk setiap role utama di production.

Gunakan akun test production yang sudah disiapkan (bukan demo/dummy):

```
ROLE: Admin
□ Login berhasil
□ Dashboard tampil dengan data production
□ CRUD master data berjalan (test satu modul)
□ Menu builder bisa diakses
□ Audit log tampil

ROLE: Keuangan
□ Login berhasil
□ Daftar tagihan tampil
□ Verifikasi pembayaran bisa dilakukan

ROLE: Prodi
□ Login berhasil
□ Data akademik prodi tampil
□ KRS (jika periode aktif) bisa diakses

ROLE: Dosen
□ Login berhasil
□ Daftar kelas tampil
□ LMS kelas bisa diakses

ROLE: Mahasiswa
□ Login berhasil
□ Dashboard mahasiswa tampil
□ Tagihan tampil (jika ada)
□ LMS tampil (jika terdaftar di kelas)

ROLE: Calon Mahasiswa (jika PMB aktif)
□ Halaman /pmb bisa diakses tanpa login
□ Form pendaftaran bisa dibuka
```

STEP 2: Verifikasi data isolation di production.

```
□ Mahasiswa A tidak bisa akses data Mahasiswa B
□ Dosen tidak bisa akses kelas dosen lain
□ Route yang tidak sesuai role di-redirect dengan benar
```

### Checklist Akhir — PRODUCTION READY

```
ENVIRONMENT
□ Semua env production terisi dan benar
□ Tidak ada secret di git history
□ Demo auth mati di production
□ SESSION_SECRET kuat dan aktif

AUTH
□ Login Supabase Auth production berjalan
□ User nonaktif ditolak
□ Logout membersihkan session

DATABASE
□ Semua migration diapply ke production
□ RLS aktif untuk semua tabel sensitif
□ Data seed minimum tersedia
□ Tidak ada data dummy di production

BACKUP
□ Backup pre-launch tersedia
□ Restore procedure terdokumentasi

DEPLOYMENT
□ CI/CD hijau
□ Build production sukses
□ Preview deployment sudah ditest
□ Post-deploy verification sudah dilakukan

PAYMENT (jika aktif)
□ Mode production/sandbox sesuai kebutuhan
□ Webhook URL sudah benar
□ Signature validation aktif

SMOKE TEST
□ Admin: login + dashboard + CRUD + audit ✅
□ Keuangan: login + tagihan + pembayaran ✅
□ Prodi: login + akademik ✅
□ Dosen: login + kelas + LMS ✅
□ Mahasiswa: login + dashboard + LMS ✅
□ Calon Mahasiswa: PMB publik (jika aktif) ✅

ROLLBACK PLAN
□ Cara rollback via Vercel dashboard sudah dipahami
□ Backup database tersedia jika perlu rollback data
□ Kontak PIC yang bisa melakukan rollback sudah diketahui
```

**Keputusan akhir:** Semua item di atas hijau → sistem siap production. Ada yang merah → selesaikan dulu, jangan go-live.

---

## Output yang Diharapkan

1. **Sistem aman** — tidak ada secret bocor, demo auth mati, RLS aktif.
2. **Database siap** — semua migration diapply, data seed tersedia, tidak ada data dummy.
3. **Backup ada** — data production bisa diselamatkan jika terjadi masalah.
4. **Semua role berjalan** — smoke test semua role utama lolos di production.
5. **Rollback siap** — jika ada masalah setelah go-live, tim tahu apa yang harus dilakukan.
