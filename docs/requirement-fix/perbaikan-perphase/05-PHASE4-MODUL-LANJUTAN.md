# Phase 4 - Modul Lanjutan, EDOM, Audit Log, dan Laporan

## Tujuan

Merapikan modul lanjutan setelah fondasi data dan flow utama siap: EDOM, audit log, laporan, dan dashboard berbasis data real. Fitur notifikasi ditunda penuh sebagai backlog.

## Masalah dari File Gabungan

- EDOM masih placeholder dan mismatch tabel.
- Fitur notifikasi, termasuk template, queue, event, dan in-app notification, ditunda/backlog.
- `audit_logs` masih kosong.
- Laporan belum terbukti karena data sumber kosong.
- Dashboard chart/metric masih sebagian hardcoded dan boleh menjadi fixture sementara.
- Smoke test per role belum dilakukan penuh.

## File/Area Terkait

- `src/actions/edom.ts`
- `src/lib/admin/edom.ts`
- `src/modules/edom/*`
- `src/app/dashboard/edom/page.tsx`
- `src/modules/reports/*`
- `src/lib/admin/reports.ts`
- `src/modules/dashboard/overview.tsx`
- tabel `edom_questions`
- tabel `edom_responses`
- tabel `edom_response_answers`
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

### 2. Audit Log

Langkah:

1. Pastikan action mutasi penting menulis audit log.
2. Pastikan audit log bisa dibaca dari dashboard/admin yang sesuai.
3. Catat event yang nanti perlu notifikasi sebagai backlog.
4. Jangan jadikan notifikasi sebagai blocker Phase 4.

Definition of done:

- Audit log bisa dilihat dari dashboard.
- Event calon notifikasi terdokumentasi sebagai backlog.
- Tidak ada klaim fitur notifikasi sudah siap jika belum diuji.

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
- Audit log punya data nyata.
- Notifikasi ditunda/backlog dan tidak menjadi blocker.
- Laporan membaca data real.
- Smoke test per role terdokumentasi.
- `npm run type-check` PASS.
