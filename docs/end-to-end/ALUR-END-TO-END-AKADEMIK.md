# Alur End-to-End Akademik (KRS & Nilai)

Dokumen ini menjelaskan flow modul akademik, dimulai dari penetapan jadwal kuliah oleh Admin Akademik, pengajuan KRS (Kartu Rencana Studi) oleh Mahasiswa, persetujuan KRS oleh Dosen Wali, pengisian nilai oleh Dosen Pengampu, hingga penerbitan KHS (Kartu Hasil Studi) dan Transkrip Nilai.

Status dokumen: draf alur operasional.

## Ringkasan Alur Besar

```text
Admin Akademik set Tahun Akademik Aktif & Jadwal Kuliah
-> Mahasiswa (berstatus LUNAS tagihan) mengisi dan mengajukan KRS
-> Dosen Wali / Prodi me-review dan Menyetujui/Menolak KRS
-> KRS Disetujui -> Mahasiswa masuk kelas sesuai jadwal
-> Proses perkuliahan berjalan (Dosen absensi, LMS)
-> Akhir semester: Dosen Pengampu menginput dan mem-publish Nilai Akademik Akhir
-> Mahasiswa melihat KHS
-> Nilai terakumulasi menjadi Transkrip Nilai
```

## 1. Persiapan Kalender dan Jadwal Kuliah

### Admin Akademik / Prodi

- Mengaktifkan Tahun Akademik dan Semester berjalan.
- Mengaktifkan "Periode Pengisian KRS".
- Menyusun Jadwal Kuliah berdasarkan:
  - Mata Kuliah aktif dari Kurikulum
  - Dosen Pengampu
  - Ruangan yang tersedia (memeriksa konflik ruangan/jam)
  - Kelompok/Rombongan Belajar.
- Mem-publish Jadwal Kuliah agar dapat dipilih oleh Mahasiswa.

### Sistem

- Memvalidasi agar tidak ada Dosen mengajar dua kelas pada jam yang persis sama.
- Memvalidasi kapasitas Ruangan vs estimasi pendaftar Kelas.

## 2. Pengisian KRS oleh Mahasiswa

### Mahasiswa

- Membuka halaman KRS (diizinkan HANYA JIKA status registrasi/tagihan semester telah `LUNAS` atau `DISPENSASI`).
- Sistem memeriksa status keuangan dan Tahun Akademik aktif.
- Mahasiswa melihat daftar Jadwal Kuliah (Kelas) yang ditawarkan.
- Memilih kelas-kelas yang akan diambil, memperhatikan batas SKS maksimum (berdasarkan IP semester sebelumnya).
- Mengklik "Ajukan KRS" / "Submit KRS".

### Sistem

- Menyimpan data `krs_headers` (status: `DIAJUKAN`) dan rincian kelas ke `krs_details`.
- Validasi *Backend*: Mengecek prasyarat mata kuliah, kuota kelas, batas maksimal SKS, dan mencegah jadwal bentrok bagi mahasiswa tersebut.

## 3. Persetujuan KRS oleh Dosen Wali / Prodi

### Dosen Wali / Ketua Prodi

- Membuka dashboard Persetujuan KRS.
- Melihat daftar mahasiswa bimbingan yang telah mensubmit KRS.
- Mengklik nama Mahasiswa untuk melihat rincian mata kuliah yang diambil.
- Memberikan keputusan:
  - **Setuju (Approve)**: KRS valid.
  - **Tolak (Reject) dengan Catatan**: Jika ada pilihan kelas yang kurang tepat (misal SKS berlebih, salah ambil kelas).

### Sistem

- Jika disetujui, `krs_headers.status` = `DISETUJUI`. Mahasiswa otomatis terdaftar dalam roster kelas dan LMS untuk mata kuliah tersebut.
- Jika ditolak, mahasiswa harus melakukan revisi KRS dan mengajukan ulang.

## 4. Perkuliahan & Pengisian Nilai Akhir

### Dosen Pengampu

- Melaksanakan perkuliahan selama satu semester.
- Pada saat "Periode Input Nilai" dibuka, Dosen Pengampu membuka dashboard Kelas / Input Nilai.
- Memasukkan komponen nilai (Kehadiran, Tugas, UTS, UAS) secara manual atau menyinkronkan total nilai akhir dari aktivitas LMS.
- Menyimpan nilai dalam status `Draft` untuk pengecekan.
- Setelah yakin, Dosen menekan tombol "Publish Nilai".

### Sistem

- Saat `Draft`, Mahasiswa belum dapat melihat nilai akhirnya.
- Saat di-*Publish*, sistem menghitung Nilai Huruf (A, B, C, D, E) dan Nilai Indeks (4, 3, 2, 1, 0) berdasarkan aturan *Grading* program studi.
- Menyimpan ke tabel `grades` atau meng-update `krs_details`.

## 5. KHS dan Transkrip Nilai

### Mahasiswa

- Setelah nilai di-*publish*, mahasiswa membuka halaman KHS (Kartu Hasil Studi).
- Sistem menampilkan nilai huruf, nilai angka, total SKS, dan IP Semester.
- Mahasiswa bisa membuka halaman Transkrip Nilai untuk melihat akumulasi IPK dari semester 1 hingga semester terakhir.

### Sistem

- Mengkalkulasi (atau membaca agregat) IP Semester dari seluruh KRS yang disetujui di semester berjalan.
- Mengkalkulasi IPK kumulatif untuk dicetak di Transkrip Nilai.

## 6. Flow per Role

### Mahasiswa

Status: Draf

- Melakukan registrasi mata kuliah.
- Hanya melihat KHS dan Transkrip miliknya sendiri secara *read-only*.

### Admin Akademik

Status: Draf

- Mengatur master jadwal, dosen pengampu, dan periode akademik secara penuh.
- Memantau mahasiswa yang belum KRS.

### Dosen Wali & Pengampu

Status: Draf

- Dosen Wali: Hanya bisa menyetujui/menolak KRS milik mahasiswa *bimbingannya*.
- Dosen Pengampu: Hanya bisa mengelola nilai untuk *kelas yang diajarnya*.

## 7. Gap yang Perlu Diimplementasikan

- Sistem validasi bentrok jadwal di level backend (Server Actions) agar user tidak mengakali validasi front-end.
- Kalkulasi IPK dinamis vs disimpan (materialized view) guna menjaga performa saat jumlah mahasiswa banyak.
- Cetak dokumen (PDF export) resmi untuk KHS dan Transkrip Nilai lengkap dengan *watermark/QR code* institusi.

## 8. Definition of Done Flow Utama

Flow ini dianggap jalan jika semua bukti berikut terpenuhi:

- Admin bisa membuat Jadwal Kuliah tanpa jadwal Dosen yang bentrok.
- Mahasiswa yang belum bayar SPP tidak bisa mengakses tombol "Ajukan KRS".
- Pengajuan KRS tervalidasi kuota kelas dan SKS maksimal per mahasiswa.
- Dosen Wali bisa menolak KRS dengan mencantumkan alasan.
- Dosen Pengampu bisa menginput nilai secara *draft*, lalu melakukan *publish*.
- Setelah *publish*, Nilai muncul di dashboard Mahasiswa sebagai KHS semester tersebut.
- IPK dan SKS total terhitung dengan benar dan sinkron dengan Transkrip Nilai.
