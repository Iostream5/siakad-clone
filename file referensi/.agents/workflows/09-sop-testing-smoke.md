---
description: SOP testing dan smoke test untuk SIAKAD. Prosedur verifikasi manual per role, template hasil test, dan checklist yang harus dilewati sebelum task dianggap selesai dan sebelum transisi antar phase.
---

# SOP Testing dan Smoke Test — SIAKAD STAI Al-Ittihad

## Tujuan

Setiap fitur yang selesai dikode harus diverifikasi bahwa benar-benar berjalan di browser, bukan hanya lulus type-check dan build. Smoke test adalah cara tercepat mendeteksi masalah yang tidak terlihat dari kode saja — layout pecah, query salah, permission tidak bekerja, atau alur yang putus di tengah.

---

## FASE 1: JENIS TEST DAN KAPAN DIJALANKAN

### Langkah-langkah

STEP 1: Pahami tiga jenis test yang dipakai.

**Gate Test** — dijalankan setiap selesai task:
```bash
npm run type-check   # 0 error
npm run lint         # 0 error
npm run build        # sukses
```

**Smoke Test Per Fitur** — dijalankan setelah gate test hijau, sebelum task ditandai selesai. Fokus pada fitur yang baru dibuat atau dimodifikasi.

**Smoke Test Per Role** — dijalankan sebelum transisi phase. Setiap role utama diuji end-to-end untuk memastikan tidak ada regresi.

STEP 2: Tentukan scope smoke test untuk task yang baru selesai.

Aturan scope:
- Fitur baru → test semua path fitur tersebut (happy path + edge case)
- Fitur dimodifikasi → test fitur yang diubah + fitur yang bersinggungan
- Migration baru → test query yang menyentuh tabel yang baru dimigrasi
- Perubahan auth/permission → test semua role yang terpengaruh

STEP 3: Catat hasil test di final response atau dokumen task jika repo menyediakannya.

```markdown
## Hasil Smoke Test

| Test Case | Expected | Hasil | Catatan |
|-----------|----------|-------|---------|
| Buat kampus baru | Data tersimpan, tampil di list | ✅ | |
| Buat kampus nama kosong | Validasi error muncul | ✅ | |
| Soft delete kampus | Data hilang dari list aktif | ✅ | |
| Restore kampus | Data kembali ke list aktif | ✅ | |
| Hard delete kampus | Data hilang permanen | ✅ | |
| Search kampus | Filter berjalan | ✅ | |
| Import Excel | 10 baris masuk | ✅ | |
| Import Excel invalid | Error per baris muncul | ❌ | Error tidak spesifik, perlu perbaikan |
```

### Checklist

- [ ] Jenis test yang diperlukan sudah ditentukan
- [ ] Scope test sudah disesuaikan dengan perubahan yang dilakukan
- [ ] Hasil test dicatat di final response atau dokumen task jika repo menyediakannya

---

## FASE 2: TEMPLATE SMOKE TEST PER FITUR

### Langkah-langkah

STEP 1: Template smoke test CRUD master data.

Gunakan template ini untuk setiap modul master data baru:

```
MODUL: [Nama Modul]
URL: /dashboard/[path]
Tanggal test: [tanggal]

─── HAPPY PATH ─────────────────────────────
[ ] Halaman list terbuka, data tampil
[ ] Search berfungsi (ketik sebagian nama → filter)
[ ] Filter status aktif/dihapus berfungsi
[ ] Pagination berfungsi (jika data > limit)
[ ] Tombol Tambah membuka modal form
[ ] Isi form valid → data tersimpan → muncul di list
[ ] Klik edit → form terisi data existing
[ ] Update data valid → data berubah di list
[ ] Soft delete → data hilang dari list aktif
[ ] Filter "Dihapus" → data yang dihapus tampil
[ ] Restore → data kembali ke list aktif
[ ] Hard delete → data hilang permanen dari semua filter
[ ] Export Excel → file terunduh dan bisa dibuka
[ ] Import Excel valid → data masuk ke database
[ ] Download template → file template terunduh

─── EDGE CASE ──────────────────────────────
[ ] Submit form kosong → semua field error muncul
[ ] Kode duplikat → error "kode sudah digunakan"
[ ] Nama terlalu panjang → error validasi
[ ] Import Excel kolom salah → error spesifik per baris
[ ] Hard delete data yang masih punya relasi FK → error ditangani

─── ERROR STATE ────────────────────────────
[ ] List saat database error → error state tampil (bukan crash)
[ ] Submit saat koneksi putus → toast error muncul
[ ] Akses tanpa permission → redirect atau 403

─── AUDIT LOG ──────────────────────────────
[ ] Create → audit log tercatat dengan new_data
[ ] Update → audit log tercatat dengan old_data dan new_data
[ ] Delete → audit log tercatat dengan old_data
```

STEP 2: Template smoke test alur autentikasi.

```
─── AUTH FLOW ──────────────────────────────
[ ] Login email valid → masuk dashboard sesuai role
[ ] Login username valid → masuk dashboard sesuai role
[ ] Login password salah → error message muncul
[ ] Login user nonaktif → ditolak dengan pesan jelas
[ ] Akses /dashboard tanpa session → redirect ke /login
[ ] Logout → session terhapus, redirect ke /login
[ ] Akses /login saat sudah login → redirect ke /dashboard
[ ] Role tidak punya akses ke route tertentu → redirect
```

STEP 3: Template smoke test form dengan relasi.

```
─── FORM DENGAN RELASI ─────────────────────
[ ] Dropdown pilihan FK ter-load saat form dibuka
[ ] Dropdown hanya menampilkan data aktif (bukan yang dihapus)
[ ] Save dengan FK valid → relasi tersimpan
[ ] Hapus parent yang masih punya child → ditangani (error atau cascade)
```

### Checklist

- [ ] Happy path semua berjalan
- [ ] Edge case utama ditangani dengan pesan yang jelas
- [ ] Error state tidak menampilkan stack trace atau detail internal
- [ ] Audit log tercatat untuk semua mutasi

---

## FASE 3: SMOKE TEST PER ROLE — ADMIN

### Langkah-langkah

STEP 1: Jalankan smoke test role Admin sebelum phase gate.

Akun test: `admin` / `admin123` (dev) atau akun Admin production/staging.

```
─── ADMIN SMOKE TEST ───────────────────────
AUTH
[ ] Login berhasil
[ ] Dashboard admin tampil dengan data real
[ ] Sidebar dirender dari database (bukan hardcode)

USER MANAGEMENT
[ ] List user tampil dengan search dan pagination
[ ] Buat user baru
[ ] Edit role user
[ ] Nonaktifkan user → user tidak bisa login
[ ] Aktifkan kembali

RBAC
[ ] List role tampil
[ ] Buat role baru dengan permission spesifik
[ ] Assign role ke user
[ ] Role baru tampil di sidebar user tersebut

MENU BUILDER
[ ] List menu tampil dengan struktur nested
[ ] Buat menu baru
[ ] Ubah urutan menu
[ ] Nonaktifkan menu → menu hilang dari sidebar

MASTER DATA (minimal satu modul per kategori)
[ ] CRUD Kampus berjalan
[ ] CRUD Fakultas berjalan
[ ] CRUD Program Studi berjalan

AUDIT LOG
[ ] Aksi di atas tercatat di halaman audit aktivitas
[ ] Filter audit per modul berjalan
```

---

## FASE 4: SMOKE TEST PER ROLE — NON-ADMIN

### Langkah-langkah

STEP 1: Smoke test role Mahasiswa.

```
─── MAHASISWA SMOKE TEST ───────────────────
[ ] Login berhasil
[ ] Dashboard mahasiswa tampil
[ ] Tidak bisa akses /dashboard/master-data (redirect)
[ ] KRS: bisa lihat jadwal tersedia
[ ] KRS: bisa submit (jika periode terbuka)
[ ] Nilai: hanya lihat nilai sendiri
[ ] LMS: hanya lihat kelas dari KRS yang diapprove
[ ] Tagihan: hanya lihat tagihan sendiri
[ ] Notifikasi: hanya lihat notifikasi sendiri
```

STEP 2: Smoke test role Dosen.

```
─── DOSEN SMOKE TEST ────────────────────────
[ ] Login berhasil
[ ] Dashboard dosen tampil
[ ] Tidak bisa akses manajemen user (redirect)
[ ] LMS: hanya lihat kelas yang dia ajar
[ ] Input nilai: hanya bisa untuk kelasnya
[ ] Approval KRS: hanya mahasiswa bimbingannya (jika dosen wali)
```

STEP 3: Smoke test role Keuangan.

```
─── KEUANGAN SMOKE TEST ─────────────────────
[ ] Login berhasil
[ ] Tagihan: bisa lihat semua tagihan mahasiswa
[ ] Pembayaran: bisa verifikasi pembayaran manual
[ ] Laporan keuangan tampil dengan data real
[ ] Tidak bisa akses manajemen role (redirect)
```

STEP 4: Smoke test role Pimpinan.

```
─── PIMPINAN SMOKE TEST ─────────────────────
[ ] Login berhasil
[ ] Dashboard pimpinan tampil dengan ringkasan
[ ] Laporan akademik bisa diakses
[ ] Laporan PMB bisa diakses
[ ] Laporan keuangan bisa diakses
[ ] Tidak bisa mutasi data (tombol edit/hapus tidak muncul)
```

### Checklist

- [ ] Semua role yang relevan dengan phase aktif sudah ditest
- [ ] Setiap role tidak bisa mengakses route di luar haknya
- [ ] Data isolation per role sudah diverifikasi (mahasiswa tidak lihat data mahasiswa lain)
- [ ] Hasil test dicatat per role

---

## FASE 5: SMOKE TEST ALUR KRITIS

### Langkah-langkah

STEP 1: Test alur PMB end-to-end (Phase 2+).

```
─── PMB FLOW ────────────────────────────────
[ ] Buka /pmb → landing PMB tampil
[ ] Klik daftar → form pendaftaran tampil
[ ] Submit form valid → nomor pendaftaran muncul
[ ] Admin buka dashboard PMB → pendaftar muncul
[ ] Admin update status → status berubah
[ ] Pembayaran manual diverifikasi → status paid
[ ] Admin generate NIM → NIM muncul, role Mahasiswa diberikan
[ ] User login dengan akun mahasiswa baru → berhasil
```

STEP 2: Test alur pembayaran via payment gateway (Phase 2+).

```
─── PAYMENT GATEWAY FLOW ────────────────────
[ ] Request checkout → URL Midtrans Snap muncul
[ ] Simulasi webhook settlement → status berubah Terverifikasi
[ ] Simulasi webhook settlement ulang → tidak dobel
[ ] Simulasi webhook signature invalid → ditolak 401
[ ] Cek arus_kas → hanya satu entry per transaksi
```

STEP 3: Test alur KRS (Phase 3+).

```
─── KRS FLOW ────────────────────────────────
[ ] Mahasiswa buka KRS → jadwal tersedia tampil
[ ] Submit KRS di luar periode → ditolak dengan pesan
[ ] Submit KRS valid → status Draft/Menunggu
[ ] Dosen/prodi approve → status Disetujui
[ ] Mahasiswa lihat KHS → nilai tampil setelah publish
```

### Checklist Akhir Smoke Test

```
□ Gate test hijau: type-check, lint, build
□ Smoke test fitur yang baru dibuat: happy path ✅
□ Smoke test fitur yang baru dibuat: edge case ✅
□ Smoke test fitur yang baru dibuat: error state ✅
□ Audit log tercatat untuk semua mutasi yang ditest
□ Role isolation diverifikasi: tidak ada data bocor antar user
□ Alur kritis yang relevan dengan phase aktif sudah ditest
□ Hasil test dicatat di final response atau dokumen task jika repo menyediakannya
□ Known issues (jika ada) didokumentasikan
```

---

## Output yang Diharapkan

Setelah SOP Testing ini dijalankan:

1. **Bukti test tersedia** - hasil smoke test tercatat di final response atau dokumen task jika repo menyediakannya.
2. **Regresi terdeteksi dini** — fitur lama yang rusak akibat perubahan baru teridentifikasi sebelum merge.
3. **Data isolation terverifikasi** — setiap role hanya melihat data yang menjadi haknya.
4. **Alur kritis berjalan** — PMB, pembayaran, KRS, dan alur bisnis utama phase aktif sudah diverifikasi end-to-end.
5. **Known issues terdokumentasi** — masalah yang ditemukan tapi belum diperbaiki tercatat dengan jelas.
