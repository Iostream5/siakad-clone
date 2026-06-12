---
description: SOP gate check sebelum berpindah dari satu phase ke phase berikutnya. Workflow ini memastikan setiap phase benar-benar selesai dan aman sebelum phase berikutnya dimulai, mencegah fondasi yang rapuh menopang fitur yang makin berat.
---

# SOP Phase Gate dan Transisi Antar Phase — SIAKAD STAI Al-Ittihad

## Tujuan

Setiap phase memiliki acceptance criteria yang harus dipenuhi sebelum phase berikutnya dimulai. Workflow ini adalah pintu gerbang formal yang memastikan tidak ada hutang teknis tersembunyi yang terbawa ke phase selanjutnya. Phase yang belum selesai tapi dipaksa lanjut adalah bom waktu.

---

## FASE 1: GATE CHECK PHASE 0 → PHASE 1

### Langkah-langkah

STEP 1: Verifikasi production safety baseline.

Phase 0 adalah fondasi keamanan. Semua item ini harus selesai sebelum Phase 1 dimulai.

STEP 2: Jalankan semua verifikasi teknis.

```bash
npm run type-check   # wajib 0 error
npm run lint         # wajib 0 error
npm run build        # wajib sukses
```

STEP 3: Verifikasi kondisi keamanan.

```bash
# Pastikan .env.local tidak ada di git history
git log --all -- .env.local

# Pastikan tidak ada secret di tracked files
git ls-files | grep -i env

# Pastikan src/proxy.ts ada (bukan middleware.ts)
Test-Path src/proxy.ts
```

### Checklist Gate Phase 0

```
□ .env.local tidak di-commit dan tidak ada di git history
□ .env.example ada dan lengkap tanpa nilai secret
□ src/proxy.ts ada di `src/` (bukan middleware.ts)
□ Demo auth tidak aktif saat NODE_ENV=production
□ SUPABASE_SERVICE_ROLE_KEY tidak ada sebagai NEXT_PUBLIC_*
□ Semua Server Action mutasi yang sudah ada punya authorization check
□ Webhook (jika ada) memvalidasi signature
□ RLS aktif minimal untuk: users, user_roles, menus, settings, audit_logs
□ npm run type-check: 0 error
□ npm run lint: 0 error
□ npm run build: sukses
□ /login bisa dibuka
□ /dashboard tanpa session redirect ke /login
```

**Keputusan:** Jika semua checklist hijau → lanjut ke Phase 1. Jika ada yang merah → selesaikan dulu, jangan lanjut.

---

## FASE 2: GATE CHECK PHASE 1 → PHASE 2

### Langkah-langkah

STEP 1: Verifikasi semua acceptance criteria Phase 1.

Rujuk `docs/tahapan/DETAIL-PHASE-1-FONDASI-ADMIN.md` bagian "Definisi Selesai Phase 1".

STEP 2: Smoke test semua route admin utama.

Lakukan manual test untuk setiap route berikut dan catat hasilnya:

| Route | Expected | Hasil |
|-------|----------|-------|
| `/login` | Halaman login tampil | |
| `/dashboard` | Dashboard admin tampil | |
| `/dashboard/master-data/pengguna` | Tabel user tampil | |
| `/dashboard/pengaturan/akun-akses` | RBAC management tampil | |
| `/dashboard/pengaturan/menu-builder` | Menu builder tampil | |
| `/dashboard/master-data/kampus` | Tabel kampus tampil | |
| `/dashboard/master-data/fakultas` | Tabel fakultas tampil | |
| `/dashboard/master-data/program-studi` | Tabel prodi tampil | |
| `/dashboard/master-data/tahun-akademik` | Tabel TA tampil | |
| `/dashboard/pengaturan/audit-aktivitas` | Audit log tampil | |

STEP 3: Verifikasi data Phase 2 sudah siap di database.

Phase 2 (PMB & Keuangan) butuh data dari Phase 1. Pastikan semua ada:

```sql
-- Cek via Supabase dashboard atau MCP siakad_dev
SELECT count(*) FROM public.program_studi WHERE deleted_at IS NULL;
SELECT count(*) FROM public.fakultas WHERE deleted_at IS NULL;
SELECT count(*) FROM public.tahun_akademik;
SELECT count(*) FROM public.kampus WHERE deleted_at IS NULL;
```

### Checklist Gate Phase 1

```
□ Admin login via Supabase Auth berjalan
□ Session dan route protection stabil (src/proxy.ts)
□ Sidebar dirender dari database (tabel menus)
□ CRUD Users: create, update, soft delete, restore, hard delete ✓
□ CRUD Roles & Permissions ✓
□ CRUD Menu Builder (nested) ✓
□ CRUD Kampus ✓ (dengan search, filter, pagination, soft delete)
□ CRUD Fakultas ✓
□ CRUD Program Studi ✓
□ CRUD Ruangan ✓
□ CRUD Kelas ✓
□ CRUD Tahun Akademik ✓
□ CRUD Kurikulum ✓
□ CRUD Mata Kuliah ✓
□ CRUD Dosen ✓
□ CRUD Mahasiswa ✓
□ Import/Export Excel untuk master data prioritas ✓
□ Audit log tercatat untuk login, CRUD penting ✓
□ Dashboard admin menampilkan data real dari database ✓
□ npm run type-check: 0 error
□ npm run lint: 0 error
□ npm run build: sukses
□ Semua smoke test route admin lolos
□ Data master (prodi, fakultas, TA) sudah ada untuk Phase 2
```

**Keputusan:** Semua hijau → lanjut ke Phase 2. Ada yang merah → catat gap, selesaikan dulu.

**Gap yang boleh ditoleransi untuk lanjut ke Phase 2:**
- Import/export Excel belum 100% semua tabel (minimal prodi, dosen, mahasiswa sudah bisa)
- Dashboard admin belum punya semua widget (minimal statistik dasar sudah ada)

**Gap yang TIDAK boleh ditoleransi:**
- Auth tidak stabil
- CRUD user/role/menu tidak jalan
- Master data inti (prodi, dosen, mahasiswa) belum ada CRUD
- Build gagal

---

## FASE 3: GATE CHECK PHASE 2 → PHASE 3

### Langkah-langkah

STEP 1: Verifikasi alur PMB end-to-end.

```
□ Halaman /pmb bisa diakses publik
□ Halaman /pmb/daftar bisa diakses publik
□ Form pendaftaran PMB bisa di-submit
□ Data masuk ke tabel pmb_pendaftaran
□ Admin bisa melihat daftar pendaftar
□ Admin bisa update status seleksi
□ Pembayaran PMB manual bisa diverifikasi
□ Generate NIM berjalan dan idempoten
□ Mahasiswa baru muncul di master data mahasiswa
□ Role Mahasiswa diberikan setelah generate NIM
```

STEP 2: Verifikasi alur keuangan end-to-end.

```
□ Master biaya bisa dibuat oleh keuangan/admin
□ Tagihan bisa di-generate untuk mahasiswa
□ Generate tagihan idempoten (tidak dobel)
□ Pembayaran manual bisa dibuat dan diverifikasi
□ Status tagihan berubah ke Lunas setelah bayar penuh
□ Arus kas tercatat untuk pembayaran yang terverifikasi
```

STEP 3: Verifikasi keamanan payment gateway.

```
□ Midtrans checkout URL berhasil dibuat
□ Webhook Midtrans menolak request dengan signature invalid
□ Webhook Midtrans idempoten (settlement dua kali tidak membuat arus kas ganda)
□ Webhook error tidak membocorkan secret di response
□ Provider reference tersimpan di tabel pembayaran
```

### Checklist Gate Phase 2

```
□ Pendaftaran PMB publik berjalan
□ Dashboard PMB admin berjalan
□ Verifikasi pendaftar berjalan
□ Biaya PMB bisa dikonfigurasi
□ Pembayaran PMB manual berjalan
□ Midtrans PMB: checkout + webhook + idempotency ✓
□ Generate NIM berjalan dan idempoten ✓
□ Sinkronisasi calon mahasiswa → mahasiswa aktif ✓
□ Master biaya berjalan
□ Generate tagihan bulk berjalan dan idempoten ✓
□ Pembayaran mahasiswa manual berjalan ✓
□ Midtrans finance: checkout + webhook + idempotency ✓
□ Sinkronisasi status mahasiswa dari pembayaran ✓
□ Laporan keuangan dasar tampil dengan data real ✓
□ Audit log PMB dan keuangan tercatat ✓
□ RLS aktif untuk: pmb_pendaftaran, pmb_pembayaran, tagihan, pembayaran ✓
□ npm run type-check: 0 error
□ npm run lint: 0 error
□ npm run build: sukses
□ Smoke test PMB dan keuangan lolos
```

---

## FASE 4: GATE CHECK PHASE 3 → PHASE 4

### Langkah-langkah

STEP 1: Verifikasi alur akademik end-to-end.

```
□ Jadwal kuliah bisa dibuat oleh admin/prodi
□ Mahasiswa bisa mengisi KRS (hanya periode terbuka)
□ Dosen/prodi bisa approve KRS
□ Dosen bisa input nilai
□ Nilai akhir dihitung benar
□ Mahasiswa bisa melihat KHS
□ Transkrip bisa diakses
```

STEP 2: Verifikasi alur LMS end-to-end.

```
□ Dosen melihat kelas yang dia ajar
□ Mahasiswa melihat kelas dari KRS yang diapprove
□ Dosen bisa upload materi
□ Dosen bisa membuat tugas dengan deadline
□ Mahasiswa bisa submit tugas
□ Dosen bisa menilai submission
□ Forum diskusi berjalan
```

STEP 3: Verifikasi data isolation.

```
□ Mahasiswa hanya melihat data diri sendiri
□ Dosen tidak bisa edit kelas dosen lain
□ Mahasiswa tidak bisa submit tugas di kelas bukan miliknya
□ Mahasiswa tidak bisa melihat nilai mahasiswa lain
□ Prodi hanya melihat data prodi terkait (jika aturan scope diterapkan)
```

### Checklist Gate Phase 3

```
□ Jadwal kuliah CRUD berjalan ✓
□ KRS mahasiswa berjalan dengan validasi ✓
□ Approval KRS berjalan ✓
□ Input nilai dosen berjalan ✓
□ KHS mahasiswa tampil dengan IPS/IPK benar ✓
□ Transkrip tersedia ✓
□ LMS kelas berbasis jadwal berjalan ✓
□ Materi kuliah berjalan ✓
□ Tugas dan submission berjalan ✓
□ Grading submission berjalan ✓
□ Forum diskusi berjalan ✓
□ Data isolation terverifikasi ✓
□ Audit log akademik dan LMS tercatat ✓
□ RLS tabel akademik dan LMS aktif ✓
□ npm run type-check: 0 error
□ npm run lint: 0 error
□ npm run build: sukses
□ Smoke test role: admin, dosen, mahasiswa lolos
```

---

## FASE 5: GATE CHECK PHASE 4 → PHASE 5

### Checklist Gate Phase 4

```
□ Dashboard pimpinan tampil dengan data real ✓
□ Laporan akademik tersedia dengan filter ✓
□ Laporan PMB tersedia dengan filter ✓
□ Laporan keuangan tersedia dengan filter ✓
□ Export PDF/Excel laporan prioritas berjalan ✓
□ Halaman audit aktivitas berfungsi ✓
□ Halaman audit login berfungsi ✓
□ Webhook payment bisa ditelusuri ✓
□ Error aplikasi punya logging ✓
□ Smoke test per role tersedia sebagai dokumen ✓
□ npm run type-check: 0 error
□ npm run lint: 0 error
□ npm run build: sukses
```

---

## FASE 6: GATE CHECK PHASE 5 → PHASE 6

### Checklist Gate Phase 5

```
□ Template notifikasi bisa dikelola admin ✓
□ Notification queue berjalan ✓
□ In-app notification tampil di topbar ✓
□ Mark as read berjalan ✓
□ User hanya membaca notifikasi miliknya ✓
□ Event PMB membuat notifikasi ✓
□ Event keuangan membuat notifikasi ✓
□ Event akademik/LMS membuat notifikasi ✓
□ EDOM berjalan end-to-end ✓
□ Reminder utama tersedia ✓
□ Push notification: siap atau gap terdokumentasi ✓
□ UX mobile role utama sudah rapi ✓
□ npm run type-check: 0 error
□ npm run lint: 0 error
□ npm run build: sukses
```

---

## FASE 7: GATE CHECK FINAL (PHASE 6 — PRODUCTION READINESS)

### Checklist Gate Phase 6 — Production

```
□ npm ci sukses (dari node_modules bersih)
□ npm run type-check: 0 error
□ npm run lint: 0 error
□ npm run build: sukses
□ CI/CD pipeline hijau
□ Tidak ada .env.local atau secret di git history
□ Semua env production tersedia dan benar di Vercel
□ Demo auth mati di production (NODE_ENV=production)
□ Supabase Auth production berjalan
□ RLS aktif untuk semua tabel sensitif di production
□ Policy service role tersedia untuk backend
□ Migration production sudah diapply
□ Data seed dasar tersedia di production
□ Payment gateway production/sandbox sesuai environment
□ Webhook URL production benar di Midtrans dashboard
□ Backup database tersedia sebelum deploy
□ CI/CD berjalan di GitHub Actions
□ Preview deployment Vercel sukses
□ Production deployment Vercel sukses
□ Smoke test semua role di production lolos:
  □ Admin: login, dashboard, CRUD, audit log
  □ Prodi: login, akademik, laporan
  □ Dosen: login, kelas, nilai, LMS
  □ Mahasiswa: login, KRS, nilai, LMS, tagihan
  □ Calon Mahasiswa: daftar PMB, status, bayar
  □ Keuangan: login, tagihan, pembayaran, laporan
  □ Pimpinan: login, dashboard, laporan
□ Rollback plan tersedia dan terdokumentasi
□ Backup dan restore procedure tersedia
```

**Keputusan:** Semua hijau → project siap production. Ada yang merah → production readiness belum tercapai.

---

## Output yang Diharapkan

Setelah setiap gate check selesai, agent menghasilkan:

1. **Laporan gate check** — status setiap item checklist (✅ hijau / ❌ merah / ⚠️ partial).
2. **Daftar gap** — item yang belum terpenuhi beserta estimasi effort untuk menyelesaikannya.
3. **Keputusan** — lanjut ke phase berikutnya atau selesaikan gap dulu.
4. **Catatan progress** - catat bahwa gate check sudah dijalankan dan hasilnya di final response atau dokumen progress jika repo menyediakannya.
5. **Catatan task berikutnya** - catat task pertama phase berikutnya jika gate lulus.
