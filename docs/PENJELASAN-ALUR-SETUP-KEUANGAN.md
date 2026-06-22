# Penjelasan Alur Setup Keuangan

Dokumen ini menjelaskan fungsi setiap menu di `/dashboard/keuangan?tab=setup`.

Bahasa gampangnya: tab **Setup Keuangan** adalah tempat menyiapkan aturan dasar sebelum sistem membuat tagihan, menerima pembayaran, mencatat arus kas, dan menampilkan laporan.

```text
Setup dasar
-> COA
-> Rekening Kampus
-> Integrasi VA Bank
-> Metode Pembayaran
-> Komponen Biaya
-> Tarif Biaya Kuliah
-> Beasiswa/Diskon
-> Generate atau Import Tagihan
-> Mahasiswa bayar
-> Keuangan verifikasi
-> Arus kas dan laporan terbentuk
```

## 1. Periode Akademik

### Fungsi

Menu ini menentukan tahun akademik atau semester yang sedang aktif.

Contoh:

```text
2025/2026 Genap = aktif
2026/2027 Ganjil = belum aktif
```

### Alur

```text
Admin/Keuangan memilih periode
-> klik Aktifkan
-> sistem set tahun_akademik.is_aktif = true
-> periode lain otomatis menjadi nonaktif
```

### Dipakai Oleh

- Pembuatan tagihan.
- Generate tagihan massal.
- Filter laporan.
- Penentuan periode aktif di workflow akademik/keuangan.

### Catatan

Kalau periode aktif salah, tagihan bisa masuk semester yang salah. Ini kecil kelihatannya, tapi efeknya bisa bikin laporan ikut ngawur.

## 2. Tarif Biaya Kuliah

### Fungsi

Menu ini adalah master biaya yang nanti bisa dijadikan tagihan mahasiswa.

Contoh tarif:

```text
Nama: SPP Semester Genap
Nominal: Rp3.000.000
Prodi: MPI
Angkatan: 2026
Tahun Akademik: 2025/2026 Genap
```

### Alur

```text
Keuangan membuat tarif
-> tarif tersimpan di master_biaya
-> klik generate tagihan
-> sistem mencari mahasiswa aktif yang cocok
-> sistem membuat tagihan untuk mahasiswa tersebut
```

### Dipakai Untuk

- SPP/UKT.
- Praktikum.
- Skripsi.
- Wisuda.
- Biaya akademik lain.

### Catatan

- Hapus tarif menggunakan soft delete.
- Tarif yang dihapus tidak muncul lagi di daftar aktif.
- Tagihan lama yang sudah dibuat tetap aman.

## 3. Beasiswa / Diskon

### Fungsi

Menu ini menyimpan master potongan biaya.

Contoh:

```text
Diskon DEV 10%
Beasiswa Tahfidz Rp500.000
```

### Alur

```text
Keuangan membuat data beasiswa/diskon
-> memilih tipe: Beasiswa atau Diskon
-> memilih satuan: Nominal atau Persen
-> opsional membatasi prodi, tahun akademik, angkatan, dan kuota
-> data siap dipakai untuk penyesuaian tagihan
```

### Status Saat Ini

Data beasiswa/diskon sudah disiapkan sebagai master setup. Penerapan otomatis ke nominal tagihan bisa menjadi workflow lanjutan.

## 4. Integrasi VA Bank

### Fungsi

Menu ini menyimpan konfigurasi integrasi bank atau payment provider tanpa menyimpan secret mentah.

Contoh:

```text
Provider: dummy-va
Bank: BSI
Mode: sandbox
Secret asli: tidak disimpan di form
Yang disimpan: nama setting key, misalnya payment.dummy_va.secret_key
```

### Alur

```text
Keuangan/Admin mengisi provider VA
-> sistem menyimpan konfigurasi publik
-> secret asli tetap berada di env/settings server-side
-> metode pembayaran bisa diarahkan ke integrasi ini
```

### Catatan

- Jangan memasukkan secret mentah ke form.
- Menu ini adalah fondasi integrasi VA/payment provider.
- Untuk saat ini fokusnya masih in-app workflow dan konfigurasi DEV/sandbox.

## 5. Metode Pembayaran

### Fungsi

Menu ini menyimpan daftar cara bayar yang boleh dipakai.

Contoh:

```text
Transfer Bank BSI
Virtual Account Dummy DEV
Payment Gateway Midtrans
```

### Alur

```text
Setup rekening kampus atau integrasi dulu
-> buat metode pembayaran
-> pilih tipe pembayaran
-> metode siap dipakai dalam workflow pembayaran
```

### Tipe Metode

```text
Manual Transfer
Payment Gateway
VA Bank
```

### Relasi

```text
Metode Pembayaran
-> bisa memakai Rekening Kampus
-> bisa memakai Integrasi VA Bank
```

Contoh:

```text
Metode: Transfer Bank BSI
Tipe: Manual Transfer
Rekening: Bank Syariah Indonesia 1234567890
```

## 6. Komponen Biaya

### Fungsi

Menu ini menyimpan kategori transaksi keuangan.

Contoh:

```text
SPP / UKT Mahasiswa = Pemasukan
Biaya Pendaftaran PMB = Pemasukan
Operasional Kampus = Pengeluaran
```

### Alur

```text
Keuangan membuat komponen biaya
-> memilih tipe Pemasukan atau Pengeluaran
-> opsional menghubungkan ke COA
-> komponen dipakai saat arus kas dicatat
```

### Dipakai Oleh

- Arus kas.
- Laporan penerimaan.
- Mapping akuntansi sederhana.

### Bahasa Gampang

```text
Komponen Biaya = label transaksi
COA = akun akuntansi di belakangnya
```

## 7. COA / Chart of Accounts

### Fungsi

COA adalah kerangka akun akuntansi.

Contoh:

```text
1101 - Kas dan Bank Kampus
4101 - Pendapatan Pendidikan
```

### Alur

```text
Admin/Keuangan membuat COA
-> COA dipakai oleh Komponen Biaya atau Rekening Kampus
-> laporan keuangan bisa lebih rapi dan akuntansi-friendly
```

### Tipe COA

```text
Aset
Kewajiban
Ekuitas
Pendapatan
Beban
```

### Contoh Relasi

```text
Rekening BSI Kampus -> COA 1101 Kas dan Bank Kampus
SPP / UKT Mahasiswa -> COA 4101 Pendapatan Pendidikan
```

## 8. Rekening Kampus

### Fungsi

Menu ini menyimpan daftar rekening resmi kampus untuk menerima pembayaran.

Contoh:

```text
Bank: Bank Syariah Indonesia
Nomor: 1234567890
Nama: STAI Al-Ittihad DEV
Default: Ya
```

### Alur

```text
Buat COA kas dulu
-> buat rekening kampus
-> hubungkan rekening ke COA kas
-> metode pembayaran transfer bisa memakai rekening ini
```

### Dipakai Oleh

- Instruksi pembayaran manual.
- Metode pembayaran transfer.
- Mapping kas masuk.

## Urutan Setup Yang Direkomendasikan

Kalau dari nol, urutan paling aman:

```text
1. Periode Akademik
   Set semester aktif.

2. COA
   Buat akun kas dan pendapatan.

3. Rekening Kampus
   Buat rekening resmi kampus.

4. Integrasi VA Bank
   Isi konfigurasi dummy/sandbox jika memakai VA/gateway.

5. Metode Pembayaran
   Buat Transfer Bank / VA / Gateway.

6. Komponen Biaya
   Buat kategori SPP, PMB, Praktikum, dan biaya lain.

7. Tarif Biaya Kuliah
   Buat nominal biaya per prodi/angkatan/periode.

8. Beasiswa/Diskon
   Siapkan master potongan biaya.

9. Generate atau Import Tagihan
   Buat tagihan mahasiswa.

10. Pembayaran
    Mahasiswa bayar, lalu keuangan verifikasi.
```

## Contoh Workflow Nyata: Tagihan SPP

```text
Keuangan set Periode Akademik aktif
-> buat COA Pendapatan Pendidikan
-> buat Komponen Biaya SPP / UKT
-> buat Tarif SPP Semester Genap Rp3.000.000
-> klik generate tagihan
-> mahasiswa menerima tagihan
-> sistem mengirim notifikasi in-app
-> mahasiswa membayar
-> keuangan memverifikasi pembayaran
-> pembayaran masuk arus kas
-> laporan keuangan terbaca
```

## Ringkasan

```text
Setup = bikin aturan
Tagihan = hasil dari aturan
Pembayaran = eksekusi bayar
Arus Kas = catatan uang masuk/keluar
Laporan = rekap dari semuanya
```

Kalau setup salah, fitur setelahnya ikut salah. Jadi tab setup ini bukan pajangan, tapi pondasi keuangan. Pondasi miring, tagihan ikut joget.
