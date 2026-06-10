---
trigger: always_on
---

# Business Module Rules — PMB, Keuangan, Akademik, LMS

## Tujuan
Memastikan AI memahami alur bisnis, status flow, aturan validasi, dan batasan antar modul utama SIAKAD agar kode yang dihasilkan sesuai dengan proses kampus nyata.

---

## 1. Gambaran Umum

### Status Phase Modul

| Modul | Phase | Status Dev |
|---|---|---|
| Auth & Admin Dashboard | Phase 1 | Active |
| Master Data Akademik | Phase 1 | Active |
| PMB (Penerimaan Mahasiswa Baru) | Phase 2 | Active |
| Keuangan & Payment Gateway | Phase 2 | Active |
| Akademik (KRS, Nilai, KHS) | Phase 3 | In Progress |
| LMS | Phase 3 | In Progress |
| Laporan & Dashboard Pimpinan | Phase 4 | Planned |
| Notifikasi & EDOM | Phase 5 | Planned |
| Production Readiness | Phase 6 | Planned |

---

## 2. Modul PMB

### 2.1 Status Flow Pendaftaran

```text
(Formulir diisi) → Draft
  → (Submit form) → Submitted
    → (Invoice dibuat otomatis) → Waiting Payment
      → (Bayar manual/gateway) → [Menunggu Verifikasi]
        → (Verifikasi oleh staff) → Verified
          → (Keputusan seleksi) → Accepted / Rejected
            → (Accepted + Generate NIM) → Registered
```

Status lengkap di tabel `pmb_pendaftaran.status_pendaftaran`:

| Status | Kode | Aktor |
|---|---|---|
| Formulir tersimpan | `Draft` | Calon mahasiswa |
| Formulir dikirim | `Submitted` | Calon mahasiswa |
| Menunggu pembayaran | `Waiting Payment` | Sistem (otomatis) |
| Pembayaran diverifikasi | `Verified` | Staff/Keuangan |
| Diterima | `Accepted` | Admin/Prodi |
| Ditolak | `Rejected` | Admin/Prodi |
| Terdaftar sebagai mahasiswa | `Registered` | Admin (setelah generate NIM) |

### 2.2 Status Pembayaran PMB

| Status | Kode | Keterangan |
|---|---|---|
| Menunggu | `pending` | Belum ada pembayaran |
| Lunas | `paid` | Pembayaran dikonfirmasi |
| Kadaluarsa | `expired` | Melewati batas waktu |
| Gagal | `failed` | Pembayaran gagal/ditolak |
| Refund | `refund` | Dana dikembalikan |
| Review manual | `manual_review` | Perlu cek manual |

### 2.3 Aturan Bisnis PMB

- Status tidak boleh **mundur** (misal: `Accepted` tidak bisa kembali ke `Submitted`)
- Generate NIM hanya boleh dilakukan jika status `Accepted` dan pembayaran `paid`
- Generate NIM bersifat **idempotent** — tidak boleh membuat dua NIM untuk satu pendaftar
- Invoice PMB dibuat **otomatis** saat status berubah ke `Waiting Payment`
- Nomor pendaftaran bersifat unik dan tidak boleh diubah

### 2.4 Generate NIM

```text
Prasyarat:
  - status_pendaftaran = 'Accepted'
  - status_pembayaran = 'paid'

Proses:
  1. Lock baris pmb_pendaftaran untuk mencegah race condition
  2. Cek apakah generated_nim sudah ada (idempotency)
  3. Hitung sequence NIM berdasarkan angkatan
  4. Format: [TAHUN][4 digit sequence] contoh: 20240001
  5. Simpan generated_nim ke pmb_pendaftaran
  6. Buat user baru di Supabase Auth (jika belum ada)
  7. Buat record di public.users dengan role Mahasiswa
  8. Buat record di public.mahasiswa
  9. Cabut role 'Calon Mahasiswa', beri role 'Mahasiswa'
```

---

## 3. Modul Keuangan

### 3.1 Jenis Tagihan

| Jenis | Keterangan |
|---|---|
| PMB | Biaya pendaftaran calon mahasiswa |
| Registrasi | Biaya registrasi ulang semester |
| SPP | Semester Payment Plan / UKT |
| Praktikum | Biaya praktikum per mata kuliah |
| Skripsi | Biaya bimbingan dan sidang |
| Wisuda | Biaya prosesi wisuda |

### 3.2 Status Tagihan

| Status | Kode | Keterangan |
|---|---|---|
| Belum lunas | `Belum Lunas` | Default saat dibuat |
| Lunas | `Lunas` | Total pembayaran ≥ nominal tagihan |
| Dispensasi | `Dispensasi` | Diberikan keringanan |

### 3.3 Alur Pembayaran

```text
Tagihan dibuat (manual atau generate bulk)
  → status = 'Belum Lunas'
    → Mahasiswa melakukan pembayaran:
        a. Transfer manual → upload bukti → status = 'Menunggu'
        b. Payment gateway → checkout → webhook update status

    → Staff/Keuangan verifikasi (untuk manual):
        → status = 'Terverifikasi' → jika total ≥ nominal → tagihan 'Lunas'
        → status = 'Ditolak' → tagihan tetap 'Belum Lunas'

    → Webhook gateway (untuk digital):
        → settlement → status = 'Terverifikasi' → tagihan 'Lunas'
        → expired/failed → status = 'Kadaluarsa'/'Gagal'
```

### 3.4 Aturan Bisnis Keuangan

- Arus kas masuk hanya dicatat **sekali** per pembayaran terverifikasi (idempotency wajib)
- Payment gateway webhook wajib validasi **signature** sebelum diproses
- Webhook yang sama (order_id + transaction_id) tidak boleh memproses dua kali
- Generate tagihan bulk tidak boleh membuat **tagihan duplikat** untuk mahasiswa + jenis + periode yang sama
- Status mahasiswa dapat berubah berdasarkan status pembayaran (sinkronisasi manual/terjadwal)

### 3.5 Midtrans Status Mapping

| Status Midtrans | Status Internal |
|---|---|
| `settlement` | `Terverifikasi` |
| `capture` + fraud accept | `Terverifikasi` |
| `capture` + fraud challenge | `Menunggu` |
| `pending` | `Menunggu` |
| `expire` | `Kadaluarsa` |
| `cancel`, `deny`, `failure` | `Gagal` |

---

## 4. Modul Akademik

### 4.1 KRS Status Flow

```text
Mahasiswa ajukan KRS
  → status = 'Draft'
    → Submit untuk approval → status = 'Diajukan'
      → Dosen Wali/Prodi review:
          → Setuju → status = 'Disetujui'
          → Tolak + catatan → status = 'Ditolak'
            → Mahasiswa revisi → kembali ke 'Diajukan'
```

### 4.2 Validasi KRS

Sebelum mahasiswa bisa submit KRS, sistem wajib cek:

| Validasi | Keterangan |
|---|---|
| Periode KRS terbuka | `tahun_akademik.is_krs_open = true` |
| Status pembayaran | Tidak ada tagihan outstanding (tergantung kebijakan) |
| Maksimum SKS | Total SKS yang diambil ≤ batas (umumnya 24 SKS) |
| Kapasitas jadwal | `jadwal_kuliah.peserta < kapasitas` |
| Tidak duplikat | Mahasiswa tidak mengambil jadwal yang sama dua kali |
| Prasyarat mata kuliah | Jika ada prasyarat, harus sudah lulus |

### 4.3 Nilai dan Komponen Nilai

| Komponen | Contoh Bobot |
|---|---|
| Tugas | 20% |
| UTS | 30% |
| UAS | 35% |
| Kehadiran/Partisipasi | 15% |

Konversi nilai angka ke huruf (contoh umum):

| Rentang | Huruf | Bobot |
|---|---|---|
| 85–100 | A | 4.0 |
| 80–84 | A- | 3.7 |
| 75–79 | B+ | 3.3 |
| 70–74 | B | 3.0 |
| 65–69 | B- | 2.7 |
| 60–64 | C+ | 2.3 |
| 55–59 | C | 2.0 |
| 50–54 | C- | 1.7 |
| 45–49 | D | 1.0 |
| 0–44 | E | 0.0 |

### 4.4 Aturan Bisnis Akademik

- Dosen hanya bisa input nilai untuk **kelas yang dia ajar**
- Mahasiswa hanya bisa melihat nilai **miliknya**
- KRS mahasiswa hanya bisa disetujui oleh **dosen wali** mahasiswa tersebut (atau prodi/admin)
- Nilai hanya bisa dilihat mahasiswa setelah **di-publish** oleh dosen
- IPK dihitung ulang setiap ada nilai baru yang dipublish

---

## 5. Modul LMS

### 5.1 Struktur LMS

```text
Jadwal Kuliah (classroom)
  ├── Materi (lms_materi)
  ├── Tugas (lms_tugas)
  │     └── Pengumpulan/Submission (lms_pengumpulan)
  │           └── Penilaian oleh Dosen
  └── Forum Topik (lms_forum_topik)
        └── Komentar (lms_forum_komentar)
```

### 5.2 Aturan Akses LMS

| Role | Akses |
|---|---|
| Dosen | Hanya kelas yang **dia ajar** |
| Mahasiswa | Hanya kelas yang **ada di KRS approved** |
| Admin/Prodi | Semua kelas (untuk monitoring) |

### 5.3 Aturan Bisnis LMS

- Submission tugas setelah deadline: **ditolak** atau diberi flag `terlambat` (sesuai kebijakan)
- Satu mahasiswa hanya bisa submit **satu submission** per tugas (unique constraint)
- Nilai submission tidak boleh melebihi `poin_max` tugas
- Materi dengan `is_visible = false` tidak tampil ke mahasiswa
- Forum hanya bisa diakses oleh **peserta kelas** (dosen + mahasiswa yang KRS-nya approved)

---

## 6. Security Rules

### PMB
- Halaman publik PMB tidak butuh login — tapi mutasi (submit form) harus memvalidasi input ketat
- Data personal calon mahasiswa hanya bisa dilihat oleh **staff PMB, admin, dan calon mahasiswa itu sendiri**
- Perubahan status pendaftaran hanya oleh **admin/staff PMB** — tidak bisa diubah sendiri oleh calon mahasiswa

### Keuangan
- Data tagihan dan pembayaran hanya untuk **admin, keuangan, bendahara, dan mahasiswa bersangkutan**
- Webhook endpoint tidak membutuhkan session tapi **wajib validasi signature**
- Nominal tagihan tidak boleh diubah setelah mahasiswa melakukan pembayaran

### Akademik
- Nilai hanya bisa diinput oleh **dosen kelas tersebut**
- KRS hanya bisa disubmit oleh **mahasiswa bersangkutan**
- Approval KRS hanya oleh **dosen wali atau prodi** — tidak bisa self-approve

### LMS
- Upload file submission dan materi harus ke **Supabase Storage** — bukan base64 di database
- File size dan tipe file harus divalidasi sebelum upload

---

## 7. Anti Pattern

❌ Ubah status PMB tanpa cek flow yang valid (misal: langsung ke `Registered` tanpa `Accepted`)  
❌ Generate NIM tanpa cek idempotency — bisa membuat NIM duplikat  
❌ Proses webhook payment tanpa validasi signature  
❌ Proses webhook yang sama dua kali — menyebabkan double arus kas  
❌ Generate tagihan bulk tanpa cek duplikasi  
❌ Mahasiswa bisa edit nilai mereka sendiri  
❌ Dosen bisa input nilai untuk kelas yang tidak dia ajar  
❌ KRS di luar periode — harus cek `is_krs_open`  
❌ Submission tugas tanpa cek mahasiswa ada di kelas  
❌ Return data mahasiswa/tagihan/nilai lintas user tanpa filter  

---

## 8. Checklist AI

Sebelum menulis kode untuk modul bisnis, verifikasi:

**PMB:**
- [ ] Apakah status flow PMB diikuti dengan benar?
- [ ] Apakah generate NIM bersifat idempotent?
- [ ] Apakah invoice dibuat otomatis saat status berubah?
- [ ] Apakah perubahan status dicatat di audit log?

**Keuangan:**
- [ ] Apakah webhook memvalidasi signature?
- [ ] Apakah arus kas masuk hanya dicatat sekali (idempotency)?
- [ ] Apakah generate tagihan mencegah duplikasi?
- [ ] Apakah Midtrans status dimapping dengan benar?

**Akademik:**
- [ ] Apakah KRS memvalidasi periode terbuka?
- [ ] Apakah KRS memvalidasi maksimum SKS?
- [ ] Apakah akses nilai dibatasi per dosen/mahasiswa?
- [ ] Apakah approval KRS hanya oleh dosen wali/prodi?

**LMS:**
- [ ] Apakah akses kelas dibatasi sesuai role?
- [ ] Apakah submission hanya boleh satu per tugas per mahasiswa?
- [ ] Apakah deadline tugas diterapkan?
- [ ] Apakah file upload menggunakan Supabase Storage?

---

## 9. Ringkasan

- **PMB**: status flow searah, generate NIM idempotent, invoice otomatis
- **Keuangan**: webhook signature wajib, idempotency arus kas, cegah tagihan duplikat
- **Akademik**: validasi KRS ketat (periode + SKS + kapasitas + prasyarat), nilai per dosen
- **LMS**: akses berbasis jadwal kuliah, submission unik per tugas, file ke Supabase Storage
- Semua modul: **audit log wajib** untuk mutasi penting, **akses data dibatasi per role**
