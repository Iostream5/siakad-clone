# Alur End-to-End SIAKAD STAI Al-Ittihad

> **Versi Dokumen:** Gabungan  
> **Tanggal:** Juni 2026  
> **Status:** Draf Operasional  
> **Cakupan:** Admin Fondasi · PMB & Mahasiswa · Akademik (KRS & Nilai) · LMS · Keuangan

---

## Daftar Isi

1. [Gambaran Besar Alur Sistem](#1-gambaran-besar-alur-sistem)
2. [Admin Fondasi — Master Data & RBAC](#2-admin-fondasi--master-data--rbac)
3. [PMB sampai Mahasiswa Aktif](#3-pmb-sampai-mahasiswa-aktif)
4. [Akademik — KRS & Nilai](#4-akademik--krs--nilai)
5. [LMS — Learning Management System](#5-lms--learning-management-system)
6. [Keuangan — Tagihan & Pembayaran](#6-keuangan--tagihan--pembayaran)
7. [Matriks Flow per Role](#7-matriks-flow-per-role)
8. [Gap & Pekerjaan Lanjutan](#8-gap--pekerjaan-lanjutan)
9. [Definition of Done — Semua Flow](#9-definition-of-done--semua-flow)

---

## 1. Gambaran Besar Alur Sistem

Diagram berikut menunjukkan urutan besar proses dalam SIAKAD dari setup awal sampai mahasiswa aktif di LMS.

```
[FASE 0 — FONDASI]
Admin login
→ Setup RBAC (Role, Permission, Menu)
→ Setup Master Kampus (Kampus, Fakultas, Prodi)
→ Setup Master Infrastruktur (Gedung, Ruangan)
→ Setup Master Akademik (Tahun Akademik, Kurikulum, Mata Kuliah, Kelas)

[FASE 1 — PMB]
Calon Mahasiswa daftar PMB (halaman publik)
→ Bayar biaya pendaftaran
→ Admin/Keuangan verifikasi pembayaran
→ Admin/Prodi input hasil seleksi & wawancara
→ Admin/Prodi meluluskan atau menolak
→ Jika lulus: Admin generate NIM → akun berubah menjadi Mahasiswa

[FASE 2 — ONBOARDING MAHASISWA BARU]
Keuangan generate tagihan semester
→ Mahasiswa bayar tagihan / mendapat dispensasi
→ Mahasiswa registrasi semester (status: LUNAS / DISPENSASI)

[FASE 3 — AKADEMIK]
Admin Akademik buka periode KRS
→ Mahasiswa isi dan ajukan KRS
→ Dosen Wali / Prodi approve KRS
→ KRS Disetujui → Mahasiswa masuk kelas & LMS

[FASE 4 — LMS & PENILAIAN]
Dosen unggah materi, buat tugas, buka forum
→ Mahasiswa baca materi, submit tugas
→ Dosen nilai submission
→ Akhir semester: Dosen input & publish Nilai Akhir
→ Mahasiswa lihat KHS → IPK terakumulasi ke Transkrip
```

---

## 2. Admin Fondasi — Master Data & RBAC

### 2.1 Ringkasan Alur

```
Admin login
→ Setup Role, Permission, Menu Dinamis
→ Setup Users (Staf, Dosen, Admin lain)
→ Setup Master Kampus (Kampus, Fakultas, Prodi)
→ Setup Master Infrastruktur (Gedung, Ruangan)
→ Setup Master Akademik (Tahun Akademik, Kurikulum, Mata Kuliah, Kelas)
→ Sistem siap untuk modul operasional
```

### 2.2 Setup RBAC — Role, Permission, dan Menu Dinamis

**Admin:**
- Login ke dashboard menggunakan akun role `admin`.
- Membuka halaman manajemen **Permission** → menambahkan daftar permission format `module.action` (contoh: `users.read`, `pmb.verify`).
- Membuka halaman manajemen **Role** → membuat role baru dan menghubungkannya dengan permission yang sesuai.
- Membuka halaman manajemen **Menu** → menyusun hierarki menu dinamis untuk sidebar (parent & child), menentukan permission yang dibutuhkan per menu.

**Sistem:**
- Menyimpan data ke tabel `permissions`, `roles`, dan `role_permissions`.
- Menyimpan struktur navigasi ke tabel `menus` dan `menu_permissions`.
- Merender sidebar secara dinamis berdasarkan role & permission user aktif.
- Menerapkan route protection di `src/proxy.ts` dan Server Actions.

**Status Data:**
```
roles.name         = admin, prodi, keuangan, dosen, mahasiswa, dll
permissions.action = users.read, pmb.verify, dll
menus.status       = Aktif
```

### 2.3 Manajemen Pengguna (Users)

**Admin:**
- Membuka halaman manajemen User.
- Menambahkan user baru secara manual (Staf, Dosen, Pimpinan, dll).
- Mengisi data profil (nama, email, NIK/NIP).
- Menugaskan satu atau lebih Role kepada user.
- Menonaktifkan (soft delete) user yang sudah tidak aktif.

**Sistem:**
- Membuat akun kredensial di Supabase Auth.
- Menyimpan referensi ke tabel `users` dan profil ke `user_profiles`.
- Menyimpan pemetaan role ke tabel `user_roles`.

### 2.4 Setup Master Data Institusi

**Admin:**
- Menambahkan data **Kampus** (nama, alamat, dll).
- Menambahkan **Fakultas** di bawah Kampus.
- Menambahkan **Program Studi (Prodi)** di bawah Fakultas.

**Sistem:** Menyimpan ke tabel `campuses`, `faculties`, dan `departments` dengan relasi FK yang benar.

### 2.5 Setup Master Infrastruktur Fisik

**Admin:**
- Menambahkan data **Gedung** yang ada di kampus.
- Menambahkan **Ruangan** di dalam setiap Gedung beserta kapasitas optimalnya.

**Sistem:** Menyimpan ke tabel `buildings` dan `classrooms`. Data ruangan akan digunakan dalam penjadwalan kuliah.

### 2.6 Setup Master Akademik

**Admin:**
- Membuat **Tahun Akademik & Semester** baru → menandai yang sedang aktif → mengatur periode penting (`is_krs_open`, `is_input_nilai_open`).
- Membuat **Kurikulum** per Program Studi.
- Mendaftarkan **Mata Kuliah** dan menghubungkannya ke Kurikulum.
- Membuat **Kelas / Kelompok Belajar** (`class_groups`) untuk rombongan belajar.

**Sistem:** Menyimpan ke tabel `academic_terms`, `curriculums`, `courses`, dan `class_groups`. Hanya satu tahun akademik yang aktif pada satu waktu. Semua perubahan krusial dicatat di `audit_logs`.

---

## 3. PMB sampai Mahasiswa Aktif

### 3.1 Ringkasan Alur

```
Calon Mahasiswa daftar PMB (halaman publik)
→ Bayar biaya pendaftaran
→ Admin/Keuangan verifikasi pembayaran
→ Jadwal seleksi & wawancara
→ Admin/Prodi input skor & hasil seleksi
→ Luluskan atau tolak
→ Jika lulus: Admin generate NIM → akun berubah menjadi Mahasiswa
→ Keuangan generate tagihan semester
→ Mahasiswa registrasi semester → KRS → LMS
```

### 3.2 Registrasi PMB dan Akun Calon Mahasiswa

**Calon Mahasiswa:**
- Membuka halaman publik PMB → mengisi formulir pendaftaran → memilih program studi → mengunggah dokumen (jika tersedia) → submit.
- Menerima akun calon mahasiswa → login → melihat invoice biaya pendaftaran PMB.

**Sistem:**
- Membuat data di `pmb_pendaftaran`.
- Membuat nomor pendaftaran dan invoice PMB.
- Membuat akun Auth dan profil `users` dengan role `Calon Mahasiswa`.

**Status Data:**
```
pmb_pendaftaran.status_pendaftaran = Submitted / Waiting Payment
pmb_pendaftaran.status_pembayaran  = pending / manual_review
pmb_pendaftaran.status_seleksi     = BARU
users.role                         = Calon Mahasiswa
```

### 3.3 Pembayaran PMB

**Calon Mahasiswa:**
- Membuka portal pembayaran PMB → memilih metode pembayaran.
- **Transfer manual:** mengunggah bukti pembayaran.
- **Payment Gateway:** melakukan checkout lewat Midtrans/Xendit.

**Sistem (Payment Gateway):**
- Menyimpan `provider_reference` dan `checkout_url`.
- Webhook memvalidasi signature dan idempotency → update status otomatis.

**Admin / Keuangan / Staff:**
- Mengecek bukti pembayaran → Terima (approve) atau Tolak (reject).

**Status jika diterima:**
```
pmb_pembayaran.status              = Terverifikasi
pmb_pendaftaran.status_pembayaran  = paid
pmb_pendaftaran.status_pendaftaran = Verified
pmb_pendaftaran.status_seleksi     = VERIFIKASI
```

**Status jika ditolak:**
```
pmb_pembayaran.status              = Ditolak
pmb_pendaftaran.status_pembayaran  = pending
pmb_pendaftaran.status_pendaftaran = Waiting Payment
```

### 3.4 Penjadwalan Seleksi dan Wawancara

**Admin / Staff PMB / Prodi:**
- Melihat calon mahasiswa dengan status pembayaran `paid`.
- Menentukan jadwal dan jenis seleksi (tes akademik/SKD, wawancara, baca Al-Quran, validasi dokumen).
- Mengirim informasi jadwal kepada calon mahasiswa.

**Calon Mahasiswa:**
- Mengikuti tes/wawancara sesuai jadwal (offline maupun portal PMB jika tersedia).

> Catatan: Tes maba adalah subfitur PMB — bukan LMS. LMS dipakai setelah calon mahasiswa menjadi mahasiswa aktif dengan KRS approved.

### 3.5 Input Hasil Seleksi

**Admin / Prodi / Staff PMB:**
- Membuka tab seleksi PMB → memilih calon mahasiswa dengan status `VERIFIKASI`.
- Menginput skor per komponen:

| Komponen | Bobot | Keterangan |
|---|---:|---|
| Tes akademik / SKD | 40% | Nilai tes objektif |
| Wawancara | 30% | Nilai dari pewawancara/prodi |
| Baca Al-Quran | 20% | Jika menjadi syarat kampus |
| Kelengkapan dokumen | 10% | Validasi dokumen wajib |

- Menentukan keputusan: **Lulus** / **Ditolak** / Perlu review ulang.

**Status jika lulus:**
```
pmb_pendaftaran.status_seleksi     = LULUS
pmb_pendaftaran.status_pendaftaran = Accepted
```

**Status jika ditolak:**
```
pmb_pendaftaran.status_seleksi     = DITOLAK
pmb_pendaftaran.status_pendaftaran = Rejected
```

### 3.6 Generate NIM dan Konversi Menjadi Mahasiswa

**Admin / Prodi / Staff PMB:**
- Membuka tab Registrasi/NIM → memilih calon mahasiswa dengan status `LULUS` → klik **Generate NIM**.

**Sistem:**
- Mengecek calon mahasiswa sudah lulus dan NIM belum pernah dibuat.
- Generate NIM berdasarkan tahun/angkatan.
- Mengubah `users.role` dari `Calon Mahasiswa` menjadi `Mahasiswa`.
- Membuat record di tabel `mahasiswa`.

**Status setelah berhasil:**
```
pmb_pendaftaran.generated_nim      = NIM baru
pmb_pendaftaran.status_pendaftaran = Registered
users.role                         = Mahasiswa
mahasiswa.status_mahasiswa         = AKTIF
```

### 3.7 Tahapan Setelah Mahasiswa Punya NIM

```
NIM aktif
→ Dashboard mahasiswa tampil tahapan berikutnya
→ Mahasiswa cek tagihan semester
→ Mahasiswa bayar / mendapat dispensasi
→ Registrasi semester = LUNAS / DISPENSASI
→ Periode KRS dibuka
→ Mahasiswa isi KRS
→ Dosen Wali / Prodi approve KRS
→ LMS tampil berdasarkan KRS yang disetujui
```

**Navigasi utama mahasiswa:**
```
Dashboard → Keuangan/Tagihan → Registrasi Semester → KRS → LMS → Nilai
```

---

## 4. Akademik — KRS & Nilai

### 4.1 Ringkasan Alur

```
Admin Akademik set Tahun Akademik Aktif & Jadwal Kuliah
→ Mahasiswa (LUNAS tagihan) mengisi & mengajukan KRS
→ Dosen Wali / Prodi review → Setujui / Tolak
→ KRS Disetujui → Mahasiswa masuk kelas sesuai jadwal
→ Perkuliahan berjalan (absensi, LMS)
→ Akhir semester: Dosen input & publish Nilai Akhir
→ Mahasiswa lihat KHS
→ Nilai terakumulasi ke Transkrip
```

### 4.2 Persiapan Jadwal Kuliah

**Admin Akademik / Prodi:**
- Mengaktifkan Tahun Akademik & Semester berjalan → mengaktifkan Periode Pengisian KRS.
- Menyusun Jadwal Kuliah (Mata Kuliah × Dosen × Ruangan × Rombongan Belajar).
- Mem-publish Jadwal Kuliah.

**Sistem:**
- Memvalidasi tidak ada Dosen mengajar dua kelas pada jam yang sama.
- Memvalidasi kapasitas Ruangan vs estimasi pendaftar Kelas.

### 4.3 Pengisian KRS oleh Mahasiswa

**Mahasiswa** (syarat: tagihan semester berstatus `LUNAS` atau `DISPENSASI`):
- Membuka halaman KRS → melihat daftar Jadwal Kuliah yang ditawarkan.
- Memilih kelas dengan memperhatikan batas SKS maksimum.
- Klik **"Ajukan KRS"**.

**Sistem:**
- Menyimpan ke `krs_headers` (status: `DIAJUKAN`) dan `krs_details`.
- Validasi backend: prasyarat mata kuliah, kuota kelas, batas SKS, bentrok jadwal.

### 4.4 Persetujuan KRS

**Dosen Wali / Ketua Prodi:**
- Membuka dashboard Persetujuan KRS → mengklik nama Mahasiswa untuk melihat rincian.
- **Setuju (Approve)** atau **Tolak (Reject) dengan Catatan**.

**Sistem:**
- Jika disetujui: `krs_headers.status = DISETUJUI` → Mahasiswa otomatis terdaftar di roster kelas dan LMS.
- Jika ditolak: Mahasiswa harus revisi KRS dan mengajukan ulang.

**Status KRS:**
```
Draft → Diajukan → Disetujui
Draft → Diajukan → Ditolak → revisi → Diajukan
```

### 4.5 Input dan Publish Nilai

**Dosen Pengampu** (saat Periode Input Nilai dibuka):
- Membuka dashboard Kelas / Input Nilai.
- Memasukkan komponen nilai (Kehadiran, Tugas, UTS, UAS) — secara manual atau sinkronisasi dari LMS.
- Menyimpan sebagai status `Draft` → setelah yakin, klik **"Publish Nilai"**.

**Sistem:**
- Status `Draft`: Mahasiswa belum dapat melihat nilai akhir.
- Status `Published`: Sistem menghitung Nilai Huruf (A/B/C/D/E) dan Nilai Indeks → menyimpan ke tabel `grades`.

### 4.6 KHS dan Transkrip Nilai

**Mahasiswa:**
- Setelah nilai dipublish → membuka halaman KHS → melihat nilai huruf, nilai angka, total SKS, dan IP Semester.
- Membuka halaman Transkrip Nilai → melihat akumulasi IPK dari seluruh semester.

**Sistem:** Mengkalkulasi IP Semester dan IPK kumulatif untuk ditampilkan dan dicetak.

---

## 5. LMS — Learning Management System

### 5.1 Ringkasan Alur

```
KRS Mahasiswa Disetujui
→ Mahasiswa & Dosen Pengampu otomatis terdaftar di Kelas LMS
→ Dosen unggah Materi & buat Tugas
→ Mahasiswa akses Materi & submit Tugas
→ Dosen periksa Submission & berikan Nilai + Feedback
→ (Opsional) Forum Diskusi Kelas
→ Nilai Tugas direkap sebagai komponen Nilai Akhir Akademik
```

### 5.2 Akses Kelas (Sinkronisasi dari Akademik)

**Sistem:**
- Tidak ada pendaftaran LMS manual.
- Akses kelas bersumber dari `krs_details` di mana `krs_headers.status = 'DISETUJUI'` pada `jadwal_kuliah` semester aktif.
- Dosen Pengampu yang terdaftar di `jadwal_kuliah` otomatis mendapat akses pengajar.

**Mahasiswa & Dosen:** Membuka Dashboard LMS → melihat daftar mata kuliah semester berjalan.

### 5.3 Manajemen Konten oleh Dosen

**Dosen Pengampu:**
- Masuk ke Kelas → menambahkan **Modul / Pertemuan** (contoh: Pertemuan 1, Pertemuan 2).
- Menambahkan **Materi** ke dalam pertemuan (PDF ke Supabase Storage, tautan YouTube, atau teks/Markdown).
- (Opsional) Membuat **Forum Diskusi** per topik.

**Mahasiswa:**
- Membuka kelas → mengunduh/membaca materi → berpartisipasi di Forum Diskusi.

### 5.4 Pembuatan Tugas

**Dosen Pengampu:**
- Masuk ke pertemuan di Kelas → klik **"Buat Tugas"**.
- Mengisi Judul, Instruksi, Lampiran (opsional), **Tenggat Waktu** (Due Date & Jam).
- Menentukan apakah mengizinkan *Late Submission*.

**Sistem:** Menyimpan ke `lms_assignments` → tugas langsung terlihat di kalender/To-Do List mahasiswa.

### 5.5 Pengumpulan Tugas (Submission)

**Mahasiswa:**
- Membuka detail tugas → membaca instruksi.
- Mengunggah file tugas (PDF/Word) ke Supabase Storage atau mengetik jawaban teks langsung.
- Klik **"Kumpulkan Tugas"**.

**Sistem:**
- Menyimpan ke `lms_submissions` beserta timestamp pengumpulan.
- Jika melebihi Due Date, tugas dilabeli `LATE`.
- Mencegah submit ulang jika dosen menonaktifkan fitur revisi.

### 5.6 Pemeriksaan dan Grading

**Dosen Pengampu:**
- Membuka detail Tugas → melihat daftar mahasiswa + status pengumpulan (Submitted / Not Submitted / Late).
- Mengklik mahasiswa yang sudah submit → mengunduh/preview file tugas.
- Menginput **Skor (0–100)** dan **Feedback** (opsional) → klik **"Simpan Nilai"**.

**Mahasiswa:**
- Membuka kembali detail tugas → melihat nilai angka dan feedback dari Dosen.

---

## 6. Keuangan — Tagihan & Pembayaran

### 6.1 Ringkasan Alur

```
Keuangan membuat Master Biaya / Jenis Tagihan
→ Keuangan generate Tagihan (Invoice) massal/individu
→ Mahasiswa cek Tagihan di Dashboard
→ Mahasiswa melakukan Checkout/Pembayaran
→ Jika Manual: Mahasiswa unggah bukti → Keuangan verifikasi
→ Jika Gateway: Webhook otomatis update status
→ Tagihan = LUNAS (atau DISPENSASI)
→ Mahasiswa berhak KRS
```

### 6.2 Setup Master Biaya dan Tarif

**Admin / Keuangan:**
- Membuka menu **Master Biaya** (`billing_types`).
- Menambahkan jenis biaya (contoh: Biaya Pendaftaran PMB, SPP Semester Ganjil, Biaya SKS, Biaya Wisuda).
- Mengatur nominal default, deskripsi, periode berlaku, dan atribut biaya (wajib/opsional).

**Sistem:** Menyimpan definisi tarif ke tabel `billing_types`.

### 6.3 Generate Tagihan (Invoice)

**Admin / Keuangan:**
- Membuka halaman Manajemen Tagihan.
- Memilih kelompok Mahasiswa (berdasarkan Angkatan, Prodi, Kelas) atau Mahasiswa individu.
- Memilih Tahun Akademik aktif dan Jenis Biaya → klik **"Generate Tagihan"**.

**Sistem:**
- Membuat data di tabel `invoices` (berelasi dengan `mahasiswa_id`).
- Membuat detail komponen tagihan di `invoice_items`.
- Status awal: `UNPAID` / `PENDING`.
- (Opsional) Mengirimkan notifikasi ke Mahasiswa.

### 6.4 Pembayaran oleh Mahasiswa

**Mahasiswa:**
- Login → menu Keuangan / Tagihan → melihat tagihan berstatus `UNPAID` → klik **"Bayar"**.
- Memilih metode:
  - **Manual Transfer:** Melihat instruksi rekening tujuan → transfer → unggah bukti.
  - **Payment Gateway:** Memilih metode melalui UI Midtrans/Xendit.

**Sistem (jika Payment Gateway):**
- Memanggil API provider → membuat Payment Link / Virtual Account.
- Menyimpan `provider_reference` dan `checkout_url`.
- Mengarahkan Mahasiswa ke halaman checkout provider.

### 6.5 Verifikasi Pembayaran

#### Pembayaran Manual

- Mahasiswa mengunggah foto bukti transfer → status berubah menjadi `MENUNGGU VERIFIKASI`.
- Staf Keuangan mengecek bukti → **Terima** (Approve) atau **Tolak** (Reject jika bukti buram/salah).

#### Pembayaran via Gateway

- Mahasiswa selesai bayar di platform provider.
- Provider mengirim Webhook ke server SIAKAD.
- Sistem memvalidasi signature webhook (mencegah spoofing) + idempotency (menghindari proses ganda).
- Jika settled: sistem mencatat `payments` dan mengupdate status tagihan otomatis.

**Status data setelah verifikasi:**
```
invoices.status              = PAID (Lunas)
payments.amount              = nominal sesuai tagihan
registrasi_semester.status   = LUNAS
```

### 6.6 Dispensasi Pembayaran (Opsional)

**Keuangan / Pimpinan:**
- Membuka detail tagihan Mahasiswa → mengubah status sebagian atau menandai `DISPENSASI`.

**Sistem:** Mahasiswa tidak di-block dari akses KRS meskipun belum lunas 100%.

---

## 7. Matriks Flow per Role

| Role | Modul Utama | Status Implementasi |
|---|---|---|
| **Admin** | RBAC, Master Data, PMB, Jadwal, Audit Log | Partial — flow utama tersedia |
| **Prodi** | Seleksi PMB, KRS approval, monitoring nilai | Partial — monitoring KRS & seleksi tersedia |
| **Dosen Wali** | Approval KRS mahasiswa bimbingan | Partial — approval KRS tersedia |
| **Dosen Pengampu** | LMS (materi, tugas, forum), input nilai | Partial — LMS & input nilai tersedia |
| **Mahasiswa** | Tagihan, registrasi, KRS, LMS, nilai/KHS/transkrip | Partial — dashboard & flow dasar tersedia |
| **Calon Mahasiswa** | Daftar PMB, bayar, lihat status seleksi | Partial — basic PMB tersedia |
| **Staff PMB** | Validasi dokumen, administrasi PMB | Partial — validasi & input administrasi tersedia |
| **Keuangan** | Master biaya, tagihan, verifikasi pembayaran | Implemented dasar |
| **Bendahara** | Transaksi keuangan sesuai permission | Partial — akses finance tersedia |
| **Pimpinan** | Laporan PMB, akademik, keuangan (read-only) | Partial — dashboard ringkasan tersedia |

### Aturan Lintas Role

- Semua data bersifat **per-user** — tidak ada mahasiswa yang bisa melihat tagihan, KRS, nilai, atau LMS mahasiswa lain.
- Semua mutasi penting **wajib tercatat di `audit_logs`**.
- Route protection dijalankan di `src/proxy.ts`, bukan hanya di UI.
- Setiap Server Action mutasi **wajib cek role/permission di server-side**.

---

## 8. Gap & Pekerjaan Lanjutan

### PMB dan Seleksi
- Tabel jadwal seleksi, komponen nilai, nilai seleksi, passing grade, dan notifikasi in-app perlu diimplementasikan.
- CBT/ujian online (bank soal, timer, auto scoring) belum masuk MVP.
- Portal calon mahasiswa untuk detail jadwal/hasil seleksi perlu dilengkapi.

### Keuangan
- Sistem cicilan (*Installments*) untuk pembayaran SPP bertahap.
- Keamanan endpoint Webhook: signature verification dan idempotency check wajib dipastikan di production.
- Dashboard piutang mahasiswa dan kas masuk per bulan/semester.
- Pastikan submit bukti pembayaran tidak membuat duplikasi.

### Akademik dan LMS
- Validasi bentrok jadwal di level backend (Server Actions).
- Kalkulasi IPK dinamis vs disimpan (materialized view).
- Cetak dokumen PDF resmi KHS dan Transkrip dengan watermark/QR code institusi.
- Sinkronisasi nilai LMS ke modul Nilai Akademik agar dosen tidak entry dua kali.
- Batasan ukuran file submission via Supabase Storage Policy.
- Auto-Lock Tugas (hard-stop lewat tenggat waktu jika late submission tidak diizinkan).

### EDOM, Kalender, dan Laporan
- Form builder EDOM yang lengkap dan export hasil.
- Laporan pimpinan/prodi yang lebih detail.
- Notifikasi akademik untuk KRS, LMS, nilai published, dan event kalender.

### Infrastruktur
- Upload dokumen PMB dan bukti pembayaran end-to-end ke Supabase Storage.
- Dynamic sidebar sepenuhnya database-driven (tidak ada hardcode di `constants.ts`).
- Smoke test manual per role utama.

---

## 9. Definition of Done — Semua Flow

### Admin Fondasi

| # | Kriteria |
|---|---|
| 1 | Admin berhasil login via Supabase Auth dan melihat dashboard |
| 2 | Admin bisa membuat Role baru dan mengatur Permission |
| 3 | Admin bisa mengatur Menu sidebar, dan menu otomatis hilang untuk user tanpa permission |
| 4 | Admin bisa membuat User baru dan user tersebut berhasil login |
| 5 | Admin bisa melengkapi data Kampus, Fakultas, dan Prodi tanpa error relasi |
| 6 | Admin bisa menambahkan Tahun Akademik dan mengaktifkannya |
| 7 | Audit Log mencatat siapa, kapan, dan apa yang diubah pada operasi krusial |

### PMB sampai Mahasiswa Aktif

| # | Kriteria |
|---|---|
| 1 | Calon mahasiswa bisa daftar PMB dari halaman publik |
| 2 | Calon mahasiswa bisa login dan melihat invoice PMB |
| 3 | Calon mahasiswa bisa submit pembayaran |
| 4 | Admin/keuangan bisa verifikasi pembayaran PMB |
| 5 | Admin/prodi bisa input skor seleksi |
| 6 | Admin/prodi bisa meluluskan atau menolak calon mahasiswa |
| 7 | Calon mahasiswa lulus bisa dibuatkan NIM |
| 8 | Akun calon mahasiswa berubah menjadi mahasiswa; data muncul di master mahasiswa |

### Akademik — KRS & Nilai

| # | Kriteria |
|---|---|
| 1 | Admin bisa membuat Jadwal Kuliah tanpa bentrok jadwal Dosen |
| 2 | Mahasiswa yang belum bayar SPP tidak bisa mengakses tombol "Ajukan KRS" |
| 3 | Pengajuan KRS tervalidasi kuota kelas dan SKS maksimal |
| 4 | Dosen Wali bisa menolak KRS dengan mencantumkan alasan |
| 5 | Dosen Pengampu bisa input nilai draft lalu publish |
| 6 | Setelah publish, nilai muncul di dashboard Mahasiswa sebagai KHS |
| 7 | IPK dan SKS total terhitung benar dan sinkron dengan Transkrip |

### LMS

| # | Kriteria |
|---|---|
| 1 | Dosen dapat mengunggah PDF materi ke Supabase Storage dan menyematkannya di kelas |
| 2 | Mahasiswa hanya melihat kelas yang KRS-nya "Disetujui" pada semester aktif |
| 3 | Mahasiswa dapat mengunggah file tugas (submission) |
| 4 | Dosen dapat melihat daftar submission dan memberikan nilai serta feedback |
| 5 | Mahasiswa bisa melihat feedback nilai tanpa bisa mengubahnya |
| 6 | Mahasiswa tidak bisa mengakses tugas/submit jika kelas bukan miliknya (RBAC/RLS) |

### Keuangan

| # | Kriteria |
|---|---|
| 1 | Keuangan dapat membuat master biaya SPP |
| 2 | Keuangan dapat generate invoice SPP untuk 1 atau 100 Mahasiswa sekaligus (Bulk) |
| 3 | Mahasiswa dapat melihat nominal tagihan yang sesuai (tidak tertukar) |
| 4 | Pembayaran via Midtrans webhook otomatis mengubah status tagihan tanpa intervensi Staf |
| 5 | Mahasiswa dengan tagihan SPP "Lunas" atau "Dispensasi" terbuka akses KRS-nya |
| 6 | Tidak ada pembayaran ganda akibat retry webhook |

---

*Dokumen ini merupakan gabungan dari: ALUR-END-TO-END-ADMIN-FONDASI.md, ALUR-END-TO-END-PMB-MAHASISWA-LMS.md, ALUR-END-TO-END-AKADEMIK.md, ALUR-END-TO-END-LMS.md, dan ALUR-END-TO-END-KEUANGAN.md.*
