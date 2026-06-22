# Alur End-to-End LMS (Learning Management System)

Dokumen ini menjelaskan flow modul LMS (Learning Management System). Modul ini digunakan setelah mahasiswa mendapatkan persetujuan KRS untuk mengikuti kegiatan belajar mengajar secara online (materi, tugas, pengumpulan tugas, forum, dan *grading* tugas).

Status dokumen: draf alur operasional.

## Ringkasan Alur Besar

```text
KRS Mahasiswa Disetujui
-> Mahasiswa dan Dosen Pengampu otomatis terdaftar di Kelas LMS
-> Dosen Mengunggah Materi (File/Video/Teks) & Membuat Tugas
-> Mahasiswa Mengakses Materi & Mengumpulkan (Submit) Tugas
-> Dosen Memeriksa Submission dan Memberikan Nilai Tugas + Feedback
-> (Opsional) Interaksi di Forum Diskusi Kelas
-> Nilai Tugas dapat direkap oleh Dosen sebagai komponen Nilai Akhir Akademik
```

## 1. Akses Kelas (Sinkronisasi dari Akademik)

### Sistem

- Tidak ada proses "Pendaftaran LMS" secara manual.
- Akses kelas (`classrooms` / LMS context) murni bersumber dari `krs_details` di mana `krs_headers.status = 'DISETUJUI'` dan beririsan dengan `jadwal_kuliah` semester aktif.
- Dosen yang mendapatkan akses pengajar adalah Dosen Pengampu yang terdaftar di `jadwal_kuliah` tersebut.

### Mahasiswa & Dosen

- Membuka Dashboard LMS (My Courses).
- Melihat *cards* daftar mata kuliah semester berjalan yang diikutinya (atau diajarnya).

## 2. Manajemen Konten oleh Dosen (Materi & Forum)

### Dosen Pengampu

- Masuk ke salah satu Kelas.
- Menambahkan **Modul / Pertemuan** (contoh: Pertemuan 1, Pertemuan 2).
- Menambahkan **Materi** ke dalam pertemuan (Bisa berupa PDF diunggah ke Supabase Storage, Tautan YouTube, atau teks kaya/Markdown).
- (Opsional) Membuat **Forum Diskusi** per topik agar mahasiswa bisa berdiskusi tanya-jawab.

### Mahasiswa

- Membuka kelas.
- Mengunduh atau membaca materi yang diunggah oleh Dosen.
- Berpartisipasi membalas atau membuat *thread* di Forum Diskusi.

## 3. Pembuatan Tugas (Assignment)

### Dosen Pengampu

- Masuk ke salah satu pertemuan di Kelas.
- Menekan tombol "Buat Tugas".
- Mengisi Judul Tugas, Instruksi, Lampiran File (opsional).
- Menentukan **Tenggat Waktu** (Due Date) & Jam.
- Menentukan apakah tugas mengizinkan *Late Submission* (Pengumpulan Terlambat).

### Sistem

- Menyimpan record di `lms_assignments`.
- Mengaktifkan status tugas agar langsung terlihat di dashboard kalender atau *To-Do List* Mahasiswa di kelas tersebut.

## 4. Pengumpulan Tugas (Submission) oleh Mahasiswa

### Mahasiswa

- Melihat notifikasi/To-Do tugas yang belum dikerjakan.
- Membuka detail tugas dan membaca instruksi.
- Mengunggah file tugas (PDF/Word) ke Supabase Storage melalui UI aplikasi atau mengetik jawaban teks langsung (jika diizinkan).
- Menekan "Kumpulkan Tugas" (Submit).

### Sistem

- Menyimpan rekam jejak pengumpulan di tabel `lms_submissions`.
- Mencatat timestamp pengumpulan. Jika melebihi *Due Date*, maka dilabeli sistem sebagai `LATE`.
- Mencegah mahasiswa submit ulang/revisi jika dosen mematikan fitur revisi tugas.

## 5. Pemeriksaan dan Grading Tugas

### Dosen Pengampu

- Membuka detail Tugas.
- Melihat daftar mahasiswa di kelas, beserta status pengumpulannya (Submitted, Not Submitted, Late).
- Mengklik salah satu mahasiswa yang sudah *submit*.
- Mengunduh/melihat *preview* file tugas mahasiswa.
- Menginput Skor (Skala 0-100) dan (Opsional) Feedback naratif.
- Menekan tombol "Simpan Nilai".

### Mahasiswa

- Setelah dinilai oleh Dosen, mahasiswa membuka kembali detail tugas.
- Melihat nilai angka dan pesan balasan (feedback) dari Dosen.

## 6. Flow per Role

### Mahasiswa

Status: Draf

- Hanya bisa melihat materi dan tugas untuk kelas yang ia ikuti (berdasarkan KRS).
- Hanya bisa melihat nilai submission miliknya sendiri, tidak bisa melihat nilai mahasiswa lain.

### Dosen

Status: Draf

- Dosen bebas menambah, mengedit, menghapus (Soft Delete) materi dan tugas di kelas yang ia ampu.
- Dosen bisa melihat semua submission dan memberikan nilai untuk seluruh mahasiswanya.

### Admin Akademik

Status: Draf

- Biasanya Admin bersifat *Read-Only* di LMS atau dapat bertindak sebagai super-moderator jika terjadi error jadwal atau pendaftaran kelas.

## 7. Gap yang Perlu Diimplementasikan

- Fitur sinkronisasi nilai LMS ke modul Nilai Akademik Akhir (agar dosen tidak perlu entry dua kali manual).
- Implementasi batasan ukuran file saat Mahasiswa submit tugas menggunakan Supabase Storage Policy agar *bandwidth* tidak habis/bocor.
- Fitur *Auto-Lock* Tugas, di mana sistem secara *hard-stop* menolak unggahan submission lewat dari tenggat waktu (jika *late submission* tidak diizinkan).

## 8. Definition of Done Flow Utama

Flow ini dianggap jalan jika semua bukti berikut terpenuhi:

- Dosen dapat mengunggah PDF materi ke Supabase Storage, lalu menyematkannya di kelas.
- Mahasiswa hanya melihat kelas yang KRS-nya "Disetujui" pada semester aktif tersebut.
- Mahasiswa dapat mengunggah file tugas (*submission*).
- Dosen dapat melihat daftar submission mahasiswa dan memberikan nilai (contoh: 85) serta *feedback*.
- Mahasiswa bisa melihat *feedback* nilai tugas tersebut tanpa bisa diubah oleh mahasiswa.
- Mahasiswa tidak bisa mengakses tugas maupun submit jika kelas bukan miliknya, dikunci oleh RBAC/RLS Server Actions.
