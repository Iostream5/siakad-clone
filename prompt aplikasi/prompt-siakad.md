Bangun aplikasi SIAKAD (Sistem Informasi Akademik) Universitas yang production-ready menggunakan Next.js App Router + TypeScript + Supabase (Auth, PostgreSQL, Storage).

Kerjakan end-to-end di codebase ini sampai aplikasi bisa dijalankan secara lokal. Buat, edit, dan susun file secara lengkap. Jangan hanya memberi penjelasan.

Ambil keputusan teknis yang masuk akal jika ada detail kecil yang belum ditentukan, tetapi patuhi seluruh spesifikasi berikut.

==================================================
🎯 TUJUAN UTAMA
==================================================

Bangun sistem SIAKAD lengkap yang mencakup:

- autentikasi multi-role
- manajemen akademik
- PMB (penerimaan mahasiswa baru)
- keuangan
- KRS dan nilai
- laporan dan export
- notifikasi dan pengumuman
- approval flow
- audit trail
- dashboard per role

Sistem harus siap digunakan operasional kampus.

==================================================
🧱 STACK WAJIB
==================================================

- Next.js App Router (latest)
- TypeScript
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- TanStack Table
- Chart.js / Recharts
- SheetJS (xlsx)
- jsPDF / pdf-lib

==================================================
📁 STRUKTUR PROJECT
==================================================

Gunakan struktur modular:

src/
app/
components/
modules/
lib/
hooks/
types/
actions/
supabase/
supabase/migrations/
supabase/seed.sql

==================================================
🔐 AUTH & ROLE
==================================================

Role:

- Admin
- Prodi
- Dosen
- Mahasiswa
- Staff
- Keuangan
- Pimpinan

Login:

- email + password
- atau username + password

Flow:

- jika login pakai username → cari email di tabel users
- login via Supabase Auth
- redirect sesuai role

Buat middleware untuk proteksi route.

==================================================
🗄️ DATABASE (WAJIB LENGKAP)
==================================================

Gunakan:

- auth.users untuk auth
- public.users sebagai profile

Buat SEMUA tabel berikut:

(semua tabel dari spesifikasi awal tetap wajib dibuat)

DAN TAMBAHAN WAJIB berikut:

---

## 🔹 TABEL TAMBAHAN PENTING

1. krs_header

- id
- id_mahasiswa
- id_tahun_akademik
- total_sks
- status (Draft, Diajukan, Disetujui, Ditolak)
- approved_by
- approved_at

2. krs_detail

- id
- id_krs_header
- id_jadwal
- status
- catatan

3. registrasi_semester

- id
- id_mahasiswa
- id_tahun_akademik
- status (Belum, Proses, Selesai)
- tanggal

4. dosen_wali

- id
- id_dosen
- id_mahasiswa

5. mata_kuliah_prasyarat

- id
- id_mk
- id_mk_prasyarat

6. riwayat_status_mahasiswa

- id
- id_mahasiswa
- status_lama
- status_baru
- tanggal

7. approval_logs

- id
- modul
- id_ref
- step
- status
- approved_by
- approved_at
- catatan

8. notifikasi

- id
- id_user
- judul
- pesan
- is_read
- created_at

9. pengumuman

- id
- judul
- isi
- target_role
- is_active
- created_at

10. audit_logs

- id
- id_user
- modul
- aksi
- table_name
- record_id
- old_data jsonb
- new_data jsonb
- created_at

==================================================
⚙️ RULES BISNIS WAJIB
==================================================

1. Simpan Dosen/Mahasiswa → otomatis buat user account
2. KRS hanya bisa jika:
   - status mahasiswa AKTIF
   - tidak ada tunggakan
   - periode KRS aktif
3. Generate NIM hanya 1x per periode
4. Aktivasi tahun akademik:
   - semua mahasiswa aktif → NON-AKTIF
5. Mahasiswa aktif hanya via pembayaran
6. Validasi:
   - bentrok jadwal
   - kapasitas kelas
   - prasyarat mata kuliah
   - batas SKS berdasarkan IPS

==================================================
📦 FITUR WAJIB
==================================================

====================

1. # DASHBOARD
   Admin:

- statistik
- user terakhir login
- grafik

Mahasiswa:

- KRS
- tagihan
- jadwal
- IPK

Dosen:

- jadwal mengajar
- input nilai
- mahasiswa bimbingan

==================== 2. MASTER DATA
====================

- Program Studi
- Mata Kuliah
- Dosen
- Mahasiswa

==================== 3. PMB
====================

- daftar
- kelulusan
- generate NIM (transactional)

==================== 4. KEUANGAN
====================

- tagihan
- pembayaran
- dispensasi
- piutang

Upload bukti → Supabase Storage

==================== 5. REGISTRASI SEMESTER
====================

- mahasiswa daftar ulang
- validasi pembayaran
- status semester

==================== 6. KRS
====================

- header + detail
- approval dosen wali
- validasi penuh

==================== 7. NILAI
====================

- input nilai per komponen
- hitung nilai akhir
- publish nilai
- finalisasi

==================== 8. SURAT
====================

- pengajuan
- approval

==================== 9. KUESIONER
====================

- isi survey
- grafik hasil

==================== 10. LAPORAN
====================

- export Excel
- export PDF

==================== 11. IMPORT
====================

- Excel import:
  - dosen
  - mahasiswa
  - jadwal
  - mata kuliah

==================== 12. GRAFIK
====================

- mahasiswa per prodi
- keuangan
- kelulusan

==================== 13. NOTIFIKASI
====================

- KRS buka
- pembayaran
- nilai publish
- pengumuman

==================================================
🔐 SECURITY
==================================================

- Role-based access
- RLS atau proteksi server
- validasi server-side
- audit logs
- soft delete
- file validation

==================================================
🎨 UI/UX
==================================================

- modern dashboard
- sidebar menu
- responsive
- clean design
- wizard untuk:
  - PMB
  - KRS
  - pembayaran

==================================================
📄 FILE WAJIB
==================================================

- migration SQL lengkap
- supabase/seed.sql
- auth setup
- middleware
- dashboard
- CRUD utama
- README
- .env.example

==================================================
📦 ENV
==================================================

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

==================================================
🧪 OUTPUT YANG DIHARAPKAN
==================================================

Setelah selesai:

1. ringkas apa yang dibuat
2. jelaskan struktur project
3. jelaskan cara setup
4. jelaskan fitur yang sudah jalan
5. jelaskan fitur yang masih stub (jika ada)

==================================================
🚀 EKSEKUSI
==================================================

Mulai langsung implementasi sekarang.

Jangan berhenti di tengah.

Utamakan aplikasi yang bisa dijalankan end-to-end.

---

Koneksi supabase :

project URL : https://qudjkcpudzngqzhkqccl.supabase.co
publishable key : sb_publishable_li7div_DtyOPV1zZtZinjA_iTtb1Fe6
direct connection string : postgresql://postgres:[YOUR-PASSWORD]@db.qudjkcpudzngqzhkqccl.supabase.co:5432/postgres

password db : [REDACTED]