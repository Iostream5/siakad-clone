# Phase 0 — Keamanan & Infrastruktur Dasar

> **Prioritas:** 🔴 URGENT — selesaikan sebelum lanjut ke phase manapun  
> **Estimasi:** 2-3 hari  
> **Gate:** Semua item `[x]` sebelum lanjut

---

## Tujuan

Memastikan fondasi keamanan dan infrastruktur development sudah solid sebelum menambah fitur baru. Phase ini menangani celah keamanan, code quality, dan tooling dasar.

---

## Checklist Perbaikan

### 1. Custom Error Pages

> **Status saat ini:** ❌ Tidak ada — user melihat default Next.js error  
> **Dampak:** UX buruk, informasi teknis bisa bocor ke user

- [ ] **Buat `src/app/not-found.tsx`** — halaman 404 custom
  - Desain sesuai design system (Shadcn + Tailwind)
  - Tombol "Kembali ke Dashboard" dan "Kembali ke Beranda"
  - Jangan tampilkan informasi teknis

- [ ] **Buat `src/app/error.tsx`** — error boundary global
  - Tampilkan pesan ramah: "Terjadi kesalahan, coba lagi"
  - Tombol retry dan tombol kembali
  - Log error ke `console.error` (server side)
  - Jangan expose stack trace ke UI

- [ ] **Buat `src/app/dashboard/error.tsx`** — error boundary dashboard
  - Mirip error global tapi di dalam layout dashboard (sidebar tetap tampil)

- [ ] **Handling akses ditolak (403)**
  - Saat ini `requireAuthorizedUser` redirect ke `/dashboard` tanpa penjelasan
  - Tambahkan toast notification saat redirect karena akses ditolak
  - Atau buat halaman `/dashboard/forbidden` dengan penjelasan

**File yang perlu dibuat:**
```
src/app/not-found.tsx          [NEW]
src/app/error.tsx              [NEW]
src/app/dashboard/error.tsx    [NEW]
```

---

### 2. Bersihkan `any` Type

> **Status saat ini:** ❌ Ada di 5+ file — melanggar TypeScript strict  
> **Dampak:** Bug tersembunyi, autocompletion rusak, inkonsistensi

- [ ] **`src/app/dashboard/krs/page.tsx`**
  - `let submissions: any[] = []` → buat type `KrsSubmissionItem`

- [ ] **`src/app/dashboard/nilai/page.tsx`**
  - `let gradesData: any[]` → buat type `StudentGradeItem`
  - `let lecturerClasses: any[]` → buat type `LecturerClassItem`
  - `let studentProfile: any` → buat type `MahasiswaProfile`

- [ ] **`src/app/dashboard/akademik/lms/page.tsx`**
  - `let classes: any[] = []` → buat type `LmsClassItem`

- [ ] **Audit seluruh codebase** untuk `any` type lain
  - Jalankan: `npx tsc --noEmit 2>&1 | grep "any"` atau search manual
  - Target: **0 `any` di file page dan action**

**File yang perlu dimodifikasi:**
```
src/app/dashboard/krs/page.tsx          [MODIFY]
src/app/dashboard/nilai/page.tsx        [MODIFY]
src/app/dashboard/akademik/lms/page.tsx [MODIFY]
src/types/domain.ts                     [MODIFY] — tambah type baru
```

---

### 3. Setup CI/CD — GitHub Actions

> **Status saat ini:** ❌ Folder `.github/` tidak ada  
> **Dampak:** Tidak ada gate otomatis sebelum merge, regresi bisa lolos

- [ ] **Buat `.github/workflows/ci.yml`**
  ```yaml
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

- [ ] **Verifikasi script ada di `package.json`**
  - `type-check`: `tsc --noEmit`
  - `lint`: `next lint`
  - `build`: `next build`

**File yang perlu dibuat:**
```
.github/workflows/ci.yml    [NEW]
```

---

### 4. Audit Server Actions — Auth Check

> **Status saat ini:** ⚠️ Sebagian besar sudah ada, perlu verifikasi 100%  
> **Dampak:** Server Action tanpa auth check = celah keamanan kritis

- [ ] **Audit semua file di `src/actions/`** — pastikan setiap fungsi mutasi memiliki:
  1. `requireAuthorizedUser()` atau `requireUser()` di baris pertama
  2. Zod validation untuk input
  3. `logAuditAction()` setelah operasi berhasil

File yang perlu diaudit:
```
src/actions/auth.ts              — ✅ sudah ada auth logic
src/actions/access-control.ts    — perlu verifikasi
src/actions/announcements.ts     — perlu verifikasi
src/actions/dosen.ts             — perlu verifikasi
src/actions/faculties.ts         — perlu verifikasi
src/actions/finance-master.ts    — perlu verifikasi
src/actions/finance.ts           — perlu verifikasi
src/actions/grades.ts            — perlu verifikasi
src/actions/jadwal-kuliah.ts     — perlu verifikasi
src/actions/kampus.ts            — perlu verifikasi
src/actions/kelas.ts             — perlu verifikasi
src/actions/krs.ts               — perlu verifikasi
src/actions/kurikulum.ts         — perlu verifikasi
src/actions/lms.ts               — perlu verifikasi
src/actions/mahasiswa.ts         — perlu verifikasi
src/actions/mata-kuliah.ts       — perlu verifikasi
src/actions/menus.ts             — perlu verifikasi
src/actions/notifications.ts     — perlu verifikasi
src/actions/pmb.ts               — perlu verifikasi
src/actions/ruangan.ts           — perlu verifikasi
src/actions/settings.ts          — perlu verifikasi
src/actions/study-programs.ts    — perlu verifikasi
src/actions/users.ts             — perlu verifikasi
src/actions/academic-years.ts    — perlu verifikasi
```

---

### 5. Verifikasi `.env.example` Lengkap

> **Status saat ini:** ✅ File ada — perlu verifikasi isinya  
> **Dampak:** Developer baru tidak tahu env apa yang dibutuhkan

- [ ] Pastikan `.env.example` berisi semua key yang digunakan:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  NEXT_PUBLIC_APP_URL=
  SESSION_SECRET=
  MIDTRANS_SERVER_KEY=
  MIDTRANS_CLIENT_KEY=
  MIDTRANS_IS_PRODUCTION=
  ```

- [ ] Pastikan `.env.local` **tidak pernah** masuk git:
  ```bash
  git log --all -- .env.local
  ```

---

### 6. Verifikasi Demo Auth Protection

> **Status saat ini:** ✅ `getUserByCredential` sudah cek `NODE_ENV === "production"`  
> **Dampak:** Jika lolos, siapapun bisa login dengan demo credentials di production

- [ ] Verifikasi `src/lib/auth.ts` line 184: `if (process.env.NODE_ENV === "production") return null`
- [ ] Verifikasi tidak ada bypass lain di `src/actions/auth.ts`
- [ ] Cek `src/lib/constants.ts` — demo users tercantum, pastikan tidak digunakan di production

---

## Kriteria Selesai Phase 0

```bash
# Semua command harus hijau:
npm run type-check    # 0 error
npm run lint          # 0 error (warning boleh)
npm run build         # sukses

# Manual check:
✅ Custom not-found.tsx menampilkan halaman 404 yang rapi
✅ Custom error.tsx menampilkan pesan error yang aman
✅ Tidak ada `any` type di file page dan action
✅ CI/CD workflow file ada dan valid
✅ Semua Server Action mutasi punya auth check
✅ .env.example lengkap
✅ Demo auth terlindungi di production
```
