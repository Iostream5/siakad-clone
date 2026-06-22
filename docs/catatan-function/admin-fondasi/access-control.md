# access-control.ts

## saveUserRolesAction
- **Deskripsi Singkat:** Menyimpan/mengubah Role yang di-assign kepada seorang user. Menyesuaikan tabel `user_roles`.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Fungsi ini mengecek otorisasi admin terlebih dahulu, lalu menghapus role yang lama dan mengganti dengan role baru.
  - Sesuai dengan instruksi *Admin login -> mengelola Role dan Permission (RBAC) -> mengelola Users (Staf, Dosen, Admin lain)*.
- **Saran Perbaikan:**
  - Tambahkan *Audit Log* (menggunakan `logActivity`) setelah role berhasil di-assign, karena ini adalah aksi *krusial* menurut poin "Audit Log mencatat siapa, kapan, dan apa yang diubah pada operasi krusial".

## saveRoleAccessAction
- **Deskripsi Singkat:** Menyimpan/menyesuaikan Permission (serta akses menu) yang dimiliki oleh sebuah Role.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Melakukan assign permission ke role tertentu. Sesuai dengan spesifikasi "Membuat role baru (jika belum ada) dan memberikan permission yang sesuai ke setiap role".
- **Saran Perbaikan:**
  - Sama dengan `saveUserRolesAction`, pastikan *Audit Log* digunakan di sini.
