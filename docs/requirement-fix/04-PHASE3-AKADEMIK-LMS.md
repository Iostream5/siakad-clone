# Phase 3 — Akademik & LMS (Gap Perbaikan)

> **Prioritas:** 🟡 Penting  
> **Estimasi:** 3-5 hari  
> **Prasyarat:** Phase 0 + Phase 1 + Phase 2 selesai

---

## Tujuan

Mematangkan modul Akademik (KRS, Nilai, KHS, Transkrip) dan LMS yang sudah ada. Beberapa komponen dasar sudah diimplementasi tapi masih ada gap signifikan yang perlu ditutup.

---

## Status Saat Ini

| Fitur | Status | Catatan |
|---|---|---|
| KRS Submit (Mahasiswa) | ✅ Ada | `krs-manager.tsx`, multi-role |
| KRS Approval (Dosen/Admin) | ✅ Ada | Approve/reject dengan audit log |
| Input Nilai (Dosen) | ✅ Ada | `grades-manager.tsx` |
| Lihat Nilai (Mahasiswa) | ✅ Ada | Filter `publishedOnly: true` |
| LMS Dashboard | ✅ Ada | Per-role (Dosen lihat kelas yang diajar, Mhs lihat kelas KRS) |
| LMS Detail Kelas | ✅ Ada | Materi, tugas, forum |
| LMS Tugas & Submission | ✅ Ada | Submit tugas, grading |
| LMS Forum | ✅ Ada | Topik dan komentar |
| **KHS per Semester** | ❌ Tidak ada | Tidak ada halaman terpisah |
| **Transkrip Kumulatif** | ❌ Tidak ada | Tidak ada halaman terpisah |
| **LMS Admin/Prodi View** | ❌ Hardcode `[]` | Admin/Prodi tidak bisa lihat kelas |
| **Kalender Akademik** | ❌ Tidak ada | Tidak ada halaman |
| **Jadwal per Mahasiswa** | ❌ Tidak ada | Mhs tidak bisa lihat jadwal mingguan |

---

## Checklist Perbaikan

### 1. 🔴 KHS (Kartu Hasil Studi) per Semester

> **Status saat ini:** ❌ Tidak ada halaman — nilai hanya ditampilkan flat di `/dashboard/nilai`  
> **Dampak:** Mahasiswa tidak bisa melihat performa per semester  
> **Referensi PRD:** Phase 3 — "KRS, KHS, Transkrip dengan validasi lengkap"

- [ ] **Buat `src/app/dashboard/khs/page.tsx`**
  - Role: Mahasiswa (lihat milik sendiri), Admin/Prodi (lihat per mahasiswa)
  - Pilih semester → tampilkan KHS

- [ ] **Buat `src/modules/grades/khs-viewer.tsx`**
  - **Header:** Nama mahasiswa, NIM, program studi, semester
  - **Tabel mata kuliah semester:** Kode MK, Nama MK, SKS, Nilai huruf, Bobot
  - **Summary:** Total SKS diambil, Total SKS lulus, IPS (Indeks Prestasi Semester)
  - **Opsi cetak/export PDF**

- [ ] **Buat helper `src/lib/admin/khs.ts`**
  - `getKhsBySemester(mahasiswaId, tahunAkademikId)` — query nilai + mata kuliah
  - `calculateIps(grades)` — hitung IPS dari array nilai

**File yang perlu dibuat:**
```
src/app/dashboard/khs/page.tsx          [NEW]
src/modules/grades/khs-viewer.tsx       [NEW]
src/lib/admin/khs.ts                    [NEW]
```

---

### 2. 🔴 Transkrip Kumulatif

> **Status saat ini:** ❌ Tidak ada halaman  
> **Dampak:** Mahasiswa tidak bisa melihat IPK dan progres kelulusan

- [ ] **Buat `src/app/dashboard/transkrip/page.tsx`**
  - Role: Mahasiswa (milik sendiri), Admin/Prodi (per mahasiswa)

- [ ] **Buat `src/modules/grades/transkrip-viewer.tsx`**
  - **Header:** Nama, NIM, Prodi, Angkatan
  - **Tabel semua mata kuliah yang sudah dinilai (lintas semester):**
    - Semester, Kode MK, Nama MK, SKS, Nilai, Bobot
    - Dikelompokkan per semester
  - **Summary:**
    - Total SKS kumulatif
    - Total SKS wajib program studi (dari kurikulum)
    - IPK (Indeks Prestasi Kumulatif)
    - Predikat kelulusan (jika sudah cukup SKS)
  - **Opsi cetak/export PDF** — format resmi transkrip

- [ ] **Buat helper `src/lib/admin/transkrip.ts`**
  - `getTranscript(mahasiswaId)` — semua nilai lintas semester
  - `calculateIpk(allGrades)` — hitung IPK kumulatif
  - `getGraduationProgress(mahasiswaId)` — progres terhadap kurikulum

**File yang perlu dibuat:**
```
src/app/dashboard/transkrip/page.tsx       [NEW]
src/modules/grades/transkrip-viewer.tsx    [NEW]
src/lib/admin/transkrip.ts                [NEW]
```

---

### 3. 🔴 LMS — Admin/Prodi View

> **Status saat ini:** ❌ `src/app/dashboard/akademik/lms/page.tsx` hardcode `classes = []` untuk Admin/Prodi  
> **Dampak:** Admin dan Prodi tidak bisa monitoring aktivitas LMS

- [ ] **Implementasi `getLmsClassesForAdmin()` di `src/lib/admin/lms.ts`**
  - Return semua kelas aktif dengan: nama MK, dosen, jumlah peserta, jumlah materi/tugas
  - Filter: tahun akademik aktif, prodi (untuk role Prodi)
  - Pagination

- [ ] **Update `src/app/dashboard/akademik/lms/page.tsx`**
  - Ganti `classes = []` dengan query aktual
  - Admin: lihat semua kelas
  - Prodi: lihat kelas di prodinya saja

- [ ] **Tambah view monitoring di `lms-dashboard.tsx`**
  - Untuk Admin/Prodi: card statistik (total kelas, total materi, total submission)
  - Filter per prodi, per dosen
  - Akses ke detail kelas (read-only, untuk monitoring)

**File yang perlu dimodifikasi:**
```
src/lib/admin/lms.ts                          [MODIFY]
src/app/dashboard/akademik/lms/page.tsx       [MODIFY]
src/modules/lms/lms-dashboard.tsx             [MODIFY]
```

---

### 4. 🟡 Kalender Akademik

> **Status saat ini:** ❌ Tidak ada halaman  
> **Dampak:** User tidak bisa melihat jadwal penting semester (KRS, UTS, UAS, wisuda)

- [ ] **Buat `src/app/dashboard/kalender/page.tsx`**
  - Role: Semua (read-only), Admin (manage events)

- [ ] **Buat `src/modules/dashboard/academic-calendar.tsx`**
  - Tampilan kalender bulanan
  - Event: periode KRS, UTS, UAS, libur, deadline tugas, wisuda
  - Color-coded per kategori event
  - Admin bisa tambah/edit/hapus event

- [ ] **Buat migration jika perlu**
  ```sql
  CREATE TABLE public.kalender_akademik (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_akademik_id UUID REFERENCES public.tahun_akademik(id),
    judul TEXT NOT NULL,
    deskripsi TEXT,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    kategori TEXT NOT NULL CHECK (kategori IN ('KRS', 'UTS', 'UAS', 'LIBUR', 'WISUDA', 'LAINNYA')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```

**File yang perlu dibuat:**
```
supabase/migrations/028_kalender_akademik.sql     [NEW] (jika tabel belum ada)
src/app/dashboard/kalender/page.tsx               [NEW]
src/modules/dashboard/academic-calendar.tsx        [NEW]
src/lib/admin/kalender.ts                         [NEW]
src/actions/kalender.ts                           [NEW]
```

---

### 5. 🟡 Jadwal Mingguan Mahasiswa

> **Status saat ini:** ❌ Mahasiswa tidak bisa melihat jadwal mingguan mereka  
> **Dampak:** UX kurang — mahasiswa harus cek manual dari KRS

- [ ] **Tambah view jadwal mingguan di dashboard atau KRS**
  - Berdasarkan KRS yang sudah disetujui
  - Format kalender mingguan: Senin–Sabtu, jam 07:00–17:00
  - Tampilkan: nama MK, ruangan, dosen, jam
  - Bisa diakses dari sidebar sebagai sub-item

**File yang perlu dibuat/dimodifikasi:**
```
src/modules/krs/weekly-schedule.tsx         [NEW]
src/app/dashboard/krs/page.tsx              [MODIFY] — tampilkan jadwal
```

---

### 6. 🟢 Polish KRS

> **Status saat ini:** ⚠️ Fungsional tapi ada area yang perlu dipoles

- [ ] **Validasi prasyarat mata kuliah**
  - Cek apakah mahasiswa sudah lulus prasyarat sebelum boleh ambil MK
  - Tampilkan pesan jelas jika prasyarat belum terpenuhi

- [ ] **Validasi kapasitas jadwal**
  - Cek `jadwal_kuliah.peserta < kapasitas` sebelum boleh ambil
  - Tampilkan sisa kapasitas di daftar jadwal

- [ ] **Validasi maks SKS**
  - Tampilkan total SKS yang sudah dipilih vs batas maksimum
  - Blokir submit jika melebihi batas

---

## Kriteria Selesai Phase 3

```bash
npm run type-check && npm run lint && npm run build

# Manual check:
✅ KHS: mahasiswa bisa lihat nilai per semester dengan IPS
✅ Transkrip: mahasiswa bisa lihat semua nilai dengan IPK
✅ LMS Admin/Prodi: bisa lihat dan monitoring semua kelas
✅ Kalender akademik: event tampil dan admin bisa manage
✅ Jadwal mingguan: mahasiswa bisa lihat jadwal dari KRS
✅ KRS validasi: prasyarat, kapasitas, maks SKS diterapkan
✅ Export PDF: KHS dan transkrip bisa dicetak/export
```
