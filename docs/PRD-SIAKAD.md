# PRD SIAKAD STAI Al-Ittihad

## 1. Ringkasan Produk

SIAKAD STAI Al-Ittihad adalah sistem informasi akademik kampus berbasis web untuk mengelola proses akademik, PMB, keuangan, LMS, penilaian, laporan, dan kontrol akses multi-role dalam satu dashboard terpadu.

Dokumen ini mengikuti kondisi project saat ini, bukan mengikuti prompt awal secara mentah. Prompt lama tetap dipakai sebagai sumber visi produk dan roadmap, sedangkan keputusan teknis diselaraskan dengan implementasi repo sekarang.

Stack aktual:

- Next.js 16.2.4 App Router
- React 19.2.4
- TypeScript strict mode
- Tailwind CSS v4
- Supabase client/server/admin
- SQL migrations di folder `migrations/`
- Server Actions untuk operasi data
- Komponen UI shadcn-style dan Radix UI

## 2. Tujuan Produk

Tujuan utama produk:

- Menyediakan portal akademik terpadu untuk kampus.
- Mengurangi proses manual pada PMB, akademik, KRS, nilai, keuangan, dan laporan.
- Memberikan dashboard berbeda sesuai role pengguna.
- Menyediakan fondasi permission dan menu dinamis agar modul bisa dikembangkan bertahap.
- Mencatat aktivitas penting melalui audit log.
- Menyiapkan integrasi lanjutan seperti payment gateway, LMS, EDOM, dan notifikasi.

Masalah yang diselesaikan:

- Data akademik tersebar dan sulit dilacak.
- Proses pembayaran, KRS, nilai, dan PMB rawan tidak sinkron.
- Role dan akses menu sulit dikelola jika hardcoded.
- Aktivitas penting sulit diaudit.
- Dashboard kampus butuh satu sumber data yang lebih rapi.

## 3. Target Pengguna dan Role

Role aktual yang sudah tampak di project:

- Admin: mengelola master data, user, PMB, akademik, dan konfigurasi utama.
- Prodi: mengawasi data akademik program studi, KRS, nilai, dan mahasiswa.
- Dosen: mengelola kelas, LMS, tugas, nilai, dan aktivitas akademik terkait.
- Mahasiswa: mengakses KRS, nilai, tagihan, LMS, pengumuman, dan status akademik.
- Calon Mahasiswa: mengikuti alur PMB, pembayaran pendaftaran, dan status seleksi.
- Staff: membantu operasional data dan pengumuman.
- Keuangan: mengelola tagihan, pembayaran, arus kas, dan status pembayaran.
- Pimpinan: melihat ringkasan dan laporan.
- Bendahara: mendukung proses keuangan sesuai permission.

Target roadmap dari prompt awal juga mencakup role seperti Super Admin, Admin Akademik, Operator PMB, Kaprodi, Dekan, dan Rektor. Role tersebut perlu dipetakan ke model role aktual sebelum diimplementasikan, jangan asal tempel, nanti role-nya jadi bubur bayi.

## 4. Kondisi Implementasi Saat Ini

Yang sudah tersedia menurut repo dan dokumen project:

- Landing page dan login multi-role.
- Middleware proteksi route `/dashboard`.
- Dashboard per role.
- Modul master data.
- PMB dan registrasi calon mahasiswa.
- Registrasi semester, KRS, nilai, KHS/transkrip, dan laporan.
- Modul keuangan dasar sampai advanced billing.
- LMS untuk materi, tugas, submission, forum, dan grading.
- Audit log aktivitas penting.
- Dynamic menu dan role access.
- Supabase utilities untuk browser/server/admin.
- SQL migrations dan seed awal.
- Dockerfile dan docker-compose untuk PostgreSQL lokal/app container.

Catatan audit awal:

- Demo auth masih aktif dan harus diposisikan development-only.
- Session middleware belum cukup sebagai security boundary penuh.
- Service role Supabase dipakai luas, sehingga setiap Server Action wajib punya authorization eksplisit.
- `npm run lint`, `npm run build`, dan `npx tsc --noEmit` pernah timeout saat audit awal, jadi belum boleh diklaim sebagai gate hijau.

## 5. Scope Phase 1 Realistis

Phase 1 untuk project sekarang adalah menstabilkan fondasi yang sudah ada, bukan membangun ulang dari nol.

Scope Phase 1:

- Login dan session management yang aman untuk production.
- Role dan permission dasar untuk dashboard.
- Dynamic sidebar/menu berbasis database.
- CRUD user dan role/access control.
- CRUD master akademik inti:
  - Kampus
  - Fakultas
  - Program Studi
  - Dosen
  - Mahasiswa
  - Mata Kuliah
  - Ruangan
  - Kelas
  - Tahun Akademik
  - Kurikulum
- Audit log untuk login, CRUD, approval, dan aksi penting.
- Dashboard admin dan role utama.
- Stabilitas build, lint, dan typecheck.

Out of scope Phase 1:

- Payment gateway production penuh.
- FCM production penuh.
- EDOM production penuh.
- Multi-tenant production penuh.
- Mobile app native.
- Migrasi ORM besar ke Prisma.

## 6. Modul Lanjutan

### PMB

Fungsi utama:

- Form pendaftaran online.
- Biodata calon mahasiswa.
- Data orang tua/wali.
- Riwayat pendidikan.
- Upload berkas.
- Status pendaftaran.
- Verifikasi pembayaran.
- Generate NIM saat diterima.
- Sinkronisasi calon mahasiswa menjadi mahasiswa.

Status minimum:

- Draft
- Submitted
- Menunggu Pembayaran
- Verifikasi Pembayaran
- Lulus
- Ditolak
- Registrasi Ulang
- Menjadi Mahasiswa

### Keuangan

Fungsi utama:

- Master biaya.
- Generate tagihan bulk.
- Pembayaran mahasiswa.
- Riwayat transaksi.
- Arus kas masuk/keluar.
- Sinkronisasi status mahasiswa berdasarkan pembayaran.
- Laporan keuangan.

Jenis tagihan:

- PMB
- Registrasi
- SPP
- Praktikum
- Skripsi/tugas akhir
- Wisuda

### Payment Gateway

Target integrasi:

- Midtrans.
- Xendit.
- Virtual Account.
- QRIS.
- E-Wallet.
- Transfer bank.
- Webhook status pembayaran.
- Refund atau koreksi status bila diperlukan.

Status pembayaran:

- pending
- paid
- expired
- failed
- refund

### Akademik

Fungsi utama:

- Master fakultas, prodi, kurikulum, mata kuliah, dosen, ruangan, kelas, dan tahun akademik.
- Jadwal kuliah.
- KRS.
- Approval dosen wali/prodi.
- KHS.
- Transkrip.
- Kalender akademik.

Validasi akademik:

- Maksimum SKS.
- Prasyarat mata kuliah.
- Status pembayaran.
- Status mahasiswa aktif.
- Konflik jadwal.

### LMS

Fungsi utama:

- Virtual classroom berbasis jadwal kuliah.
- Upload materi.
- Tugas dan deadline.
- Pengumpulan tugas mahasiswa.
- Penilaian tugas.
- Forum diskusi.
- Sinkronisasi nilai bila diperlukan.

### EDOM

Fungsi utama:

- Kuisioner evaluasi dosen oleh mahasiswa.
- Pengisian per semester/mata kuliah.
- Rekap statistik.
- Grafik dan laporan.
- Export laporan untuk pimpinan/prodi.

### Notifikasi

Target event:

- Tagihan baru.
- Pembayaran berhasil.
- Perubahan jadwal.
- Pengumuman.
- Nilai keluar.
- Approval KRS.
- Status PMB berubah.

Channel awal:

- In-app notification.
- Template notifikasi.

Channel lanjutan:

- Firebase Cloud Messaging.
- Email jika dibutuhkan.

## 7. Requirement Fungsional

### Authentication dan Session

- User dapat login memakai email atau username.
- User diarahkan ke dashboard sesuai role aktif.
- User multi-role dapat memilih atau berpindah role jika diizinkan.
- Logout harus menghapus session.
- Session production wajib ditandatangani dengan secret khusus.
- Demo auth hanya boleh aktif untuk development.

### Authorization dan Menu

- Akses halaman dashboard wajib berdasarkan role/permission.
- Sidebar dirender dari data menu dan permission.
- Admin dapat mengatur role, permission, dan akses menu.
- Server Action yang mengubah data wajib melakukan authorization server-side.

### Master Data

- User dapat mencari, menambah, mengubah, menghapus, dan melihat data sesuai permission.
- Entity bisnis memakai soft delete jika sesuai.
- Import/export Excel disediakan untuk master data prioritas.
- Pagination dan search wajib tersedia untuk tabel besar.

### Audit Log

- Sistem mencatat aksi penting:
  - Login
  - Logout
  - Create
  - Update
  - Delete
  - Restore
  - Approval
  - Payment verification
- Audit log minimal menyimpan user, modul, aksi, target data, timestamp, dan payload perubahan jika aman disimpan.

### Dashboard dan Laporan

- Dashboard menampilkan ringkasan sesuai role.
- Pimpinan dan admin dapat melihat laporan agregat.
- Laporan akademik dan keuangan harus bisa diekspor saat modul terkait stabil.

## 8. Requirement Non-Fungsional

### Security

- Tidak boleh ada akun demo production.
- Password tidak boleh disimpan plaintext.
- Service role key hanya boleh dipakai server-side.
- Server Action wajib validasi input dan role.
- Middleware tidak boleh menjadi satu-satunya pengaman.
- Env secret tidak boleh masuk git.

### Reliability

- Operasi pembayaran dan status akademik harus idempotent jika memungkinkan.
- Webhook payment gateway harus aman dari replay dan signature palsu.
- Mutasi penting harus punya error handling dan audit log.

### Performance

- Tabel besar wajib pagination.
- Query dashboard harus dibatasi dan tidak menarik seluruh data tanpa perlu.
- Build, lint, dan typecheck harus selesai dalam waktu wajar untuk CI.

### UI/UX

- Responsive untuk desktop dan mobile.
- Layout dashboard padat tapi tetap mudah dibaca.
- Tabel punya loading, empty, dan error state.
- Form penting memakai validasi yang jelas.
- Aksi destruktif memakai konfirmasi.

### Maintainability

- Modul bisnis dipisahkan per domain.
- Komponen reusable ditempatkan di shared UI.
- Logic server-side tidak disalin berulang jika bisa dibuat helper.
- Permission dan menu tidak hardcoded di UI utama.

## 9. Data Model Konseptual dan Permission

Kelompok data utama:

- Identity: users, user_roles, sessions/auth mapping.
- Access Control: roles, permissions, role_menu_permissions, menus.
- Academic Master: kampus, fakultas, program_studi, dosen, mahasiswa, mata_kuliah, ruangan, kelas, tahun_akademik, kurikulum.
- Academic Transaction: registrasi_semester, krs_header, krs_detail, nilai_akhir, riwayat_status_mahasiswa.
- PMB: pmb_pendaftaran, pmb_biaya, pmb_pembayaran.
- Finance: master_biaya, tagihan, pembayaran, kategori_keuangan, arus_kas.
- LMS: lms_materi, lms_tugas, lms_pengumpulan, lms_forum_topik, lms_forum_komentar.
- System: settings, notification_templates, audit_logs, api_logs, queue_jobs, scheduled_jobs.

Permission model minimum:

- Format permission disarankan konsisten: `module.action`.
- Action dasar: `create`, `read`, `update`, `delete`, `restore`, `approve`, `import`, `export`, `manage`.
- Role hanya menentukan default akses.
- User-role dan menu permission menentukan akses efektif.
- Semua akses data sensitif tetap divalidasi di server.

## 10. Acceptance Criteria

Dokumen dan project dianggap siap untuk milestone stabil jika:

- PRD ini tersedia dan menjadi rujukan scope.
- Semua modul dari prompt aplikasi sudah punya posisi: Phase 1, roadmap, atau out of scope.
- Stack yang tertulis sesuai repo aktual.
- Demo auth tidak aktif di production.
- Session production memakai `SESSION_SECRET` khusus.
- Semua Server Action mutasi punya authorization server-side.
- Dynamic menu dan role access berfungsi untuk dashboard utama.
- Audit log mencatat aksi penting.
- Master data utama memiliki CRUD, search, dan pagination.
- PMB dapat mengubah calon mahasiswa menjadi mahasiswa sesuai workflow.
- Keuangan dapat membuat tagihan dan mencatat pembayaran.
- LMS dapat mengelola materi, tugas, submission, dan grading.
- `npm run lint`, `npx tsc --noEmit`, dan `npm run build` berhasil tanpa timeout di environment target.

## 11. Gap dari Prompt Awal

Gap teknis:

- Prompt awal menargetkan Next.js 15, repo aktual memakai Next.js 16.2.4.
- Prompt awal menargetkan Prisma dan SQLite development, repo aktual memakai Supabase client/admin dan SQL migrations.
- Prompt awal menargetkan Better Auth/NextAuth, repo aktual memakai custom auth flow dengan Supabase dan demo fallback.
- Prompt awal memakai istilah Super Admin, repo aktual memakai role seperti Admin, Prodi, Dosen, Mahasiswa, Staff, Keuangan, Pimpinan, Bendahara, dan Calon Mahasiswa.
- Prompt awal menginginkan multi-tenant penuh, repo aktual belum terlihat sebagai multi-tenant production-ready.

Gap readiness:

- Demo users masih ada dan perlu dibatasi development-only.
- Middleware session perlu diperkuat atau diposisikan hanya sebagai UX redirect.
- Penggunaan service role harus diaudit per action.
- Build/lint/typecheck pernah timeout saat audit awal.
- File env lokal perlu dipastikan tidak masuk git, terutama file bernama `env` tanpa titik.

## 12. Roadmap Prioritas

### Prioritas 0: Production Safety

- Nonaktifkan demo auth di production.
- Wajibkan `SESSION_SECRET`.
- Audit semua mutasi Server Action.
- Rapikan env handling.
- Selesaikan timeout lint/typecheck/build.

### Prioritas 1: Stabilkan Fondasi Admin

- Validasi role dan permission aktual.
- Pastikan sidebar dinamis sesuai database.
- Rapikan audit log.
- Lengkapi CRUD master data inti.
- Tambahkan acceptance check per role utama.

### Prioritas 2: PMB dan Keuangan

- Stabilkan workflow PMB sampai generate NIM.
- Stabilkan master biaya dan tagihan.
- Siapkan payment gateway dengan webhook aman.
- Pastikan status mahasiswa tersinkron dari pembayaran.

### Prioritas 3: Akademik dan LMS

- Lengkapi validasi KRS.
- Perkuat KHS/transkrip.
- Stabilkan kelas, materi, tugas, submission, forum, dan grading.
- Siapkan report akademik untuk prodi/pimpinan.

### Prioritas 4: Modul Lanjutan

- EDOM.
- FCM/notifikasi mobile.
- Multi-tenant production.
- Monitoring, backup, CI/CD, dan deployment hardening.
