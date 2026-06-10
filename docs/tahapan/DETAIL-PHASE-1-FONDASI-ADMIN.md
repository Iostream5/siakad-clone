# Detail Phase 1 - Fondasi Admin dan Access Control

Dokumen ini adalah rincian kerja Phase 1 untuk project SIAKAD STAI Al-Ittihad. PRD utama tetap `docs/PRD-SIAKAD.md`; dokumen ini dipakai sebagai checklist kerja harian agar tidak nyasar ke fitur lucu tapi belum penting.

## Tujuan Phase 1

Phase 1 bertujuan membuat fondasi admin benar-benar bisa dipakai untuk mengelola sistem inti:

- Login dan session stabil.
- Admin bisa mengelola user.
- Admin bisa mengelola role dan permission.
- Admin bisa mengelola menu/sidebar dari database.
- Admin bisa mengelola master data akademik utama.
- Semua mutasi penting punya authorization server-side.
- Semua aksi penting tercatat di audit log.
- Build/type/lint tetap hijau.

Output akhir Phase 1 adalah dashboard admin yang bisa dipakai sebagai pusat kendali sistem. Bukan cuma halaman cantik yang kalau diklik isinya pura-pura kerja.

## Scope Phase 1

Masuk scope:

- Auth admin via Supabase Auth.
- Session cookie internal yang aman.
- Route protection via `src/proxy.ts`.
- User management.
- Role dan permission management.
- Menu builder.
- Master data akademik dasar.
- Import/export dasar untuk master data prioritas.
- Soft delete dan restore.
- Audit log.
- Dashboard admin berbasis data real.

Tidak masuk scope:

- Payment gateway production final.
- Xendit production.
- FCM push notification.
- EDOM.
- Multi-tenant penuh.
- LMS lanjutan.
- KRS/nilai detail production-grade.
- Redesign UI besar-besaran tanpa kebutuhan fitur.

## Stack dan Pola Implementasi

Stack wajib:

- Next.js 16.2.4 App Router.
- React 19.
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase JS Client.
- SQL migrations di `supabase/migrations/`.
- TypeScript strict.
- Tailwind CSS v4.
- Shadcn-style UI dan Radix.
- Server Actions untuk mutasi.

Pola folder yang dipakai:

- Route/page: `src/app/dashboard/...`
- Server Actions: `src/actions/...`
- Query/service helper: `src/lib/admin/...`
- UI feature module: `src/modules/...`
- Reusable UI: `src/components/ui/...`
- Auth helper: `src/lib/auth.ts`
- Navigation/access helper: `src/lib/navigation.ts`, `src/lib/admin/access-control.ts`
- Supabase client: `src/supabase/...`

Aturan teknis:

- Jangan pakai Prisma.
- Jangan pakai Better Auth atau NextAuth.
- Jangan pakai `middleware.ts`.
- Jangan hardcode akses baru di UI kalau bisa pakai menu/permission database.
- Jangan gunakan service role di client component.
- Jangan simpan secret di file tracked.

## Phase 1.1 - Auth dan Session Finalisasi

Tujuan:

- Login admin stabil memakai Supabase Auth.
- Demo auth tetap boleh untuk DEV, tapi mati di production.
- Session aman dan bisa resolve role aktif.

Task:

- Audit `src/actions/auth.ts`.
- Audit `src/lib/auth.ts`.
- Pastikan login email dan username berjalan.
- Pastikan user nonaktif atau soft-deleted tidak bisa login.
- Pastikan session cookie signed ketika secret tersedia.
- Pastikan fallback unsigned hanya berlaku non-production.
- Pastikan logout membersihkan cookie dan Supabase session.
- Pastikan switch active role hanya untuk role yang dimiliki user.

Acceptance criteria:

- Admin bisa login via Supabase Auth.
- User nonaktif tidak bisa login.
- User deleted tidak bisa login.
- Demo login tidak aktif di `NODE_ENV=production`.
- `/dashboard` tanpa session redirect ke `/login`.
- `/login` bisa dibuka tanpa session.

Test:

- `npm run type-check`
- `npm run lint`
- `npm run build`
- Smoke test `/login`.
- Smoke test `/dashboard` tanpa session.
- Login manual admin.

## Phase 1.2 - RBAC Roles dan Permissions

Tujuan:

- Role dan permission bisa dikelola dari dashboard.
- Server-side authorization menjadi sumber keamanan utama.

Task:

- Audit tabel:
  - `users`
  - `user_roles`
  - `roles` jika tersedia
  - `permissions` jika tersedia
  - `role_permissions` atau tabel akses sejenis
  - `role_menu_permissions`
- Audit `src/actions/access-control.ts`.
- Audit `src/lib/admin/access-control.ts`.
- Pastikan admin bisa mengubah role user.
- Pastikan admin bisa mengatur akses menu per role.
- Pastikan perubahan role langsung mempengaruhi sidebar dan akses halaman.
- Tambahkan validasi input untuk semua action RBAC.
- Pastikan hanya admin yang bisa mengelola akses.

Acceptance criteria:

- Admin bisa memberi lebih dari satu role ke user.
- Admin bisa memilih role aktif jika user punya multi-role.
- Admin bisa mengubah akses menu per role.
- User non-admin tidak bisa mengakses pengaturan akses.
- Server Action RBAC punya `requireAuthorizedUser`.

Test:

- Ubah role user dari dashboard.
- Login sebagai user tersebut.
- Cek menu berubah sesuai role.
- Cek akses route yang tidak diizinkan redirect ke dashboard.

## Phase 1.3 - Dynamic Sidebar dan Menu Builder

Tujuan:

- Sidebar utama mengambil data dari database.
- Admin bisa mengelola menu tanpa edit kode setiap kali nambah menu.

Task:

- Audit `src/components/layout/sidebar.tsx`.
- Audit `src/lib/navigation.ts`.
- Audit `src/lib/admin/menus.ts`.
- Audit `src/actions/menus.ts`.
- Audit `src/modules/settings/menu-builder-manager.tsx`.
- Pastikan menu punya:
  - key unik
  - label
  - href
  - icon
  - parent key
  - sort order
  - role/access mapping
  - active/inactive
  - deleted_at
- Pastikan nested menu tampil benar.
- Pastikan menu inactive/deleted tidak tampil.
- Pastikan move up/down atau sort order berjalan.
- Pastikan perubahan menu tercatat di audit log.

Acceptance criteria:

- Sidebar admin berasal dari tabel `menus` dan akses role.
- Admin bisa create/update/delete menu.
- Admin bisa mengatur urutan menu.
- Menu child tampil di parent yang benar.
- Menu tanpa akses tidak tampil untuk role terkait.

Test:

- Tambah menu dummy.
- Ubah urutan menu.
- Nonaktifkan menu.
- Login role lain dan cek menu tidak muncul.
- Hapus/restore menu jika fitur restore tersedia.

## Phase 1.4 - User Management

Tujuan:

- Admin bisa mengelola akun pengguna operasional.

Task:

- Audit `src/app/dashboard/master-data/pengguna/page.tsx`.
- Audit `src/modules/master-data/user-manager.tsx`.
- Audit `src/actions/users.ts`.
- Audit relasi `auth.users` dan `public.users`.
- Pastikan list user punya search, filter, pagination.
- Pastikan update user tidak merusak Supabase Auth.
- Pastikan soft delete user tersedia.
- Pastikan active/inactive user tersedia.
- Pastikan validasi email, username, role, dan status.
- Pastikan audit log tercatat untuk update/delete user.

Acceptance criteria:

- Admin bisa melihat daftar user.
- Admin bisa mencari user.
- Admin bisa update nama, email, role, dan status.
- Admin bisa menonaktifkan user.
- User nonaktif tidak bisa login.
- Mutasi user hanya bisa oleh admin.

Test:

- Update user test.
- Nonaktifkan user test.
- Coba login user nonaktif.
- Aktifkan lagi user test.
- Cek audit log.

## Phase 1.5 - Master Data Akademik Dasar

Tujuan:

- Data dasar kampus bisa dikelola secara konsisten.

Modul prioritas:

1. Kampus
2. Fakultas
3. Program Studi
4. Ruangan
5. Kelas
6. Tahun Akademik
7. Kurikulum
8. Mata Kuliah
9. Dosen
10. Mahasiswa

Task umum tiap modul:

- Audit route page.
- Audit Server Action.
- Audit service helper di `src/lib/admin`.
- Audit UI manager di `src/modules/master-data`.
- Pastikan create/update/delete berjalan.
- Pastikan search berjalan.
- Pastikan pagination atau pembatasan data tersedia.
- Pastikan soft delete konsisten.
- Pastikan restore tersedia jika sudah ada pola.
- Pastikan import/export tersedia untuk modul prioritas.
- Pastikan relasi FK aman.
- Pastikan audit log tercatat untuk mutasi penting.

Acceptance criteria umum:

- Admin bisa CRUD data.
- Data deleted tidak tampil di list aktif.
- Relasi antar master data tidak rusak.
- Error validasi muncul jelas di UI.
- Mutasi hanya bisa role yang berwenang.

Urutan pengerjaan disarankan:

1. Kampus
2. Fakultas
3. Program Studi
4. Ruangan
5. Kelas
6. Tahun Akademik
7. Kurikulum
8. Mata Kuliah
9. Dosen
10. Mahasiswa

Alasannya sederhana: data bawah jangan dibuat dulu kalau data induknya belum benar. Masa mahasiswa punya prodi gaib, nanti database ikut halu.

## Phase 1.6 - Import dan Export

Tujuan:

- Admin bisa export data dan import data awal untuk master data prioritas.

Task:

- Audit route export yang sudah ada.
- Audit template route yang sudah ada.
- Pastikan format Excel konsisten.
- Pastikan import validasi kolom wajib.
- Pastikan import menolak data duplikat yang merusak constraint.
- Pastikan error import menjelaskan baris dan kolom bermasalah.
- Pastikan audit log tercatat untuk import.

Prioritas import/export:

- Kampus
- Fakultas
- Program Studi
- Kelas
- Kurikulum
- Mata Kuliah
- Tahun Akademik
- Dosen
- Mahasiswa

Acceptance criteria:

- Export menghasilkan file bisa dibuka.
- Template import tersedia.
- Import data valid berhasil.
- Import data invalid gagal dengan pesan jelas.
- Import tidak membuat duplikasi liar.

## Phase 1.7 - Audit Log

Tujuan:

- Aksi penting bisa dilacak.

Task:

- Audit `src/lib/admin/audit-logger.ts`.
- Audit `src/lib/admin/activity-audit.ts`.
- Audit halaman audit aktivitas.
- Pastikan action penting mencatat:
  - user pelaku
  - modul
  - aksi
  - target table
  - old_data jika relevan
  - new_data jika relevan
  - timestamp
- Pastikan audit log tidak bisa dihapus dari UI biasa.
- Pastikan admin bisa filter audit log.

Acceptance criteria:

- Login success/fail tercatat.
- CRUD user tercatat.
- CRUD role/menu tercatat.
- CRUD master data tercatat.
- Admin bisa membaca audit log.

## Phase 1.8 - Dashboard Admin Real Data

Tujuan:

- Dashboard admin menampilkan kondisi sistem dari database, bukan angka pajangan.

Task:

- Audit `src/app/dashboard/page.tsx`.
- Audit `src/modules/dashboard/overview.tsx`.
- Audit query dashboard di `src/lib/admin`.
- Tampilkan minimal:
  - total user aktif
  - total mahasiswa
  - total dosen
  - total pendaftar PMB
  - total tagihan belum lunas
  - aktivitas terbaru
- Pastikan query punya fallback aman jika tabel kosong.
- Pastikan error query tidak membuat seluruh dashboard crash.

Acceptance criteria:

- Dashboard tampil setelah admin login.
- Angka sesuai database.
- Empty state aman.
- Recent activity tampil jika ada audit log.

## Phase 1.9 - Quality Gate dan Dokumentasi

Tujuan:

- Phase 1 selesai dengan bukti, bukan modal "kayaknya bisa".

Task:

- Bersihkan warning lint prioritas di area Phase 1.
- Pastikan tidak ada `any` baru di kode Phase 1.
- Pastikan tidak ada unused import baru.
- Pastikan route admin smoke test lolos.
- Update dokumentasi jika ada perubahan struktur atau env.

Gate wajib:

```bash
npm run type-check
npm run lint
npm run build
```

Smoke test manual:

- `/login`
- `/dashboard`
- `/dashboard/master-data/pengguna`
- `/dashboard/pengaturan/akun-akses`
- `/dashboard/pengaturan/menu-builder`
- `/dashboard/master-data/kampus`
- `/dashboard/master-data/fakultas`
- `/dashboard/master-data/program-studi`
- `/dashboard/master-data/tahun-akademik`

Supabase dev check:

- Tabel utama ada.
- RLS aktif untuk tabel sensitif.
- Policy service role tersedia untuk backend.
- Data menu dan role sesuai UI.

## Checklist Per Task

Gunakan checklist ini setiap mengerjakan satu fitur kecil:

- Scope task jelas dan kecil.
- File terkait dibaca dulu.
- Tidak mengubah stack.
- Tidak membuat folder arsitektur baru tanpa alasan kuat.
- Server Action mutasi punya authorization.
- Input divalidasi.
- Query database tidak mengambil data berlebihan.
- UI punya loading/empty/error state.
- Audit log dibuat untuk aksi penting.
- Type-check sukses.
- Lint sukses.
- Build sukses untuk perubahan besar.
- Smoke test route terkait.

## Definisi Selesai Phase 1

Phase 1 dianggap selesai jika:

- Admin login Supabase Auth berjalan.
- Session dan route protection stabil.
- User management berjalan.
- Role dan permission management berjalan.
- Menu builder berjalan.
- Sidebar database-driven berjalan.
- Master data prioritas bisa CRUD.
- Import/export prioritas tersedia atau gap-nya terdokumentasi jelas.
- Audit log mencatat aksi penting.
- Dashboard admin memakai data real.
- `npm run type-check` sukses.
- `npm run lint` sukses.
- `npm run build` sukses.
- Smoke test admin utama lolos.

Kalau salah satu gate teknis merah, Phase 1 belum selesai. Jangan maksa bilang "done", nanti yang done cuma semangatnya.
