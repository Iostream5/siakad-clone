# users.ts

## updateUserAction
- **Deskripsi Singkat:** Memperbarui data pengguna (profil dan kredensial).
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Memenuhi flow: "Mengisi data profil pengguna (nama, email, NIK/NIP, dll)."
- **Saran Perbaikan:**
  - -

## deleteUserAction
- **Deskripsi Singkat:** Menghapus user.
- **Kesesuaian dengan Dokumen End-to-End:** **Belum Sesuai (Gap)**.
- **Detail Temuan:**
  - Dokumen menyebutkan "Menonaktifkan (soft delete) user yang sudah tidak aktif." Jika fungsi ini melakukan *hard delete*, maka hal tersebut melanggar flow.
- **Saran Perbaikan:**
  - Pastikan bahwa `deleteUserAction` meng-update status ke *inactive* atau mengisi kolom `deleted_at`, BUKAN menghapus baris dari tabel `users` (karena akan merusak Foreign Key dari mahasiswa, krs, dll).
