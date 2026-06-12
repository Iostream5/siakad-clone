---
trigger: always_on
---

# AI Agent Rules — Index

## Tujuan
Daftar semua file rules yang tersedia di folder ini. Setiap file adalah source of truth untuk area spesifik project SIAKAD STAI Al-Ittihad.

---

## Daftar Rules

| File | Area | Kapan Relevan |
|---|---|---|
| `01-project-context.md` | Stack, arsitektur, identitas project | **Selalu** — baca pertama kali |
| `02-database-schema.md` | Supabase PostgreSQL, migration, RLS, query | Saat menulis query, migration, atau schema |
| `03-auth-rbac.md` | Supabase Auth, session, role, permission | Saat mengerjakan auth, login, route protection, akses menu |
| `04-ui-components.md` | Form, tabel, modal, import/export, state | Saat membuat halaman atau komponen UI |
| `05-business-modules.md` | PMB, Keuangan, Akademik, LMS — alur bisnis | Saat mengerjakan modul bisnis |
| `06-audit-security.md` | Audit log, validasi, keamanan, webhook | Saat menulis Server Action atau Route Handler |
| `07-production-deployment.md` | CI/CD, Vercel, backup, smoke test | Saat mempersiapkan deployment atau production |
| `08-coding-standards.md` | TypeScript, naming, pattern, standar kode | Saat menulis kode apa pun |

---

## Urutan Baca yang Disarankan

Untuk task baru, AI harus internalisasi urutan berikut:

```text
01 (Project Context)
  → 08 (Coding Standards)    ← berlaku untuk semua kode
  → 02 (Database)            ← jika menyentuh database/schema
  → 03 (Auth/RBAC)           ← jika menyentuh auth atau akses
  → 06 (Audit/Security)      ← jika menulis Server Action atau webhook
  → 04 (UI)                  ← jika membuat komponen atau halaman
  → 05 (Business Modules)    ← jika mengerjakan PMB/Keuangan/Akademik/LMS
  → 07 (Production)          ← jika mempersiapkan deploy
```

---

## Quick Reference — Hal yang Paling Sering Dilupakan

1. **`src/proxy.ts`** bukan `middleware.ts` — route protection Next.js 16
2. **Supabase Auth** bukan Better Auth/NextAuth
3. **SQL migrations** bukan Prisma schema
4. **`requireAuthorizedUser`** di setiap Server Action mutasi
5. **Zod validation** untuk semua input form dan Server Action
6. **`logAuditAction`** setelah setiap mutasi penting berhasil
7. **`deleted_at IS NULL`** di setiap query tabel dengan soft delete
8. **Admin client** hanya server-side — tidak pernah di Client Component
9. **Demo auth** nonaktif di `NODE_ENV === 'production'`
10. **Webhook** wajib validasi signature + idempotency

---

## Status Project

- **Environment aktif:** DEV
- **MCP untuk validasi live:** `siakad_dev`
- **MCP production:** `siakad` — JANGAN dipakai saat status DEV
- **PRD aktif:** `docs/PRD-SIAKAD.md`
- **Phase aktif:** Phase 1 (Fondasi Admin) → Phase 2 (PMB & Keuangan)
- **Next.js version:** 16.2.4

---

## Hal yang Tidak Boleh Dilakukan (Summary)

❌ Gunakan `middleware.ts`  
❌ Gunakan Prisma  
❌ Gunakan Better Auth / NextAuth  
❌ Gunakan SQLite  
❌ `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`  
❌ Demo auth di production  
❌ Server Action tanpa auth check  
❌ Form tanpa Zod validation  
❌ Query tanpa filter `deleted_at IS NULL`  
❌ `SELECT *` tanpa pagination  
❌ Webhook tanpa signature validation  
❌ Hapus `audit_logs` dari UI  
❌ Hardcode role/menu/permission di UI  
❌ `any` type sembarangan  
❌ Commit `.env.local` ke git  
❌ Deploy ke production tanpa backup database  
❌ Panggil MCP `siakad` saat status project DEV  
