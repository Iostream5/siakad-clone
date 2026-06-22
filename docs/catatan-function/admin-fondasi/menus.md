# menus.ts

## saveMenuAction, deleteMenuAction, moveMenuAction
- **Deskripsi Singkat:** Mengelola struktur dan hierarki menu (parent/child) secara dinamis.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Mengakomodasi flow: "Menyusun hierarki menu dinamis untuk sidebar (termasuk menu parent dan child)."
- **Saran Perbaikan:**
  - Untuk `deleteMenuAction`, pastikan tidak memutus relasi secara fatal jika ada menu child (cascade delete atau mencegah delete parent yang punya child).
