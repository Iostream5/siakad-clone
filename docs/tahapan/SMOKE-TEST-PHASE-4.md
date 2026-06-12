# Smoke Test - Phase 4 (Laporan & Monitoring)

Dokumen ini berisi daftar pengujian manual (smoke test) yang wajib dilakukan untuk memverifikasi bahwa Phase 4 telah berjalan dengan benar sesuai dengan requirement.

## Prasyarat
- Database telah di-seed dengan data awal (PMB, Mahasiswa, Keuangan, Master Data).
- Webhook Midtrans telah dikonfigurasi (untuk test webhook).

---

## 1. Role: Pimpinan

### Tujuan
Memverifikasi dashboard pimpinan menampilkan data ringkasan dengan benar.

### Akun Test
- Username: `pimpinan`
- Password: `pimpinan123`

### Checklist
- [ ] Login menggunakan akun Pimpinan.
- [ ] Navigasi ke `/dashboard`.
- [ ] Verifikasi widget `Total Mahasiswa` menampilkan angka sesuai database (status AKTIF).
- [ ] Verifikasi widget `Total Dosen` menampilkan angka sesuai database (status Aktif).
- [ ] Verifikasi widget `Pendaftar PMB` menampilkan total, lulus, ditolak, dan proses.
- [ ] Verifikasi widget `Ringkasan Keuangan` menampilkan total tagihan, pembayaran masuk, dan tunggakan tanpa pesan error.

---

## 2. Role: Admin / Prodi / Keuangan (Laporan)

### Tujuan
Memverifikasi fungsi laporan dan ekspor (PDF & Excel) berjalan dengan baik.

### Akun Test
- Username: `admin` (Admin) atau `prodi` (Prodi) atau `keuangan` (Keuangan)

### Checklist
- [ ] Login menggunakan akun yang relevan.
- [ ] Navigasi ke `/dashboard/laporan`.
- [ ] Verifikasi **Tab Laporan Akademik**:
  - [ ] Tabel mahasiswa tampil.
  - [ ] Filter `Pilih Program Studi` berfungsi memperbarui tabel.
  - [ ] Tombol `Export PDF` mengunduh file PDF dengan isi yang benar.
  - [ ] Tombol `Export Excel` mengunduh file Excel (.xlsx) dengan isi yang benar.
- [ ] Verifikasi **Tab Laporan PMB**:
  - [ ] Tabel pendaftar tampil.
  - [ ] Filter `Prodi` dan `Status Seleksi` berfungsi.
  - [ ] Tombol `Export PDF` & `Export Excel` berfungsi.
- [ ] Verifikasi **Tab Laporan Keuangan**:
  - [ ] Tabel tagihan tampil.
  - [ ] Filter `Tahun Akademik` dan `Status Tagihan` berfungsi.
  - [ ] Angka `Terbayar` dan `Tunggakan` terkalkulasi dengan benar.
  - [ ] Tombol `Export PDF` & `Export Excel` berfungsi.

---

## 3. Role: Admin (Audit & Monitoring)

### Tujuan
Memverifikasi aktivitas operasional tercatat dengan baik dan dapat dipantau.

### Akun Test
- Username: `admin`
- Password: `admin123`

### Checklist
- [ ] Login menggunakan akun Admin.
- [ ] Navigasi ke `/dashboard/pengaturan/audit-aktivitas`.
  - [ ] Verifikasi tabel menampilkan aktivitas (CREATE/UPDATE/DELETE).
  - [ ] Filter `Modul` dan `Aksi` berjalan dengan baik.
  - [ ] Tombol `Lihat JSON` memunculkan modal/alert berisi detail payload.
- [ ] Navigasi ke `/dashboard/pengaturan/audit-login`.
  - [ ] Verifikasi log status login (Sukses/Gagal) tercatat.
  - [ ] Angka rekapan `sukses` dan `gagal` tampil.
  - [ ] Filter `Status` berjalan dengan baik.
- [ ] Navigasi ke `/dashboard/pengaturan/webhook-logs`.
  - [ ] Jika ada transaksi webhook, tabel terisi dengan `event_id` dan `event_type`.
  - [ ] Tombol `Lihat JSON` memunculkan modal/alert berisi detail payload.
  - [ ] Filter `Provider` (Midtrans/Xendit) berjalan dengan baik.

---

## 4. Validasi Error Boundaries & Logging

- [ ] Sengaja membuat error pada form (misal input tidak valid) dan pastikan UI tidak crash (error ditangkap dengan aman).
- [ ] Verifikasi di konsol/server bahwa error logging terkait webhook invalid signature dibuang (rejected) dan log mencatat "Signature Midtrans tidak valid".
