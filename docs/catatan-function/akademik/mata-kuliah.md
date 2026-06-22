# mata-kuliah.ts

## saveMataKuliahAction, deleteMataKuliahAction, importMataKuliahAction
- **Deskripsi Singkat:** Menyimpan, menghapus, dan mengimpor entitas Mata Kuliah.
- **Kesesuaian dengan Dokumen End-to-End:** **Belum Sesuai Sepenuhnya (Gap)**.
- **Detail Temuan:**
  - Belum mengimplementasikan pola *Soft Delete* seperti pada `kurikulum.ts` dan `kelas.ts`.
- **Saran Perbaikan:**
  - Refactor untuk menggunakan `restore` dan membedakan antara *Soft Delete* dengan *Hard Delete* agar selaras dengan entitas master lainnya.
