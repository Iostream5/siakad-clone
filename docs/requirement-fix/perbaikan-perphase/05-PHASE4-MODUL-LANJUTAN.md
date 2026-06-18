# Phase 4 - Modul Lanjutan, EDOM, Notifikasi, dan Laporan

## Tujuan

Merapikan modul lanjutan setelah fondasi data dan flow utama siap: EDOM, notifikasi, laporan, dan dashboard berbasis data real.

## Masalah dari File Gabungan

- EDOM masih placeholder dan mismatch tabel.
- `notification_queue` masih kosong.
- `audit_logs` masih kosong.
- Laporan belum terbukti karena data sumber kosong.
- Dashboard chart/metric masih sebagian hardcoded.
- Smoke test per role belum dilakukan penuh.

## File/Area Terkait

- `src/actions/edom.ts`
- `src/lib/admin/edom.ts`
- `src/modules/edom/*`
- `src/app/dashboard/edom/page.tsx`
- `src/lib/admin/notifications.ts`
- `src/actions/notifications.ts`
- `src/modules/dashboard/notification-list.tsx`
- `src/app/dashboard/notifikasi/page.tsx`
- `src/modules/reports/*`
- `src/lib/admin/reports.ts`
- `src/modules/dashboard/overview.tsx`
- tabel `edom_questions`
- tabel `edom_responses`
- tabel `edom_response_answers`
- tabel `notification_templates`
- tabel `notification_queue`
- tabel `notifikasi`
- tabel `audit_logs`

## Perbaikan Urgent

### 1. Fix EDOM Minimal

Langkah:

1. Samakan service/action/UI dengan tabel EDOM aktual.
2. Implement admin kelola pertanyaan.
3. Implement mahasiswa submit evaluasi.
4. Implement rekap admin/dosen.

Definition of done:

- EDOM tidak query tabel salah.
- Data evaluasi tersimpan.
- Rekap terlihat.

### 2. Notifikasi dan Audit Log

Langkah:

1. Pastikan event penting bisa membuat notifikasi atau masuk queue.
2. Cek template notifikasi yang sudah ada.
3. Pastikan action mutasi penting menulis audit log.
4. Dashboard notifikasi tidak hanya preview kosong jika data ada.

Definition of done:

- Notifikasi sample bisa tampil.
- Queue/event tercatat.
- Audit log bisa dilihat dari dashboard.

### 3. Laporan Berbasis Data Real

Langkah:

1. Pastikan laporan akademik punya data.
2. Pastikan laporan PMB punya data.
3. Pastikan laporan keuangan punya data.
4. Tambahkan empty state yang jelas bila data belum lengkap.

Definition of done:

- Laporan tidak memakai data palsu.
- Filter laporan berjalan.
- Export penting berjalan bila sudah masuk scope.

### 4. Smoke Test Per Role Lanjutan

Langkah:

1. Jalankan checklist untuk Admin, Prodi, Dosen, Mahasiswa, Keuangan, dan Pimpinan.
2. Catat PASS/FAIL/PENDING DATA.
3. Buat daftar blocker dari hasil test.

Definition of done:

- Hasil smoke test terdokumentasi.
- Error runtime punya route, role, dan langkah reproduksi.

## Gate Phase 4

- EDOM minimal jalan.
- Notifikasi/audit log punya data nyata.
- Laporan membaca data real.
- Smoke test per role terdokumentasi.
- `npm run type-check` PASS.

