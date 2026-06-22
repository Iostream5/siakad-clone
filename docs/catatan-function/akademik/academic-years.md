# academic-years.ts

## saveAcademicYearAction, deleteAcademicYearAction, importAcademicYearsAction
- **Deskripsi Singkat:** Mengelola (CRUD & Import) data Tahun Akademik.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Sesuai instruksi: "Membuat Tahun Akademik dan Semester baru (contoh: 2026/2027 Ganjil)."

## setActiveAcademicYearAction
- **Deskripsi Singkat:** Mengaktifkan satu tahun akademik (dan otomatis menonaktifkan yang lain).
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Sangat sejalan dengan: "Menandai perubahan status tahun akademik (hanya ada satu tahun akademik yang aktif pada satu waktu)."

## toggleAcademicYearKrsAction
- **Deskripsi Singkat:** Membuka atau menutup periode pengisian KRS pada tahun akademik tertentu.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Sesuai dengan "Mengaktifkan 'Periode Pengisian KRS'."

- **Saran Perbaikan Umum (academic-years.ts):**
  - Pastikan setiap penggantian status Aktif dan KRS selalu tercatat di *Audit Log* (wajib).
