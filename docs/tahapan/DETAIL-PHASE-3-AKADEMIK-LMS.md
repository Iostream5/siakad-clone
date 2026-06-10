# Detail Phase 3 - Akademik Inti dan LMS

Dokumen ini merinci Phase 3 untuk project SIAKAD STAI Al-Ittihad. Fokusnya adalah membuat proses akademik mahasiswa dan dosen berjalan end-to-end: jadwal, KRS, nilai, KHS/transkrip, dan LMS. Bukan sekadar halaman akademik yang kelihatan sibuk tapi datanya cuma numpang lewat.

PRD utama tetap `docs/PRD-SIAKAD.md`. Dokumen ini dipakai sebagai checklist operasional.

## Tujuan Phase 3

Phase 3 bertujuan menyelesaikan alur:

- Admin/prodi mengelola jadwal kuliah.
- Mahasiswa mengisi KRS.
- Dosen/prodi menyetujui KRS.
- Dosen menginput nilai.
- Mahasiswa melihat KHS dan transkrip.
- Dosen mengelola kelas LMS.
- Mahasiswa mengakses materi, tugas, submission, dan forum.
- Nilai LMS bisa dipakai sebagai bagian dari nilai akademik jika dibutuhkan.

Output akhir Phase 3 adalah flow akademik yang bisa dipakai oleh prodi, dosen, dan mahasiswa.

## Scope Phase 3

Masuk scope:

- Tahun akademik aktif dan periode KRS.
- Jadwal kuliah.
- KRS mahasiswa.
- Approval KRS.
- Nilai dan komponen nilai.
- KHS dan transkrip.
- LMS kelas berbasis jadwal.
- Materi kuliah.
- Tugas dan pengumpulan.
- Penilaian tugas.
- Forum diskusi.
- Audit log untuk aksi akademik penting.

Tidak masuk scope:

- EDOM.
- FCM push notification.
- Sertifikat otomatis.
- Online exam kompleks.
- Quiz engine penuh.
- Plagiarism checker.
- Video conference.
- Multi-tenant penuh.

## Area File Utama

- KRS actions: `src/actions/krs.ts`
- KRS service: `src/lib/admin/krs.ts`
- KRS UI: `src/modules/krs`
- Grades actions: `src/actions/grades.ts`
- Grades service: `src/lib/admin/grades.ts`
- Grades UI: `src/modules/grades`
- LMS actions: `src/actions/lms.ts`
- LMS service: `src/lib/admin/lms.ts`
- LMS UI: `src/modules/lms`
- Akademik pages: `src/app/dashboard/akademik/lms`
- KRS page: `src/app/dashboard/krs/page.tsx`
- Nilai page: `src/app/dashboard/nilai/page.tsx`
- Master jadwal/mata kuliah/dosen/mahasiswa: `src/modules/master-data`
- Migrations: `supabase/migrations/`

## Phase 3.1 - Audit Schema Akademik dan LMS

Tujuan:

- Pastikan database siap untuk flow akademik.

Task:

- Audit tabel:
  - `tahun_akademik`
  - `mata_kuliah`
  - `jadwal_kuliah`
  - `krs_header`
  - `krs_detail`
  - `nilai_komponen`
  - `nilai_akhir`
  - `mahasiswa`
  - `dosen`
  - `lms_materi`
  - `lms_tugas`
  - `lms_pengumpulan`
  - `lms_forum_topik`
  - `lms_forum_komentar`
- Pastikan FK dan index cukup.
- Pastikan RLS aktif untuk tabel sensitif.
- Pastikan policy backend service role tersedia.
- Pastikan status KRS/nilai punya alur jelas.
- Tambahkan migration jika ada kolom penting yang belum tersedia.

Acceptance criteria:

- Semua tabel Phase 3 tersedia.
- Relasi jadwal, dosen, mata kuliah, mahasiswa, dan KRS jelas.
- RLS aktif untuk tabel sensitif.
- Tidak ada status akademik yang ambigu.

## Phase 3.2 - Jadwal Kuliah

Tujuan:

- Admin/prodi bisa mengelola jadwal kuliah sebagai basis KRS dan LMS.

Task:

- Pastikan jadwal punya:
  - tahun akademik
  - mata kuliah
  - dosen
  - nama kelas
  - hari
  - jam mulai
  - jam selesai
  - ruangan
  - kapasitas
  - peserta
- Tambahkan UI CRUD jadwal jika belum ada.
- Pastikan jadwal tidak bentrok untuk dosen/ruangan pada waktu yang sama.
- Pastikan jadwal hanya memakai tahun akademik valid.
- Pastikan audit log tercatat.

Acceptance criteria:

- Admin/prodi bisa membuat jadwal.
- Admin/prodi bisa update jadwal.
- Jadwal bentrok ditolak.
- Jadwal muncul di KRS dan LMS.

## Phase 3.3 - KRS Mahasiswa

Tujuan:

- Mahasiswa bisa mengambil mata kuliah sesuai periode dan aturan.

Task:

- Audit `submitKrsAction`.
- Pastikan mahasiswa hanya bisa submit KRS miliknya.
- Pastikan tahun akademik aktif.
- Pastikan periode KRS terbuka.
- Pastikan jadwal tersedia dan kapasitas cukup.
- Pastikan mahasiswa tidak mengambil jadwal duplikat.
- Pastikan total SKS dihitung.
- Pastikan status awal KRS jelas, misalnya `Draft` atau `Menunggu Persetujuan`.
- Pastikan error jelas untuk mahasiswa.

Acceptance criteria:

- Mahasiswa bisa memilih jadwal.
- Mahasiswa bisa submit KRS.
- Submit di luar periode ditolak.
- Jadwal penuh ditolak.
- KRS tersimpan di `krs_header` dan `krs_detail`.

## Phase 3.4 - Approval KRS

Tujuan:

- Dosen/prodi/admin bisa menyetujui atau menolak KRS.

Task:

- Audit `approveKrsAction`.
- Pastikan hanya role berwenang yang bisa approve.
- Pastikan dosen hanya approve mahasiswa bimbingan jika aturan itu dipakai.
- Pastikan prodi hanya approve mahasiswa prodi terkait jika aturan itu dipakai.
- Pastikan catatan approval tersimpan.
- Pastikan status berubah jelas:
  - Menunggu
  - Disetujui
  - Ditolak
- Pastikan audit log tercatat.

Acceptance criteria:

- Dosen/prodi/admin bisa approve KRS sesuai akses.
- Role tidak berwenang ditolak.
- Mahasiswa bisa melihat status KRS.
- Catatan approval tampil.

## Phase 3.5 - Nilai dan Komponen Nilai

Tujuan:

- Dosen bisa menginput nilai kelas dan sistem menghitung nilai akhir.

Task:

- Audit `getClassGradesAction`.
- Audit `updateGradeAction`.
- Pastikan dosen hanya input nilai untuk kelasnya.
- Pastikan admin/prodi bisa melihat atau mengelola sesuai akses.
- Pastikan komponen nilai jelas:
  - tugas
  - UTS
  - UAS
  - kehadiran/partisipasi jika dipakai
- Pastikan bobot nilai valid dan total masuk akal.
- Pastikan nilai angka dikonversi ke huruf dan bobot.
- Pastikan update nilai tercatat audit log.

Acceptance criteria:

- Dosen bisa melihat daftar mahasiswa di kelas.
- Dosen bisa input/update nilai.
- Nilai akhir, huruf, dan bobot tersimpan.
- Mahasiswa bisa melihat nilai setelah publish jika fitur publish tersedia.

## Phase 3.6 - KHS dan Transkrip

Tujuan:

- Mahasiswa bisa melihat hasil studi.

Task:

- Pastikan KHS membaca nilai dari semester/tahun akademik.
- Pastikan transkrip membaca seluruh nilai lulus.
- Hitung IPS per semester.
- Hitung IPK kumulatif.
- Pastikan mata kuliah mengulang ditangani dengan aturan jelas.
- Pastikan export PDF tersedia jika pola PDF sudah ada.
- Pastikan mahasiswa hanya melihat datanya sendiri.
- Pastikan admin/prodi bisa melihat sesuai akses.

Acceptance criteria:

- Mahasiswa bisa melihat KHS.
- Mahasiswa bisa melihat transkrip.
- IPS/IPK benar sesuai data.
- Export PDF berjalan jika diaktifkan.
- Akses lintas mahasiswa ditolak.

## Phase 3.7 - LMS Kelas Berbasis Jadwal

Tujuan:

- LMS memakai jadwal kuliah sebagai classroom.

Task:

- Audit `/dashboard/akademik/lms`.
- Audit `lms-dashboard.tsx`.
- Pastikan dosen melihat kelas yang dia ajar.
- Pastikan mahasiswa melihat kelas yang dia ambil dari KRS approved.
- Pastikan admin bisa melihat semua atau sesuai kebutuhan.
- Pastikan kelas kosong punya empty state.

Acceptance criteria:

- Dosen melihat daftar kelasnya.
- Mahasiswa melihat daftar kelasnya.
- Klik kelas membuka detail LMS.
- Akses kelas yang bukan haknya ditolak.

## Phase 3.8 - Materi Kuliah

Tujuan:

- Dosen bisa mengunggah atau menautkan materi kuliah.

Task:

- Audit `createLmsMateriAction`.
- Pastikan dosen hanya membuat materi untuk kelasnya.
- Pastikan materi punya:
  - judul
  - deskripsi
  - file/link
  - tipe file
  - visible/invisible
- Pastikan storage Supabase dipakai untuk file jika upload aktif.
- Jika storage belum siap, batasi ke link/file_url dan dokumentasikan gap.
- Pastikan mahasiswa bisa melihat materi visible.

Acceptance criteria:

- Dosen bisa membuat materi.
- Mahasiswa bisa melihat materi.
- Materi hidden tidak tampil ke mahasiswa.
- Aksi tercatat di audit log.

## Phase 3.9 - Tugas dan Submission

Tujuan:

- Dosen bisa membuat tugas dan mahasiswa bisa mengumpulkan.

Task:

- Audit `createLmsTugasAction`.
- Audit `submitLmsTugasAction`.
- Pastikan tugas punya:
  - judul
  - instruksi
  - deadline
  - poin maksimal
  - file/link opsional
- Pastikan mahasiswa hanya submit untuk kelas yang dia ikuti.
- Pastikan submit setelah deadline ditolak atau diberi status terlambat, sesuai aturan.
- Pastikan mahasiswa bisa update submission jika masih boleh.
- Pastikan file submission memakai storage jika aktif.

Acceptance criteria:

- Dosen bisa membuat tugas.
- Mahasiswa bisa submit tugas.
- Submission tersimpan.
- Deadline diterapkan.
- Akses lintas kelas ditolak.

## Phase 3.10 - Penilaian Tugas LMS

Tujuan:

- Dosen bisa memberi nilai dan feedback untuk submission.

Task:

- Audit `gradeSubmissionAction`.
- Pastikan dosen hanya menilai submission kelasnya.
- Pastikan nilai tidak melebihi poin maksimal.
- Pastikan feedback tersimpan.
- Pastikan graded_by dan graded_at tersimpan.
- Tentukan apakah nilai LMS otomatis masuk nilai akademik atau hanya referensi.

Acceptance criteria:

- Dosen bisa melihat submission.
- Dosen bisa memberi nilai dan feedback.
- Mahasiswa bisa melihat nilai/feedback.
- Akses dosen lain ditolak.

## Phase 3.11 - Forum Diskusi

Tujuan:

- Dosen dan mahasiswa bisa berdiskusi di kelas.

Task:

- Audit `createLmsForumTopikAction`.
- Audit `createLmsForumKomentarAction`.
- Pastikan topik hanya bisa dibuat oleh peserta kelas.
- Pastikan komentar hanya bisa dibuat oleh peserta kelas.
- Pastikan dosen/admin bisa pin topik jika fitur ada.
- Pastikan konten kosong ditolak.
- Pastikan audit log atau activity log tersedia jika diperlukan.

Acceptance criteria:

- Peserta kelas bisa membuat topik.
- Peserta kelas bisa komentar.
- Non-peserta tidak bisa akses forum.
- Topik dan komentar tampil urut.

## Phase 3.12 - Security dan Authorization Review

Tujuan:

- Data akademik tidak bocor antar role.

Checklist:

- Mahasiswa hanya melihat data sendiri.
- Dosen hanya melihat kelas yang dia ajar.
- Prodi hanya melihat data prodi terkait jika aturan diterapkan.
- Admin bisa melihat semua sesuai kebutuhan.
- Semua mutasi akademik punya `requireAuthorizedUser`.
- Semua query sensitif tidak hanya mengandalkan UI filter.
- RLS aktif untuk tabel sensitif.

Acceptance criteria:

- Akses lintas mahasiswa ditolak.
- Dosen tidak bisa edit kelas dosen lain.
- Mahasiswa tidak bisa submit tugas kelas yang tidak dia ambil.
- Mahasiswa tidak bisa melihat nilai mahasiswa lain.

## Phase 3.13 - Audit Log dan Activity

Tujuan:

- Aksi akademik penting bisa ditelusuri.

Audit minimal:

- Submit KRS.
- Approve/reject KRS.
- Create/update jadwal.
- Input/update nilai.
- Create materi.
- Create tugas.
- Submit tugas.
- Grade submission.
- Create forum/topik/komentar jika dibutuhkan.

Acceptance criteria:

- Audit log berisi pelaku, modul, aksi, target, old_data/new_data jika relevan.
- Admin bisa membaca audit akademik.

## Gate Wajib Phase 3

Command wajib:

```bash
npm run type-check
npm run lint
npm run build
```

Smoke test route:

- `/dashboard/krs`
- `/dashboard/nilai`
- `/dashboard/akademik/lms`
- `/dashboard/akademik/lms/[jadwalId]`
- `/dashboard/akademik/lms/[jadwalId]/tugas/[tugasId]`
- `/dashboard/akademik/lms/[jadwalId]/forum/[topikId]`

Manual role test:

- Admin bisa akses overview akademik.
- Prodi bisa melihat/approval data sesuai scope.
- Dosen bisa melihat kelas dan input nilai.
- Mahasiswa bisa isi KRS, akses LMS, submit tugas, dan lihat nilai.

Supabase dev check:

- KRS tersimpan benar.
- Nilai tersimpan benar.
- LMS materi/tugas/submission/forum tersimpan benar.
- RLS aktif untuk tabel sensitif.
- Tidak ada data lintas user yang bocor.

## Definisi Selesai Phase 3

Phase 3 dianggap selesai jika:

- Jadwal kuliah berjalan.
- Mahasiswa bisa submit KRS.
- Dosen/prodi bisa approve KRS.
- Dosen bisa input nilai.
- Mahasiswa bisa melihat KHS/transkrip.
- LMS kelas berbasis jadwal berjalan.
- Materi, tugas, submission, grading, dan forum berjalan.
- Authorization role aman.
- Audit log mencatat aksi penting.
- Type-check, lint, dan build sukses.
- Smoke test route akademik dan LMS lolos.

Kalau mahasiswa bisa lihat nilai temannya, Phase 3 belum selesai. Itu bukan fitur sosial, itu kebocoran data.
