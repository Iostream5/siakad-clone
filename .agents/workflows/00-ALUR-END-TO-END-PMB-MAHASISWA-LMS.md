---
description: Alur End-to-End PMB sampai LMS
---

# Flow yang di harapkan
## 1. Registrasi PMB dan Akun Calon Mahasiswa

### Calon Mahasiswa

- Membuka halaman publik PMB.
- Mengisi formulir pendaftaran.
- Memilih program studi.
- Mengunggah dokumen yang diminta jika tersedia.
- Submit pendaftaran.
- Sistem membuat akun calon mahasiswa.
- Calon mahasiswa login memakai akun yang baru dibuat.
- Calon mahasiswa melihat invoice biaya pendaftaran PMB.

### Sistem

- Membuat data di `pmb_pendaftaran`.
- Membuat nomor pendaftaran.
- Membuat invoice PMB.
- Membuat akun Auth dan profile `users` dengan role `Calon Mahasiswa`.
- Mengarahkan calon mahasiswa ke portal pembayaran PMB.

### Admin / Staff PMB

- Melihat data calon mahasiswa di dashboard PMB.
- Mengecek detail biodata dan dokumen.
- Jika data kurang, admin/staff menghubungi calon mahasiswa untuk perbaikan.

### Status Data

```text
pmb_pendaftaran.status_pendaftaran = Submitted / Waiting Payment
pmb_pendaftaran.status_pembayaran = pending / manual_review
pmb_pendaftaran.status_seleksi = BARU
users.role = Calon Mahasiswa
```

## 2. Pembayaran PMB

### Calon Mahasiswa

- Membuka portal pembayaran PMB.
- Memilih metode pembayaran.
- Jika transfer manual, mengunggah bukti pembayaran.
- Jika payment gateway aktif, melakukan checkout lewat gateway.

### Sistem

- Menyimpan bukti pembayaran manual ke Supabase Storage.
- Membuat atau memperbarui data `pmb_pembayaran`.
- Untuk gateway, menyimpan `provider_reference` dan `checkout_url`.
- Untuk webhook gateway, memvalidasi signature dan idempotency.

### Admin / Keuangan / Staff

- Membuka tab pembayaran PMB.
- Mengecek bukti pembayaran.
- Klik terima jika valid.
- Klik tolak jika bukti tidak valid.

### Status Jika Diterima

```text
pmb_pembayaran.status = Terverifikasi
pmb_pendaftaran.status_pembayaran = paid
pmb_pendaftaran.status_pendaftaran = Verified
pmb_pendaftaran.status_seleksi = VERIFIKASI
arus_kas = tercatat sebagai pemasukan PMB
```

### Status Jika Ditolak

```text
pmb_pembayaran.status = Ditolak
pmb_pendaftaran.status_pembayaran = pending
pmb_pendaftaran.status_pendaftaran = Waiting Payment
```

## 3. Penjadwalan Seleksi dan Wawancara

### Admin / Staff PMB / Prodi

- Melihat calon mahasiswa dengan status pembayaran `paid`.
- Menentukan jadwal seleksi.
- Menentukan jenis seleksi, misalnya:
  - tes akademik atau SKD;
  - wawancara;
  - baca Al-Quran;
  - validasi dokumen;
  - tes tambahan sesuai kebijakan kampus.
- Mengirim informasi jadwal kepada calon mahasiswa.

### Calon Mahasiswa

- Menerima jadwal seleksi.
- Mengikuti tes atau wawancara sesuai jadwal.
- Jika tes online tersedia, calon mahasiswa mengerjakan tes dari portal PMB.
- Jika tes offline, calon mahasiswa hadir sesuai jadwal.

### Catatan Implementasi

- Tes maba sebaiknya menjadi subfitur PMB, bukan LMS.
- LMS dipakai setelah calon mahasiswa menjadi mahasiswa aktif dan punya KRS approved.
- Untuk implementasi lanjutan, modul yang disarankan:
  - `/dashboard/pmb?tab=tes-seleksi` untuk admin/staff/prodi;
  - `/pmb/tes` atau portal calon mahasiswa untuk peserta;
  - tabel `pmb_tes`, `pmb_soal`, `pmb_jawaban`, `pmb_hasil_tes`, dan `pmb_jadwal_seleksi`.

## 4. Input Hasil Seleksi, SKD, dan Wawancara

### Admin / Prodi / Staff PMB

- Membuka tab seleksi PMB.
- Memilih calon mahasiswa yang sudah `VERIFIKASI`.
- Menginput hasil seleksi.
- Menginput skor akhir.
- Menentukan keputusan:
  - lulus;
  - ditolak;
  - perlu review ulang.

### Sumber Skor Seleksi

Skor sebaiknya bukan angka asal ketik. Skor idealnya berasal dari komponen berikut:

| Komponen | Contoh Bobot | Keterangan |
| --- | ---: | --- |
| Tes akademik / SKD | 40% | Nilai tes objektif calon mahasiswa |
| Wawancara | 30% | Nilai dari pewawancara/prodi |
| Baca Al-Quran | 20% | Jika menjadi syarat kampus |
| Kelengkapan dokumen | 10% | Validasi dokumen wajib |

Contoh:

```text
skor_akhir = (SKD x 40%) + (wawancara x 30%) + (baca_quran x 20%) + (dokumen x 10%)
```

### Aturan Sementara Jika Belum Ada Modul Tes

- Panitia boleh input skor manual skala 0 sampai 100.
- Sumber skor manual harus berasal dari hasil tes/wawancara offline.
- Passing grade sementara bisa ditentukan kampus, misalnya 70.
- Jika skor >= passing grade, calon mahasiswa bisa diluluskan.
- Jika skor < passing grade, calon mahasiswa ditolak atau masuk review.

### Status Jika Lulus

```text
pmb_pendaftaran.status_seleksi = LULUS
pmb_pendaftaran.status_pendaftaran = Accepted
pmb_pendaftaran.skor_seleksi = skor akhir
```

### Status Jika Ditolak

```text
pmb_pendaftaran.status_seleksi = DITOLAK
pmb_pendaftaran.status_pendaftaran = Rejected
pmb_pendaftaran.skor_seleksi = skor akhir
```

## 5. Generate NIM dan Konversi Menjadi Mahasiswa

### Admin / Prodi / Staff PMB

- Membuka tab Registrasi/NIM di dashboard PMB.
- Memilih calon mahasiswa dengan status `LULUS`.
- Klik generate NIM.

### Sistem

- Mengecek calon mahasiswa sudah lulus.
- Mengecek NIM belum pernah dibuat.
- Generate NIM berdasarkan tahun/angkatan.
- Update metadata akun Auth.
- Update `users.role` menjadi `Mahasiswa`.
- Menghapus role `Calon Mahasiswa` jika ada.
- Menambahkan role `Mahasiswa`.
- Membuat record di tabel `mahasiswa`.
- Update status pendaftaran menjadi `Registered`.

### Status Setelah Berhasil

```text
pmb_pendaftaran.generated_nim = NIM baru
pmb_pendaftaran.status_pendaftaran = Registered
users.role = Mahasiswa
user_roles.role = Mahasiswa
mahasiswa.status_mahasiswa = AKTIF
```

## 6. Tahapan Setelah Mahasiswa Punya NIM

### Mahasiswa

- Login sebagai mahasiswa.
- Melihat dashboard mahasiswa.
- Melengkapi profil jika ada data yang kurang.
- Mengecek tagihan semester.
- Membayar tagihan daftar ulang atau SPP.
- Melihat status pembayaran.
- Melakukan registrasi semester atau daftar ulang.
- Mengisi KRS saat periode KRS dibuka.
- Menunggu approval KRS.
- Setelah KRS disetujui, mahasiswa dapat mengakses kelas LMS.

### Admin Akademik / Staff

- Memastikan data mahasiswa sudah masuk master mahasiswa.
- Memastikan program studi, kurikulum, mata kuliah, dosen, ruangan, kelas, dan tahun akademik aktif sudah siap.
- Membuat jadwal kuliah.
- Membuka periode KRS.
- Mengawasi mahasiswa yang belum registrasi semester atau belum mengisi KRS.

### Keuangan

- Membuat master biaya semester.
- Generate tagihan mahasiswa.
- Memverifikasi pembayaran mahasiswa.
- Menjalankan sync status mahasiswa jika diperlukan.
- Memberi dispensasi jika ada kebijakan khusus.

### Prodi / Dosen Wali

- Melihat pengajuan KRS.
- Mengecek batas SKS dan prasyarat.
- Menyetujui atau menolak KRS.
- Memberi catatan jika KRS perlu revisi.

### Dosen Pengampu

- Melihat daftar kelas yang diajar.
- Mengelola materi LMS.
- Membuat tugas.
- Membuka forum diskusi.
- Menilai submission mahasiswa.

## 7. Registrasi Semester / Daftar Ulang

### Mahasiswa

- Membuka halaman registrasi semester.
- Mengecek status daftar ulang.
- Membayar tagihan yang terkait semester aktif.
- Menunggu verifikasi keuangan jika pembayaran manual.

### Admin / Keuangan

- Generate data registrasi semester massal untuk mahasiswa aktif.
- Verifikasi registrasi jika pembayaran sudah valid.
- Memberi dispensasi jika mahasiswa diizinkan tetap aktif walau belum lunas.

### Status Registrasi

```text
BELUM -> MENUNGGU -> LUNAS
BELUM -> DISPENSASI
```

## 8. KRS

### Mahasiswa

- Membuka halaman KRS.
- Melihat jadwal kuliah yang tersedia.
- Memilih mata kuliah.
- Submit KRS.
- Menunggu approval.
- Jika ditolak, membaca catatan lalu revisi.

### Sistem

- Mengecek tahun akademik aktif.
- Mengecek periode KRS.
- Mengecek kapasitas kelas.
- Mengecek total SKS.
- Mengecek mata kuliah prasyarat jika ada.
- Menyimpan data ke `krs_header` dan `krs_detail`.

### Dosen Wali / Prodi / Admin

- Review KRS mahasiswa.
- Approve jika sesuai.
- Reject jika ada masalah.

### Status KRS

```text
Draft -> Diajukan -> Disetujui
Draft -> Diajukan -> Ditolak -> revisi -> Diajukan
```

## 9. LMS

### Mahasiswa

- LMS hanya tampil untuk kelas dari KRS yang sudah disetujui.
- Membuka daftar kelas.
- Membaca materi.
- Mengumpulkan tugas.
- Ikut forum diskusi.
- Melihat nilai tugas jika sudah dinilai.

### Dosen

- Membuka kelas yang dia ajar.
- Menambahkan materi.
- Membuat tugas.
- Membuat forum.
- Mengecek submission.
- Memberi nilai dan feedback.

### Admin / Prodi

- Memantau kelas LMS.
- Membantu koreksi data jadwal, dosen, atau peserta kelas jika ada mismatch.

### Sumber Akses LMS

```text
jadwal_kuliah
-> krs_detail
-> krs_header.status = Disetujui
-> mahasiswa bisa melihat kelas LMS
```

## 10. Flow per Role

### Calon Mahasiswa

- Registrasi PMB.
- Login memakai akun baru.
- Membayar biaya pendaftaran.
- Upload bukti pembayaran jika manual.
- Mengikuti seleksi/wawancara.
- Melihat status hasil seleksi.
- Jika lulus, menunggu NIM dibuat.

### Mahasiswa

- Login sebagai mahasiswa.
- Melengkapi profil.
- Membayar tagihan semester.
- Melakukan registrasi semester.
- Mengisi KRS.
- Menunggu approval KRS.
- Mengakses LMS setelah KRS disetujui.
- Mengikuti materi, tugas, forum, dan nilai.

### Admin

- Melihat data calon mahasiswa.
- Mengelola tarif PMB.
- Mengecek dokumen PMB.
- Mengecek pembayaran PMB.
- Mengatur jadwal seleksi/wawancara.
- Menginput hasil seleksi.
- Meluluskan atau menolak calon mahasiswa.
- Generate NIM.
- Mengelola master data akademik.
- Membantu setup jadwal, KRS, LMS, dan akses.

### Staff PMB

- Memantau pendaftar.
- Memvalidasi data dan dokumen.
- Membantu verifikasi administrasi PMB.
- Membantu input hasil seleksi jika diberi akses.

### Keuangan

- Memverifikasi pembayaran PMB.
- Mengelola master biaya.
- Generate tagihan mahasiswa.
- Memverifikasi pembayaran semester.
- Mengelola arus kas.
- Memberi status dispensasi sesuai kebijakan.

### Prodi

- Melihat calon mahasiswa sesuai kebutuhan prodi.
- Memberi hasil seleksi atau wawancara.
- Menentukan lulus/tidak lulus bersama panitia.
- Menyiapkan kurikulum dan jadwal bersama admin akademik.
- Approve atau memantau KRS.

### Dosen Wali

- Review KRS mahasiswa bimbingan.
- Approve atau reject KRS.
- Memberi catatan revisi.

### Dosen Pengampu

- Mengelola kelas LMS.
- Mengunggah materi.
- Membuat tugas.
- Mengelola forum.
- Menilai submission mahasiswa.

## 11. Gap yang Perlu Diimplementasikan

### PMB dan Seleksi

- Modul tes seleksi PMB belum dipisahkan jelas dari input skor manual.
- Perlu tabel dan UI untuk jadwal seleksi/wawancara.
- Perlu tabel dan UI untuk komponen nilai seleksi.
- Perlu aturan passing grade per prodi/gelombang jika kampus butuh.
- Perlu notifikasi jadwal seleksi untuk calon mahasiswa.

### Keuangan

- Pastikan submit bukti pembayaran tidak membuat duplikasi pembayaran.
- Pastikan status pembayaran PMB dan arus kas idempotent.
- Pastikan tagihan daftar ulang/SPP dibuat dari master biaya yang benar.

### Akademik dan LMS

- Data minimal wajib ada: dosen, mata kuliah, jadwal kuliah, mahasiswa, tahun akademik aktif.
- KRS hanya boleh dibuka pada periode aktif.
- LMS hanya boleh menampilkan kelas dari KRS approved.
- Nilai LMS perlu diputuskan apakah hanya nilai tugas atau ikut masuk nilai akhir akademik.

## 12. Definition of Done Flow Utama

Flow ini dianggap jalan jika semua bukti berikut terpenuhi:

- Calon mahasiswa bisa daftar PMB dari halaman publik.
- Calon mahasiswa bisa login dan melihat invoice PMB.
- Calon mahasiswa bisa submit pembayaran.
- Admin/keuangan bisa verifikasi pembayaran PMB.
- Calon mahasiswa bisa mengikuti proses seleksi.
- Admin/prodi bisa input skor seleksi.
- Admin/prodi bisa meluluskan atau menolak calon mahasiswa.
- Calon mahasiswa lulus bisa dibuatkan NIM.
- Akun calon mahasiswa berubah menjadi mahasiswa.
- Data mahasiswa muncul di master mahasiswa.
- Mahasiswa menerima tagihan semester.
- Mahasiswa bisa registrasi semester.
- Mahasiswa bisa mengisi KRS.
- Dosen wali/prodi bisa approve KRS.
- Mahasiswa hanya melihat LMS untuk kelas yang KRS-nya disetujui.
- Dosen bisa mengelola materi, tugas, forum, dan penilaian di LMS.
