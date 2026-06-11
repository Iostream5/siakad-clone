# Detail Phase 4 - Laporan, Pimpinan, dan Monitoring

Dokumen ini merinci Phase 4 untuk project SIAKAD STAI Al-Ittihad. Fokusnya adalah laporan, dashboard pimpinan, audit operasional, monitoring, dan kontrol sistem. Setelah data akademik, PMB, dan keuangan jalan, barulah masuk akal bikin laporan. Kalau datanya belum bener tapi laporannya cantik, itu namanya infografis halu.

PRD utama tetap `docs/PRD-SIAKAD.md`. Dokumen ini adalah checklist operasional Phase 4.

## Tujuan Phase 4

Phase 4 bertujuan membuat sistem bisa dipakai untuk pengawasan dan pengambilan keputusan:

- Pimpinan bisa melihat ringkasan akademik, PMB, dan keuangan.
- Admin bisa export laporan penting.
- Prodi bisa melihat laporan akademik program studi.
- Keuangan bisa melihat laporan pembayaran dan tunggakan.
- Aktivitas penting bisa diaudit.
- Error dan webhook bisa dipantau.
- Sistem punya smoke test per role.

Output akhir Phase 4 adalah dashboard dan laporan yang bersumber dari data real, bukan angka pajangan yang tugasnya cuma terlihat meyakinkan.

## Scope Phase 4

Masuk scope:

- Dashboard pimpinan.
- Laporan akademik.
- Laporan PMB.
- Laporan keuangan.
- Laporan aktivitas/audit.
- Export PDF/Excel.
- Filter laporan.
- Monitoring webhook payment.
- Monitoring error aplikasi dasar.
- Dokumentasi smoke test per role.

Tidak masuk scope:

- Business intelligence kompleks.
- Data warehouse.
- Realtime analytics penuh.
- Alerting enterprise multi-channel.
- Akuntansi double-entry lengkap.
- Multi-tenant production hardening penuh.
- FCM push notification.

## Area File Utama

- Laporan page: `src/app/dashboard/laporan/page.tsx`
- Report UI: `src/modules/reports/report-panel.tsx`
- Dashboard overview: `src/modules/dashboard/overview.tsx`
- Recent activity: `src/modules/dashboard/recent-activity.tsx`
- Finance module: `src/modules/finance`
- PMB module: `src/modules/pmb`
- Audit activity page: `src/app/dashboard/pengaturan/audit-aktivitas/page.tsx`
- Audit login page: `src/app/dashboard/pengaturan/audit-login/page.tsx`
- Audit helpers: `src/lib/admin/audit-logger.ts`, `src/lib/admin/activity-audit.ts`
- PDF helper: `src/lib/pdf-generator.ts`
- Export routes: `src/app/dashboard/**/export/route.ts`
- Payment webhook routes: `src/app/api/payment-gateway/midtrans/...`

## Phase 4.1 - Audit Kebutuhan Laporan

Tujuan:

- Menentukan laporan yang benar-benar dibutuhkan tiap role.

Task:

- Inventarisasi laporan untuk role:
  - Admin
  - Prodi
  - Keuangan
  - Pimpinan
  - Staff
- Petakan sumber data tiap laporan.
- Tentukan filter wajib:
  - tahun akademik
  - program studi
  - status
  - tanggal mulai/selesai
  - jenis pembayaran
- Tentukan format output:
  - tabel dashboard
  - PDF
  - Excel
- Tandai laporan yang belum bisa dibuat karena data belum lengkap.

Acceptance criteria:

- Daftar laporan prioritas jelas.
- Setiap laporan punya sumber tabel/query.
- Setiap laporan punya filter minimal.
- Gap data terdokumentasi.

## Phase 4.2 - Dashboard Pimpinan

Tujuan:

- Pimpinan bisa melihat kondisi kampus secara ringkas.

Widget minimal:

- Total mahasiswa aktif.
- Total dosen aktif.
- Total pendaftar PMB.
- Pendaftar lulus/ditolak/proses.
- Total tagihan.
- Total pembayaran masuk.
- Total tunggakan.
- KRS submitted/approved/rejected.
- Aktivitas terbaru.

Task:

- Buat atau audit dashboard untuk role `Pimpinan`.
- Pastikan query mengambil data real.
- Pastikan dashboard tidak menampilkan data sensitif detail berlebihan.
- Tambahkan filter tahun akademik jika data tersedia.
- Tambahkan empty state jika database kosong.
- Pastikan akses hanya role berwenang.

Acceptance criteria:

- Role pimpinan bisa membuka dashboard.
- Angka dashboard sesuai database.
- Dashboard tetap aman saat tabel kosong.
- Role tidak berwenang tidak bisa mengakses view pimpinan.

Test:

- Login sebagai pimpinan.
- Buka dashboard.
- Bandingkan angka dengan query Supabase dev.
- Test empty state dengan data kosong jika memungkinkan.

## Phase 4.3 - Laporan Akademik

Tujuan:

- Admin/prodi/pimpinan bisa melihat laporan akademik.

Laporan minimal:

- Rekap mahasiswa per prodi.
- Rekap mahasiswa per angkatan.
- Rekap status mahasiswa.
- Rekap KRS per tahun akademik.
- Rekap nilai/IPK.
- Rekap dosen dan mata kuliah.
- Rekap jadwal kuliah.

Task:

- Audit `src/app/dashboard/laporan/page.tsx`.
- Audit `src/modules/reports/report-panel.tsx`.
- Buat query laporan akademik di service helper.
- Tambahkan filter tahun akademik dan prodi.
- Pastikan prodi hanya melihat data prodi terkait jika aturan scope diterapkan.
- Tambahkan export Excel/PDF untuk laporan prioritas.

Acceptance criteria:

- Laporan akademik tampil.
- Filter berjalan.
- Export menghasilkan file valid.
- Akses data sesuai role.

Test:

- Buka laporan sebagai admin.
- Buka laporan sebagai prodi.
- Test filter prodi/tahun akademik.
- Export PDF/Excel.

## Phase 4.4 - Laporan PMB

Tujuan:

- Admin/staff/prodi/pimpinan bisa memantau proses PMB.

Laporan minimal:

- Total pendaftar.
- Pendaftar per prodi pilihan.
- Pendaftar per status seleksi.
- Pendaftar per status pembayaran.
- Pendaftar lulus.
- Pendaftar yang sudah generate NIM.
- Konversi daftar ke mahasiswa.

Task:

- Buat query laporan PMB.
- Tambahkan filter:
  - tahun akademik
  - prodi
  - status seleksi
  - status pembayaran
  - tanggal daftar
- Tambahkan export Excel.
- Tambahkan ringkasan chart jika sudah ada pola chart.
- Pastikan akses role aman.

Acceptance criteria:

- Laporan PMB tampil.
- Filter PMB berjalan.
- Data sesuai tabel `pmb_pendaftaran` dan `pmb_pembayaran`.
- Export berhasil.

Test:

- Cek jumlah pendaftar dari UI dan Supabase.
- Filter status seleksi.
- Filter status pembayaran.
- Export laporan PMB.

## Phase 4.5 - Laporan Keuangan

Tujuan:

- Keuangan/admin/pimpinan bisa melihat kondisi pembayaran.

Laporan minimal:

- Total tagihan.
- Total pembayaran masuk.
- Total tunggakan.
- Pembayaran per periode.
- Pembayaran per prodi/angkatan.
- Tagihan belum lunas.
- Pembayaran PMB.
- Arus kas masuk/keluar.

Task:

- Audit finance summary.
- Buat query laporan keuangan.
- Tambahkan filter:
  - tahun akademik
  - tanggal
  - jenis tagihan
  - prodi
  - status pembayaran
- Pastikan angka memakai sumber yang konsisten.
- Pastikan pembayaran gateway dan manual masuk hitungan.
- Tambahkan export Excel/PDF.

Acceptance criteria:

- Laporan keuangan tampil.
- Total pembayaran sesuai database.
- Tunggakan dihitung benar.
- Export valid.
- Role non-keuangan tidak bisa melihat detail sensitif jika tidak berwenang.

Test:

- Bandingkan total pembayaran UI dengan query database.
- Filter tanggal.
- Filter status lunas/belum lunas.
- Export laporan.

## Phase 4.6 - Audit Aktivitas dan Audit Login

Tujuan:

- Admin bisa melacak aktivitas penting.

Task:

- Audit halaman audit aktivitas.
- Audit halaman audit login.
- Pastikan audit log punya filter:
  - user
  - modul
  - aksi
  - tanggal
- Pastikan detail old_data/new_data bisa dibaca.
- Pastikan data audit tidak bisa dihapus dari UI biasa.
- Pastikan login success/fail tercatat.
- Pastikan aksi PMB/finance/akademik penting tercatat.

Acceptance criteria:

- Admin bisa melihat audit aktivitas.
- Admin bisa melihat audit login.
- Filter audit berjalan.
- Detail audit tampil jelas.
- Audit log tidak bisa dihapus sembarangan.

Test:

- Login berhasil dan gagal.
- Lakukan satu CRUD.
- Cek audit log.
- Filter berdasarkan modul.

## Phase 4.7 - Monitoring Webhook Payment

Tujuan:

- Webhook payment bisa dipantau dan debug.

Task:

- Audit route webhook Midtrans PMB dan finance.
- Pastikan webhook invalid ditolak.
- Pastikan webhook valid tercatat.
- Tambahkan log event webhook jika tabel/struktur tersedia.
- Simpan minimal:
  - provider
  - order_id
  - transaction_id
  - status
  - received_at
  - processed_at
  - result
  - error message jika gagal
- Pastikan log tidak menyimpan secret.
- Pastikan webhook retry aman/idempotent.

Acceptance criteria:

- Admin/keuangan bisa melihat status webhook atau minimal log database tersedia.
- Webhook gagal bisa ditelusuri.
- Webhook valid berulang tidak menggandakan transaksi.

Test:

- Simulasi webhook valid.
- Simulasi webhook invalid signature.
- Simulasi webhook berulang.
- Cek log dan data pembayaran.

## Phase 4.8 - Monitoring Error Aplikasi

Tujuan:

- Error runtime tidak hilang tanpa jejak.

Task:

- Audit pola error handling Server Actions.
- Audit error boundary dashboard jika ada.
- Pastikan error user-facing tidak membocorkan stack/secret.
- Tambahkan logging untuk error penting:
  - auth
  - payment
  - PMB
  - finance
  - akademik
  - LMS
- Jika memakai Vercel, siapkan catatan monitoring via Vercel logs.
- Jika memakai Supabase, siapkan catatan monitoring via Supabase logs.

Acceptance criteria:

- Error penting bisa dilihat dari log.
- User melihat pesan error yang rapi.
- Secret tidak muncul di UI/log publik.

Test:

- Trigger error validasi.
- Trigger webhook invalid.
- Cek response dan log.

## Phase 4.9 - Export PDF dan Excel

Tujuan:

- Laporan penting bisa diunduh.

Task:

- Audit `src/lib/pdf-generator.ts`.
- Audit penggunaan `xlsx`.
- Standarkan format export:
  - judul laporan
  - periode/filter
  - tanggal export
  - kolom konsisten
  - total/ringkasan jika relevan
- Pastikan export tidak terlalu berat untuk data besar.
- Tambahkan limit atau streaming jika diperlukan.

Acceptance criteria:

- Export PDF berhasil.
- Export Excel berhasil.
- File bisa dibuka.
- Data export sesuai filter.
- Tidak ada data lintas role bocor.

Test:

- Export laporan akademik.
- Export laporan PMB.
- Export laporan keuangan.
- Buka file hasil export.

## Phase 4.10 - Smoke Test Per Role

Tujuan:

- Setiap role utama punya checklist manual.

Role minimal:

- Admin
- Prodi
- Dosen
- Mahasiswa
- Calon Mahasiswa
- Keuangan
- Pimpinan

Task:

- Buat dokumen smoke test per role.
- Tentukan akun test per role.
- Tentukan route wajib per role.
- Tentukan expected result tiap route.
- Catat blocker jika ada.

Acceptance criteria:

- Smoke test tertulis.
- Semua role utama punya checklist.
- Hasil test terakhir terdokumentasi.

## Gate Wajib Phase 4

Command wajib:

```bash
npm run type-check
npm run lint
npm run build
```

Smoke route:

- `/dashboard`
- `/dashboard/laporan`
- `/dashboard/pengaturan/audit-aktivitas`
- `/dashboard/pengaturan/audit-login`
- `/dashboard/keuangan`
- `/dashboard/pmb`
- `/dashboard/nilai`

Supabase dev check:

- Query laporan sesuai data.
- Audit log terisi.
- Webhook log atau data pembayaran bisa ditelusuri.
- RLS tetap aktif.

## Definisi Selesai Phase 4

Phase 4 dianggap selesai jika:

- Dashboard pimpinan tampil dari data real.
- Laporan akademik tersedia.
- Laporan PMB tersedia.
- Laporan keuangan tersedia.
- Export PDF/Excel laporan prioritas berjalan.
- Audit aktivitas dan login bisa dipakai.
- Webhook payment bisa ditelusuri.
- Error penting punya logging.
- Smoke test per role tersedia.
- Type-check, lint, dan build sukses.

Kalau laporan tidak bisa dibuktikan angkanya dari database, jangan disebut laporan. Sebut saja dekorasi angka.
