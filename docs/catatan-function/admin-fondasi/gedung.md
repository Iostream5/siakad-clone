# gedung.ts

## saveGedungAction, deleteGedungAction, restoreGedungAction, hardDeleteGedungAction, importGedungAction, bulkDeleteGedungAction, bulkRestoreGedungAction, bulkHardDeleteGedungAction
- **Deskripsi Singkat:** Kumpulan fungsi untuk operasi CRUD, Import, Bulk, dan Soft Delete / Restore entitas Gedung.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Implementasi *Soft Delete*, *Restore*, dan *Bulk Operations* yang sangat lengkap dan sesuai dengan ekspektasi dokumen. Sesuai dengan "Menambahkan data Gedung yang ada di kampus" dan "Implementasi Soft Delete dan kemampuan me-restore".
- **Saran Perbaikan:**
  - Pastikan `logActivity` dipanggil pada saat `hardDelete` dan perubahan data (*save*, *delete*, *restore*).
