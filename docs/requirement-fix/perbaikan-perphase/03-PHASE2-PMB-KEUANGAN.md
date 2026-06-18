# Phase 2 - PMB dan Keuangan

## Tujuan

Membuat flow calon mahasiswa dan pembayaran bisa diuji end-to-end: daftar, bayar, verifikasi, seleksi, generate NIM, tagihan, pembayaran, dan webhook.

## Masalah dari File Gabungan

- `/pmb/daftar` masih memakai `isPmbOpen = true`.
- Tabel `pmb_pendaftaran`, `pmb_pembayaran`, `tagihan`, dan `pembayaran` masih kosong.
- Flow PMB belum terbukti: daftar -> bayar -> verifikasi -> seleksi -> generate NIM.
- Flow finance belum terbukti karena data tagihan/pembayaran kosong.
- Webhook sudah punya validasi signature di service, tetapi belum diuji dengan payload valid/invalid karena data order belum siap.
- Beberapa action PMB/finance masih perlu audit error safe dan audit log.

## File/Area Terkait

- `src/app/pmb/daftar/page.tsx`
- `src/app/pmb/daftar/registration-form.tsx`
- `src/actions/pmb.ts`
- `src/actions/finance.ts`
- `src/actions/settings.ts`
- `src/lib/admin/pmb.ts`
- `src/lib/admin/finance.ts`
- `src/modules/pmb/pmb-manager.tsx`
- `src/modules/finance/finance-manager.tsx`
- `src/app/api/payment-gateway/midtrans/pmb/route.ts`
- `src/app/api/payment-gateway/midtrans/finance/route.ts`
- tabel `settings`
- tabel `pmb_pendaftaran`
- tabel `pmb_pembayaran`
- tabel `master_biaya`
- tabel `tagihan`
- tabel `pembayaran`
- tabel `webhook_events`
- tabel `audit_logs`

## Perbaikan Urgent

### 1. Pindahkan Status PMB Open ke Settings

Langkah:

1. Tambah key `pmb_registration_open` di tabel `settings` atau gunakan field konfigurasi akademik yang disepakati.
2. Buat helper baca setting PMB aktif.
3. Update `/pmb/daftar` agar membaca setting.
4. Admin bisa mengubah status dari halaman settings.
5. Saat PMB tutup, submit form harus ditolak server-side.

Definition of done:

- PMB bisa ditutup tanpa edit kode.
- Form publik membaca setting.
- Pesan "Pendaftaran ditutup" jelas.

### 2. Seed Data PMB dan Finance

Langkah:

1. Buat pendaftar PMB sample dengan beberapa status.
2. Buat data biaya PMB.
3. Buat sample pembayaran PMB.
4. Buat master biaya mahasiswa.
5. Buat tagihan sample untuk mahasiswa.
6. Buat pembayaran manual sample.

Definition of done:

- Dashboard PMB tidak kosong.
- Dashboard finance tidak kosong.
- Flow minimal bisa diuji dari UI.

### 3. Test Webhook Payment

Langkah:

1. Siapkan order/payment sample.
2. Test payload Midtrans invalid signature, harus ditolak.
3. Test payload valid signature, harus update status.
4. Test idempotency, payload sama tidak boleh membuat transaksi dobel.
5. Pastikan `webhook_events` tercatat.

Definition of done:

- Invalid signature ditolak.
- Valid webhook memproses status.
- Duplicate webhook diabaikan aman.
- Event tercatat di `webhook_events`.

### 4. Audit Action PMB dan Finance

Langkah:

1. Audit auth/role check pada action PMB dan finance.
2. Sanitize error message ke client.
3. Pastikan audit log masuk untuk status berubah, verifikasi pembayaran, generate tagihan, dan generate NIM.

Definition of done:

- Role salah tidak bisa mutasi PMB/finance.
- Audit log masuk.
- Error aman.

## Gate Phase 2

- PMB open dari settings.
- Ada data PMB dan finance minimal.
- Flow PMB bisa dicoba.
- Flow tagihan/pembayaran bisa dicoba.
- Webhook invalid/valid sudah dites.
- `npm run type-check` PASS.

