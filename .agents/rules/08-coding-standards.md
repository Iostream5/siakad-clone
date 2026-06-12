---
trigger: always_on
---

# Coding Standards & TypeScript Rules

## Tujuan
Memastikan kode yang dihasilkan AI bersih, konsisten, type-safe, dan mudah dipelihara — mengikuti standar yang sudah ada di project ini.

---

## 1. Gambaran Umum

### Prinsip Utama

| Prinsip | Implementasi |
|---|---|
| TypeScript Strict | `noImplicitAny`, `strictNullChecks` aktif — tidak ada `any` sembarangan |
| Satu task = satu file | Jangan gabungkan logika berbeda dalam satu file besar |
| Repository pattern | Akses database di `src/lib/admin/`, bukan langsung di komponen atau action |
| Server Actions untuk mutasi | Semua create/update/delete via Server Actions |
| Reusable components | Gunakan yang sudah ada sebelum buat baru |
| No magic numbers | Semua konstanta punya nama yang jelas |

---

## 2. Aturan Inti

### 2.1 TypeScript Strict — Tidak Ada `any` Sembarangan

✅ BENAR
```typescript
// Tipe eksplisit
interface FakultasRow {
  id: string
  kode: string
  nama: string
  dekan: string | null
  is_active: boolean
  created_at: string
  deleted_at: string | null
}

// Union type untuk status
type StatusMahasiswa = 'CALON' | 'AKTIF' | 'NON-AKTIF' | 'CUTI' | 'LULUS' | 'DO'

// Generic untuk response
interface ActionResult<T = undefined> {
  success?: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}
```

❌ SALAH
```typescript
// any tersebar di mana-mana
function updateData(data: any) {
  // tidak tahu apa isinya
}

const result: any = await fetchData()
```

### 2.2 Server Actions — Format Standar

✅ BENAR
```typescript
'use server'

// Selalu export named function, bukan default
export async function createFakultasAction(
  input: unknown // unknown, lalu divalidasi Zod
): Promise<ActionResult<{ id: string }>> {

  // 1. Auth
  const user = await requireAuthorizedUser(['Admin'])

  // 2. Validasi
  const parsed = CreateFakultasSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Input tidak valid', fieldErrors: parsed.error.flatten().fieldErrors }
  }

  // 3. Database
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('fakultas')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) {
    console.error('[createFakultasAction]', error.message)
    return { error: 'Gagal menyimpan data' }
  }

  // 4. Audit
  await logAuditAction({
    userId: user.id,
    module: 'master_data',
    action: 'INSERT',
    tableName: 'fakultas',
    recordId: data.id,
    newData: parsed.data,
  })

  return { success: true, data: { id: data.id } }
}
```

### 2.3 Query Helper — Repository Pattern

✅ BENAR
```typescript
// src/lib/admin/fakultas.ts — query helper, bukan logika bisnis besar

export interface FakultasListParams {
  search?: string
  page?: number
  pageSize?: number
  isActive?: boolean
}

export async function getFakultasList(params: FakultasListParams = {}) {
  const { search = '', page = 1, pageSize = 10, isActive } = params
  const offset = (page - 1) * pageSize

  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('fakultas')
    .select('id, kode, nama, dekan, is_active, created_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('nama', { ascending: true })

  if (search) {
    query = query.or(`nama.ilike.%${search}%,kode.ilike.%${search}%`)
  }

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive)
  }

  const { data, error, count } = await query.range(offset, offset + pageSize - 1)

  if (error) {
    console.error('[getFakultasList]', error.message)
    return { data: [], count: 0, error: error.message }
  }

  return { data: data ?? [], count: count ?? 0 }
}
```

### 2.4 Naming Convention

| Jenis | Convention | Contoh |
|---|---|---|
| File komponen | `kebab-case.tsx` | `fakultas-manager.tsx` |
| File helper/util | `kebab-case.ts` | `audit-logger.ts` |
| File action | `kebab-case.ts` | `faculty-actions.ts` (atau `actions.ts` per modul) |
| Komponen React | `PascalCase` | `FakultasManager` |
| Fungsi/variabel | `camelCase` | `getFakultasList`, `isLoading` |
| Konstanta | `UPPER_SNAKE_CASE` | `MAX_SKS_PER_SEMESTER` |
| Tipe/Interface | `PascalCase` | `FakultasRow`, `ActionResult` |
| Tabel DB | `snake_case` | `fakultas`, `user_roles` |
| Kolom DB | `snake_case` | `is_active`, `deleted_at` |

### 2.5 Import Order

✅ BENAR
```typescript
// 1. External libraries
import { z } from 'zod'
import { useForm } from 'react-hook-form'

// 2. Next.js / React
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 3. Internal absolute imports (@/...)
import { requireAuthorizedUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { logAuditAction } from '@/lib/admin/audit-logger'

// 4. Relative imports
import { FakultasForm } from './fakultas-form'
```

---

## 3. Workflow

### Membuat Fitur Baru

```text
1. Buat/update migration SQL jika ada perubahan schema
   → supabase/migrations/<nomor>_nama_fitur.sql

2. Buat query helper
   → src/lib/admin/nama-modul.ts

3. Buat Zod schema validasi
   → src/lib/validations/nama-modul.ts (atau inline di action)

4. Buat Server Action
   → src/actions/nama-modul.ts

5. Buat komponen UI
   → src/modules/nama-modul/nama-komponen.tsx

6. Buat atau update halaman
   → src/app/dashboard/nama-route/page.tsx

7. Test: type-check + lint + manual smoke test
```

### Refactoring

```text
1. Baca file yang akan direfactor
2. Identifikasi pola yang sudah ada
3. Ikuti pola yang sudah ada — jangan ganti arsitektur
4. Pastikan tidak ada `any` baru yang diperkenalkan
5. Jalankan type-check dan lint
```

---

## 4. Implementasi

### Konstanta — Jangan Hardcode

```typescript
// src/lib/constants.ts

export const ROLES = {
  ADMIN: 'Admin',
  PRODI: 'Prodi',
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
  CALON_MAHASISWA: 'Calon Mahasiswa',
  STAFF: 'Staff',
  KEUANGAN: 'Keuangan',
  PIMPINAN: 'Pimpinan',
  BENDAHARA: 'Bendahara',
} as const

export type RoleType = (typeof ROLES)[keyof typeof ROLES]

export const STATUS_MAHASISWA = {
  CALON: 'CALON',
  AKTIF: 'AKTIF',
  NON_AKTIF: 'NON-AKTIF',
  CUTI: 'CUTI',
  LULUS: 'LULUS',
  DO: 'DO',
} as const

export const MAX_SKS_PER_SEMESTER = 24
export const DEFAULT_PAGE_SIZE = 10
```

### Response Format Standar

```typescript
// Semua Server Action menggunakan format yang sama
type ActionResponse<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success?: never; error: string; fieldErrors?: Record<string, string[]> }

// Contoh penggunaan di UI
const result = await createFakultasAction(formData)
if ('error' in result) {
  toast.error(result.error)
  if (result.fieldErrors) {
    // set field errors ke form
  }
} else {
  toast.success('Berhasil disimpan')
  router.refresh()
}
```

### Comment yang Berguna

```typescript
// ✅ Comment menjelaskan MENGAPA, bukan WHAT (kode sudah menjelaskan what)

// Harus ambil old_data sebelum update karena audit log butuh perbandingan
const { data: existing } = await supabase.from('fakultas').select('*').eq('id', id).single()

// Idempotency: cek apakah webhook sudah pernah diproses sebelumnya
const alreadyProcessed = await checkWebhookProcessed(transactionId)
```

---

## 5. Security Rules

- `unknown` type untuk input Server Action, lalu divalidasi Zod — **tidak** langsung `any`
- Secret env selalu diakses via `process.env.VAR_NAME` — tidak di-destructure global
- Logging error di server: `console.error('[konteks]', detail)` — jangan kirim ke client
- Fungsi yang berpotensi throw wajib di-wrap `try/catch` dengan fallback yang aman

---

## 6. Anti Pattern

❌ `any` type tanpa alasan jelas  
❌ Hardcode string role, status, atau konstanta di luar constants file  
❌ Query database langsung di komponen React (harus via Server Action atau helper)  
❌ Default export untuk Server Action (gunakan named export)  
❌ Satu file dengan > 300 baris yang mencampur logika berbeda  
❌ Komentar yang hanya menjelaskan apa kodenya (bukan mengapa)  
❌ `console.log` di-commit untuk debugging sementara  
❌ Import circular (A import B, B import A)  
❌ `as unknown as X` untuk bypass type check — perbaiki tipe yang sebenarnya  
❌ Function dengan lebih dari 5 parameter — gunakan object parameter  

---

## 7. Checklist AI

Sebelum menghasilkan kode:

- [ ] Apakah semua tipe eksplisit (tidak ada `any` sembarangan)?
- [ ] Apakah Server Action menggunakan `unknown` input + Zod validation?
- [ ] Apakah naming convention konsisten (camelCase fungsi, PascalCase komponen)?
- [ ] Apakah query database ada di helper (`src/lib/admin/`), bukan di komponen?
- [ ] Apakah response format standar digunakan?
- [ ] Apakah konstanta menggunakan `src/lib/constants.ts`?
- [ ] Apakah tidak ada hardcode string role/status?
- [ ] Apakah error di-log ke server dan pesan aman ke client?
- [ ] Apakah import diurutkan dengan benar?
- [ ] Apakah ada TypeScript error yang bisa diprediksi?

---

## 8. Ringkasan

- TypeScript: **strict mode** — tidak ada `any` sembarangan, tipe eksplisit
- Server Action: format baku → **auth → Zod → DB → audit log → return**
- Query: di **`src/lib/admin/`** — repository pattern, bukan langsung di komponen
- Naming: **camelCase** fungsi/variabel, **PascalCase** komponen/tipe, **UPPER_SNAKE** konstanta
- Konstanta: di **`src/lib/constants.ts`** — tidak hardcode role/status di inline kode
- Response: **format standar** `{ success, data }` atau `{ error, fieldErrors }`
- Error: **server log detail**, **pesan aman** ke client
- Komentar: jelaskan **mengapa**, bukan apa
