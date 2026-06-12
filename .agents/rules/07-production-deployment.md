---
trigger: always_on
---

# Production Readiness & Deployment Rules

## Tujuan
Memastikan AI memahami standar yang harus dipenuhi sebelum aplikasi dinyatakan siap production — termasuk CI/CD, environment, Vercel, backup, monitoring, dan smoke test per role.

---

## 1. Gambaran Umum

### Gate Teknis Wajib

Sebelum klaim production-ready, **semua** command berikut wajib hijau:

```bash
npm ci                  # install dependencies bersih
npm run type-check      # npx tsc --noEmit — 0 error
npm run lint            # 0 error (warning boleh, dicatat)
npm run build           # next build sukses
```

### Environment

| Env | Supabase Project | Demo Auth | Tujuan |
|---|---|---|---|
| `development` | DEV project | Boleh aktif | Local dev |
| `preview` | DEV project | Boleh aktif | Vercel preview deployment |
| `production` | Production project | **Dimatikan** | Live kampus |

---

## 2. Aturan Inti

### 2.1 Environment Variables

✅ BENAR — `.env.example` di-commit, `.env.local` tidak

```bash
# .env.example — commit ke git (tanpa value)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
SESSION_SECRET=

# Payment gateway (isi di Vercel env, bukan di .env.local)
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=

# Firebase (opsional, Phase 5+)
FCM_SERVER_KEY=
```

❌ SALAH
```bash
# .env.local di git history
git add .env.local
# atau
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=
```

Jika secret pernah masuk git: **rotasi segera** via Supabase dashboard dan Vercel env.

### 2.2 Demo Auth Mati di Production

✅ BENAR
```typescript
// src/actions/auth.ts
export async function loginWithDemoCredentials(username: string, password: string) {
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Demo login tidak tersedia' }
  }
  // ... demo logic hanya untuk dev
}
```

❌ SALAH
```typescript
// Demo login aktif tanpa cek environment
const DEMO_USERS = { admin: 'admin123', mahasiswa: 'mhs12345' }
```

### 2.3 Build Harus Hijau Sebelum Merge

CI/CD wajib menjalankan:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: https://siakad.example.com
```

---

## 3. Workflow

### Deployment Flow

```text
Push ke branch → GitHub Actions CI
  → npm ci
  → npm run type-check (gagal = block merge)
  → npm run lint (gagal = block merge)
  → npm run build (gagal = block merge)
    → Jika semua hijau: Vercel deploy preview
      → Smoke test manual di preview URL
        → Merge ke main
          → Vercel deploy production
            → Smoke test production
              → Backup database setelah deploy sukses
```

### Rollback Plan

```text
Jika ada masalah di production:
  1. Vercel: rollback ke deployment sebelumnya (1 klik)
  2. Database: restore dari backup sebelum deployment (jika migration merusak data)
  3. Payment gateway: disable di settings jika webhook bermasalah
  4. Dokumen: catat incident dan langkah yang diambil
```

### Backup Strategy (Supabase)

```text
Sebelum setiap migration production:
  1. Buat backup manual via Supabase dashboard
  2. Atau gunakan pg_dump (butuh direct connection)
  3. Simpan backup dengan label: backup_YYYYMMDD_sebelum_migration_NNN

Jadwal backup reguler:
  - Harian: auto-backup Supabase (tersedia di tier berbayar)
  - Mingguan: backup manual + test restore di staging
```

---

## 4. Implementasi

### Dockerfile (Opsional — untuk self-hosting)

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose (untuk lokal)

```yaml
# docker-compose.yml — untuk development lokal dengan PostgreSQL
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: siakad_local
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build:
      context: .
      target: builder
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/siakad_local
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Monitoring Checklist

```typescript
// Pastikan error penting memiliki server-side log
export async function criticalAction(input: unknown) {
  try {
    // ...operasi
  } catch (error) {
    // Log ke server (Vercel logs akan menangkap console.error)
    console.error('[CRITICAL] Action failed:', {
      action: 'criticalAction',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })
    return { error: 'Operasi gagal. Hubungi administrator.' }
  }
}
```

---

## 5. Security Rules

### Pre-deployment Checklist

- [ ] Tidak ada `.env.local` di git history: `git log --all -- .env.local`
- [ ] Service role key tidak di-expose sebagai `NEXT_PUBLIC_`
- [ ] Demo auth dimatikan di production: cek kode `NODE_ENV === 'production'`
- [ ] RLS aktif untuk semua tabel sensitif di Supabase production
- [ ] Policy `service_role` tersedia di semua tabel yang diakses backend
- [ ] Supabase Security Advisors tidak ada blocker kritis
- [ ] Webhook URL production sudah diset di Midtrans/Xendit dashboard
- [ ] `NEXT_PUBLIC_APP_URL` production benar (untuk Supabase Auth callback)

### RLS Wajib Aktif di Production

Tabel minimal yang harus RLS aktif sebelum production:

```
users, user_roles, menus, settings, audit_logs,
pmb_pendaftaran, pmb_pembayaran,
tagihan, pembayaran,
mahasiswa, dosen,
krs_header, krs_detail,
nilai_akhir, nilai_komponen,
lms_materi, lms_tugas, lms_pengumpulan, lms_forum_topik, lms_forum_komentar,
notification_queue, notification_devices,
edom_responses, edom_response_answers
```

---

## 6. Smoke Test Per Role (Wajib Sebelum Production)

### Admin
- [ ] Login berhasil
- [ ] Dashboard tampil dengan data real
- [ ] CRUD user berjalan
- [ ] CRUD role/permission berjalan
- [ ] Menu builder berjalan
- [ ] CRUD master data berjalan
- [ ] Audit log tercatat

### Prodi
- [ ] Login berhasil
- [ ] Melihat data akademik prodi
- [ ] Approve/reject KRS

### Dosen
- [ ] Login berhasil
- [ ] Melihat kelas yang diajar
- [ ] Input nilai
- [ ] Akses LMS kelas

### Mahasiswa
- [ ] Login berhasil
- [ ] Mengisi KRS
- [ ] Melihat KHS/nilai
- [ ] Mengakses LMS
- [ ] Melihat tagihan

### Calon Mahasiswa
- [ ] Daftar PMB dari halaman publik
- [ ] Melihat status PMB
- [ ] Melakukan pembayaran (jika tersedia)

### Keuangan
- [ ] Login berhasil
- [ ] Melihat tagihan
- [ ] Verifikasi pembayaran
- [ ] Melihat laporan keuangan

### Pimpinan
- [ ] Login berhasil
- [ ] Dashboard pimpinan tampil
- [ ] Melihat laporan ringkas

---

## 7. Anti Pattern

❌ Deploy ke production tanpa `npm run build` hijau  
❌ Deploy tanpa backup database terlebih dahulu  
❌ Demo auth aktif di production  
❌ Secret production disimpan di `.env.local` yang di-commit  
❌ RLS tidak diaktifkan untuk tabel sensitif di production  
❌ Webhook URL masih mengarah ke sandbox setelah go-live  
❌ `NEXT_PUBLIC_APP_URL` masih `localhost` di production (auth callback akan gagal)  
❌ Tidak ada rollback plan sebelum deploy  
❌ Smoke test tidak dilakukan setelah deploy  
❌ Migration production dijalankan tanpa backup sebelumnya  

---

## 8. Checklist AI

Saat membantu persiapan deployment atau production readiness:

- [ ] Apakah semua gate teknis bisa hijau (`type-check`, `lint`, `build`)?
- [ ] Apakah `.env.example` lengkap tapi tanpa value?
- [ ] Apakah demo auth dicek `NODE_ENV`?
- [ ] Apakah CI/CD GitHub Actions sudah ada?
- [ ] Apakah Dockerfile/Docker Compose tersedia jika dibutuhkan?
- [ ] Apakah RLS aktif untuk semua tabel sensitif?
- [ ] Apakah backup strategy terdokumentasi?
- [ ] Apakah smoke test per role tersedia?
- [ ] Apakah rollback plan tersedia?
- [ ] Apakah webhook URL production sudah dikonfigurasi?

---

## 9. Ringkasan

- Gate wajib: **`type-check` + `lint` + `build`** — semua harus hijau
- Demo auth: **dimatikan di production** — cek `NODE_ENV`
- Secret: **tidak pernah di git**, rotasi jika bocor
- CI/CD: **GitHub Actions** — block merge jika gate merah
- Deployment: **Vercel** — deploy preview dulu, baru production
- Backup: **sebelum setiap migration production**
- RLS: **wajib aktif** di semua tabel sensitif production
- Smoke test: **semua role utama** harus lolos sebelum klaim production-ready
- Rollback: **plan tersedia** — Vercel rollback + database restore
