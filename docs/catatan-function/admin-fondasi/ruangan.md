# ruangan.ts

## upsertGedungAction, deleteGedungAction
- **Deskripsi Singkat:** Mengelola data Gedung (kemungkinan duplikasi dengan `gedung.ts` atau versi alternatif).
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai, tetapi Berisiko Duplikasi**.
- **Detail Temuan:**
  - Terdapat fungsi yang mengelola gedung di `ruangan.ts` sedangkan sudah ada `gedung.ts` yang jauh lebih komprehensif (ada soft delete, restore, bulk).
- **Saran Perbaikan:**
  - Sebaiknya fungsi terkait gedung dihapus dari `ruangan.ts` dan semua komponen UI diarahkan ke `gedung.ts` untuk menjaga Single Source of Truth dan standarisasi *Soft Delete*.

## upsertRuanganAction, deleteRuanganAction
- **Deskripsi Singkat:** Menambah/memperbarui dan menghapus data Ruangan.
- **Kesesuaian dengan Dokumen End-to-End:** **Belum Sesuai (Gap)**.
- **Detail Temuan:**
  - Ruangan belum memiliki operasi *Soft Delete* dan *Restore* terstandarisasi seperti yang dimiliki entitas Gedung.
- **Saran Perbaikan:**
  - Refactor `ruangan.ts` agar menyerupai arsitektur `gedung.ts` atau `kampus.ts` (menggunakan pola *soft delete*, *restore*, dan *import* jika memungkinkan).
