# Phase 1 — Fondasi Admin (Gap Perbaikan)

> **Prioritas:** 🔴 Tinggi — harus selesai sebelum Phase 2  
> **Estimasi:** 3-5 hari  
> **Prasyarat:** Phase 0 selesai

---

## Tujuan

Menutup gap yang tersisa di Phase 1 agar fondasi admin benar-benar lengkap. Sebagian besar Phase 1 sudah selesai — dokumen ini hanya memuat item yang **belum ada atau belum lengkap**.

---

## Checklist Perbaikan

### 1. Forgot Password & Reset Password

> **Status saat ini:** ❌ Tidak ada halaman, action, atau flow  
> **Dampak:** User tidak bisa recovery akun jika lupa password  
> **Referensi PRD:** Phase 1 — "Login (email/username) via Supabase Auth"

- [ ] **Buat halaman `/login/forgot-password`**
  - Form dengan input email
  - Validasi Zod: email valid
  - Panggil `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
  - Tampilkan pesan sukses: "Link reset password telah dikirim ke email Anda"
  - Rate limiting sederhana (disable button 30 detik setelah submit)

- [ ] **Buat halaman `/login/reset-password`**
  - Terima token dari URL callback Supabase Auth
  - Form: password baru + konfirmasi password
  - Validasi: min 8 karakter, harus match
  - Panggil `supabase.auth.updateUser({ password })`
  - Redirect ke `/login` dengan toast sukses

- [ ] **Buat Server Action di `src/actions/auth.ts`**
  - `forgotPasswordAction(email)` — kirim reset email
  - `resetPasswordAction(password)` — update password
  - Audit log untuk kedua aksi

- [ ] **Tambah link di halaman login**
  - Link "Lupa password?" mengarah ke `/login/forgot-password`

**File yang perlu dibuat/dimodifikasi:**
```
src/app/login/forgot-password/page.tsx       [NEW]
src/app/login/reset-password/page.tsx        [NEW]
src/actions/auth.ts                          [MODIFY] — tambah 2 action
src/app/login/login-form.tsx                 [MODIFY] — tambah link
```

---

### 2. Halaman Master Data Gedung

> **Status saat ini:** ❌ Tabel `gedung` ada, helper `gedung.ts` ada, tapi tidak ada halaman  
> **Dampak:** Gedung tidak bisa dikelola dari UI — padahal ruangan butuh FK ke gedung  
> **Referensi:** `supabase/migrations/007_gedung_refactor.sql`, `src/lib/admin/gedung.ts`

- [ ] **Buat `src/app/dashboard/master-data/gedung/page.tsx`**
  - Server Component, `requireAuthorizedUser("master-data.gedung")`
  - Fetch data via helper yang sudah ada

- [ ] **Buat `src/modules/master-data/gedung-manager.tsx`**
  - Fitur: list, search, tambah, edit, soft delete, restore, hard delete
  - Modal form (bukan halaman baru) — sesuai pola master data lain
  - Zod validation untuk input

- [ ] **Buat Server Action di `src/actions/gedung.ts`**
  - `createGedungAction`, `updateGedungAction`, `deleteGedungAction`, `restoreGedungAction`
  - Auth check + Zod + audit log

- [ ] **Tambah shortcut di halaman Master Data index**
  - Tambah `GedungSection` di `src/modules/master-data/sections.tsx`
  - Import di `src/app/dashboard/master-data/page.tsx`

- [ ] **Tambah di sidebar `constants.ts`**
  - Tambah item `master-data.gedung` di children master-data

**File yang perlu dibuat/dimodifikasi:**
```
src/app/dashboard/master-data/gedung/page.tsx    [NEW]
src/modules/master-data/gedung-manager.tsx       [NEW]
src/actions/gedung.ts                            [NEW]
src/modules/master-data/sections.tsx             [MODIFY]
src/app/dashboard/master-data/page.tsx           [MODIFY]
src/lib/constants.ts                             [MODIFY]
```

---

### 3. Import/Export Excel untuk Semua Master Data

> **Status saat ini:** ❌ Helper `excel-generator.ts` ada tapi **tidak dipakai** di satupun manager  
> **Dampak:** PRD Phase 1 P2 — "Import/Export Excel untuk semua master data" belum terpenuhi  
> **Referensi PRD:** Phase 1 — "Import/Export Excel untuk semua master data"

- [ ] **Implementasi export Excel di setiap master data manager:**
  - `kampus-manager.tsx` — Tombol "Export Excel"
  - `faculties-manager.tsx` — Tombol "Export Excel"
  - `study-programs-manager.tsx` — Tombol "Export Excel"
  - `academic-years-manager.tsx` — Tombol "Export Excel"
  - `kelas-manager.tsx` — Tombol "Export Excel"
  - `kurikulum-manager.tsx` — Tombol "Export Excel"
  - `mata-kuliah-manager.tsx` — Tombol "Export Excel"
  - `jadwal-kuliah-manager.tsx` — Tombol "Export Excel"
  - `dosen-manager.tsx` — Tombol "Export Excel"
  - `mahasiswa-manager.tsx` — Tombol "Export Excel"
  - `ruangan-manager.tsx` — Tombol "Export Excel"
  - `user-manager.tsx` — Tombol "Export Excel"
  - `gedung-manager.tsx` (baru) — Tombol "Export Excel"

- [ ] **Implementasi import Excel di setiap manager:**
  - Dialog upload `.xlsx`
  - Validasi kolom: tipe data, required fields
  - Preview data sebelum import
  - Ringkasan hasil: berhasil/gagal per baris
  - Server Action untuk proses import batch

- [ ] **Implementasi download template Excel:**
  - Tombol "Download Template"
  - File `.xlsx` dengan header kolom saja

- [ ] **Buat shared component import/export:**
  - `src/modules/shared/excel-import-dialog.tsx` — reusable dialog import
  - `src/modules/shared/excel-export-button.tsx` — reusable export button

**File yang perlu dibuat/dimodifikasi:**
```
src/modules/shared/excel-import-dialog.tsx     [NEW]
src/modules/shared/excel-export-button.tsx     [NEW]
src/modules/master-data/*-manager.tsx          [MODIFY] — 13 files
```

---

### 4. Halaman Profil User

> **Status saat ini:** ❌ Tidak ada halaman profil  
> **Dampak:** User tidak bisa lihat/edit data diri, ganti password, atau foto  

- [ ] **Buat `src/app/dashboard/profil/page.tsx`**
  - Tampilkan: nama, email, role aktif, role tersedia, tanggal bergabung
  - Tombol "Edit Profil" → modal form
  - Tombol "Ganti Password" → modal form (via Supabase Auth)

- [ ] **Buat `src/modules/dashboard/profile-manager.tsx`**
  - Tampilan profil card
  - Form edit nama/foto (upload ke Supabase Storage)
  - Form ganti password via `supabase.auth.updateUser({ password })`

- [ ] **Buat Server Action `src/actions/profile.ts`**
  - `updateProfileAction` — edit nama, foto
  - `changePasswordAction` — ganti password via Supabase Auth

**File yang perlu dibuat:**
```
src/app/dashboard/profil/page.tsx          [NEW]
src/modules/dashboard/profile-manager.tsx  [NEW]
src/actions/profile.ts                     [NEW]
```

---

### 5. Tambah FakultasSection di Master Data Index

> **Status saat ini:** ❌ FakultasSection hilang dari render list  
> **Dampak:** Halaman index Master Data tidak menampilkan ringkasan fakultas

- [ ] **Tambah `FakultasSection` di `sections.tsx`** (jika belum ada)
- [ ] **Import dan render di `master-data/page.tsx`**

**File yang perlu dimodifikasi:**
```
src/modules/master-data/sections.tsx         [MODIFY]
src/app/dashboard/master-data/page.tsx       [MODIFY]
```

---

### 6. Soft Delete, Restore, Hard Delete — Audit Universal

> **Status saat ini:** ⚠️ Beberapa manager sudah punya, perlu verifikasi 100%  
> **Dampak:** PRD mengharuskan semua master data punya fitur ini

- [ ] **Verifikasi setiap manager memiliki:**
  - Tab "Arsip" / filter untuk melihat data terhapus
  - Tombol "Pulihkan" (restore) di data terhapus
  - Tombol "Hapus Permanen" dengan dialog konfirmasi
  - Bulk delete via checkbox

Manager yang perlu diaudit (13 total):
```
kampus-manager.tsx
faculties-manager.tsx
study-programs-manager.tsx
academic-years-manager.tsx
kelas-manager.tsx
kurikulum-manager.tsx
mata-kuliah-manager.tsx
jadwal-kuliah-manager.tsx
dosen-manager.tsx
mahasiswa-manager.tsx
ruangan-manager.tsx
user-manager.tsx
gedung-manager.tsx (baru)
```

---

## Kriteria Selesai Phase 1

```bash
# Semua command hijau:
npm run type-check && npm run lint && npm run build

# Manual check:
✅ Forgot password: email terkirim, link reset valid
✅ Reset password: password berhasil diubah
✅ Halaman gedung: CRUD berfungsi lengkap
✅ Semua 13 master data punya export, import, dan template Excel
✅ Halaman profil: user bisa lihat dan edit data diri
✅ FakultasSection tampil di index master data
✅ Semua master data punya soft delete + restore + hard delete
✅ Audit log tercatat untuk semua aksi CRUD
```
