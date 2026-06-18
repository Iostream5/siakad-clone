# Phase 1 - Fondasi Admin dan Access Control

## Tujuan

Membuat fondasi admin benar-benar bisa dipakai: user, role, sidebar/menu sementara, permission, audit mutasi, dan kualitas Server Action.

## Masalah dari File Gabungan

- Tabel `menus` kosong; untuk sementara sidebar/menu tetap boleh memakai fallback hardcoded.
- `user_roles`, `role_menu_permissions`, dan `user_menu_permissions` masih kosong.
- Data user/role DEV belum cukup untuk test role utama.
- Banyak Server Action belum diaudit penuh.
- Ada potensi raw error message dikirim ke client.
- Ada audit action typo pada forgot password.
- Ada import order bermasalah di `src/actions/finance.ts`.
- Banyak `any` melemahkan TypeScript strict.

## File/Area Terkait

- `src/lib/access-control.ts`
- `src/lib/admin/access-control.ts`
- `src/lib/admin/menus.ts`
- `src/components/layout/sidebar.tsx`
- `src/lib/constants.ts`
- `src/actions/auth.ts`
- `src/actions/users.ts`
- `src/actions/access-control.ts`
- `src/actions/menus.ts`
- `src/actions/finance.ts`
- `src/lib/admin/audit-logger.ts`
- tabel `users`
- tabel `user_roles`
- tabel `menus`
- tabel `role_menu_permissions`
- tabel `user_menu_permissions`
- tabel `audit_logs`

## Perbaikan Urgent

### 1. Seed User dan Role Dasar

Langkah:

1. Siapkan user DEV untuk Admin, Prodi, Dosen, Mahasiswa, Calon Mahasiswa, dan Keuangan.
2. Pastikan `public.users` sinkron dengan Auth user.
3. Isi `user_roles` minimal untuk role utama.
4. Test login tiap role.

Definition of done:

- Login role utama bisa diuji.
- Role aktif dan multi-role berjalan.
- Dashboard dan sidebar sesuai role.

### 2. Pertahankan Menu Hardcoded/Fallback Sementara

Langkah:

1. Jadikan `menuDefinitions` atau `src/lib/constants.ts` sebagai sumber menu sementara.
2. Pastikan sidebar menampilkan route penting sesuai role yang sedang diuji.
3. Catat rencana pindah ke tabel `menus` sebagai backlog, bukan blocker Phase 1.
4. Menu Builder boleh tetap ada, tetapi belum wajib menjadi sumber utama sidebar.

Definition of done:

- Sidebar tampil stabil dari fallback hardcoded.
- Route penting untuk role utama bisa diakses sesuai permission.
- Gap menuju menu DB/Menu Builder terdokumentasi.
- Tidak ada klaim sidebar sudah database-driven jika belum terbukti.

### 3. Audit Server Action Admin

Langkah:

1. Audit action auth, users, access-control, dan menus.
2. Pastikan tiap mutasi punya auth server-side, permission check, validasi input, audit log, dan error aman.
3. Perbaiki raw `error.message` yang dikirim ke client.

Definition of done:

- Mutasi admin tidak bisa dipanggil role salah.
- Audit log masuk untuk create/update/delete/role/menu changes.
- Error client tidak membocorkan detail DB.

### 4. Quick Fix Kode Fondasi

Langkah:

1. Fix audit action typo di forgot password agar tidak dicatat sebagai `LOGIN_SUCCESS`.
2. Pindahkan import di `src/actions/finance.ts` ke bagian atas file.
3. Ganti `any` paling gampang di `audit-logger.ts` menjadi `Record<string, unknown> | null`.

Definition of done:

- Audit log auth lebih akurat.
- Import order rapi.
- Warning `any` mulai turun.

## Gate Phase 1

- Admin bisa login.
- Role utama bisa diuji.
- Sidebar/menu hardcoded sementara berjalan dan route penting terlihat.
- Menu Builder/menu DB tercatat sebagai backlog.
- Mutasi admin mencatat audit.
- `npm run type-check` PASS.
- `npm run lint` PASS.
