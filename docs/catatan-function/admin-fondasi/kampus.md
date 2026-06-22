# kampus.ts

## saveKampusAction, deleteKampusAction, restoreKampusAction, hardDeleteKampusAction, importKampusAction, bulkDeleteKampusAction, bulkRestoreKampusAction, bulkHardDeleteKampusAction
- **Deskripsi Singkat:** Kumpulan fungsi untuk operasi CRUD, Import, Bulk, dan Soft Delete / Restore entitas Kampus utama.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Lengkap dengan *Soft Delete* dan *Restore*, sangat sejalan dengan instruksi end-to-end.
- **Saran Perbaikan:**
  - Pastikan *Audit Log* aktif untuk setiap aksi mutasi pada data utama ini.
