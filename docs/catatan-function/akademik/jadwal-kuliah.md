# jadwal-kuliah.ts

## saveJadwalKuliahAction
- **Deskripsi Singkat:** Membuat/mengubah sesi Jadwal Kuliah.
- **Kesesuaian dengan Dokumen End-to-End:** **Belum Sesuai Sepenuhnya**.
- **Detail Temuan:**
  - Dokumen mensyaratkan: "Memvalidasi agar tidak ada Dosen mengajar dua kelas pada jam yang persis sama" dan "Memvalidasi kapasitas Ruangan".
  - Harus dipastikan *didalam kode `saveJadwalKuliahAction`* apakah pengecekan bentrok dosen dan bentrok ruangan ini (clash validation) sudah benar-benar jalan sebelum menyimpan ke database.
- **Saran Perbaikan:**
  - Tambahkan atau perkuat *Conflict Detection Logic* (Bentrok Jam/Dosen/Ruangan) di backend sebelum eksekusi Insert/Update.

## deleteJadwalKuliahAction
- **Deskripsi Singkat:** Menghapus data jadwal kuliah.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
