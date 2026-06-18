# Audit Fitur, Workflow, Rules, dan PRD SIAKAD

Tanggal audit: 18 Juni 2026  
Status project dari env: DEV  
Target Supabase yang dipakai: `siakad_dev`  
Project ref DEV: `akcslbvwkpbilsywrtkk`

## Verdict Singkat

Project belum bisa dinyatakan "semua fitur berjalan dengan baik" dan belum sepenuhnya sesuai workflow, rules, serta PRD aktif.

Kondisi saat ini cukup layak untuk development dan smoke test internal: type-check lulus, lint lulus dengan warning, build production lulus, halaman publik utama bisa dibuka, dan route dashboard tanpa session redirect ke login.

Namun secara fitur end-to-end masih banyak yang belum terbukti jalan karena data DEV sangat minim, beberapa modul masih placeholder, sebagian dokumen sudah drift dari repo aktual, dan history Git masih pernah menyentuh file env berisi pola secret. Jadi jangan klaim production-ready dulu. Bayinya sudah bisa berdiri, tapi jangan langsung disuruh lari maraton.

## Scope Audit

Yang dicek:

- Struktur repo aktual.
- `docs/PRD-SIAKAD.md`.
- `docs/Ringkasan Project.md`.
- `docs/requirement-fix/*`.
- `.agents/rules/*`.
- `.agents/workflows/*`.
- `.agents/phase/*`.
- Env aktif dan mapping MCP.
- Supabase DEV via MCP `siakad_dev`.
- Script teknis: `type-check`, `lint`, `build`, `audit`.
- Smoke test ringan route publik dan redirect dashboard.
- Audit secret pada tracked files dan history Git.

## Bukti Teknis

### Env dan MCP

- `STATUS_PROJECT=DEV` ditemukan di `env`, `env.local`, dan `.env.local`.
- `NEXT_PUBLIC_SUPABASE_URL` mengarah ke `https://akcslbvwkpbilsywrtkk.supabase.co`.
- Sesuai rules project, validasi live DB dilakukan memakai MCP `siakad_dev`.

### Install dan Gate Lokal

Awalnya `npm run type-check` gagal karena `node_modules` lokal tidak punya `@radix-ui/react-progress`, padahal dependency sudah ada di `package.json` dan `package-lock.json`.

Setelah `npm install`:

| Gate | Hasil |
| --- | --- |
| `npm run type-check` | PASS |
| `npm run lint` | PASS, tetapi ada 264 warning |
| `npm run build` | PASS |
| `npm audit --json` | FAIL, 9 vulnerabilities: 2 low, 4 moderate, 3 high |

Catatan lint:

- Warning paling banyak berasal dari `no-explicit-any`.
- Ada unused variable/import di banyak file.
- Ada warning React Compiler seperti JSX dalam `try/catch`, `setState` dalam effect, dan mutasi `window.location.href`.

Catatan dependency:

- `next@16.2.4` terkena advisory high dan audit menyarankan upgrade ke `16.2.9`.
- `xlsx` punya high vulnerability dan `fixAvailable=false` dari npm audit.
- Ada vulnerability lain pada `ws`, `dompurify`, `postcss`, `js-yaml`, `brace-expansion`, `esbuild`, dan `@babel/core`.

### Build dan Smoke Test Route

`npm run build` sukses dan menghasilkan 59 route.

Smoke test ringan memakai server lokal production di port 3010:

| Target | Hasil |
| --- | --- |
| `/` | 200 |
| `/login` | 200 |
| `/pmb` | 200 |
| `/pmb/daftar` | 200 |
| `/dashboard` tanpa session | 307 ke `/login` |
| GET `/api/payment-gateway/midtrans/finance` | 405 |
| GET `/api/payment-gateway/midtrans/pmb` | 405 |

Ini membuktikan shell aplikasi, halaman publik, dan guard dasar hidup. Ini belum membuktikan login semua role, CRUD semua modul, payment gateway valid, atau workflow akademik end-to-end.

## Bukti Supabase DEV

Query MCP menunjukkan:

- Public base table: 57.
- Public table tanpa RLS: 0.
- Tabel utama seperti `users`, `user_roles`, `menus`, `kampus`, `fakultas`, `program_studi`, `tahun_akademik`, `pmb_pendaftaran`, `tagihan`, `pembayaran`, `jadwal_kuliah`, `krs_header`, `lms_*`, `notification_*`, `edom_*`, dan `webhook_events` tersedia.

Row count penting:

| Tabel | Rows |
| --- | ---: |
| `users` | 1 |
| `kampus` | 1 |
| `fakultas` | 2 |
| `tahun_akademik` | 1 |
| `notification_templates` | 6 |
| `menus` | 0 |
| `user_roles` | 0 |
| `role_menu_permissions` | 0 |
| `user_menu_permissions` | 0 |
| `program_studi` | 0 |
| `dosen` | 0 |
| `mahasiswa` | 0 |
| `pmb_pendaftaran` | 0 |
| `pmb_pembayaran` | 0 |
| `tagihan` | 0 |
| `pembayaran` | 0 |
| `jadwal_kuliah` | 0 |
| `krs_header` | 0 |
| `krs_detail` | 0 |
| `nilai_akhir` | 0 |
| `lms_materi` | 0 |
| `lms_tugas` | 0 |
| `lms_pengumpulan` | 0 |
| `lms_forum_topik` | 0 |
| `notification_queue` | 0 |
| `edom_questions` | 0 |
| `edom_responses` | 0 |
| `webhook_events` | 0 |
| `audit_logs` | 0 |

Kesimpulan DB:

- Schema DEV sudah cukup luas.
- RLS aktif untuk base table.
- Data uji belum cukup untuk membuktikan workflow bisnis.
- Sidebar database belum benar-benar dipakai karena `menus` kosong; kode fallback ke definisi menu hardcoded.

## Status Fitur per Area

| Area | Status Saat Ini | Catatan |
| --- | --- | --- |
| Auth dan route guard | Partial OK | Login page ada, Supabase Auth dipakai, demo fallback hanya non-production. `src/proxy.ts` hanya cek bentuk cookie, security utama tetap harus di server action. |
| Dashboard | Partial OK | Build dan route ada. Dashboard admin memakai sebagian data real, tapi masih ada metric fallback dari constants. |
| Sidebar dan menu access | Partial | Kode mendukung DB `menus`, tetapi DEV `menus` kosong sehingga fallback hardcoded masih jalan. Belum memenuhi acceptance "sidebar dari database". |
| Master data | Partial | Banyak page dan action tersedia. Data DEV belum cukup untuk verifikasi CRUD penuh tiap modul. |
| PMB publik | Partial OK | `/pmb` dan `/pmb/daftar` 200. Namun status PMB open masih hardcoded `true`, bukan dari settings. |
| PMB dashboard | Partial | Tabel dan action ada, tetapi DEV belum punya pendaftar/pembayaran. Belum terbukti daftar -> bayar -> verifikasi -> seleksi -> generate NIM. |
| Keuangan | Partial | Midtrans finance punya signature validation dan idempotency. Namun beberapa setup subtab masih placeholder, dan DEV tidak punya tagihan/pembayaran. |
| Payment gateway | Partial OK | Route webhook ada, GET ditolak 405, service memvalidasi signature. Belum dilakukan test POST payload sandbox valid/invalid karena perlu data/order nyata. |
| KRS | Partial | Page memakai DB dan action, bukan cuma statis. Namun data `mahasiswa`, `jadwal_kuliah`, `krs_*` masih 0. Batas SKS masih hardcoded 24. |
| Nilai/KHS/Transkrip | Partial | Route dan helper ada, tetapi `nilai_akhir` 0 dan belum ada data E2E. |
| LMS | Partial | Route detail, tugas, forum, submission, grading ada. DEV belum punya jadwal/LMS data, jadi belum terbukti jalan end-to-end. |
| Laporan | Partial | Page ada, tetapi data sumber banyak kosong. |
| Notifikasi | Partial | Template ada, preview membaca tabel `notifikasi`, queue 0. FCM/push belum terlihat sebagai fitur real. |
| EDOM | Belum siap | Action masih placeholder. Service membaca `edom_questionnaires`, tetapi tabel DEV yang ada adalah `edom_questions`, `edom_responses`, `edom_response_answers`. UI hanya empty state. |
| Audit log | Partial | Tabel ada dan RLS aktif, tetapi row 0. Belum terbukti semua mutasi penting mencatat audit. |

## Kesesuaian dengan Workflow dan Rules

Yang sudah sesuai:

- Stack repo aktual sesuai rules utama: Next.js 16.2.4, React 19, Supabase PostgreSQL, SQL migration di `supabase/migrations/`, dan `src/proxy.ts`.
- Env DEV diarahkan ke MCP `siakad_dev`.
- CI sudah ada di `.github/workflows/ci.yml` dengan `npm ci`, `type-check`, `lint`, dan `build`.
- Webhook Midtrans di service PMB/finance sudah memvalidasi signature.
- RLS aktif pada base table public DEV.

Yang belum sesuai atau perlu dirapikan:

- `menus` kosong, jadi dynamic sidebar dari database belum terpenuhi.
- PRD masih menyebut tabel `roles`, `permissions`, `role_permissions`, tetapi implementasi aktual memakai `user_roles`, `role_menu_permissions`, dan `user_menu_permissions`.
- PRD mencantumkan TanStack Query, tetapi dependency yang ada adalah `@tanstack/react-table`, bukan `@tanstack/react-query`.
- `docs/Ringkasan Project.md` masih punya potongan struktur lama seperti `src/db`, `migrations`, `migrate.ts`, `seed.ts`, dan `reset.ts`.
- `docs/requirement-fix/00-RINGKASAN-AUDIT.md` sudah basi di beberapa poin, misalnya masih bilang CI/CD belum ada dan forgot/reset password belum ada.
- Beberapa phase docs berisi bahasa sarkas di konten dokumen. Untuk dokumen internal tidak fatal, tetapi jangan dibawa ke copy aplikasi user-facing.
- Banyak Server Action memakai guard, tetapi belum diaudit satu per satu apakah semua mutasi penting sudah `requireAuthorizedUser` dan `logAuditAction`.

## Audit Secret dan Git Safety

Current tracked files:

- Tidak ditemukan value secret real pada tracked source dengan pola umum service-role Supabase, anon key JWT, secret key platform, Midtrans key, Xendit key, atau session secret pada scan tracked files yang relevan.
- `git ls-files` hanya melacak `.env.example` dan `docker.env.example`.
- `.gitignore` sudah mengabaikan `.env*`, `env`, `env.*`, dan `docker.env`.

History Git:

- Pencarian history untuk marker service-role Supabase pada file env masih menemukan commit awal.
- Pencarian history untuk pola secret/JWT-like pada file env dan source juga masih menemukan commit lama.

Kesimpulan secret:

- Working tree sekarang relatif aman dari tracked env real.
- Untuk push ke remote publik atau repo shared yang belum dibersihkan, history masih harus dianggap pernah bocor.
- Pastikan semua key yang pernah muncul sudah di-rotate/revoke, lalu bersihkan history jika repo akan dipush/distribusikan. Jangan percaya "sudah dihapus dari file sekarang" sebagai bukti aman. Itu cuma bersih di halaman depan, gudangnya belum tentu.

## Catatan Risiko Utama

1. History Git masih punya jejak env/secret pattern.
2. Dependency audit punya 3 high vulnerabilities, termasuk `next` dan `xlsx`.
3. Banyak workflow bisnis belum bisa dibuktikan karena data DEV kosong.
4. Dynamic menu belum real DB-driven karena `menus` kosong.
5. EDOM belum jalan end-to-end dan ada mismatch nama tabel.
6. PMB registration open masih hardcoded.
7. Lint masih 264 warning, terutama `any` dan React Compiler rules.
8. Audit log belum terbukti karena `audit_logs` kosong.
9. Dokumen PRD/ringkasan/requirement-fix perlu sinkron ulang dengan repo saat ini.

## Saran Prioritas

### P0 - Wajib sebelum klaim siap demo serius

1. Rotate semua secret yang pernah masuk history, lalu bersihkan history Git sebelum push publik/shared.
2. Upgrade `next` ke versi patched yang kompatibel, minimal sesuai saran npm audit.
3. Buat keputusan untuk `xlsx`: upgrade/replacement/mitigasi karena npm audit tidak punya fix otomatis.
4. Seed DEV minimal untuk test: admin, prodi, dosen, mahasiswa, program studi, mata kuliah, jadwal, tagihan, PMB sample, KRS sample, LMS sample.
5. Isi `menus` dari fallback/menuDefinitions agar sidebar benar-benar database-driven.
6. Fix EDOM: pilih kontrak final antara `edom_questionnaires` atau `edom_questions`, lalu samakan migration, service, action, dan UI.
7. Pindahkan status PMB open dari hardcoded `true` ke `settings`.

### P1 - Wajib sebelum production readiness

1. Audit semua Server Action mutasi: auth check, Zod validation, audit log, dan error response.
2. Kurangi lint warning bertahap, mulai dari unused variables, React Compiler warnings, lalu `any`.
3. Jalankan smoke test manual per role sesuai `docs/CHECKLIST-TEST-PAGE-SIAKAD-CLONE.md`.
4. Tambahkan script smoke kecil untuk route publik, redirect dashboard, dan webhook invalid signature.
5. Sinkronkan `docs/PRD-SIAKAD.md`, `docs/Ringkasan Project.md`, dan `docs/requirement-fix/*` dengan repo aktual.

### P2 - Setelah flow utama stabil

1. Lengkapi import/export master data yang belum merata.
2. Lengkapi laporan dengan data real dan export PDF/Excel.
3. Lengkapi notification queue dan in-app notification penuh.
4. Siapkan FCM hanya jika kebutuhan real sudah jelas.
5. Tambahkan monitoring, backup, restore drill, dan runbook deployment.

## Kesimpulan Akhir

Project ini sudah punya fondasi yang lumayan hidup: struktur Next/Supabase benar, build hijau, RLS aktif, route utama terbentuk, webhook sudah punya validasi signature, dan CI sudah tersedia.

Tetapi jawaban untuk pertanyaan "apakah semua fitur sudah berjalan dengan baik?" adalah: belum. Banyak fitur sudah ada sebagai halaman/kode/schema, tetapi belum terbukti end-to-end karena data DEV kosong, beberapa modul masih placeholder, dan dokumen belum sepenuhnya sinkron dengan implementasi.

Status paling jujur saat ini: DEV baseline cukup baik untuk lanjut implementasi dan smoke test terarah, belum production-ready, belum semua workflow/PRD terpenuhi.
