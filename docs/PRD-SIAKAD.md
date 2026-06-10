# PRD SIAKAD STAI Al-Ittihad
## Architecture Decision Record — Stack Final — Phase 1 Roadmap

> **Versi:** 2.0 (Final Stack)
> **Tanggal:** Juni 2026
> **Status:** AKTIF — Gunakan dokumen ini sebagai referensi tunggal
> **Pengganti:** PRD v1.0 dan semua prompt lama yang bertentangan

---

> ⚠️ **PERINGATAN:** Dokumen ini adalah *single source of truth*. Semua prompt lama yang menyebut Prisma, SQLite, Better Auth, atau Next.js 15 dianggap **TIDAK BERLAKU** dan harus disesuaikan dengan dokumen ini sebelum digunakan.

---

## Daftar Isi

1. [Ringkasan Produk](#1-ringkasan-produk)
2. [Stack Teknologi Final](#2-stack-teknologi-final)
3. [Breaking Changes Next.js 16](#3-breaking-changes-nextjs-16)
4. [Sistem Role & Permission](#4-sistem-role--permission)
5. [Database Design](#5-database-design)
6. [Security Requirements](#6-security-requirements)
7. [Roadmap Phase](#7-roadmap-phase)
8. [Struktur Folder](#8-struktur-folder)
9. [Acceptance Criteria Phase 1](#9-acceptance-criteria-phase-1)
10. [Aturan Vibe Coding](#10-aturan-vibe-coding)
11. [Gap dari Prompt Lama & Keputusan Final](#11-gap-dari-prompt-lama--keputusan-final)

---

## 1. Ringkasan Produk

SIAKAD STAI Al-Ittihad adalah sistem informasi akademik kampus berbasis web yang mengelola proses akademik, PMB, keuangan, LMS, penilaian, laporan, dan kontrol akses multi-role dalam satu dashboard terpadu.

**Masalah yang diselesaikan:**
- Data akademik tersebar dan sulit dilacak
- Proses pembayaran, KRS, nilai, dan PMB rawan tidak sinkron
- Role dan akses menu sulit dikelola jika hardcoded
- Aktivitas penting sulit diaudit
- Dashboard kampus butuh satu sumber data yang rapi

---

## 2. Stack Teknologi Final

> ✅ Stack di bawah ini sudah **FINAL** dan tidak boleh diubah tanpa membuat ADR baru. Gunakan stack ini sebagai konteks di setiap prompt vibe coding.

### 2.1 Frontend

| Layer | Teknologi | Versi | Catatan |
|---|---|---|---|
| Framework | Next.js | 16.2.4 | App Router. `middleware.ts` sudah diganti `proxy.ts` |
| UI Library | React | 19.2.4 | Gunakan fitur terbaru: `use()`, Suspense boundary |
| Language | TypeScript | Strict mode | `noImplicitAny`, `strictNullChecks` wajib aktif |
| Styling | Tailwind CSS | v4 | Konfigurasi di CSS, bukan `tailwind.config.js` |
| Komponen UI | Shadcn UI + Radix UI | Latest | Komponen di-copy ke `/components/ui` |
| Animasi | Framer Motion | Latest | Untuk transisi halaman dan micro-interaction |
| Form | React Hook Form + Zod | Latest | Validasi wajib di semua form |
| State/Data | Tanstack Query | v5 | Untuk data fetching dan cache client-side |

### 2.2 Backend & Database

| Layer | Teknologi | Catatan |
|---|---|---|
| Backend | Next.js Server Actions + Route Handlers | Fullstack dalam satu project |
| Database | Supabase PostgreSQL | Bukan SQLite. Bukan Prisma. Raw SQL + Supabase client |
| ORM / Query | Supabase JS Client (`@supabase/supabase-js`) | Browser, server, dan admin client terpisah |
| Auth | **Supabase Auth** | Bukan Better Auth. Bukan NextAuth. Supabase Auth saja |
| Migrations | SQL files di folder `/migrations` | Jalankan manual atau via Supabase CLI |
| Storage | Supabase Storage | Untuk upload dokumen, foto, berkas PMB |
| Realtime | Supabase Realtime (opsional) | Untuk notifikasi in-app jika diperlukan |

### 2.3 Infrastruktur & Deployment

| Layer | Teknologi | Catatan |
|---|---|---|
| Hosting | Vercel | Deploy otomatis dari GitHub main branch |
| Database Hosting | Supabase Cloud | Project terpisah untuk dev dan production |
| CI/CD | GitHub Actions | Lint, typecheck, build check sebelum merge |
| Notifikasi Push | Firebase Cloud Messaging (FCM) | Untuk Phase 3+ |
| Payment Gateway | Midtrans + Xendit | Untuk Phase 2+ |
| Monitoring | Vercel Analytics + Supabase Dashboard | Untuk production |

---

## 3. Breaking Changes Next.js 16

> 🚨 Next.js 16 memperkenalkan beberapa perubahan yang **BREAKING** dari versi 15. Semua kode dan prompt harus memperhatikan hal ini.

| Perubahan | Next.js 15 (Lama) | Next.js 16 (Aktual) | Impact |
|---|---|---|---|
| Route Protection | `middleware.ts` | `proxy.ts` | **BREAKING — harus migrasi** |
| Caching | Implicit / otomatis | Explicit via Cache Components | Perubahan perilaku fetch |
| Bundler | Webpack (default) | Turbopack (default) | Konfigurasi webpack mungkin tidak berlaku |
| PPR | `experimental.ppr` flag | Cache Components API baru | Flag lama dihapus |
| Dev Tools | — | DevTools MCP tersedia | Fitur baru, opsional |

> 🚨 **PENTING:** Semua prompt lama yang menyebut `middleware.ts` untuk route protection **harus diganti** menjadi `proxy.ts`. Ini adalah perubahan terbesar dari Next.js 16.

---

## 4. Sistem Role & Permission

### 4.1 Role Default

| Role | Kode | Deskripsi | Dashboard |
|---|---|---|---|
| Admin | `admin` | Mengelola master data, user, PMB, dan konfigurasi | Phase 1 |
| Prodi | `prodi` | Mengawasi akademik program studi | Phase 1 (partial) |
| Dosen | `dosen` | Mengelola kelas, LMS, nilai | Phase 2 |
| Mahasiswa | `mahasiswa` | KRS, nilai, tagihan, LMS | Phase 2 |
| Calon Mahasiswa | `calon_mahasiswa` | Alur PMB dan status seleksi | Phase 2 |
| Keuangan | `keuangan` | Tagihan, pembayaran, arus kas | Phase 2 |
| Staff | `staff` | Operasional data dan pengumuman | Phase 2 |
| Pimpinan | `pimpinan` | Ringkasan dan laporan | Phase 3 |
| Bendahara | `bendahara` | Proses keuangan sesuai permission | Phase 3 |

### 4.2 Format Permission

Format permission yang digunakan: **`module.action`**

| Module | Action yang Tersedia |
|---|---|
| `users` | `create, read, update, delete, restore, import, export` |
| `roles` | `create, read, update, delete, manage` |
| `permissions` | `create, read, update, delete, manage` |
| `menus` | `create, read, update, delete, manage` |
| `settings` | `read, manage` |
| `audit_logs` | `read, export` |
| `campuses` | `create, read, update, delete, restore, import, export` |
| `faculties` | `create, read, update, delete, restore, import, export` |
| `departments` | `create, read, update, delete, restore, import, export` |
| `classrooms` | `create, read, update, delete, restore, import, export` |
| `class_groups` | `create, read, update, delete, restore, import, export` |
| `academic_terms` | `create, read, update, delete, restore` |
| `curriculums` | `create, read, update, delete, restore, import, export` |
| `pmb` | `create, read, update, delete, approve, verify, export` |
| `academic` | `create, read, update, delete, approve, export` |
| `finance` | `create, read, update, delete, approve, export` |
| `lms` | `create, read, update, delete, manage` |
| `edom` | `read, manage, export` |
| `notification` | `create, read, manage` |

---

## 5. Database Design

> ℹ️ Database menggunakan **Supabase PostgreSQL**. **TIDAK** menggunakan Prisma atau SQLite. Semua schema ditulis sebagai SQL migration files di folder `/migrations`.

### 5.1 Konvensi Penamaan

| Aturan | Contoh Benar | Contoh Salah |
|---|---|---|
| Nama tabel: `snake_case`, plural | `user_roles`, `audit_logs` | `UserRoles`, `userRole` |
| Nama kolom: `snake_case` | `created_at`, `deleted_at` | `createdAt`, `DeletedAt` |
| Primary key: `id` (UUID) | `id UUID DEFAULT gen_random_uuid()` | `user_id`, `userId` |
| Foreign key: `{table}_id` | `user_id`, `role_id`, `faculty_id` | `userId`, `roleID` |
| Soft delete: `deleted_at` | `deleted_at TIMESTAMPTZ NULL` | `is_deleted`, `isActive` |
| Timestamp: `timestamptz` | `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` | `TIMESTAMP` tanpa timezone |

### 5.2 Tabel Phase 1 (Wajib Ada)

| Tabel | Modul | Soft Delete | Keterangan |
|---|---|---|---|
| `users` | Auth | Ya | Tabel user utama, terhubung ke Supabase Auth |
| `user_profiles` | Auth | Tidak | Data profil tambahan, 1:1 dengan users |
| `roles` | RBAC | Ya | Role dinamis |
| `permissions` | RBAC | Tidak | Daftar permission format `module.action` |
| `role_permissions` | RBAC | Tidak | Relasi many-to-many role dan permission |
| `user_roles` | RBAC | Tidak | Relasi many-to-many user dan role |
| `menus` | Menu Builder | Ya | Nested menu dinamis |
| `menu_permissions` | Menu Builder | Tidak | Relasi menu dan permission |
| `audit_logs` | System | **Tidak** | Log bersifat permanen, tidak boleh dihapus |
| `settings` | System | Tidak | Key-value settings |
| `notification_templates` | Notifikasi | Ya | Template notifikasi |
| `campuses` | Master | Ya | Data kampus |
| `faculties` | Master | Ya | Fakultas, FK ke `campuses` |
| `departments` | Master | Ya | Program studi, FK ke `faculties` |
| `classrooms` | Master | Ya | Ruangan |
| `class_groups` | Master | Ya | Kelas / kelompok belajar |
| `academic_terms` | Master | Ya | Tahun akademik dan semester |
| `curriculums` | Master | Ya | Kurikulum per program studi |

### 5.3 Kolom Standar Wajib

Setiap tabel bisnis **WAJIB** memiliki kolom berikut:

```sql
id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
deleted_at  TIMESTAMPTZ NULL,                    -- NULL = aktif, isi = soft deleted
created_by  UUID        NULL REFERENCES users(id),
updated_by  UUID        NULL REFERENCES users(id)
```

### 5.4 Tabel Skeleton untuk Modul Mendatang

Siapkan migration kosong atau skeleton untuk modul berikut agar struktur siap dikembangkan:

```
students, lecturers
pmb_registrations, pmb_documents, pmb_payments
billing_types, invoices, invoice_items, payments, installments
courses, course_prerequisites
schedules, krs_headers, krs_details
grades, transcripts
lms_materials, lms_assignments, lms_submissions, lms_forums
edom_questionnaires, edom_responses
```

---

## 6. Security Requirements

> 🚨 Semua Server Action yang melakukan mutasi data **WAJIB** memiliki authorization server-side. `proxy.ts` hanya boleh digunakan sebagai UX redirect, bukan sebagai security boundary utama.

### 6.1 Rules Wajib

- Demo auth / akun demo **TIDAK BOLEH** aktif di production
- Service role key Supabase hanya boleh dipakai server-side, tidak pernah di client
- Setiap Server Action mutasi wajib validasi input dengan Zod **DAN** cek role/permission
- Password tidak boleh disimpan plaintext (Supabase Auth sudah handle ini)
- ENV secrets tidak boleh masuk git (`.env.local` tidak di-commit)
- Webhook payment gateway wajib validasi signature, bukan hanya cek payload
- Supabase RLS (Row Level Security) **HARUS** diaktifkan untuk tabel sensitif

### 6.2 Supabase Client Strategy

| Client Type | File | Kapan Digunakan |
|---|---|---|
| Browser Client | `lib/supabase/client.ts` | Client Components, tidak untuk operasi sensitif |
| Server Client | `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers |
| Admin Client | `lib/supabase/admin.ts` | Hanya untuk operasi yang butuh bypass RLS |

### 6.3 Environment Variables

```bash
# .env.example — commit ke git
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-side only, tidak pernah NEXT_PUBLIC_
NEXT_PUBLIC_APP_URL=
```

```bash
# .env.local — TIDAK di-commit
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 7. Roadmap Phase

### Phase 0 — Production Safety *(Sekarang, sebelum lanjut apapun)*

> 🚨 Selesaikan ini sebelum lanjut ke Phase 1. Tanpa fondasi yang aman, semua yang dibangun di atasnya berisiko.

- [ ] Nonaktifkan demo auth di production environment
- [ ] Pastikan env secrets tidak masuk git
- [ ] Audit semua Server Action — pastikan ada authorization check
- [ ] Ganti semua `middleware.ts` menjadi `proxy.ts` (breaking change Next.js 16)
- [ ] Pasang husky pre-commit: `npm run lint` + `npx tsc --noEmit` harus hijau
- [ ] Verifikasi `npm run build` berhasil tanpa error
- [ ] Aktifkan RLS di Supabase untuk tabel sensitif

### Phase 1 — Fondasi Admin

| Fitur | Priority | Status Target |
|---|---|---|
| Login (email/username) via Supabase Auth | P0 | Wajib selesai |
| Session management dan route protection via `proxy.ts` | P0 | Wajib selesai |
| Dynamic RBAC (roles, permissions, role_permissions) | P0 | Wajib selesai |
| Dynamic sidebar dari database (menus table) | P0 | Wajib selesai |
| CRUD Users dengan search, filter, pagination | P1 | Wajib selesai |
| CRUD Roles & Permissions | P1 | Wajib selesai |
| CRUD Menu Builder (nested, drag-and-drop sortable) | P1 | Wajib selesai |
| CRUD Master Akademik: Kampus, Fakultas, Prodi | P1 | Wajib selesai |
| CRUD Master Akademik: Ruangan, Kelas, Tahun Akademik, Kurikulum | P1 | Wajib selesai |
| Import/Export Excel untuk semua master data | P2 | Wajib selesai |
| Soft delete, restore, hapus permanen | P2 | Wajib selesai |
| Audit Log untuk semua aksi penting | P1 | Wajib selesai |
| Dashboard admin dengan widget statistik | P2 | Wajib selesai |
| `npm run build` hijau | P0 | **Gate sebelum Phase 2** |

### Phase 2 — PMB & Keuangan

- Workflow PMB: pendaftaran online, verifikasi, generate NIM
- Master biaya dan generate tagihan bulk
- Integrasi payment gateway: Midtrans dan Xendit
- Webhook payment dengan validasi signature
- Dashboard mahasiswa dan calon mahasiswa
- Sinkronisasi status mahasiswa dari pembayaran

### Phase 3 — Akademik & LMS

- KRS, KHS, Transkrip dengan validasi lengkap
- Jadwal kuliah dan kalender akademik
- LMS: materi, tugas, submission, forum, grading
- Laporan akademik untuk prodi dan pimpinan

### Phase 4 — Modul Lanjutan

- EDOM (Evaluasi Dosen Oleh Mahasiswa)
- Firebase Cloud Messaging untuk notifikasi push
- Monitoring dan alerting production
- Multi-tenant production hardening

---

## 8. Struktur Folder

> ℹ️ Gunakan struktur folder ini sebagai konteks di setiap prompt. Jangan buat folder baru di luar struktur ini tanpa diskusi arsitektur.

```
/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # login, forgot-password, reset-password
│   │   ├── (dashboard)/             # semua halaman dashboard per role
│   │   │   ├── admin/
│   │   │   ├── dosen/
│   │   │   └── mahasiswa/
│   │   ├── api/                     # Route Handlers (webhook, API eksternal)
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/                      # Shadcn components (jangan dimodifikasi)
│   │   └── shared/                  # Komponen reusable custom
│   │       ├── DataTable.tsx
│   │       ├── Modal.tsx
│   │       ├── PageHeader.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client
│   │   │   ├── server.ts            # Server client
│   │   │   └── admin.ts             # Admin client (bypass RLS)
│   │   ├── validations/             # Zod schemas per modul
│   │   └── utils/                   # Helper functions umum
│   │
│   ├── modules/                     # Logic per modul
│   │   ├── auth/
│   │   │   ├── actions.ts           # Server Actions
│   │   │   ├── queries.ts           # Database queries
│   │   │   └── types.ts
│   │   ├── users/
│   │   ├── roles/
│   │   ├── permissions/
│   │   ├── menus/
│   │   ├── master/
│   │   │   ├── campuses/
│   │   │   ├── faculties/
│   │   │   └── departments/
│   │   └── audit-logs/
│   │
│   ├── hooks/                       # Custom React hooks
│   └── types/                       # TypeScript types global & database types
│
├── supabase/migrations/                      # SQL migration files (bernomor urut)
│   ├── 001_initial_schema.sql
│   ├── 002_rbac.sql
│   ├── 003_menus.sql
│   └── ...
│
├── scripts/                         # Seed scripts dan utility scripts
│   └── seed.ts
│
├── docs/                            # PRD, ADR, dokumentasi teknis
│   └── PRD-SIAKAD.md                # File ini
│
├── proxy.ts                         # Route protection (bukan middleware.ts)
├── .env.example                     # Di-commit ke git
├── .env.local                       # TIDAK di-commit
└── package.json
```

---

## 9. Acceptance Criteria Phase 1

Project dianggap selesai Phase 1 jika **semua** kriteria berikut terpenuhi:

| # | Kriteria | Cara Verifikasi |
|---|---|---|
| 1 | `npm install` berhasil tanpa error | Jalankan di terminal bersih |
| 2 | `npx tsc --noEmit` berhasil (0 error) | Jalankan di terminal |
| 3 | `npm run lint` berhasil (0 error) | Jalankan di terminal |
| 4 | `npm run build` berhasil | Jalankan di terminal |
| 5 | Admin dapat login via Supabase Auth | Test manual di browser |
| 6 | Dashboard admin tampil dengan sidebar dari database | Test manual |
| 7 | CRUD Users berfungsi dengan search, filter, pagination | Test manual |
| 8 | CRUD Roles & Permissions berfungsi | Test manual |
| 9 | CRUD Menu Builder berfungsi (nested menu) | Test manual |
| 10 | CRUD semua Master Akademik berfungsi | Test manual |
| 11 | Import/Export Excel berfungsi untuk master data | Test dengan file contoh |
| 12 | Soft delete, restore, dan hapus permanen berfungsi | Test manual |
| 13 | Audit log tercatat untuk login, CRUD, dan aksi penting | Cek tabel `audit_logs` |
| 14 | Demo auth **TIDAK** aktif di production | Cek environment production |
| 15 | Tidak ada `.env.local` di git history | `git log --all -- .env.local` |
| 16 | `proxy.ts` digunakan (bukan `middleware.ts`) | Cek file di root project |
| 17 | RLS aktif di Supabase untuk tabel sensitif | Cek Supabase dashboard |

---

## 10. Aturan Vibe Coding

> ⚠️ Baca bagian ini sebelum memulai sesi vibe coding apapun.

### 10.1 Konteks Wajib di Setiap Prompt

Setiap prompt ke AI **harus** menyertakan:

- Stack yang digunakan (Next.js 16, Supabase, TypeScript strict)
- File yang relevan dengan task (paste isi file, bukan path saja)
- Apa yang sudah ada (jangan minta generate ulang yang sudah ada)
- Output yang diharapkan (file apa, di folder mana)

### 10.2 Template Prompt Vibe Coding

Gunakan template ini setiap memulai sesi baru:

```
Stack:
- Next.js 16.2.4 App Router
- Supabase Auth (bukan Better Auth / NextAuth)
- Supabase PostgreSQL + Supabase JS Client (bukan Prisma / SQLite)
- TypeScript strict mode
- Tailwind CSS v4
- Shadcn UI + Radix UI
- Server Actions untuk mutasi data
- proxy.ts untuk route protection (bukan middleware.ts)

Context file yang relevan:
[paste isi file di sini]

Task:
[deskripsi task yang spesifik dan kecil]

Output yang diharapkan:
[nama file dan folder tujuan]
```

### 10.3 Rules Kode

- TypeScript strict mode — tidak boleh ada `any` yang tidak disengaja
- Semua form wajib Zod validation
- Semua tabel wajib pagination, search, sorting
- Semua Server Action mutasi wajib authorization check di server-side
- Tidak boleh hardcode role/menu/permission di UI
- Satu prompt = satu fitur kecil, bukan satu modul besar sekaligus
- Kode yang di-generate wajib di-review sebelum commit

### 10.4 Yang TIDAK Boleh Dilakukan

| ❌ Jangan | ✅ Gantinya |
|---|---|
| Gunakan `middleware.ts` | Gunakan `proxy.ts` (Next.js 16) |
| Gunakan Prisma | Gunakan Supabase client |
| Gunakan Better Auth / NextAuth | Gunakan Supabase Auth |
| Hardcode kredensial di kode | Gunakan environment variables |
| Pakai `localStorage` untuk data sensitif | Gunakan Supabase session |
| Skip typecheck sebelum commit | Jalankan `npx tsc --noEmit` |
| Generate satu modul besar sekaligus | Pecah menjadi task kecil |
| Gunakan `NEXT_PUBLIC_` untuk secret key | Server-only env tanpa prefix |

---

## 11. Gap dari Prompt Lama & Keputusan Final

| Item | Prompt Lama | Keputusan Final | Alasan |
|---|---|---|---|
| Framework version | Next.js 15 | **Next.js 16.2.4** | Repo aktual sudah di v16 |
| Auth | Better Auth / NextAuth | **Supabase Auth** | Repo aktual sudah pakai Supabase |
| ORM | Prisma | **Supabase client langsung** | Repo aktual tidak menggunakan Prisma |
| Database dev | SQLite | **Supabase PostgreSQL** | Tidak ada migrasi SQLite ke Postgres |
| Route protection | `middleware.ts` | **`proxy.ts`** | Breaking change Next.js 16 |
| Migration | Prisma schema + migrate | **SQL files di `/migrations`** | Sesuai pola Supabase |
| Storage | Local (dev) / Supabase (prod) | **Supabase Storage selalu** | Konsistensi dev-prod |
| Role naming | `SUPER_ADMIN`, `ADMIN_AKADEMIK`, dll | **`admin`, `prodi`, `dosen`, dll** | Sesuai repo aktual |
| Multi-tenant | Full multi-tenant Phase 1 | **Seed 1 tenant, siapkan struktur** | Hindari over-engineering Phase 1 |
| Caching | Implicit / fetch otomatis | **Explicit Cache Components** | Breaking change Next.js 16 |

---

## Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | Awal project | Dokumen awal, stack belum final |
| 2.0 | Juni 2026 | Stack final: Next.js 16, Supabase Auth, Supabase client. Hapus Prisma & Better Auth. Tambah breaking changes Next.js 16. |

---

> 📌 **Catatan:** Dokumen ini wajib diupdate setiap ada perubahan keputusan arsitektur. Simpan di `/docs/PRD-SIAKAD.md` dan commit ke repository. Semua anggota tim dan AI assistant harus menggunakan versi terbaru dokumen ini.