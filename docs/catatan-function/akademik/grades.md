# grades.ts

## getClassGradesAction
- **Deskripsi Singkat:** Mengambil list nilai mahasiswa untuk sebuah kelas.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.

## updateGradeAction
- **Deskripsi Singkat:** Memperbarui nilai mahasiswa oleh Dosen Pengampu.
- **Kesesuaian dengan Dokumen End-to-End:** **Gap / Kurang Lengkap**.
- **Detail Temuan:**
  - Dokumen menyebutkan perlunya status "Draft" dan "Publish", serta konversi nilai angka menjadi nilai huruf/indeks.
- **Saran Perbaikan:**
  - Tambahkan parameter atau action khusus `publishGradeAction` yang mengubah status nilai dari *Draft* ke *Published* dan melakukan kalkulasi akhir (A, B, C / 4, 3, 2).
