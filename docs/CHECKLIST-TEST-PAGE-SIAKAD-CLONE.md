# Checklist Test Page SIAKAD Clone

Tanggal: 13 Juni 2026  
Status: DEV  
Tujuan: panduan halaman apa saja yang perlu dites manual.

## Cara Pakai

1. Login sebagai role yang sesuai.
2. Buka URL halaman.
3. Cek halaman tampil tanpa error.
4. Cek data tampil atau empty state masuk akal.
5. Cek tombol utama berjalan.
6. Catat hasil: `PASS`, `FAIL`, atau `PENDING DATA`.

## Prioritas 1 - Wajib Dicek

| Halaman | URL | Role | Yang Dicek |
|---|---|---|---|
| Login | `/login` | Semua | Login berhasil, login salah ditolak, logout bersih |
| Dashboard | `/dashboard` | Semua | Tidak error, data ringkas tampil, sidebar sesuai role |
| Master Data | `/dashboard/master-data` | Admin, Prodi, Staff | Shortcut master data tampil |
| Kampus | `/dashboard/master-data/kampus` | Admin, Prodi, Staff | List, search, tambah, edit, hapus |
| Fakultas | `/dashboard/master-data/fakultas` | Admin, Prodi, Staff | List, tambah, edit, hapus |
| Program Studi | `/dashboard/master-data/program-studi` | Admin, Prodi, Staff | List, tambah, edit, hapus |
| Tahun Akademik | `/dashboard/master-data/tahun-akademik` | Admin, Prodi, Staff | List, aktif/nonaktif, tambah, edit |
| Kelas | `/dashboard/master-data/kelas` | Admin, Prodi, Staff | List, tambah, edit, hapus |
| Kurikulum | `/dashboard/master-data/kurikulum` | Admin, Prodi, Staff | List, tambah, edit, hapus |
| Mata Kuliah | `/dashboard/master-data/mata-kuliah` | Admin, Prodi, Staff | List, tambah, edit, hapus |
| Jadwal Kuliah | `/dashboard/master-data/jadwal-kuliah` | Admin, Prodi | List, search, tambah, edit, hapus, validasi bentrok |
| Dosen | `/dashboard/master-data/dosen` | Admin, Prodi, Staff | List, tambah/edit data dosen |
| Mahasiswa | `/dashboard/master-data/mahasiswa` | Admin, Prodi, Staff | List, tambah/edit data mahasiswa |
| Ruangan | `/dashboard/master-data/ruangan` | Admin, Prodi, Staff | List, tambah, edit, hapus |
| Pengguna | `/dashboard/master-data/pengguna` | Admin | List user, tambah/edit user, role benar |

## Prioritas 2 - Alur Bisnis

| Halaman | URL | Role | Yang Dicek |
|---|---|---|---|
| PMB Publik | `/pmb` | Publik | Halaman tampil tanpa login |
| Form Daftar PMB | `/pmb/daftar` | Publik | Form tampil, pilihan prodi muncul |
| PMB Dashboard | `/dashboard/pmb` | Admin, Prodi, Staff, Keuangan | Tab pendaftar, pembayaran, seleksi, registrasi |
| Registrasi | `/dashboard/registrasi` | Admin, Staff, Keuangan, Mahasiswa | Data registrasi tampil |
| Keuangan | `/dashboard/keuangan` | Admin, Keuangan, Mahasiswa | Tagihan tampil, generate tagihan, pembayaran |
| KRS | `/dashboard/krs` | Admin, Prodi, Dosen, Mahasiswa | Submit KRS, approval/reject, audit tercatat |
| Nilai | `/dashboard/nilai` | Admin, Prodi, Dosen, Mahasiswa | Input nilai dosen, mahasiswa lihat nilai |
| LMS | `/dashboard/akademik/lms` | Admin, Prodi, Dosen, Mahasiswa | Kelas tampil sesuai jadwal/KRS |
| Detail LMS | `/dashboard/akademik/lms/[jadwalId]` | Dosen, Mahasiswa | Materi, tugas, forum tampil |
| Tugas LMS | `/dashboard/akademik/lms/[jadwalId]/tugas/[tugasId]` | Dosen, Mahasiswa | Submit tugas, nilai submission |
| Forum LMS | `/dashboard/akademik/lms/[jadwalId]/forum/[topikId]` | Dosen, Mahasiswa | Komentar/diskusi berjalan |
| Laporan | `/dashboard/laporan` | Admin, Prodi, Keuangan, Pimpinan | Filter dan data laporan tampil |

## Prioritas 3 - Pengaturan Admin

| Halaman | URL | Role | Yang Dicek |
|---|---|---|---|
| Pengaturan | `/dashboard/pengaturan` | Admin | Menu pengaturan tampil |
| Akun Akses | `/dashboard/pengaturan/akun-akses` | Admin | Role user, akses menu, simpan perubahan |
| Menu Builder | `/dashboard/pengaturan/menu-builder` | Admin | Tambah/edit menu, parent, role default |
| Settings | `/dashboard/pengaturan/settings` | Admin | Update setting non-secret dan secret |
| Payment Gateway | `/dashboard/pengaturan/payment-gateway` | Admin, Keuangan | Simpan konfigurasi Midtrans |
| Webhook Logs | `/dashboard/pengaturan/webhook-logs` | Admin | Event webhook tampil |
| Audit Aktivitas | `/dashboard/pengaturan/audit-aktivitas` | Admin | Log CRUD/action tampil |
| Audit Login | `/dashboard/pengaturan/audit-login` | Admin | Log login tampil |
| Template Notifikasi | `/dashboard/pengaturan/template-notifikasi` | Admin | Template tampil dan bisa diedit |
| Developer Tools | `/dashboard/pengaturan/developer-tools` | Admin | Queue/job/status tampil |

## Endpoint Yang Dites Khusus

| Endpoint | Cara Test | Expected |
|---|---|---|
| `/api/payment-gateway/midtrans/pmb` | Kirim payload Midtrans sandbox/signature valid | Event masuk `webhook_events`, status PMB berubah |
| `/api/payment-gateway/midtrans/finance` | Kirim payload Midtrans sandbox/signature valid | Event masuk `webhook_events`, pembayaran/tagihan berubah |

## Bagian Yang Wajib Dicek di Setiap Page

- Page tidak 500/error.
- Sidebar aktif sesuai URL.
- Role yang tidak punya akses ditolak atau redirect.
- Loading dan empty state tidak pecah.
- Search/filter tidak error.
- Tombol simpan menampilkan hasil sukses/gagal.
- Setelah create/update/delete, data berubah di tabel.
- Audit log masuk untuk aksi penting.
- Tidak ada error merah di terminal dev server.

## Urutan Test Paling Aman

1. Login Admin.
2. Test semua Master Data.
3. Isi data minimum: kampus, fakultas, prodi, tahun akademik, ruangan, kelas, kurikulum, mata kuliah, dosen, mahasiswa.
4. Test Jadwal Kuliah.
5. Test KRS.
6. Test Nilai.
7. Test LMS.
8. Test PMB.
9. Test Keuangan.
10. Test Pengaturan dan audit log.

## Status Awal Saat Ini

- `npm run type-check`: sudah pernah lolos.
- `npm run build`: sudah pernah lolos.
- Masih perlu smoke test manual per role.
- Project masih DEV, bukan production-ready.
