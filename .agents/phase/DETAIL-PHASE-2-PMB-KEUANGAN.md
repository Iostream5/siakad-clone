# Detail Phase 2 - PMB dan Keuangan

Dokumen ini merinci Phase 2 untuk project SIAKAD STAI Al-Ittihad. Fokusnya adalah membuat alur penerimaan mahasiswa baru dan pembayaran berjalan end-to-end, bukan cuma tombol "Bayar" yang kalau diklik malah membuat hidup ikut pending.

PRD utama tetap `docs/PRD-SIAKAD.md`. Dokumen ini adalah checklist operasional untuk pengerjaan harian.

## Tujuan Phase 2

Phase 2 bertujuan menyelesaikan alur:

- Calon mahasiswa daftar PMB.
- Admin/staff/prodi memverifikasi pendaftaran.
- Biaya PMB bisa dikonfigurasi.
- Pembayaran PMB bisa dicatat dan diverifikasi.
- Pendaftar lulus bisa dibuatkan NIM.
- Mahasiswa punya tagihan.
- Keuangan bisa mengelola tagihan dan pembayaran.
- Payment gateway berjalan aman dengan validasi signature dan idempotency.
- Status mahasiswa bisa sinkron berdasarkan pembayaran.

Output akhir Phase 2 adalah flow PMB dan keuangan yang bisa dipakai operasional kampus dari daftar sampai bayar.

## Scope Phase 2

Masuk scope:

- PMB publik.
- Dashboard PMB.
- Verifikasi pendaftar.
- Biaya PMB.
- Pembayaran PMB manual dan gateway.
- Generate NIM.
- Sinkronisasi calon mahasiswa menjadi mahasiswa aktif.
- Master biaya.
- Generate tagihan bulk.
- Pembayaran mahasiswa.
- Verifikasi pembayaran.
- Riwayat pembayaran.
- Ledger mahasiswa.
- Webhook Midtrans.
- Hardening webhook: signature, idempotency, logging.
- Audit log untuk aksi PMB dan keuangan.

Tidak masuk scope:

- Xendit production jika Midtrans sudah cukup untuk target awal.
- Sistem akuntansi penuh.
- Jurnal akuntansi double-entry lengkap.
- Refund otomatis production-grade.
- Rekonsiliasi bank otomatis.
- Notifikasi FCM.
- LMS, KRS, nilai, dan EDOM lanjutan.

## Stack dan Pola Implementasi

Stack wajib:

- Next.js 16.2.4 App Router.
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase JS Client.
- SQL migrations.
- Server Actions.
- Route Handlers untuk webhook.
- TypeScript strict.
- Zod untuk validasi form.

Area file utama:

- PMB actions: `src/actions/pmb.ts`
- PMB service: `src/lib/admin/pmb.ts`
- PMB UI: `src/modules/pmb`
- PMB public pages: `src/app/pmb`, `src/app/pmb/daftar`
- Finance actions: `src/actions/finance.ts`, `src/actions/finance-master.ts`
- Finance service: `src/lib/admin/finance.ts`, `src/lib/admin/finance-master.ts`
- Finance UI: `src/modules/finance`
- Payment gateway UI: `src/modules/payment-gateway`
- Webhook routes: `src/app/api/payment-gateway/midtrans/...`
- Supabase clients: `src/supabase/...`
- Migrations: `supabase/migrations/`

Aturan teknis:

- Mutasi dashboard wajib punya `requireAuthorizedUser`.
- Aksi publik PMB hanya boleh menulis data yang memang public-safe.
- Webhook wajib validasi signature.
- Webhook wajib idempotent.
- Service role hanya server-side.
- Jangan expose server key ke client.
- Semua status pembayaran harus punya mapping jelas.
- Semua aksi penting masuk audit log.

## Phase 2.1 - Audit dan Finalisasi Schema PMB/Finance

Tujuan:

- Pastikan schema database cukup untuk flow Phase 2.
- Jangan bikin fitur di atas tabel yang bentuknya masih ngambang. Nanti query-nya yoga.

Task:

- Audit tabel PMB:
  - `pmb_pendaftaran`
  - `pmb_biaya`
  - `pmb_pembayaran`
  - tabel dokumen PMB jika ada
- Audit tabel finance:
  - `master_biaya`
  - `tagihan`
  - `pembayaran`
  - `arus_kas`
  - `kategori_keuangan`
  - `riwayat_status_mahasiswa`
- Audit constraint, index, FK, dan status enum/check.
- Pastikan semua tabel sensitif RLS aktif.
- Pastikan policy backend service role tersedia.
- Tambahkan migration jika ada kolom penting yang belum ada, misalnya:
  - provider transaction id
  - webhook event id
  - payment note
  - failure reason
  - verified_by
  - verified_at
  - created_by/updated_by jika dibutuhkan

Acceptance criteria:

- Semua tabel Phase 2 tersedia di Supabase dev.
- RLS aktif untuk tabel sensitif.
- Relasi PMB ke user/mahasiswa jelas.
- Relasi pembayaran ke tagihan jelas.
- Tidak ada kolom status yang ambigu.

Test:

- Cek schema via MCP `siakad_dev`.
- Jalankan migration lokal jika ada.
- `npm run type-check`
- `npm run build`

## Phase 2.2 - PMB Public Registration

Tujuan:

- Calon mahasiswa bisa mendaftar dari halaman publik.

Task:

- Audit `src/app/pmb/page.tsx`.
- Audit `src/app/pmb/daftar/page.tsx`.
- Audit `src/app/pmb/daftar/registration-form.tsx`.
- Audit `registerPmbAction`.
- Pastikan form validasi lengkap:
  - nama lengkap
  - email
  - nomor HP
  - pilihan prodi
  - tahun akademik/gelombang jika ada
  - data identitas dasar
- Pastikan email/nomor pendaftar tidak membuat duplikasi liar.
- Pastikan status awal jelas:
  - pendaftaran submitted
  - pembayaran pending/unpaid
  - seleksi menunggu verifikasi
- Pastikan response user-friendly.
- Pastikan data publik tidak butuh session.

Acceptance criteria:

- Halaman `/pmb` terbuka.
- Halaman `/pmb/daftar` terbuka.
- Form valid bisa submit.
- Data masuk ke `pmb_pendaftaran`.
- Data invalid ditolak dengan pesan jelas.
- Submit ulang data duplikat ditangani.

Test:

- Submit pendaftaran valid.
- Submit pendaftaran email duplikat.
- Submit form kosong.
- Cek data di Supabase dev.

## Phase 2.3 - Dashboard PMB dan Verifikasi Pendaftar

Tujuan:

- Admin/staff/prodi bisa mengelola data pendaftar.

Task:

- Audit dashboard `/dashboard/pmb`.
- Audit `src/modules/pmb/pmb-manager.tsx`.
- Pastikan list pendaftar punya:
  - search
  - filter status
  - pagination
  - detail modal
  - aksi update status
- Pastikan update status memakai authorization.
- Pastikan status flow tidak loncat sembarangan.
- Pastikan admin bisa memberi catatan verifikasi.
- Pastikan audit log tercatat.

Status minimal:

- Submitted
- Waiting Payment
- Verified
- Rejected
- Lulus
- Tidak Lulus
- Registered

Acceptance criteria:

- Admin bisa melihat daftar pendaftar.
- Admin bisa membuka detail pendaftar.
- Admin bisa update status seleksi/verifikasi.
- Role tidak berwenang tidak bisa update.
- Audit log tercatat.

Test:

- Login admin.
- Buka dashboard PMB.
- Update status pendaftar.
- Cek perubahan status di database.
- Cek audit log.

## Phase 2.4 - Biaya PMB dan Pembayaran PMB Manual

Tujuan:

- Biaya pendaftaran bisa dikonfigurasi dan pembayaran manual bisa diverifikasi.

Task:

- Audit `pmb_biaya`.
- Audit `savePmbFeeAction`.
- Audit `deletePmbFeeAction`.
- Audit `submitPmbTransferPaymentAction`.
- Audit `verifyPmbPaymentAction`.
- Pastikan admin/keuangan bisa membuat tarif PMB.
- Pastikan calon mahasiswa bisa submit bukti transfer jika login/session tersedia.
- Pastikan upload file diarahkan ke Supabase Storage jika sudah siap.
- Jika storage belum siap, dokumentasikan gap dan jangan pura-pura production-ready.
- Pastikan verifikasi pembayaran mengubah:
  - status pembayaran
  - status pendaftaran
  - catatan pembayaran
  - `verified_by`
  - `verified_at`
- Pastikan arus kas masuk tercatat saat pembayaran terverifikasi.

Acceptance criteria:

- Admin/keuangan bisa membuat tarif PMB.
- Pembayaran manual bisa dibuat.
- Admin/keuangan bisa verifikasi/menolak pembayaran.
- Pembayaran terverifikasi memperbarui status pendaftar.
- Arus kas masuk tercatat satu kali.

Test:

- Buat tarif PMB.
- Submit pembayaran manual.
- Verifikasi pembayaran.
- Tolak pembayaran.
- Cek `pmb_pembayaran`, `pmb_pendaftaran`, dan `arus_kas`.

## Phase 2.5 - Midtrans PMB

Tujuan:

- Calon mahasiswa bisa membayar PMB via Midtrans.

Task:

- Audit `requestPmbPaymentGatewayAction`.
- Audit `handleMidtransPmbNotification`.
- Audit route `src/app/api/payment-gateway/midtrans/pmb/route.ts`.
- Pastikan checkout Snap dibuat dengan order id unik.
- Pastikan `provider_reference` disimpan.
- Pastikan webhook validasi signature.
- Pastikan webhook idempotent.
- Pastikan status Midtrans dimapping ke status internal.
- Pastikan pembayaran settlement mengubah pendaftaran menjadi paid/verified.
- Pastikan webhook berulang tidak membuat `arus_kas` ganda.
- Pastikan error webhook tidak membocorkan secret.

Mapping status minimal:

- `settlement` -> Terverifikasi
- `capture` + fraud accept -> Terverifikasi
- `capture` + fraud challenge -> Menunggu
- `pending` -> Menunggu
- `expire` -> Kadaluarsa
- `cancel`, `deny`, `failure` -> Gagal
- `refund`, `partial_refund` -> Gagal atau status refund jika sudah ada

Acceptance criteria:

- Checkout URL berhasil dibuat.
- Webhook signature invalid ditolak.
- Webhook valid memperbarui pembayaran.
- Webhook valid berulang tidak membuat transaksi ganda.
- Status pendaftar ikut berubah.

Test:

- Request checkout PMB.
- Simulasi webhook valid.
- Simulasi webhook invalid signature.
- Simulasi webhook settlement dua kali.
- Cek `pmb_pembayaran`, `pmb_pendaftaran`, dan `arus_kas`.

## Phase 2.6 - Generate NIM dan Sinkronisasi Mahasiswa

Tujuan:

- Pendaftar yang lulus bisa menjadi mahasiswa.

Task:

- Audit `generateNimAction`.
- Audit helper `generateNimAndCreateStudent`.
- Audit RPC/function `generate_nim` jika ada.
- Pastikan hanya pendaftar status lulus yang bisa generate NIM.
- Pastikan pembayaran wajib lunas jika aturan kampus begitu.
- Pastikan user profile dibuat/diupdate.
- Pastikan role `Mahasiswa` diberikan.
- Pastikan role `Calon Mahasiswa` dicabut jika sudah tidak relevan.
- Pastikan data masuk tabel `mahasiswa`.
- Pastikan generate NIM idempotent: tidak membuat mahasiswa duplikat.

Acceptance criteria:

- Pendaftar lulus bisa dibuatkan NIM.
- Pendaftar belum lulus tidak bisa generate NIM.
- Mahasiswa baru punya user dan role benar.
- NIM unik.
- Data mahasiswa muncul di master data mahasiswa.

Test:

- Generate NIM pendaftar valid.
- Coba generate ulang pendaftar yang sama.
- Coba generate NIM pendaftar belum lulus.
- Cek `users`, `user_roles`, `mahasiswa`, `pmb_pendaftaran`.

## Phase 2.7 - Master Biaya dan Generate Tagihan

Tujuan:

- Keuangan bisa membuat biaya dan menghasilkan tagihan mahasiswa.

Task:

- Audit `src/actions/finance-master.ts`.
- Audit `src/lib/admin/finance-master.ts` jika ada.
- Audit UI setup finance.
- Pastikan master biaya mendukung:
  - jenis biaya
  - nominal
  - tahun akademik
  - program studi
  - angkatan/tingkat jika dipakai
  - status aktif
- Pastikan generate tagihan bulk punya filter jelas.
- Pastikan generate tidak membuat duplikasi tagihan.
- Pastikan hasil generate bisa dilihat.
- Pastikan audit log tercatat.

Acceptance criteria:

- Keuangan/admin bisa membuat master biaya.
- Keuangan/admin bisa generate tagihan.
- Tagihan duplikat tidak dibuat.
- Tagihan muncul di list tagihan.
- Mutasi hanya bisa role berwenang.

Test:

- Buat master biaya.
- Generate tagihan untuk mahasiswa target.
- Generate ulang dengan kriteria sama.
- Cek jumlah tagihan.

## Phase 2.8 - Pembayaran Mahasiswa Manual

Tujuan:

- Pembayaran tagihan mahasiswa bisa dicatat dan diverifikasi.

Task:

- Audit `createTagihanAction`.
- Audit `verifyPaymentAction`.
- Audit `createCashFlowAction`.
- Audit ledger modal dan tab pembayaran.
- Pastikan pembayaran manual punya:
  - tagihan
  - nominal
  - metode
  - bukti
  - status
  - verifier
  - verified_at
- Pastikan verifikasi pembayaran mengubah status tagihan jika lunas.
- Pastikan pembayaran parsial dihitung benar jika didukung.
- Pastikan arus kas masuk tercatat satu kali.
- Pastikan ledger mahasiswa menampilkan tagihan dan pembayaran.

Acceptance criteria:

- Pembayaran manual bisa dibuat.
- Admin/keuangan bisa verifikasi.
- Tagihan lunas jika total bayar cukup.
- Ledger mahasiswa sesuai data.
- Arus kas tidak dobel.

Test:

- Buat tagihan.
- Buat pembayaran manual.
- Verifikasi pembayaran.
- Cek status tagihan.
- Cek ledger mahasiswa.

## Phase 2.9 - Midtrans Finance

Tujuan:

- Mahasiswa bisa membayar tagihan via Midtrans.

Task:

- Audit `requestFinancePaymentGatewayAction`.
- Audit `handleMidtransFinanceNotification`.
- Audit route `src/app/api/payment-gateway/midtrans/finance/route.ts`.
- Pastikan checkout Snap dibuat dengan order id unik.
- Pastikan `provider_reference` disimpan di `pembayaran`.
- Pastikan webhook validasi signature.
- Pastikan webhook validasi payload wajib.
- Pastikan webhook idempotent.
- Pastikan settlement mengubah pembayaran menjadi terverifikasi.
- Pastikan status tagihan berubah menjadi lunas jika total bayar cukup.
- Pastikan arus kas masuk tercatat satu kali.

Acceptance criteria:

- Checkout tagihan berhasil dibuat.
- Webhook invalid ditolak.
- Webhook valid memperbarui pembayaran.
- Webhook berulang tidak membuat arus kas ganda.
- Tagihan berubah lunas jika nominal cukup.

Test:

- Request checkout tagihan.
- Simulasi webhook settlement.
- Simulasi webhook invalid signature.
- Simulasi webhook settlement ulang.
- Cek `pembayaran`, `tagihan`, `arus_kas`.

## Phase 2.10 - Sinkronisasi Status Mahasiswa

Tujuan:

- Status mahasiswa bisa berubah berdasarkan kondisi pembayaran/registrasi.

Task:

- Audit `syncAllStudentsStatusAction`.
- Audit helper finance terkait status mahasiswa.
- Tentukan aturan status:
  - aktif jika pembayaran semester lunas
  - nonaktif jika belum bayar melewati batas
  - calon jika belum resmi mahasiswa
- Pastikan perubahan status tercatat di `riwayat_status_mahasiswa`.
- Pastikan sync bisa dijalankan oleh admin/keuangan.
- Pastikan sync tidak overwrite status khusus seperti cuti/lulus/drop out tanpa aturan jelas.

Acceptance criteria:

- Admin/keuangan bisa menjalankan sync status.
- Status mahasiswa berubah sesuai aturan.
- Riwayat status tercatat.
- Status khusus tidak rusak sembarangan.

Test:

- Siapkan mahasiswa dengan tagihan lunas.
- Jalankan sync.
- Cek status mahasiswa.
- Cek riwayat status.

## Phase 2.11 - Laporan Keuangan Dasar

Tujuan:

- Admin/keuangan bisa melihat ringkasan tagihan dan pembayaran.

Task:

- Audit dashboard finance.
- Pastikan ringkasan menampilkan:
  - total tagihan
  - total pembayaran masuk
  - total tunggakan
  - pembayaran PMB
  - pembayaran mahasiswa
  - transaksi terbaru
- Pastikan filter tahun akademik tersedia jika data sudah mendukung.
- Pastikan export laporan dasar tersedia jika sudah ada pola.

Acceptance criteria:

- Dashboard keuangan tampil.
- Angka sesuai database.
- Filter tidak merusak query.
- Empty state aman.

Test:

- Buka `/dashboard/keuangan`.
- Cek angka dengan query database.
- Test filter tahun akademik jika ada.

## Phase 2.12 - Audit Log dan Security Review

Tujuan:

- PMB dan keuangan bisa diaudit.

Task:

- Pastikan audit log untuk:
  - update status PMB
  - verifikasi pembayaran PMB
  - generate NIM
  - create/update/delete master biaya
  - generate tagihan
  - verifikasi pembayaran mahasiswa
  - sync status mahasiswa
  - perubahan payment gateway settings
- Pastikan Route Handler webhook tidak butuh session tapi tetap validasi signature.
- Pastikan semua dashboard action punya authorization.
- Pastikan service role tidak dipakai di client.
- Pastikan error tidak menampilkan secret.

Acceptance criteria:

- Audit log muncul untuk aksi penting.
- Webhook aman dari signature palsu.
- User tanpa akses tidak bisa mutasi PMB/finance.
- Tidak ada secret di response error.

## Gate Wajib Phase 2

Command wajib:

```bash
npm run type-check
npm run lint
npm run build
```

Smoke test route:

- `/pmb`
- `/pmb/daftar`
- `/dashboard/pmb`
- `/dashboard/keuangan`
- `/dashboard/pengaturan/payment-gateway`
- `/api/payment-gateway/midtrans/pmb`
- `/api/payment-gateway/midtrans/finance`

Supabase dev check:

- Tabel PMB dan finance ada.
- RLS aktif.
- Policy backend tersedia.
- Data test masuk sesuai flow.
- Tidak ada transaksi dobel setelah webhook berulang.

## Definisi Selesai Phase 2

Phase 2 dianggap selesai jika:

- Calon mahasiswa bisa daftar.
- Admin bisa verifikasi pendaftar.
- Pembayaran PMB manual dan gateway berjalan.
- Generate NIM berjalan dan idempotent.
- Mahasiswa punya tagihan.
- Keuangan bisa generate dan verifikasi tagihan.
- Midtrans finance berjalan dengan signature validation dan idempotency.
- Status mahasiswa bisa disinkronkan dengan aturan jelas.
- Laporan keuangan dasar tampil.
- Audit log mencatat aksi penting.
- Type-check, lint, dan build sukses.
- Smoke test route utama lolos.

Kalau payment gateway bisa membuat pembayaran dobel, Phase 2 belum selesai. Itu bukan fitur, itu mesin fotokopi masalah.
