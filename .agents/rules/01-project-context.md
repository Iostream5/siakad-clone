---
trigger: always_on
---

# Project Context — SIAKAD STAI Al-Ittihad

## Tujuan
Memberikan AI konteks utuh tentang identitas, status, dan batasan teknis project agar tidak salah arah saat coding, debugging, atau refactoring.

---

## 1. Gambaran Umum

SIAKAD STAI Al-Ittihad adalah sistem informasi akademik kampus berbasis web yang mengelola PMB, akademik, keuangan, LMS, penilaian, laporan, notifikasi, dan kontrol akses multi-role dalam satu dashboard terpadu.

| Atribut | Nilai |
|---|---|
| Nama Aplikasi | SIAKAD STAI Al-Ittihad |
| Status | DEV |
| Snapshot Docs | 10 Juni 2026 |
| MCP Target (DEV) | `siakad_dev` |
| MCP Target (Prod) | `siakad` — JANGAN dipakai saat status DEV |
| PRD Aktif | `docs/PRD-SIAKAD.md` |
| Source of Truth | Repo aktual + PRD aktif + migration SQL |

### Stack Final (TIDAK BOLEH DIGANTI tanpa ADR baru)

| Layer | Teknologi | Versi | Catatan |
|---|---|---|---|
| Framework | Next.js | **16.2.4** | App Router. `middleware.ts` sudah **DIHAPUS**, diganti `src/proxy.ts` |
| UI | React | 19.2.4 | `use()`, Suspense boundary |
| Language | TypeScript | Strict | `noImplicitAny`, `strictNullChecks` aktif |
| Styling | Tailwind CSS | v4 | Konfigurasi di CSS, bukan `tailwind.config.js` |
| Komponen | Shadcn UI + Radix UI | Latest | Copy ke `/components/ui` |
| Animasi | Framer Motion | Latest | |
| Form | React Hook Form + Zod | Latest | Validasi wajib semua form |
| Data Fetching | Tanstack Query v5 | Latest | Client-side |
| Backend | Next.js Server Actions + Route Handlers | — | Fullstack monorepo |
| Database | **Supabase PostgreSQL** | — | Bukan SQLite, bukan Prisma |
| Query | Supabase JS Client | Latest | Browser/server/admin client terpisah |
| Auth | **Supabase Auth** | — | Bukan Better Auth, bukan NextAuth |
| Migrations | SQL files di `supabase/migrations/` | — | Jalankan manual/CLI, bernomor urut |
| Storage | Supabase Storage | — | Upload dokumen, foto, berkas PMB |
| Deployment | Vercel | — | |
| Payment | Midtrans + Xendit | — | Phase 2+ |
| Push Notif | Firebase Cloud Messaging | — | Phase 3+ |

---

## 2. Aturan Inti

### 2.1 Jangan Gunakan Stack yang Sudah Diganti

❌ SALAH
```typescript
// middleware.ts — sudah dihapus di Next.js 16
export function middleware(req: NextRequest) { ... }

// Prisma
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Better Auth / NextAuth
import NextAuth from 'next-auth'
```

✅ BENAR
```typescript
// src/proxy.ts di `src/` — route protection Next.js 16
export async function GET(req: Request) { ... }

// Supabase client
import { createServerClient } from '@/supabase/server'
const supabase = createServerClient()
```

Alasan:
- Next.js 16 mengganti `middleware.ts` dengan `src/proxy.ts` sebagai breaking change
- Repo aktual tidak menggunakan Prisma — schema dikelola via SQL migrations
- Auth menggunakan Supabase Auth, bukan library pihak ketiga lain

### 2.2 Jangan Commit Secret ke Git

❌ SALAH
```bash
# .env.local di-commit
SUPABASE_SERVICE_ROLE_KEY=
```

✅ BENAR
```bash
# .env.example — boleh di-commit, tanpa value
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

Alasan: Service role key memberikan akses penuh bypass RLS. Jika bocor ke git, rotasi segera.

### 2.3 Selalu Gunakan MCP yang Sesuai Status

| Status ENV | MCP yang Dipakai |
|---|---|
| DEV | `siakad_dev` |
| Production | `siakad` |

❌ Jangan pakai MCP production saat `STATUS_PROJECT=DEV`.

---

## 3. Workflow Referensi

### Struktur Folder Aktual

```text
src/
  app/                    # Routing dan thin page wrappers
    api/                  # Route Handlers (webhook, API eksternal)
    dashboard/            # Semua halaman dashboard
    login/
    pmb/
  actions/                # Server Actions — boundary mutasi UI ke backend
    auth.ts
    access-control.ts
    pmb.ts
    finance.ts
    krs.ts
    lms.ts
    users.ts
  components/
    layout/               # Sidebar, topbar, breadcrumb
    ui/                   # Shadcn components — jangan modifikasi
  lib/
    admin/                # Query/service helper per domain
    auth.ts
    constants.ts
  modules/                # Komponen UI besar per domain
    dashboard/
    finance/
    krs/
    lms/
    master-data/
    pmb/
    reports/
    settings/
  supabase/
    client.ts             # Browser client
    server.ts             # Server client
    admin.ts              # Admin client — bypass RLS, server-side only
    migrate.ts
    seed.ts
  types/
supabase/migrations/      # SQL migration files bernomor urut
  001_init.sql
  ...
  022_dynamic_menu_builder.sql
docs/
  PRD-SIAKAD.md           # Sumber kebenaran utama
src/proxy.ts                  # Route protection (BUKAN middleware.ts)
```

### Pola Data Flow

```text
UI Component
  → Server Action (src/actions/)
    → Service Helper (src/lib/admin/)
      → Supabase Client
        → PostgreSQL (RLS aktif)
          → Audit Log (setiap mutasi penting)
```

---

## 4. Implementasi

### Supabase Client yang Benar

```typescript
// src/supabase/server.ts — untuk Server Actions dan Server Components
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
}

// src/supabase/admin.ts — HANYA untuk operasi bypass RLS
// JANGAN import di client component
import { createClient } from '@supabase/supabase-js'

export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only
  )
}
```

### Server Action dengan Authorization

```typescript
// src/actions/users.ts
'use server'

import { requireAuthorizedUser } from '@/lib/auth'
import { z } from 'zod'

const UpdateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1),
  role: z.string(),
})

export async function updateUserAction(input: unknown) {
  // 1. Auth check dulu
  const user = await requireAuthorizedUser(['admin'])

  // 2. Validasi input
  const parsed = UpdateUserSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Input tidak valid', details: parsed.error.flatten() }
  }

  // 3. Query database
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('users')
    .update({ full_name: parsed.data.full_name })
    .eq('id', parsed.data.id)

  if (error) return { error: 'Gagal update user' }

  // 4. Audit log
  await logAuditAction({ user, module: 'users', action: 'update', recordId: parsed.data.id })

  return { success: true }
}
```

---

## 5. Security Rules

- `SUPABASE_SERVICE_ROLE_KEY` **hanya** boleh dipakai di `src/supabase/admin.ts` — tidak pernah `NEXT_PUBLIC_`
- Demo auth hanya boleh aktif saat `NODE_ENV !== 'production'`
- RLS wajib aktif untuk: `users`, `user_roles`, `menus`, `settings`, `audit_logs`, `pmb_pendaftaran`, `pmb_pembayaran`, `tagihan`, `pembayaran`, `mahasiswa`, `dosen`, `krs_header`, `nilai_akhir`, `lms_*`, `notification_*`, `edom_*`
- Policy `service_role` harus tersedia di setiap tabel sensitif untuk operasi backend
- Webhook payment wajib validasi signature — jangan proses payload tanpa verifikasi
- Semua Server Action mutasi wajib `requireAuthorizedUser` atau `requireUser`
- Error response tidak boleh expose stack trace atau secret ke client

---

## 6. Anti Pattern

❌ Gunakan `middleware.ts` untuk route protection  
❌ Import `SUPABASE_SERVICE_ROLE_KEY` di client component  
❌ Hardcode role/menu/permission di UI utama  
❌ `select('*')` pada tabel besar tanpa filter  
❌ Lakukan mutasi database tanpa authorization check  
❌ Gunakan Prisma, SQLite, Better Auth, atau NextAuth  
❌ Bypass RLS tanpa alasan teknis yang jelas  
❌ Commit `.env.local` ke git  
❌ Panggil MCP `siakad` saat status adalah DEV  
❌ Buat schema Prisma — gunakan SQL migration files  
❌ Buat folder arsitektur baru (`application/domain/infrastructure`) tanpa keputusan eksplisit  

---

## 7. Checklist AI

Sebelum menghasilkan kode, verifikasi:

- [ ] Apakah menggunakan Supabase client (bukan Prisma)?
- [ ] Apakah menggunakan `src/proxy.ts` (bukan `middleware.ts`)?
- [ ] Apakah auth menggunakan Supabase Auth?
- [ ] Apakah Server Action mutasi memiliki `requireAuthorizedUser`?
- [ ] Apakah input divalidasi dengan Zod?
- [ ] Apakah audit log dipanggil untuk aksi penting?
- [ ] Apakah service role key tidak di-expose ke client?
- [ ] Apakah RLS dipertimbangkan untuk tabel yang diakses?
- [ ] Apakah MCP yang digunakan sesuai status project (DEV = `siakad_dev`)?
- [ ] Apakah mengikuti pola folder yang sudah ada (`actions/ → lib/admin/ → supabase/`)?

---

## 8. Ringkasan

- Stack final: **Next.js 16.2.4, Supabase Auth, Supabase PostgreSQL, Supabase JS Client**
- Route protection: **`src/proxy.ts`** — bukan `middleware.ts`
- Database: **SQL migrations** di `supabase/migrations/` — bukan Prisma, bukan SQLite
- Auth: **Supabase Auth** — bukan Better Auth, bukan NextAuth
- MCP dev: **`siakad_dev`** — jangan pakai `siakad` production saat status DEV
- Secret: **tidak pernah di git**, tidak pernah `NEXT_PUBLIC_` untuk service role key
- Semua mutasi: wajib **authorization + Zod validation + audit log**
- PRD aktif: `docs/PRD-SIAKAD.md` — ini sumber kebenaran tunggal
