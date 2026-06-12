---
description: SOP deployment SIAKAD ke Vercel. Mencakup setup awal, manajemen environment variable, alur preview vs production deployment, monitoring post-deploy, dan prosedur rollback deployment yang aman.
---

# SOP Deployment Vercel — SIAKAD STAI Al-Ittihad

## Tujuan

Deployment ke Vercel bukan sekadar push ke main branch. Ada urutan langkah yang harus dilakukan agar deployment tidak merusak data production, environment variable tidak bocor, dan rollback bisa dilakukan dalam hitungan menit jika ada masalah.

---

## FASE 1: PERSIAPAN SEBELUM DEPLOY

### Langkah-langkah

STEP 1: Pastikan semua gate teknis lokal sudah hijau.

Jangan deploy jika salah satu dari ini gagal:

```bash
npm ci                  # install dari lockfile, bukan npm install
npm run type-check      # 0 error TypeScript
npm run lint            # 0 error lint
npm run build           # build production sukses
```

Jika `npm run build` gagal di lokal, pasti gagal juga di Vercel. Perbaiki dulu sebelum push.

STEP 2: Verifikasi tidak ada secret yang ter-commit.

```bash
# Cek file env yang masuk git
git ls-files | grep -iE "\.env$|\.env\.local|\.env\.production"
# Hanya .env.example yang boleh muncul

# Cek apakah pernah ada secret di history
git log --all --full-history -- .env.local
git log --all --full-history -- .env.production
# Jika ada hasil: secret pernah bocor, wajib rotasi sebelum deploy
```

STEP 3: Konfirmasi branch yang akan di-deploy.

```
main branch     → Production deployment (otomatis di Vercel)
feature/xxx     → Preview deployment (otomatis di Vercel)
```

Aturan:
- Tidak boleh push langsung ke `main` tanpa review
- Semua fitur lewat branch → PR → review → merge ke main
- CI harus hijau sebelum merge diizinkan

### Checklist

- [ ] `npm ci && npm run type-check && npm run lint && npm run build` semua hijau
- [ ] Tidak ada secret di tracked files
- [ ] Secret yang pernah bocor sudah dirotasi
- [ ] Deploy ke production melalui PR → merge → bukan push langsung ke main

---

## FASE 2: SETUP VERCEL (PERTAMA KALI)

### Langkah-langkah

STEP 1: Hubungkan repository ke Vercel.

```
1. Buka vercel.com → Add New Project
2. Import repository GitHub SIAKAD
3. Set Framework Preset: Next.js
4. Set Root Directory: . (root project)
5. Build Command: npm run build (default)
6. Output Directory: .next (default)
7. Install Command: npm ci
```

STEP 2: Set environment variables di Vercel dashboard.

Buka Settings → Environment Variables dan tambahkan:

```
# Wajib ada di Production dan Preview
NEXT_PUBLIC_SUPABASE_URL          → URL Supabase project
NEXT_PUBLIC_SUPABASE_ANON_KEY     → Anon key Supabase (boleh publik)
SUPABASE_SERVICE_ROLE_KEY         → Service role key (server only)
NEXT_PUBLIC_APP_URL               → https://domain-production.com
SESSION_SECRET                    → Random string panjang (min 32 karakter)

# Payment gateway (set ke production saat siap)
MIDTRANS_SERVER_KEY               → Server key Midtrans
MIDTRANS_CLIENT_KEY               → Client key Midtrans
MIDTRANS_IS_PRODUCTION            → false (sandbox) atau true (production)

# FCM (jika sudah aktif)
FIREBASE_SERVICE_ACCOUNT          → JSON service account FCM
```

Aturan penting di Vercel:
- **Production** env: nilai production (Supabase production project, Midtrans production key)
- **Preview** env: nilai staging/dev (Supabase dev project, Midtrans sandbox)
- **Development** env: tidak perlu diset di Vercel (pakai `.env.local` lokal)

STEP 3: Verifikasi konfigurasi Next.js untuk Vercel.

```typescript
// next.config.ts — pastikan tidak ada konfigurasi yang konflik dengan Vercel
const nextConfig = {
  // Tidak perlu output: "standalone" untuk Vercel
  // Vercel handle output sendiri

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co", // untuk Supabase Storage images
      },
    ],
  },
};
```

### Checklist

- [ ] Repository terhubung ke Vercel
- [ ] Semua env variable production sudah diset di Vercel dashboard
- [ ] Preview env menggunakan Supabase dev, bukan production
- [ ] `NEXT_PUBLIC_APP_URL` sudah mengarah ke domain production
- [ ] `SESSION_SECRET` sudah diset (bukan kosong)

---

## FASE 3: ALUR DEPLOYMENT

### Langkah-langkah

STEP 1: Preview deployment — test sebelum production.

Setiap push ke branch selain `main` akan otomatis membuat preview URL di Vercel. Gunakan ini untuk test sebelum merge:

```
Alur yang benar:
1. Push branch feature/xxx ke GitHub
2. Vercel otomatis build dan deploy ke preview URL
3. Test di preview URL: login, fitur baru, smoke test
4. Jika OK → buat PR ke main
5. Reviewer cek preview URL
6. Merge PR → Vercel otomatis deploy ke production
```

STEP 2: Verifikasi preview deployment sebelum merge ke main.

Checklist minimal yang harus diverifikasi di preview URL:

```
□ Halaman login bisa dibuka
□ Login admin berhasil
□ Dashboard admin tampil
□ Fitur yang baru dikerjakan berjalan
□ Tidak ada halaman yang crash (cek console browser)
□ Environment mengarah ke Supabase DEV (bukan production)
```

STEP 3: Post-deploy verification di production.

Setelah merge ke main dan Vercel selesai deploy production:

```
□ Buka domain production — tidak ada error 500
□ Login dengan akun production berhasil
□ Dashboard tampil dengan data production
□ Fitur utama berjalan (smoke test singkat)
□ Tidak ada error di Vercel deployment logs
□ Cek Vercel Functions tab — tidak ada function error tinggi
```

### Checklist

- [ ] Preview deployment sudah ditest sebelum merge
- [ ] PR sudah di-review (bukan merge sendiri)
- [ ] Post-deploy verification di production sudah dilakukan dalam 15 menit setelah deploy
- [ ] Tidak ada error di Vercel logs setelah deploy

---

## FASE 4: MONITORING POST-DEPLOY

### Langkah-langkah

STEP 1: Pantau Vercel deployment logs.

Lokasi log di Vercel dashboard:
```
Project → Deployments → [deployment terbaru] → Functions tab
```

Yang perlu diperhatikan:
- **Runtime Errors** — error yang terjadi saat request diproses
- **Build Errors** — error saat proses build (harusnya sudah teratasi sebelum deploy)
- **Function Duration** — jika ada fungsi yang sangat lambat (>3 detik)

STEP 2: Pantau Supabase production dashboard.

Setelah deploy, cek Supabase production:
```
Supabase Dashboard → Logs → API logs
```

Perhatikan:
- Query yang error (status 4xx atau 5xx)
- Query yang lambat (>1 detik)
- RLS policy yang memblokir request yang seharusnya diizinkan

STEP 3: Definisi kapan harus rollback.

Lakukan rollback jika dalam 30 menit setelah deploy terjadi salah satu:
- Error rate naik signifikan di Vercel logs
- Login production tidak bisa dilakukan
- Fitur kritikal (PMB, pembayaran, KRS) tidak berjalan
- Data production mengalami perubahan yang tidak diinginkan

### Checklist

- [ ] Vercel deployment logs dicek dalam 15 menit setelah deploy
- [ ] Supabase production logs dicek untuk error baru
- [ ] Smoke test production dilakukan setelah deploy
- [ ] Kondisi rollback sudah dipahami dan siap dilakukan jika diperlukan

---

## FASE 5: PROSEDUR ROLLBACK

### Langkah-langkah

STEP 1: Rollback deployment via Vercel dashboard (cara tercepat).

```
1. Buka Vercel dashboard → Project → Deployments
2. Cari deployment sebelumnya yang masih berjalan baik
3. Klik tiga titik (...) di sebelah deployment tersebut
4. Pilih "Promote to Production"
5. Konfirmasi → deployment lama langsung aktif kembali
```

Rollback Vercel tidak mempengaruhi database. Ini hanya mengembalikan kode aplikasi.

STEP 2: Jika rollback deployment tidak cukup — rollback database.

Jika deployment baru disertai migration database yang bermasalah:

```
1. Rollback deployment Vercel dulu (langkah 1)
2. Buka Supabase production dashboard
3. Jalankan rollback SQL dari script yang sudah disiapkan
   (lihat 07-sop-database-migration.md untuk prosedur rollback SQL)
4. Verifikasi data kembali normal
5. Catat di PROGRESS.md: apa yang di-rollback dan mengapa
```

STEP 3: Komunikasikan rollback.

Setelah rollback dilakukan:

```markdown
## Catatan Rollback — [Tanggal]

**Deployment yang di-rollback:** [hash commit atau deskripsi fitur]
**Alasan:** [deskripsi singkat masalah yang terjadi]
**Waktu deteksi:** [waktu masalah pertama terdeteksi]
**Waktu rollback selesai:** [waktu rollback selesai]
**Database di-rollback:** Ya / Tidak
**Tindakan berikutnya:** [apa yang harus diperbaiki sebelum re-deploy]
```

Simpan catatan ini di `PROGRESS.md`.

### Checklist Akhir Deployment

```
□ Gate teknis lokal hijau sebelum push
□ Tidak ada secret di tracked files
□ Preview deployment sudah ditest
□ PR sudah di-review sebelum merge
□ Post-deploy verification dilakukan dalam 15 menit
□ Vercel dan Supabase logs dipantau
□ Rollback plan tersedia: tahu cara rollback via Vercel dashboard
□ Catatan rollback (jika terjadi) tersimpan di PROGRESS.md
```

---

## Output yang Diharapkan

1. **Deployment terstruktur** — tidak ada push langsung ke main tanpa preview dan review.
2. **Environment aman** — production pakai env production, preview pakai env dev, tidak ada campur aduk.
3. **Post-deploy terverifikasi** — setiap deployment diverifikasi manual dalam 15 menit.
4. **Rollback siap** — jika ada masalah, rollback bisa dilakukan dalam 5 menit via Vercel dashboard.
5. **Audit trail** — setiap deployment dan rollback terdokumentasi di PROGRESS.md.
