# Laporan Perubahan Fitur SIAKAD Clone

Tanggal: 13 Juni 2026  
Project: SIAKAD STAI Al-Ittihad Clone  
Status environment: DEV  
Target review: Leader/Tech Lead

## Ringkasan

Versi clone ini dibuat sebagai area pengembangan untuk melanjutkan dan menguji fitur SIAKAD tanpa langsung mengganggu project utama. Perubahan utama berfokus pada penguatan modul Akademik, Keuangan, PMB, LMS, dan kesiapan operasional backend.

## Fitur dan Fungsi yang Telah Dibuat

### 1. Master Data Jadwal Kuliah

Fitur baru untuk mengelola jadwal perkuliahan dari dashboard admin/prodi.

Fungsi yang tersedia:

- Menampilkan daftar jadwal kuliah.
- Mencari jadwal berdasarkan nama kelas atau ruangan.
- Menambahkan jadwal kuliah baru.
- Mengubah jadwal kuliah.
- Menghapus jadwal kuliah.
- Menghubungkan jadwal dengan tahun akademik, mata kuliah, dosen, kelas, hari, jam, ruangan, dan kapasitas.
- Mengecek bentrok jadwal berdasarkan ruangan, hari, dan rentang waktu.
- Mencatat aktivitas tambah, ubah, dan hapus ke audit log.

File utama:

- `src/app/dashboard/master-data/jadwal-kuliah/page.tsx`
- `src/modules/master-data/jadwal-kuliah-manager.tsx`
- `src/actions/jadwal-kuliah.ts`
- `src/lib/admin/jadwal-kuliah.ts`

### 2. Integrasi Menu Master Data

Menu Master Data diperbarui agar fitur Jadwal Kuliah bisa diakses dari dashboard.

Fungsi yang tersedia:

- Menampilkan shortcut/link Jadwal Kuliah pada halaman Master Data.
- Mengarahkan user ke halaman manajemen jadwal kuliah.

File utama:

- `src/modules/master-data/sections.tsx`

### 3. Audit Log untuk KRS

Modul KRS diperkuat dengan pencatatan aktivitas penting.

Fungsi yang tersedia:

- Mencatat aktivitas saat mahasiswa mengajukan KRS.
- Mencatat aktivitas saat KRS disetujui.
- Mencatat aktivitas saat KRS ditolak.
- Menyimpan konteks data seperti mahasiswa, tahun akademik, daftar jadwal, status, catatan, dan user approver.

File utama:

- `src/actions/krs.ts`

### 4. Pencegahan Duplikasi Tagihan Mahasiswa

Generate tagihan massal dibuat lebih aman agar tidak membuat tagihan dobel untuk mahasiswa yang sama.

Fungsi yang tersedia:

- Mengecek tagihan yang sudah ada sebelum insert data baru.
- Melewati mahasiswa yang sudah memiliki tagihan dengan jenis dan tahun akademik yang sama.
- Menolak proses jika semua mahasiswa target sudah memiliki tagihan.
- Menyimpan referensi `master_biaya_id` pada tagihan yang dibuat.

File utama:

- `src/actions/finance-master.ts`

### 5. Idempotency Webhook Payment

Webhook pembayaran Midtrans untuk PMB dan Keuangan diperkuat agar event yang sama tidak diproses berulang.

Fungsi yang tersedia:

- Menyimpan event webhook ke tabel `webhook_events`.
- Mengecek event berdasarkan provider dan event ID.
- Mengabaikan event yang sudah pernah diproses.
- Mengurangi risiko pembayaran tercatat ganda akibat retry webhook.

File utama:

- `src/lib/admin/pmb.ts`
- `src/lib/admin/finance.ts`

### 6. Migration Phase 2 PMB dan Keuangan

Migration baru ditambahkan untuk melengkapi kebutuhan PMB, Keuangan, dan webhook.

Fungsi schema yang ditambahkan:

- Kolom `master_biaya_id` pada tabel `tagihan`.
- Kolom `last_error_message` pada tabel `pmb_pendaftaran`.
- Kolom `failure_reason` pada tabel `pembayaran`.
- Kolom `failure_reason` pada tabel `pmb_pembayaran`.
- Tabel `webhook_events` untuk menyimpan event webhook payment.
- RLS dan policy service role untuk tabel `webhook_events`.

File utama:

- `supabase/migrations/024_phase2_pmb_finance_updates.sql`

### 7. Migration Phase 3 Akademik dan LMS

Migration baru ditambahkan untuk memastikan backend service role bisa mengelola tabel LMS yang dibutuhkan.

Fungsi schema yang ditambahkan:

- Policy service role untuk `lms_materi`.
- Policy service role untuk `lms_tugas`.
- Policy service role untuk `lms_pengumpulan`.
- Policy service role untuk `lms_forum_topik`.
- Policy service role untuk `lms_forum_komentar`.

File utama:

- `supabase/migrations/025_phase3_akademik_lms_updates.sql`

### 8. Update Dependency Development

Dependency ESLint diperjelas versinya agar environment development lebih konsisten.

Perubahan:

- `eslint` dari `^9` menjadi `^9.39.4`.

File utama:

- `package.json`
- `package-lock.json`

## Catatan Keamanan

- Project clone terdeteksi memakai status `DEV`.
- Jika perlu validasi database live, gunakan MCP `siakad_dev`.
- File env asli tidak masuk tracked Git.
- File yang aman untuk commit hanya file contoh seperti `.env.example` dan `docker.env.example`.
- Referensi secret di dokumen/rules masih berupa placeholder atau contoh kosong, bukan value secret asli.

## Catatan Review

Perubahan ini belum dinyatakan production-ready. Sebelum merge atau deploy, tetap perlu menjalankan:

- `npm run type-check`
- `npm run lint`
- `npm run build`
- Smoke test manual pada halaman Jadwal Kuliah, KRS, PMB payment webhook, dan Finance payment webhook.

## Kesimpulan

Clone ini sudah menambahkan fondasi fitur Akademik Phase 3 melalui Jadwal Kuliah, memperkuat audit KRS, memperbaiki keamanan proses tagihan dan webhook payment, serta menambah migration pendukung untuk PMB, Keuangan, dan LMS. Versi ini cocok untuk area oprek dan validasi fitur sebelum dipilih mana yang akan dibawa ke project utama.
