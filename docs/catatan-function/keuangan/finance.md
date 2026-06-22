# finance.ts

## requestFinancePaymentGatewayAction
- **Deskripsi Singkat:** Membuat sesi *checkout* (Payment Link) dengan Payment Gateway (seperti Midtrans/Xendit).
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Dokumen mensyaratkan integrasi gateway online untuk mendapatkan `checkout_url`.

## verifyPaymentAction
- **Deskripsi Singkat:** Verifikasi pembayaran, baik secara manual (oleh admin) atau *Webhook verification*.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Sangat krusial. Dokumen meminta: "Sistem memvalidasi signature webhook untuk mencegah spoofing" dan "mengecek idempotency (menghindari proses ganda)".
- **Saran Perbaikan:**
  - Berikan pengamanan ganda di dalam fungsi ini untuk mengecek tabel `webhook_events` (atau sejenisnya) agar jika request Midtrans datang berkali-kali, tagihan dan saldo mahasiswa tidak dobel lunas/berlebih.

## syncAllStudentsStatusAction, getStudentLedgerAction, createCashFlowAction
- **Deskripsi Singkat:** Fungsi analitik/pembukuan untuk mengecek status lunas, *ledger* (buku besar/piutang) mahasiswa, dan mencatat *cash flow*.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Menjawab Gap di dokumen: "Dashboard Keuangan untuk melihat piutang mahasiswa yang belum ditagih dan kas masuk per bulan/semester."

## createTagihanAction, updateTagihanAction, bulkSoftDeleteTagihanAction, importTagihanAction
- **Deskripsi Singkat:** Mengelola pembuatan (individu), perubahan, impor massal, dan soft-delete Tagihan/Invoice.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Membantu jika tagihan harus di-custom satu per satu atau dibatalkan (soft delete) karena salah input.
- **Saran Perbaikan:**
  - Pastikan `bulkSoftDeleteTagihanAction` tidak bisa dieksekusi jika tagihan sudah berstatus `PAID`.

## sendTagihanNotificationAction, sendOverdueTagihanNotificationsAction
- **Deskripsi Singkat:** Mengirimkan notifikasi tagihan baru dan tagihan yang lewat jatuh tempo (overdue).
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Fitur yang sangat baik dan selaras dengan "Mengirimkan notifikasi ke Mahasiswa bersangkutan".
