# krs.ts

## submitKrsAction
- **Deskripsi Singkat:** Aksi Mahasiswa untuk mensubmit KRS (memilih jadwal kuliah).
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai (dengan catatan penting)**.
- **Detail Temuan:**
  - Dokumen mewajibkan validasi backend yang sangat ketat (Gate Tahap 6): Mahasiswa lunas/dispensasi, tahun akademik aktif, periode KRS buka, kapasitas kelas tidak penuh, dan tidak bentrok jam.
- **Saran Perbaikan:**
  - Evaluasi ulang logic di `submitKrsAction` untuk memastikan **Semua** validasi ini (SKS max, prasyarat, kuota kelas, status keuangan) benar-benar dilakukan sebelum insert ke `krs_details`.

## approveKrsAction
- **Deskripsi Singkat:** Aksi Dosen Wali (atau Admin) untuk Menyetujui atau Menolak KRS mahasiswa bimbingannya.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Mendukung persetujuan dan penolakan (dengan notes/catatan revisi).

## assignDosenWaliAction
- **Deskripsi Singkat:** Memetakan (assign) Dosen Wali ke Mahasiswa.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
