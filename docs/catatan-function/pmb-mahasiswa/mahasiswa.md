# mahasiswa.ts

## searchMahasiswaAction
- **Deskripsi Singkat:** Mencari data mahasiswa untuk autocomplete atau dropdown di modul lain.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.

## upsertMahasiswaAction
- **Deskripsi Singkat:** Menambah atau mengupdate data profil/akademik dari Mahasiswa.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.

## deleteMahasiswaAction
- **Deskripsi Singkat:** Menghapus data mahasiswa.
- **Kesesuaian dengan Dokumen End-to-End:** **Belum Sesuai (Gap)**.
- **Detail Temuan:**
  - Sama dengan *users*, menghapus mahasiswa berisiko tinggi merusak seluruh FK (KRS, Registrasi, Nilai).
- **Saran Perbaikan:**
  - Pastikan ini adalah implementasi *Soft Delete* (ubah status mahasiswa menjadi 'Dikeluarkan' atau 'Mengundurkan Diri', atau set `deleted_at`).
