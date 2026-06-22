# faculties.ts

## saveFacultyAction
- **Deskripsi Singkat:** Menyimpan atau memperbarui data Fakultas.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Mencakup pembuatan (insert) dan update Fakultas. Sesuai dengan "Menambahkan data Fakultas yang berada di bawah Kampus tersebut".
- **Saran Perbaikan:**
  - Pastikan ada pemanggilan *Audit Log*.

## deleteFacultyAction
- **Deskripsi Singkat:** Menghapus data Fakultas.
- **Kesesuaian dengan Dokumen End-to-End:** **Belum Sesuai (Gap)**.
- **Detail Temuan:**
  - Perlu dipastikan apakah fungsi ini melakukan *Soft Delete* atau *Hard Delete*. Di dokumen tertulis: "Implementasi Soft Delete dan kemampuan me-restore (Restore) data master yang terhapus agar tidak merusak referensi data lama."
- **Saran Perbaikan:**
  - Jika saat ini `deleteFacultyAction` menghapus secara permanen dari database, rubah logikanya menjadi *Soft Delete* (misalnya mengubah kolom `deleted_at`).

## importFacultiesAction
- **Deskripsi Singkat:** Mengimpor data Fakultas secara massal.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Dokumen menyebutkan perlunya "Fitur Import/Export massal menggunakan Excel/CSV untuk entitas ... agar mempercepat proses setup."
- **Saran Perbaikan:**
  - Pastikan proses import tervalidasi agar tidak menghasilkan duplikasi kode fakultas.
