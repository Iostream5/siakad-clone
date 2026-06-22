# pmb.ts

## registerPmbAction
- **Deskripsi Singkat:** Mendaftarkan calon mahasiswa baru secara mandiri.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Sesuai dengan spesifikasi: "Calon mahasiswa bisa daftar PMB dari halaman publik."

## updatePmbStatusAction
- **Deskripsi Singkat:** Mengubah status pendaftaran PMB secara general.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.

## savePmbFeeAction, deletePmbFeeAction
- **Deskripsi Singkat:** Mengelola biaya spesifik untuk PMB.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.

## submitPmbTransferPaymentAction, requestPmbPaymentGatewayAction, verifyPmbPaymentAction, updatePmbPaymentStatusAction
- **Deskripsi Singkat:** Flow pembayaran (Transfer manual atau Gateway) beserta verifikasinya untuk tagihan pendaftaran PMB.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Mendukung instruksi: "Calon mahasiswa bisa submit pembayaran. Admin/keuangan bisa verifikasi pembayaran PMB."
- **Saran Perbaikan:**
  - Pastikan `verifyPmbPaymentAction` juga menangani idempotency agar tidak terjadi double payment.

## savePmbSelectionScheduleAction, savePmbSelectionComponentAction, savePmbPassingGradeAction, savePmbSelectionScoreAction, finalizePmbSelectionAction
- **Deskripsi Singkat:** Modul lanjutan seleksi. Mencakup penjadwalan, penentuan passing grade, input nilai tes, hingga finalisasi status kelulusan.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Menjawab Gap pada Dokumen PMB: "Implemented lanjutan: tabel jadwal seleksi, komponen nilai, nilai seleksi, passing grade...".

## generateNimAction
- **Deskripsi Singkat:** Meng-*generate* (membuat) NIM bagi calon mahasiswa yang sudah berstatus LULUS seleksi, sehingga resmi menjadi Mahasiswa aktif.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Sangat penting untuk Gate transisi dari PMB ke Akademik: "Calon mahasiswa lulus bisa dibuatkan NIM. Akun calon mahasiswa berubah menjadi mahasiswa."
