# Alur End-to-End Keuangan (Tagihan & Pembayaran)

Dokumen ini menjelaskan flow modul keuangan mulai dari setup master biaya oleh Admin/Keuangan, proses penerbitan tagihan mahasiswa, hingga penyelesaian pembayaran secara manual maupun terintegrasi dengan Payment Gateway (Midtrans/Xendit).

Status dokumen: draf alur operasional.

## Ringkasan Alur Besar

```text
Keuangan membuat Master Biaya / Jenis Tagihan
-> Keuangan me-generate Tagihan (Invoice) untuk Mahasiswa secara massal/individu
-> Mahasiswa mengecek Tagihan di Dashboard
-> Mahasiswa melakukan Checkout/Pembayaran
-> Jika Manual: Mahasiswa unggah bukti -> Keuangan Verifikasi
-> Jika Gateway: Webhook otomatis memvalidasi dan update status
-> Status Tagihan menjadi LUNAS (atau DISPENSASI)
-> Mahasiswa berhak melakukan Registrasi Semester / KRS
```

## 1. Setup Master Biaya dan Tarif

### Admin / Keuangan

- Membuka menu Master Biaya (`billing_types`).
- Menambahkan jenis biaya baru (contoh: Biaya Pendaftaran PMB, SPP Semester Ganjil, Biaya SKS, Biaya Wisuda).
- Mengatur nominal default, deskripsi, dan periode berlakunya biaya tersebut.
- Mengatur atribut biaya (misal: apakah wajib atau opsional).

### Sistem

- Menyimpan definisi tarif ke tabel `billing_types` atau yang relevan.

## 2. Generate Tagihan (Invoice)

### Admin / Keuangan

- Membuka halaman Manajemen Tagihan.
- Memilih kelompok Mahasiswa (berdasarkan Angkatan, Prodi, atau Kelas) atau Mahasiswa individu.
- Memilih Tahun Akademik aktif dan Jenis Biaya yang ditagihkan.
- Menekan tombol "Generate Tagihan".

### Sistem

- Membuat data di tabel `invoices` yang berelasi dengan `mahasiswa_id`.
- Membuat detail komponen tagihan di `invoice_items`.
- Status awal tagihan di-set menjadi `UNPAID` atau `PENDING`.
- (Opsional) Mengirimkan notifikasi ke Mahasiswa bersangkutan.

## 3. Pembayaran oleh Mahasiswa

### Mahasiswa

- Login ke Dashboard Mahasiswa.
- Menuju ke menu Keuangan / Tagihan.
- Melihat daftar tagihan yang berstatus `UNPAID`.
- Memilih tagihan dan menekan tombol "Bayar".
- Memilih metode pembayaran:
  - **Manual Transfer**: Melihat instruksi rekening tujuan.
  - **Payment Gateway**: Memilih metode melalui UI Midtrans/Xendit.

### Sistem (Jika Payment Gateway)

- Memanggil API provider (Midtrans/Xendit) untuk membuat *Payment Link* / *Virtual Account*.
- Menyimpan `provider_reference` dan `checkout_url` di database.
- Mengarahkan Mahasiswa ke halaman *checkout* provider.

## 4. Verifikasi Pembayaran

### Pembayaran Manual

- Mahasiswa melakukan transfer via bank.
- Mahasiswa kembali ke aplikasi, mengunggah foto bukti transfer.
- Sistem mengubah status menjadi `MENUNGGU VERIFIKASI` dan menyimpan dokumen di Supabase Storage.
- Staf Keuangan mengecek unggahan bukti bayar.
- Keuangan menekan "Terima" (Approve) atau "Tolak" (Reject) jika bukti buram/salah.

### Pembayaran via Gateway

- Mahasiswa menyelesaikan pembayaran di platform provider.
- Provider mengirimkan notifikasi *Webhook* ke server SIAKAD.
- Sistem memvalidasi *signature* webhook untuk mencegah *spoofing*.
- Sistem mengecek *idempotency* (menghindari proses ganda jika webhook dikirim dua kali).
- Jika *settled* (berhasil), sistem otomatis mencatat `payments` dan mengupdate status tagihan.

### Status Data Setelah Verifikasi

```text
invoices.status = PAID (Lunas)
payments.amount = nominal sesuai tagihan
registrasi_semester.status = LUNAS (jika terkait daftar ulang)
```

## 5. Dispensasi Pembayaran (Opsional)

### Keuangan / Pimpinan

- Jika terdapat kebijakan kampus/pimpinan, Mahasiswa bisa mengajukan penundaan bayar (cicilan) atau potongan (beasiswa).
- Keuangan membuka detail tagihan Mahasiswa.
- Mengubah status tagihan sebagian, atau menandai dengan status `DISPENSASI`.

### Sistem

- Memperbarui status agar Mahasiswa tidak di-*block* dari akses KRS meskipun belum lunas 100%.

## 6. Flow per Role

### Mahasiswa

Status: Draf

- Mengecek riwayat dan tagihan aktif tanpa bisa melihat tagihan mahasiswa lain.
- Melakukan transaksi pembayaran mandiri secara online/manual.
- Status pembayaran tersinkronisasi sebagai syarat KRS.

### Keuangan

Status: Draf

- Melakukan generate tagihan massal untuk pendaftaran awal/semester berjalan.
- Memverifikasi bukti pembayaran manual.
- Mengecek status mutasi dan *cashflow*.
- Memberikan dispensasi pembayaran jika ada pengajuan berdasar kebijakan kampus.

## 7. Gap yang Perlu Diimplementasikan

- Implementasi sistem cicilan (*Installments*) yang memungkinkan Mahasiswa membayar satu tagihan SPP dalam beberapa tahap.
- Keamanan endpoint Webhook: *Signature Verification* dan *Idempotency Check* wajib dipastikan bekerja dengan benar di environment Production.
- Dashboard Keuangan untuk melihat piutang mahasiswa yang belum ditagih dan kas masuk per bulan/semester.

## 8. Definition of Done Flow Utama

Flow ini dianggap jalan jika semua bukti berikut terpenuhi:

- Keuangan dapat membuat master biaya SPP.
- Keuangan dapat men-generate invoice SPP untuk 1 atau 100 Mahasiswa sekaligus (Bulk).
- Mahasiswa dapat melihat nominal tagihannya yang sesuai (tidak tertukar).
- Pembayaran via Midtrans webhook berhasil mengubah status tagihan mahasiswa otomatis tanpa intervensi Staf.
- Mahasiswa dengan tagihan SPP "Lunas" (atau "Dispensasi") akan terbuka akses KRS-nya oleh sistem.
- Tidak ada pembayaran ganda akibat retry webhook.
