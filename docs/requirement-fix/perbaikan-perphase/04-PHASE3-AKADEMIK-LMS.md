# Phase 3 - Akademik Inti dan LMS

## Tujuan

Membuktikan flow akademik berjalan: jadwal, KRS, approval, nilai, KHS/transkrip, dan LMS.

## Masalah dari File Gabungan

- Data `program_studi`, `dosen`, `mahasiswa`, `mata_kuliah`, `jadwal_kuliah`, `krs_header`, `nilai_akhir`, dan `lms_*` masih kosong.
- Flow KRS belum terbukti karena tidak ada mahasiswa/jadwal/KRS.
- Batas SKS masih hardcoded.
- `dashboardMetrics`, `studentBilling`, dan `offeredCourses` masih hardcoded di constants.
- Banyak module LMS masih memakai `any`.
- Belum ada smoke test role dosen/mahasiswa untuk akademik dan LMS.

## File/Area Terkait

- `src/app/dashboard/krs/page.tsx`
- `src/actions/krs.ts`
- `src/lib/admin/krs.ts`
- `src/modules/krs/krs-manager.tsx`
- `src/modules/krs/krs-panel.tsx`
- `src/app/dashboard/nilai/page.tsx`
- `src/actions/grades.ts`
- `src/lib/admin/grades.ts`
- `src/app/dashboard/akademik/lms/*`
- `src/actions/lms.ts`
- `src/lib/admin/lms.ts`
- `src/modules/lms/*`
- `src/lib/constants.ts`
- tabel `program_studi`
- tabel `dosen`
- tabel `mahasiswa`
- tabel `mata_kuliah`
- tabel `jadwal_kuliah`
- tabel `krs_header`
- tabel `krs_detail`
- tabel `nilai_akhir`
- tabel `lms_materi`
- tabel `lms_tugas`
- tabel `lms_pengumpulan`
- tabel `lms_forum_topik`

## Perbaikan Urgent

### 1. Seed Data Akademik Minimal

Langkah:

1. Isi program studi.
2. Isi dosen dan mahasiswa.
3. Isi mata kuliah.
4. Isi ruangan dan jadwal kuliah.
5. Hubungkan mahasiswa ke program studi.
6. Hubungkan dosen ke jadwal.

Definition of done:

- KRS mahasiswa bisa menampilkan jadwal.
- Dosen punya kelas.
- Admin/Prodi bisa melihat data akademik.

### 2. Seed dan Test KRS

Langkah:

1. Buat KRS draft/diajukan/disetujui.
2. Test mahasiswa submit KRS.
3. Test dosen/prodi approve/reject KRS.
4. Pastikan audit log masuk.
5. Pindahkan batas SKS dari hardcoded ke aturan/config jika sudah ada sumber datanya.

Definition of done:

- Mahasiswa bisa ajukan KRS.
- Dosen/Prodi bisa approve/reject.
- Status berubah benar.
- Audit log masuk.

### 3. Seed dan Test Nilai

Langkah:

1. Buat komponen nilai sample.
2. Buat nilai akhir sample.
3. Test dosen input nilai.
4. Test mahasiswa hanya melihat nilai miliknya.

Definition of done:

- Dosen bisa input nilai kelasnya.
- Mahasiswa bisa lihat nilai sendiri.
- Role lain tidak bocor data.

### 4. Seed dan Test LMS

Langkah:

1. Buat materi.
2. Buat tugas.
3. Buat submission.
4. Buat forum dan komentar.
5. Test akses dosen dan mahasiswa.

Definition of done:

- Dosen bisa mengelola kelas LMS.
- Mahasiswa bisa melihat materi/tugas/forum sesuai KRS.
- Submission dan grading berjalan minimal.

### 5. Ganti Data Hardcoded ke DB

Langkah:

1. Identifikasi `dashboardMetrics`, `studentBilling`, dan `offeredCourses`.
2. Ganti bertahap dengan query DB.
3. Empty state harus jelas saat data belum ada.

Definition of done:

- Dashboard dan KRS tidak menampilkan data palsu.
- Billing membaca tagihan real.
- KRS membaca jadwal real.

## Gate Phase 3

- Data akademik minimal tersedia.
- KRS bisa submit dan approve.
- Nilai bisa input dan dilihat sesuai role.
- LMS minimal berjalan.
- Data hardcoded utama sudah berkurang.
- `npm run type-check` PASS.

