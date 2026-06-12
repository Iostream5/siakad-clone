---
description: SOP berpikir AI Agent sebelum menulis satu baris kode. Workflow ini memastikan agent memahami konteks project, stack aktual, batasan arsitektur, dan risiko sebelum memutuskan pendekatan implementasi.
---

# SOP Berpikir AI Agent — SIAKAD STAI Al-Ittihad

## Tujuan

Memastikan AI Agent tidak langsung menulis kode berdasarkan asumsi atau prompt lama yang sudah tidak berlaku. Agent wajib membaca konteks aktual project, memverifikasi stack, memahami batasan, dan merencanakan pendekatan yang aman sebelum eksekusi.

---

## FASE 1: ANALISIS KONTEKS PROJECT

### Langkah-langkah

STEP 1: Baca dan verifikasi stack aktual.

Sebelum apapun, agent harus mengkonfirmasi stack yang sedang dipakai:

- Framework: Next.js **16.2.4** App Router — bukan 15.
- Auth: **Supabase Auth** — bukan Better Auth, bukan NextAuth.
- Database: **Supabase PostgreSQL** — bukan SQLite, bukan Prisma.
- Query layer: **Supabase JS Client** — bukan ORM Prisma.
- Route protection: **`src/proxy.ts`** — bukan `middleware.ts` (breaking change Next.js 16).
- Migrations: **SQL files di `supabase/migrations/`** — bukan Prisma migrate.
- Styling: **Tailwind CSS v4** — konfigurasi di CSS, bukan `tailwind.config.js`.
- Deployment: **Vercel** + **Supabase Cloud**.

STEP 2: Identifikasi status environment saat ini.

- Cek apakah `STATUS_PROJECT` bernilai `DEV` atau production.
- Jika `DEV`: validasi Supabase menggunakan MCP `siakad_dev`.
- Jika production: gunakan MCP `siakad` — jangan campur.
- Cek apakah task menyentuh tabel yang sudah ada di Supabase live atau hanya lokal.

STEP 3: Tentukan phase yang sedang dikerjakan dan batasan scope-nya.

Rujuk `docs/tahapan/TAHAPAN-PHASE-PENGERJAAN.md` dan tentukan:

- Apakah task masuk scope phase aktif?
- Apakah ada dependency yang belum selesai di phase sebelumnya?
- Apakah task ini memerlukan migration baru?

### Checklist

- [ ] Stack dikonfirmasi: Next.js 16, Supabase Auth, Supabase PostgreSQL, Supabase client, `src/proxy.ts`
- [ ] Tidak ada asumsi Prisma, Better Auth, SQLite, atau `middleware.ts`
- [ ] Environment teridentifikasi (DEV / production)
- [ ] Phase aktif diketahui
- [ ] Scope task jelas, tidak keluar batas phase

---

## FASE 2: VERIFIKASI SUMBER KEBENARAN

### Langkah-langkah

STEP 1: Gunakan PRD aktif sebagai referensi utama.

File `docs/PRD-SIAKAD.md` adalah **single source of truth**. Semua prompt lama di folder `prompt aplikasi/` yang bertentangan dengan PRD ini **tidak berlaku**. Jika ada konflik:

- PRD aktif (`docs/PRD-SIAKAD.md`) > `docs/Ringkasan Project.md` > prompt lama.
- Prompt lama hanya berguna sebagai gambaran visi bisnis, bukan panduan teknis.

STEP 2: Pahami perbedaan prompt lama vs kondisi aktual.

| Area | Prompt Lama | Kondisi Aktual |
|---|---|---|
| Next.js | 15 | 16.2.4 |
| Database dev | SQLite | Supabase PostgreSQL |
| ORM | Prisma | Supabase client |
| Auth | Better Auth / NextAuth | Supabase Auth |
| Route protection | `middleware.ts` | `src/proxy.ts` |
| Role naming | `SUPER_ADMIN`, `ADMIN_AKADEMIK` | `admin`, `prodi`, `dosen`, dll |
| Schema management | Prisma schema | SQL migration files |

STEP 3: Baca dokumen phase yang relevan.

Untuk setiap task, baca dokumen detail phase yang sesuai:

- Phase 0: Production safety dan stabilitas dasar.
- Phase 1: `docs/tahapan/DETAIL-PHASE-1-FONDASI-ADMIN.md`
- Phase 2: `docs/tahapan/DETAIL-PHASE-2-PMB-KEUANGAN.md`
- Phase 3: `docs/tahapan/DETAIL-PHASE-3-AKADEMIK-LMS.md`
- Phase 4: `docs/tahapan/DETAIL-PHASE-4-LAPORAN-MONITORING.md`
- Phase 5: `docs/tahapan/DETAIL-PHASE-5-NOTIFIKASI-EDOM-LANJUTAN.md`
- Phase 6: `docs/tahapan/DETAIL-PHASE-6-PRODUCTION-READINESS.md`

### Checklist

- [ ] PRD aktif sudah dibaca dan dipahami
- [ ] Konflik antara prompt lama dan PRD sudah diidentifikasi
- [ ] Perbedaan stack sudah dipahami — tidak ada kontaminasi asumsi lama
- [ ] Dokumen detail phase yang relevan sudah dibaca
- [ ] Acceptance criteria phase aktif sudah diketahui

---

## FASE 3: ANALISIS TASK SPESIFIK

### Langkah-langkah

STEP 1: Pecah task menjadi unit kerja terkecil.

Satu sesi agent = satu fitur kecil yang bisa diverifikasi. Jangan gabungkan beberapa modul besar dalam satu eksekusi. Contoh pemecahan yang benar:

- ❌ "Buat modul PMB lengkap"
- ✅ "Buat Server Action `registerPmbAction` dengan validasi Zod untuk data biodata pendaftar"

STEP 2: Identifikasi file yang akan disentuh.

Sebelum menulis kode, tentukan:

- File yang akan dibuat (baru).
- File yang akan diubah (existing).
- File yang perlu dibaca untuk konteks (jangan diubah).
- Migration SQL jika ada perubahan schema.

Pola folder yang wajib diikuti:

```
src/app/dashboard/...        → Route dan thin page wrapper
src/actions/...              → Server Actions (mutasi data)
src/lib/admin/...            → Query helper dan service per domain
src/modules/...              → UI komponen per fitur besar
src/components/ui/...        → Reusable UI components
src/components/layout/...    → Layout components
src/supabase/...             → Supabase client utilities
supabase/migrations/...      → SQL migration files
```

STEP 3: Identifikasi dependency dan urutan pengerjaan.

Tanyakan:

- Apakah tabel database yang dibutuhkan sudah ada? Jika belum, buat migration dulu.
- Apakah ada tabel induk yang harus ada sebelum tabel turunan?
- Apakah ada Server Action yang bergantung pada helper yang belum dibuat?
- Urutan aman: migration → seed jika perlu → helper/service → Server Action → UI.

### Checklist

- [ ] Task sudah dipecah menjadi unit kecil yang bisa diverifikasi
- [ ] Daftar file yang akan dibuat / diubah sudah jelas
- [ ] Dependency antar file sudah dipetakan
- [ ] Urutan pengerjaan aman sudah ditentukan
- [ ] Tidak ada task yang melompati dependency yang belum ada

---

## FASE 4: ANALISIS RISIKO DAN BATASAN

### Langkah-langkah

STEP 1: Identifikasi risiko keamanan.

Untuk setiap mutasi data, tanyakan:

- Apakah Server Action ini memiliki `requireUser` atau `requireAuthorizedUser`?
- Apakah input sudah divalidasi dengan Zod sebelum menyentuh database?
- Apakah service role Supabase hanya dipakai server-side?
- Apakah ada risk data bocor antar role atau antar user?
- Apakah webhook memvalidasi signature?

STEP 2: Identifikasi risiko data integrity.

- Apakah operasi ini bisa membuat data duplikat? (contoh: generate NIM, payment webhook berulang)
- Apakah soft delete sudah konsisten? (`deleted_at IS NULL` di semua query aktif)
- Apakah foreign key constraint bisa dilanggar oleh urutan operasi yang salah?
- Apakah operasi ini perlu idempotency?

STEP 3: Identifikasi batasan yang tidak boleh dilanggar.

Hal-hal yang **mutlak tidak boleh** dilakukan:

- Memakai `middleware.ts` — gunakan `src/proxy.ts`.
- Memakai Prisma — gunakan Supabase client.
- Memakai Better Auth / NextAuth — gunakan Supabase Auth.
- Menyimpan `SUPABASE_SERVICE_ROLE_KEY` sebagai `NEXT_PUBLIC_*`.
- Hardcode role, menu, atau permission di UI yang seharusnya database-driven.
- Melakukan mutasi database di client component tanpa Server Action.
- Membuat tabel baru tanpa file migration SQL bernomor urut.
- Menulis pseudo-code atau kode tidak lengkap.

### Checklist

- [ ] Risiko keamanan diidentifikasi: auth check, input validation, role check
- [ ] Risiko data integrity diidentifikasi: duplikasi, soft delete, FK constraint
- [ ] Batasan hard (tidak boleh dilanggar) sudah diverifikasi
- [ ] Secret tidak akan bocor ke client
- [ ] Tidak ada bypass RLS yang tidak disengaja

---

## FASE 5: KEPUTUSAN PENDEKATAN

### Langkah-langkah

STEP 1: Tentukan pola implementasi yang sesuai.

Pilih pola yang sudah ada di project, jangan membuat pola baru tanpa alasan kuat:

- Mutasi data → Server Action di `src/actions/` memanggil helper di `src/lib/admin/`
- Query data di server component → gunakan Supabase server client langsung atau via helper
- Query data di client component → gunakan Supabase browser client atau Server Action
- Schema baru → buat file migration SQL di `supabase/migrations/` dengan nomor urut berikutnya
- Validasi form → React Hook Form + Zod schema
- Tabel data → TanStack Table dengan search, sort, pagination

STEP 2: Konfirmasi output yang akan dihasilkan.

Sebelum mulai coding, nyatakan dengan eksplisit:

- File apa yang akan dibuat dan di folder mana.
- File apa yang akan dimodifikasi.
- Apakah perlu migration SQL baru.
- Apakah perlu update seed data.

STEP 3: Tentukan definisi "selesai" untuk task ini.

Task dianggap selesai jika:

- `npm run type-check` sukses tanpa error baru.
- `npm run lint` sukses atau warning-nya dicatat dan bukan dari kode baru.
- `npm run build` sukses.
- Smoke test manual route yang terpengaruh lolos.
- Audit log tercatat jika task menyentuh mutasi data penting.

### Checklist

- [ ] Pola implementasi sudah dipilih dan sesuai existing codebase
- [ ] Output yang akan dihasilkan sudah jelas: file baru / dimodifikasi / migration
- [ ] Definisi "selesai" sudah ditetapkan
- [ ] Tidak ada keputusan teknis yang bertentangan dengan PRD aktif
- [ ] Agent siap masuk ke SOP Eksekusi (`02-sop-eksekusi.md`)

---

## Output yang Diharapkan

Setelah menyelesaikan SOP Berpikir ini, AI Agent harus menghasilkan:

1. **Konfirmasi stack** — pernyataan eksplisit bahwa stack yang dipahami sudah benar (Next.js 16, Supabase, `src/proxy.ts`, SQL migrations).
2. **Ringkasan task** — deskripsi singkat apa yang akan dikerjakan, dipecah menjadi unit kecil.
3. **Daftar file** — file baru yang akan dibuat, file yang akan diubah, file yang hanya dibaca.
4. **Daftar risiko** — risiko keamanan dan data integrity yang sudah diidentifikasi beserta mitigasinya.
5. **Rencana eksekusi** — urutan langkah yang aman sebelum masuk ke `02-sop-eksekusi.md`.

Agent **tidak boleh** langsung menulis kode sebelum fase berpikir ini selesai dan hasilnya dapat diverifikasi.
