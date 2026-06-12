# Laporan Ringkas Perubahan Fitur SIAKAD Clone

Tanggal: 13 Juni 2026  
Status project: DEV  
Tujuan: Ringkasan fitur untuk leader

## Ringkasan Fitur

- Update CRUD Master Data Jadwal Kuliah.
- Membuat halaman manajemen Jadwal Kuliah di dashboard.
- Menambahkan validasi bentrok jadwal berdasarkan ruangan, hari, dan jam.
- Menambahkan menu/shortcut Jadwal Kuliah pada halaman Master Data.
- Menambahkan audit log untuk proses pengajuan, persetujuan, dan penolakan KRS.
- Mengamankan generate tagihan massal agar tidak membuat tagihan ganda.
- Menambahkan relasi `master_biaya_id` pada tagihan.
- Membuat sistem pencatatan webhook payment melalui tabel `webhook_events`.
- Mengamankan webhook Midtrans PMB agar event yang sama tidak diproses dua kali.
- Mengamankan webhook Midtrans Keuangan agar event yang sama tidak diproses dua kali.
- Menambahkan kolom error/failure pada PMB dan pembayaran untuk kebutuhan tracking masalah.
- Menambahkan policy service role untuk tabel-tabel LMS.
- Update versi ESLint agar dependency development lebih konsisten.

## Kelompok Perubahan

### Master Data

- Update CRUD Jadwal Kuliah.
- Tambah halaman list, tambah, edit, hapus, dan search Jadwal Kuliah.
- Tambah validasi bentrok jadwal.

### Akademik

- Tambah audit log pada proses KRS.
- Catat aktivitas submit, approve, dan reject KRS.

### Keuangan

- Cegah tagihan mahasiswa dobel saat generate massal.
- Tambah referensi master biaya pada data tagihan.
- Tambah pencatatan event webhook pembayaran.

### PMB

- Tambah idempotency webhook pembayaran PMB.
- Tambah kolom tracking error untuk proses PMB.

### LMS

- Tambah policy service role untuk tabel LMS agar backend bisa mengelola data dengan benar.

### Development

- Update dependency ESLint.
- Menambahkan migration pendukung Phase 2 dan Phase 3.

## Catatan

- Project clone ini untuk pengembangan dan uji fitur.
- Status masih DEV, belum production-ready.
- Validasi akhir tetap perlu `type-check`, `lint`, `build`, dan smoke test.
