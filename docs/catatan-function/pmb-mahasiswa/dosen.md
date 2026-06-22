# dosen.ts

## upsertDosenAction, deleteDosenAction
- **Deskripsi Singkat:** Menambah, memperbarui, dan menghapus (CRUD) profil master Dosen.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Saran Perbaikan:**
  - Gunakan Soft Delete untuk `deleteDosenAction` jika dosen tersebut pernah memiliki historis mengajar.
