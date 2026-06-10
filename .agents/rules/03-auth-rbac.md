---
trigger: always_on
---

# Auth & RBAC Rules

## Tujuan
Memastikan AI memahami sistem autentikasi, otorisasi berbasis role, dan dynamic permission yang digunakan project ini — serta tidak menggunakan pola lama (Better Auth, NextAuth, middleware.ts).

---

## 1. Gambaran Umum

### Sistem Auth

| Komponen | Implementasi | Catatan |
|---|---|---|
| Auth Provider | **Supabase Auth** | Bukan Better Auth, bukan NextAuth |
| Session | Cookie internal `siakad_session` | HMAC signed jika `SESSION_SECRET` tersedia |
| Route Protection | **`proxy.ts`** di root | Bukan `middleware.ts` — breaking change Next.js 16 |
| Demo Auth | Fallback lokal | Hanya boleh aktif saat `NODE_ENV !== 'production'` |
| Multi-Role | `user_roles` table | Satu user bisa punya lebih dari satu role |

### Role yang Dikenal Sistem

| Role | Kode di DB | Dashboard | Phase |
|---|---|---|---|
| Admin | `Admin` | Phase 1 | ✅ |
| Prodi | `Prodi` | Phase 1 partial | ✅ |
| Dosen | `Dosen` | Phase 2 | |
| Mahasiswa | `Mahasiswa` | Phase 2 | |
| Calon Mahasiswa | `Calon Mahasiswa` | Phase 2 | |
| Staff | `Staff` | Phase 2 | |
| Keuangan | `Keuangan` | Phase 2 | |
| Pimpinan | `Pimpinan` | Phase 3 | |
| Bendahara | `Bendahara` | Phase 3 | |

### Tabel RBAC

```text
users
  └─ user_roles (user_id, role)
       └─ role_menu_permissions (role, menu_key, is_allowed)
            └─ user_menu_permissions (user_id, menu_key, is_allowed)  ← override per user
```

---

## 2. Aturan Inti

### 2.1 Auth Check di Server Action — Wajib

Setiap Server Action yang melakukan **mutasi data** wajib melakukan cek otorisasi server-side. `proxy.ts` hanya UX redirect, bukan security boundary.

✅ BENAR
```typescript
'use server'

import { requireAuthorizedUser } from '@/lib/auth'

export async function deleteUserAction(userId: string) {
  // Wajib: cek role di server, bukan dari client
  const currentUser = await requireAuthorizedUser(['Admin'])

  // Baru lakukan operasi
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId)

  return error ? { error: 'Gagal' } : { success: true }
}
```

❌ SALAH
```typescript
'use server'

export async function deleteUserAction(userId: string) {
  // TIDAK ADA auth check — siapa pun bisa memanggil action ini!
  const supabase = createServerSupabaseClient()
  await supabase.from('users').delete().eq('id', userId)
}
```

Alasan: Server Actions dapat dipanggil langsung via fetch, tanpa melalui UI. `proxy.ts` tidak melindungi action.

### 2.2 Demo Auth Hanya untuk Development

✅ BENAR
```typescript
// src/lib/auth.ts
export async function loginWithDemo(username: string, password: string) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo auth tidak tersedia di production')
  }
  // ... demo login logic
}
```

❌ SALAH
```typescript
// Demo auth aktif di semua environment
const DEMO_USERS = { admin: 'admin123', ... }
```

### 2.3 Supabase Auth untuk Production

✅ BENAR
```typescript
// Login via Supabase Auth
const supabase = createServerSupabaseClient()
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

if (error) return { error: 'Email atau password salah' }

// Set session cookie internal setelah auth sukses
await setSessionCookie(data.session)
```

### 2.4 Service Role Key Hanya Server-Side

✅ BENAR
```typescript
// src/supabase/admin.ts — server-side only
import { createClient } from '@supabase/supabase-js'

export function createAdminSupabaseClient() {
  // SUPABASE_SERVICE_ROLE_KEY — tidak ada NEXT_PUBLIC_
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

❌ SALAH
```typescript
// NEXT_PUBLIC_ berarti dikirim ke browser!
const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!)
```

---

## 3. Workflow

### Login Flow

```text
User submit form login
  → Server Action auth.ts
    → Cek Supabase Auth (email/username)
      → Jika berhasil: set session cookie siakad_session
        → Jika production: cookie HMAC signed (SESSION_SECRET)
        → Jika dev tanpa secret: cookie JSON (fallback)
      → Jika gagal: return error ke UI
    → Resolve role aktif dari user_roles
      → Redirect ke /dashboard
```

### Route Protection Flow (proxy.ts)

```text
Request masuk
  → proxy.ts membaca cookie siakad_session
    → Jika tidak ada session → redirect /login
    → Jika ada session:
        → Validasi session (HMAC atau JSON parse)
        → Resolve role aktif
        → Cek akses route berdasarkan role
          → Jika tidak punya akses → redirect /dashboard
          → Jika punya akses → lanjut ke halaman
```

### Menu Permission Flow

```text
User login
  → Resolve role aktif dari user_roles
    → Query menus yang diizinkan:
        1. Ambil semua role_menu_permissions untuk role user
        2. Override dengan user_menu_permissions jika ada
        3. Filter menus.is_active = true, deleted_at IS NULL
    → Render sidebar dari hasil query
```

### Switch Role Flow (Multi-Role User)

```text
User punya multiple roles
  → UI menampilkan pilihan role
    → User pilih role aktif
      → Server Action update active role di session
        → Sidebar dan akses halaman berubah sesuai role baru
```

---

## 4. Implementasi

### Guard Helper Pattern

```typescript
// src/lib/auth.ts

export async function requireUser() {
  const session = await getSessionFromCookie()
  if (!session) {
    redirect('/login')
  }
  return session.user
}

export async function requireAuthorizedUser(allowedRoles: string[]) {
  const user = await requireUser()

  if (!allowedRoles.includes(user.active_role)) {
    throw new Error('Akses ditolak')
    // atau redirect ke halaman 403
  }

  return user
}
```

### Resolve Menu dari Database

```typescript
// src/lib/admin/menus.ts

export async function getMenusForRole(role: string) {
  const supabase = createServerSupabaseClient()

  // Ambil menu yang diizinkan untuk role ini
  const { data: rolePermissions } = await supabase
    .from('role_menu_permissions')
    .select('menu_key, is_allowed')
    .eq('role', role)
    .eq('is_allowed', true)

  const allowedKeys = rolePermissions?.map(p => p.menu_key) ?? []

  // Ambil menu yang aktif dan diizinkan
  const { data: menus } = await supabase
    .from('menus')
    .select('id, key, label, href, icon, parent_key, sort_order')
    .is('deleted_at', null)
    .eq('is_active', true)
    .in('key', allowedKeys)
    .order('sort_order', { ascending: true })

  return menus ?? []
}
```

### Cek Status User Sebelum Login

```typescript
// Pastikan user tidak nonaktif/deleted
export async function validateUserCanLogin(userId: string) {
  const supabase = createAdminSupabaseClient() // bypass RLS untuk cek ini

  const { data: user } = await supabase
    .from('users')
    .select('id, is_active, deleted_at')
    .eq('id', userId)
    .single()

  if (!user || user.deleted_at || !user.is_active) {
    return { allowed: false, reason: 'Akun tidak aktif atau telah dihapus' }
  }

  return { allowed: true }
}
```

---

## 5. Security Rules

- Demo auth: **dimatikan di production** — cek `NODE_ENV`
- Session cookie: **HMAC signed** jika `SESSION_SECRET` tersedia
- Cookie: **`secure: true`** di production
- Logout: membersihkan **semua** — cookie internal + Supabase session
- User nonaktif (`is_active = false`): **tidak boleh login**
- User soft-deleted (`deleted_at` terisi): **tidak boleh login**
- Switch role: hanya ke role yang **benar-benar dimiliki** user di `user_roles`
- Setiap Server Action mutasi: **wajib cek role**, tidak cukup cek session saja
- RLS tabel `users` dan `user_roles`: **aktif** — user hanya baca datanya sendiri kecuali admin

---

## 6. Anti Pattern

❌ Gunakan `middleware.ts` untuk route protection  
❌ Demo auth aktif di production  
❌ Cek role hanya di sisi client (UI) tanpa cek server-side  
❌ `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` — service role tidak boleh public  
❌ Hardcode daftar role di sidebar tanpa query database  
❌ Login tanpa cek `is_active` dan `deleted_at`  
❌ Satu action bisa dipakai semua role tanpa filter  
❌ Bypass auth check dengan alasan "sudah ada route guard"  

---

## 7. Checklist AI

Sebelum menulis auth/RBAC code, verifikasi:

- [ ] Apakah menggunakan Supabase Auth (bukan Better Auth/NextAuth)?
- [ ] Apakah route protection menggunakan `proxy.ts` (bukan `middleware.ts`)?
- [ ] Apakah Server Action mutasi memiliki `requireAuthorizedUser`?
- [ ] Apakah demo auth hanya aktif saat `NODE_ENV !== 'production'`?
- [ ] Apakah service role key tidak di-expose sebagai `NEXT_PUBLIC_`?
- [ ] Apakah login mengecek `is_active` dan `deleted_at`?
- [ ] Apakah sidebar/menu dirender dari database (bukan hardcode)?
- [ ] Apakah logout membersihkan cookie DAN Supabase session?
- [ ] Apakah switch role hanya ke role yang ada di `user_roles`?
- [ ] Apakah audit log dicatat untuk login success/fail?

---

## 8. Ringkasan

- Auth: **Supabase Auth** — session cookie `siakad_session` + HMAC signed
- Route protection: **`proxy.ts`** — bukan security boundary utama
- Server Action: **wajib `requireAuthorizedUser`** — tidak cukup route guard
- Demo auth: **nonaktif di production**
- Service role: **server-side only**, tidak pernah `NEXT_PUBLIC_`
- Role: dari tabel `user_roles` — multi-role didukung
- Menu: dari tabel `menus` + `role_menu_permissions` + override `user_menu_permissions`
- Login: cek `is_active` dan `deleted_at` sebelum izinkan masuk
