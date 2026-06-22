# finance-master.ts

## createMasterBiayaAction, deleteMasterBiayaAction
- **Deskripsi Singkat:** Mengelola (CRUD) Master Biaya / Jenis Tagihan (SPP, Pendaftaran, dll).
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Dokumen menyebutkan: "Menambahkan jenis biaya baru... Mengatur nominal default, deskripsi, dan periode."

## generateBulkTagihanAction
- **Deskripsi Singkat:** Membuat tagihan secara massal (Bulk) untuk banyak mahasiswa.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Sesuai dengan spesifikasi: "Keuangan dapat men-generate invoice SPP untuk 1 atau 100 Mahasiswa sekaligus (Bulk)."
- **Saran Perbaikan:**
  - Pastikan implementasi *Idempotency* (pencegahan duplikasi tagihan) apabila admin tidak sengaja klik generate dua kali untuk kelompok mahasiswa yang sama.
