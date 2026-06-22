# finance-setup.ts

## saveFinanceSetupAction, deleteFinanceSetupAction, setActiveAcademicYearAction
- **Deskripsi Singkat:** Mengelola setup parameter awal modul keuangan (termasuk setting periode aktif dari kacamata keuangan).
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Fungsi ini kemungkinan bertugas mengkonfigurasi referensi periode tagihan, namun perlu diperhatikan duplikasinya dengan modul akademik (tahun akademik).
- **Saran Perbaikan:**
  - Pastikan `setActiveAcademicYearAction` di sini tidak *clash* (bertentangan) dengan status akademik. Idealnya single source of truth untuk periode akademik tetap di tabel master akademik, kecuali ini spesifik untuk "Periode Penagihan".
