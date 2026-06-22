# Alur End-to-End PMB sampai LMS

Dokumen ini menjelaskan flow aplikasi dari calon mahasiswa daftar PMB sampai menjadi mahasiswa aktif yang bisa mengakses KRS dan LMS.

Status dokumen: alur operasional + status implementasi. Flow dasar sudah berjalan, fungsi lanjutan per role dikerjakan bertahap sesuai PRD dan workflow.

## Ringkasan Alur Besar

```text
Calon mahasiswa daftar PMB
-> bayar biaya pendaftaran
-> admin/keuangan verifikasi pembayaran
-> calon mahasiswa mengikuti tes seleksi/wawancara
-> admin/prodi input hasil seleksi
-> admin/prodi meluluskan atau menolak
-> jika lulus, admin generate NIM
-> akun berubah menjadi Mahasiswa
-> admin/keuangan generate tagihan semester
-> mahasiswa daftar ulang/registrasi semester
-> admin/prodi/dosen siapkan jadwal kuliah
-> mahasiswa isi KRS
-> dosen/prodi approve KRS
-> mahasiswa masuk LMS berdasarkan KRS yang disetujui
```

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

Tahap ini dimulai setelah admin melakukan generate NIM dan akun berubah dari `Calon Mahasiswa` menjadi `Mahasiswa`.

Alur aplikasi:

```text
NIM aktif
-> dashboard mahasiswa menampilkan tahapan berikutnya
-> mahasiswa cek tagihan semester
-> mahasiswa bayar tagihan / mendapat dispensasi
-> registrasi semester menjadi LUNAS atau DISPENSASI
-> periode KRS dibuka
-> mahasiswa mengisi KRS
-> dosen/prodi approve KRS
-> LMS tampil berdasarkan KRS yang disetujui
```

### Mahasiswa

- Login sebagai mahasiswa.
- Melihat dashboard mahasiswa yang berisi NIM, status tagihan, registrasi semester, KRS, dan LMS.
- Mengikuti tombol "langkah berikutnya" di dashboard.
- Mengecek tagihan semester di menu Keuangan.
- Membayar tagihan daftar ulang atau SPP.
- Melihat status pembayaran dan status daftar ulang.
- Melakukan registrasi semester atau daftar ulang.
- Mengisi KRS hanya jika registrasi semester sudah `LUNAS` atau `DISPENSASI`.
- Menunggu approval KRS.
- Setelah KRS disetujui, mahasiswa dapat mengakses kelas LMS.

### Navigasi Mahasiswa

Urutan menu utama mahasiswa:

```text
Dashboard
-> Keuangan / Tagihan
-> Registrasi Semester
-> KRS
-> LMS
-> Nilai
```

Catatan:

- Menu PMB setelah mahasiswa punya NIM hanya menjadi histori pembayaran/portal lama jika masih perlu dilihat.
- Tagihan semester mahasiswa aktif berada di menu Keuangan, bukan di tab PMB.

### Admin Akademik / Staff

- Memastikan data mahasiswa sudah masuk master mahasiswa.
- Memastikan program studi, kurikulum, mata kuliah, dosen, ruangan, kelas, dan tahun akademik aktif sudah siap.
- Membuat jadwal kuliah.
- Membuka periode KRS.
- Mengawasi mahasiswa yang belum registrasi semester atau belum mengisi KRS.
- Memastikan KRS hanya dibuka pada tahun akademik aktif.

### Keuangan

- Membuat master biaya semester.
- Generate tagihan mahasiswa.
- Memverifikasi pembayaran mahasiswa.
- Menjalankan sync status mahasiswa jika diperlukan.
- Memberi dispensasi jika ada kebijakan khusus.
- Memastikan daftar ulang berakhir di status `LUNAS` atau `DISPENSASI` sebelum mahasiswa boleh KRS.

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

### Aturan Gate Tahap 6

- Dashboard mahasiswa membaca helper `getMahasiswaPostNimFlow(userId)`.
- Halaman registrasi mahasiswa hanya menampilkan data registrasi miliknya sendiri.
- Submit KRS divalidasi di server, bukan hanya lewat tombol UI.
- Syarat submit KRS:
  - mahasiswa punya data `mahasiswa`;
  - tahun akademik aktif tersedia;
  - `tahun_akademik.is_krs_open = true`;
  - registrasi semester statusnya `LUNAS` atau `DISPENSASI`.
- LMS mahasiswa hanya menampilkan kelas dari KRS berstatus `Disetujui`.

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

Status: Partial. Basic PMB sudah ada, seleksi terstruktur mulai tersedia, CBT online belum masuk MVP.

- Registrasi PMB.
- Login memakai akun baru.
- Membayar biaya pendaftaran.
- Upload bukti pembayaran jika manual.
- Melihat jadwal seleksi/wawancara dari notifikasi/status PMB.
- Mengikuti seleksi/wawancara.
- Melihat status hasil seleksi.
- Jika lulus, menunggu NIM dibuat.

Acceptance:

- Calon mahasiswa hanya melihat data PMB miliknya.
- Setelah pembayaran terverifikasi, status siap seleksi.
- Jadwal dan hasil seleksi masuk notifikasi calon mahasiswa.

### Mahasiswa

Status: Partial. Dashboard, tagihan, registrasi, KRS, LMS, nilai/KHS/transkrip dasar sudah ada; workflow nilai resmi dan laporan masih perlu hardening.

- Login sebagai mahasiswa.
- Melengkapi profil.
- Membayar tagihan semester.
- Melakukan registrasi semester.
- Mengisi KRS.
- Menunggu approval KRS.
- Mengakses LMS setelah KRS disetujui.
- Mengikuti materi, tugas, forum, dan nilai.

Acceptance:

- Mahasiswa tidak bisa melihat tagihan, registrasi, KRS, LMS, dan nilai mahasiswa lain.
- KRS hanya bisa diajukan jika registrasi semester valid.
- LMS hanya muncul dari KRS yang disetujui.
- Nilai, KHS, dan transkrip hanya membaca nilai yang sudah dipublish.

### Admin

Status: Partial. Flow utama tersedia, fungsi lanjutan seleksi PMB dan repair kalender/EDOM mulai tersedia.

- Melihat data calon mahasiswa.
- Mengelola tarif PMB.
- Mengecek dokumen PMB.
- Mengecek pembayaran PMB.
- Mengatur jadwal seleksi/wawancara.
- Mengelola komponen nilai dan passing grade seleksi.
- Menginput hasil seleksi.
- Meluluskan atau menolak calon mahasiswa.
- Generate NIM.
- Mengelola master data akademik.
- Membantu setup jadwal, KRS, LMS, dan akses.

Acceptance:

- Admin bisa menjalankan PMB dari daftar sampai NIM tanpa duplikasi.
- Admin bisa mengelola kalender akademik dan EDOM.
- Semua mutasi penting tercatat audit log.

### Staff PMB

Status: Partial. Validasi dan input administrasi tersedia, keputusan final tetap dibatasi.

- Memantau pendaftar.
- Memvalidasi data dan dokumen.
- Membantu verifikasi administrasi PMB.
- Mengatur jadwal seleksi/wawancara jika diberi akses.
- Membantu input nilai seleksi jika diberi akses.

Acceptance:

- Staff PMB tidak mengelola master biaya kampus.
- Staff PMB tidak menentukan passing grade.

### Keuangan

Status: Implemented dasar. PMB payment, tagihan, pembayaran semester, daftar ulang, dan dashboard mahasiswa sudah ada; laporan lanjutan tetap perlu diperluas.

- Memverifikasi pembayaran PMB.
- Mengelola master biaya.
- Generate tagihan mahasiswa.
- Memverifikasi pembayaran semester.
- Mengelola arus kas.
- Memberi status dispensasi sesuai kebijakan.

Acceptance:

- Pembayaran PMB dan semester idempotent.
- Tagihan mahasiswa tidak dobel untuk scope yang sama.
- Pembayaran semester tersinkron ke registrasi semester.

### Prodi

Status: Partial. Monitoring KRS dan seleksi tersedia, laporan prodi/nilai perlu dilengkapi.

- Melihat calon mahasiswa sesuai kebutuhan prodi.
- Mengatur jadwal seleksi/wawancara.
- Menginput hasil seleksi atau wawancara.
- Menentukan lulus/tidak lulus bersama panitia.
- Menyiapkan kurikulum dan jadwal bersama admin akademik.
- Approve atau memantau KRS.
- Memantau nilai, EDOM, dan laporan prodi.

Acceptance:

- Prodi hanya memproses data sesuai prodi.
- Prodi bisa melihat progres seleksi, KRS, nilai, dan EDOM.

### Dosen Wali

Status: Partial. Approval KRS tersedia, dashboard bimbingan perlu diperdalam.

- Review KRS mahasiswa bimbingan.
- Approve atau reject KRS.
- Memberi catatan revisi.

Acceptance:

- Dosen wali hanya melihat mahasiswa bimbingannya.
- KRS yang sudah disetujui tidak diproses ulang tanpa revisi mahasiswa.

### Dosen Pengampu

Status: Partial. LMS dan input nilai tersedia, workflow nilai komponen/publish perlu distandarkan.

- Mengelola kelas LMS.
- Mengunggah materi.
- Membuat tugas.
- Mengelola forum.
- Menilai submission mahasiswa.
- Menginput dan publish nilai akademik untuk kelas yang dia ajar.

Acceptance:

- Dosen pengampu hanya mengelola kelas yang dia ajar.
- Mahasiswa hanya bisa melihat nilai setelah publish.

### Pimpinan

Status: Partial. Dashboard ringkasan tersedia, laporan strategis masih perlu perluasan.

- Melihat laporan PMB, akademik, keuangan, KRS, nilai, dan EDOM.
- Tidak melakukan mutasi data operasional.

Acceptance:

- Pimpinan read-only.
- Laporan memakai data real, bukan dummy.

### Bendahara

Status: Partial. Akses finance tersedia sesuai permission, pembatasan aksi perlu audit lanjutan.

- Melihat dan memproses transaksi keuangan sesuai izin.
- Membaca arus kas, pembayaran, dan piutang.

Acceptance:

- Bendahara tidak mengubah data akademik.
- Aksi finance penting tercatat audit log.

## 11. Gap yang Perlu Diimplementasikan

### PMB dan Seleksi

- Implemented lanjutan: tabel jadwal seleksi, komponen nilai, nilai seleksi, passing grade, dan notifikasi in-app.
- Belum MVP: CBT/ujian online dengan bank soal, timer, dan auto scoring.
- Perlu lanjutan: portal calon mahasiswa untuk melihat detail jadwal/hasil seleksi lebih lengkap.

### Keuangan

- Pastikan submit bukti pembayaran tidak membuat duplikasi pembayaran.
- Pastikan status pembayaran PMB dan arus kas idempotent.
- Pastikan tagihan daftar ulang/SPP dibuat dari master biaya yang benar.

### Akademik dan LMS

- Data minimal wajib ada: dosen, mata kuliah, jadwal kuliah, mahasiswa, tahun akademik aktif.
- KRS hanya boleh dibuka pada periode aktif.
- LMS hanya boleh menampilkan kelas dari KRS approved.
- Nilai LMS tetap nilai tugas dan tidak otomatis masuk nilai akhir akademik.
- Nilai akademik resmi wajib lewat modul Nilai, lalu dipublish ke KHS/transkrip.

### EDOM, Kalender, dan Laporan

- Implemented repair: schema DEV untuk kalender akademik dan EDOM diselaraskan agar halaman tidak kosong karena drift.
- Perlu lanjutan: form builder EDOM yang lengkap, export hasil EDOM, laporan pimpinan/prodi yang lebih detail.
- Perlu lanjutan: notifikasi akademik untuk KRS, LMS, nilai published, dan event kalender.

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
