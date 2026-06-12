# Detail Phase 5 - Notifikasi, EDOM, dan Fitur Lanjutan

Dokumen ini merinci Phase 5 untuk project SIAKAD STAI Al-Ittihad. Fokusnya adalah fitur pendukung setelah flow utama sudah stabil: notifikasi, EDOM, reminder, dan peningkatan UX. Jangan mulai phase ini kalau PMB, keuangan, akademik, dan laporan masih bolong. Itu seperti pasang lampu disko di rumah yang atapnya bocor.

PRD utama tetap `docs/PRD-SIAKAD.md`. Dokumen ini adalah checklist operasional Phase 5.

## Tujuan Phase 5

Phase 5 bertujuan membuat sistem lebih komunikatif dan lengkap:

- Admin bisa mengelola template notifikasi.
- Sistem bisa membuat notifikasi in-app untuk event penting.
- Sistem siap memakai push notification jika dibutuhkan.
- EDOM atau evaluasi dosen oleh mahasiswa berjalan end-to-end.
- Reminder pembayaran, KRS, tugas, dan PMB tersedia.
- UX mobile dan empty/error state makin rapi.

Output akhir Phase 5 adalah sistem yang bukan cuma menyimpan data, tapi juga memberi tahu user saat ada hal penting. Bayi sistemnya mulai bisa ngomong, bukan cuma diam di database.

## Scope Phase 5

Masuk scope:

- Template notifikasi.
- Notification queue.
- In-app notification.
- Read/unread notification.
- Optional push notification via FCM.
- EDOM.
- Reminder PMB.
- Reminder pembayaran.
- Reminder KRS.
- Reminder tugas LMS.
- UX hardening untuk role utama.
- Dokumentasi event notifikasi.

Tidak masuk scope:

- WhatsApp gateway production kecuali ada provider resmi dan keputusan eksplisit.
- Email marketing.
- Chat realtime antar user.
- Video conference.
- BI/analytics lanjutan.
- Multi-tenant production hardening penuh.

## Area File Utama

- Template notifikasi page: `src/app/dashboard/pengaturan/template-notifikasi/page.tsx`
- Notification actions: `src/actions/notifications.ts`
- Notification service: `src/lib/admin/notifications.ts`
- Notification UI/topbar: `src/components/layout/topbar.tsx`
- Settings/payment gateway area jika event terkait: `src/modules/payment-gateway`
- LMS modules: `src/modules/lms`
- Finance modules: `src/modules/finance`
- PMB modules: `src/modules/pmb`
- EDOM tables jika tersedia: `edom_questions`, `edom_responses`, `edom_response_answers`
- Migrations: `supabase/migrations/`

## Phase 5.1 - Audit Schema Notifikasi

Tujuan:

- Pastikan schema notifikasi siap untuk event sistem.

Task:

- Audit tabel:
  - `notification_templates`
  - `notification_queue`
  - `notification_devices`
  - `notifikasi` jika masih dipakai sebagai legacy/in-app table
- Pastikan kolom minimal tersedia:
  - user_id
  - channel
  - event
  - subject
  - body
  - href
  - payload
  - status
  - attempts
  - run_at
  - sent_at
  - is_read untuk in-app
- Pastikan RLS aktif untuk tabel notifikasi sensitif.
- Pastikan policy service role tersedia.
- Pastikan user hanya bisa membaca notifikasi miliknya.

Acceptance criteria:

- Schema notifikasi jelas.
- Tabel sensitif RLS aktif.
- Tidak ada notifikasi lintas user yang bocor.

## Phase 5.2 - Template Notifikasi

Tujuan:

- Admin bisa mengelola template pesan.

Task:

- Audit halaman template notifikasi.
- Pastikan admin bisa CRUD template.
- Template minimal punya:
  - event key
  - channel
  - subject/title
  - body
  - variables
  - is_active
- Pastikan variable placeholder terdokumentasi.
- Pastikan preview template tersedia jika sudah ada pola UI.
- Pastikan hanya admin yang bisa mengelola template.

Acceptance criteria:

- Admin bisa membuat template.
- Admin bisa update template.
- Admin bisa nonaktifkan template.
- Template invalid ditolak.
- Audit log tercatat.

Test:

- Buat template event pembayaran.
- Update body template.
- Nonaktifkan template.
- Cek audit log.

## Phase 5.3 - Notification Queue

Tujuan:

- Event penting bisa masuk queue sebelum dikirim.

Task:

- Buat helper enqueue notification.
- Pastikan enqueue menerima:
  - user target
  - event
  - channel
  - payload
  - href opsional
  - run_at opsional
- Pastikan template aktif dipakai untuk membentuk subject/body.
- Pastikan queue menyimpan status:
  - waiting
  - processing
  - sent
  - failed
  - skipped
- Pastikan retry count tersedia.
- Pastikan error tersimpan di `last_error`.

Acceptance criteria:

- Event bisa membuat queue notification.
- Template dipakai saat generate pesan.
- Queue gagal menyimpan error.
- Queue tidak membuat duplikasi liar untuk event yang sama jika idempotency dibutuhkan.

## Phase 5.4 - In-App Notification

Tujuan:

- User bisa melihat notifikasi di aplikasi.

Task:

- Audit topbar notification.
- Buat list notifikasi user aktif.
- Tambahkan unread count.
- Tambahkan mark as read.
- Tambahkan mark all as read jika diperlukan.
- Pastikan klik notifikasi bisa menuju `href`.
- Pastikan user hanya membaca notifikasinya sendiri.

Acceptance criteria:

- User melihat unread count.
- User bisa membuka daftar notifikasi.
- User bisa mark as read.
- User tidak bisa membaca notifikasi user lain.

Test:

- Buat notifikasi untuk admin.
- Login admin dan cek tampil.
- Mark as read.
- Login user lain dan pastikan tidak terlihat.

## Phase 5.5 - Push Notification FCM Opsional

Tujuan:

- Sistem siap mengirim push notification jika FCM dipakai.

Task:

- Tentukan apakah FCM benar-benar dibutuhkan.
- Tambahkan env server-side untuk FCM.
- Buat registrasi device token.
- Simpan token ke `notification_devices`.
- Buat worker/server action untuk mengirim push dari queue.
- Pastikan token bisa dinonaktifkan jika invalid.
- Pastikan secret FCM tidak pernah masuk client.

Acceptance criteria:

- Device token bisa disimpan.
- Push bisa dikirim untuk event test.
- Token invalid ditandai inactive.
- In-app notification tetap berjalan walau push gagal.

Catatan:

- Jika belum ada kebutuhan real, cukup siapkan schema dan dokumentasi. Jangan pasang FCM cuma biar kelihatan canggih. Canggih tapi tidak dipakai itu namanya pajangan mahal.

## Phase 5.6 - Event Notifikasi PMB

Tujuan:

- Calon mahasiswa dan admin mendapat info penting terkait PMB.

Event minimal:

- Pendaftaran PMB berhasil.
- Status pendaftaran berubah.
- Pembayaran PMB diterima.
- Pembayaran PMB ditolak.
- Pendaftar dinyatakan lulus/tidak lulus.
- NIM berhasil dibuat.

Task:

- Tambahkan enqueue notification di action/service PMB.
- Pastikan event tidak menggandakan notifikasi saat webhook berulang.
- Pastikan pesan memakai template.
- Pastikan href menuju halaman relevan.

Acceptance criteria:

- Event PMB membuat notifikasi.
- Webhook berulang tidak membuat spam.
- User target benar.

## Phase 5.7 - Event Notifikasi Keuangan

Tujuan:

- Mahasiswa dan keuangan mendapat info pembayaran/tagihan.

Event minimal:

- Tagihan baru dibuat.
- Pembayaran diterima.
- Pembayaran ditolak.
- Pembayaran diverifikasi.
- Tagihan jatuh tempo.
- Tagihan overdue.

Task:

- Tambahkan enqueue notification di finance flow.
- Pastikan notifikasi tagihan bulk tidak terlalu berat.
- Pastikan reminder overdue bisa dijalankan terjadwal/manual.
- Pastikan data nominal tidak bocor ke user lain.

Acceptance criteria:

- Mahasiswa menerima notifikasi tagihan.
- Mahasiswa menerima status pembayaran.
- Keuangan bisa melihat aktivitas pembayaran.
- Bulk notification tidak menggandakan pesan.

## Phase 5.8 - Event Notifikasi Akademik dan LMS

Tujuan:

- Mahasiswa dan dosen mendapat info KRS, nilai, tugas, dan forum.

Event minimal:

- KRS disubmit.
- KRS disetujui/ditolak.
- Nilai dipublish.
- Materi baru tersedia.
- Tugas baru dibuat.
- Deadline tugas mendekat.
- Submission dinilai.
- Komentar forum baru.

Task:

- Tambahkan enqueue notification di KRS, grades, dan LMS.
- Pastikan dosen hanya menerima event kelasnya.
- Pastikan mahasiswa hanya menerima event kelas yang dia ambil.
- Pastikan reminder deadline bisa dijalankan manual/terjadwal.

Acceptance criteria:

- Event akademik membuat notifikasi.
- Event LMS membuat notifikasi.
- Target role benar.
- Tidak ada notifikasi lintas kelas.

## Phase 5.9 - EDOM

Tujuan:

- Mahasiswa bisa mengevaluasi dosen dan pimpinan/prodi bisa melihat hasil rekap.

Task:

- Audit tabel:
  - `edom_questions`
  - `edom_responses`
  - `edom_response_answers`
- Pastikan admin bisa mengelola pertanyaan EDOM.
- Pastikan mahasiswa hanya mengisi EDOM untuk kelas yang diambil.
- Pastikan satu mahasiswa hanya bisa submit satu response per jadwal/dosen/periode.
- Pastikan jawaban punya skala jelas, misalnya 1-5.
- Pastikan komentar opsional.
- Pastikan hasil rekap tersedia untuk prodi/pimpinan.
- Pastikan dosen tidak melihat identitas individual jika aturan anonimitas diterapkan.

Acceptance criteria:

- Admin bisa mengelola pertanyaan EDOM.
- Mahasiswa bisa mengisi EDOM.
- Submit duplikat ditolak.
- Prodi/pimpinan bisa melihat rekap.
- Privasi responden aman sesuai aturan.

Test:

- Buat pertanyaan EDOM.
- Login mahasiswa dan submit EDOM.
- Submit ulang, harus ditolak.
- Login prodi/pimpinan dan cek rekap.

## Phase 5.10 - Reminder Terjadwal

Tujuan:

- Sistem bisa membuat reminder untuk event yang punya deadline.

Reminder minimal:

- Deadline pembayaran.
- Deadline PMB.
- Periode KRS dibuka/akan ditutup.
- Deadline tugas LMS.
- EDOM belum diisi.

Task:

- Tentukan mekanisme trigger:
  - manual admin action
  - Vercel Cron
  - Supabase scheduled function
  - script internal
- Buat query target yang aman.
- Pastikan reminder idempotent per periode/event/user.
- Pastikan reminder tidak dikirim ke user nonaktif.

Acceptance criteria:

- Reminder bisa dibuat.
- Reminder tidak spam.
- Target user benar.
- Log eksekusi tersedia.

## Phase 5.11 - UX Hardening

Tujuan:

- Pengalaman pakai untuk role utama lebih rapi.

Task:

- Audit mobile layout dashboard.
- Audit empty state.
- Audit error state.
- Audit loading state.
- Audit form validation messages.
- Audit tabel yang terlalu lebar.
- Audit action destructive agar punya konfirmasi.
- Audit toast feedback.

Area prioritas:

- Topbar notification.
- PMB dashboard.
- Finance dashboard.
- KRS.
- Nilai.
- LMS.
- EDOM.

Acceptance criteria:

- Tidak ada layout pecah di mobile utama.
- Form error jelas.
- Empty state tidak membingungkan.
- Loading state tersedia.
- Aksi delete/restore punya konfirmasi.

## Phase 5.12 - Security Review

Tujuan:

- Fitur lanjutan tidak membuka lubang data.

Checklist:

- User hanya melihat notifikasi sendiri.
- Device token tidak bisa diambil user lain.
- Template hanya bisa dikelola admin.
- Queue hanya diproses server-side.
- FCM secret hanya server-side.
- Mahasiswa hanya mengisi EDOM kelasnya.
- Rekap EDOM mengikuti aturan privasi.
- Reminder tidak mengirim data sensitif ke target salah.

Acceptance criteria:

- Tidak ada data notifikasi lintas user.
- Tidak ada token/secret di client.
- EDOM tidak bocor identitas jika dibuat anonim.
- Semua mutasi punya authorization.

## Gate Wajib Phase 5

Command wajib:

```bash
npm run type-check
npm run lint
npm run build
```

Smoke route:

- `/dashboard/pengaturan/template-notifikasi`
- `/dashboard/pengumuman`
- `/dashboard/akademik/lms`
- `/dashboard/krs`
- `/dashboard/keuangan`
- Route EDOM jika sudah dibuat

Supabase dev check:

- Notification queue terisi saat event.
- Notifikasi hanya terbaca user target.
- EDOM response tersimpan benar.
- Reminder tidak duplikat.
- RLS aktif untuk tabel sensitif.

## Definisi Selesai Phase 5

Phase 5 dianggap selesai jika:

- Template notifikasi bisa dikelola.
- In-app notification berjalan.
- Queue notification berjalan.
- Event PMB, keuangan, akademik, dan LMS membuat notifikasi.
- Push notification siap atau gap-nya terdokumentasi jelas.
- EDOM berjalan end-to-end.
- Reminder utama tersedia.
- UX role utama lebih rapi.
- Security review lolos.
- Type-check, lint, dan build sukses.

Kalau notifikasi bisa terkirim ke user yang salah, Phase 5 belum selesai. Itu bukan notifikasi, itu gosip sistem.
