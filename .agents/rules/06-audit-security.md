---
trigger: always_on
---

# Audit Log & Security Rules

## Tujuan
Memastikan semua aksi penting tercatat di audit log, dan kode yang dihasilkan AI tidak memiliki celah keamanan seperti bypass otorisasi, kebocoran data, atau validasi yang tidak lengkap.

---

## 1. Gambaran Umum

### Audit Log

Audit log adalah catatan **permanen** dari semua aktivitas penting di sistem. Tabel `audit_logs` **tidak boleh dihapus dari UI biasa**.

### Struktur Tabel `audit_logs`

```sql
CREATE TABLE public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  id_user     UUID        REFERENCES public.users(id),
  modul       TEXT        NOT NULL,   -- 'users', 'pmb', 'finance', dll.
  aksi        TEXT        NOT NULL,   -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', dll.
  table_name  TEXT        NOT NULL,   -- nama tabel yang terdampak
  record_id   UUID,                   -- ID record yang diubah
  old_data    JSONB,                  -- data sebelum diubah
  new_data    JSONB,                  -- data setelah diubah
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Aksi yang Wajib Diaudit

| Modul | Aksi yang Dicatat |
|---|---|
| Auth | Login sukses, login gagal, logout, reset password |
| Users | Create, update, soft delete, restore, hard delete, ubah role |
| Roles/Permissions | Create, update, delete, assign permission |
| Menus | Create, update, delete, reorder |
| Master Data | Create, update, soft delete, restore, hard delete, import |
| PMB | Update status pendaftaran, verifikasi pembayaran, generate NIM |
| Keuangan | Create tagihan, verifikasi pembayaran, reject pembayaran |
| KRS | Submit KRS, approve KRS, reject KRS |
| Nilai | Input nilai, update nilai, publish nilai |
| LMS | Create materi, create tugas, grade submission |
| Settings | Update setting sistem, update payment gateway config |

---

## 2. Aturan Inti

### 2.1 Catat Audit Log untuk Setiap Mutasi Penting

✅ BENAR
```typescript
// src/lib/admin/audit-logger.ts
export async function logAuditAction({
  userId,
  module,
  action,
  tableName,
  recordId,
  oldData,
  newData,
}: AuditLogParams) {
  const supabase = createAdminSupabaseClient()

  await supabase.from('audit_logs').insert({
    id_user: userId,
    modul: module,
    aksi: action,
    table_name: tableName,
    record_id: recordId,
    old_data: oldData ?? null,
    new_data: newData ?? null,
  })
  // Audit log tidak boleh membuat Server Action gagal jika audit sendiri error
  // Tangani error audit secara silent
}

// Penggunaan di Server Action
export async function updateFakultasAction(id: string, data: FakultasInput) {
  const user = await requireAuthorizedUser(['Admin'])

  // Ambil data lama untuk old_data
  const { data: existing } = await supabase
    .from('fakultas')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('fakultas')
    .update(data)
    .eq('id', id)

  if (!error) {
    await logAuditAction({
      userId: user.id,
      module: 'master_data',
      action: 'UPDATE',
      tableName: 'fakultas',
      recordId: id,
      oldData: existing,
      newData: data,
    })
  }

  return error ? { error: 'Gagal update' } : { success: true }
}
```

❌ SALAH
```typescript
// Update tanpa audit log
export async function updateFakultasAction(id: string, data: any) {
  await supabase.from('fakultas').update(data).eq('id', id)
  return { success: true }
}
```

### 2.2 Audit Log Tidak Boleh Dihapus dari UI

✅ BENAR
```typescript
// Tidak ada fungsi delete untuk audit_logs di UI atau Server Action
// Hard delete audit_logs hanya boleh via database admin dengan prosedur khusus
```

❌ SALAH
```typescript
// Jangan buat endpoint atau action untuk hapus audit log
export async function deleteAuditLogAction(id: string) {
  await supabase.from('audit_logs').delete().eq('id', id)
}
```

### 2.3 Input Selalu Divalidasi dengan Zod

✅ BENAR
```typescript
const CreateKampusSchema = z.object({
  kode: z.string().min(2).max(10).trim(),
  nama: z.string().min(3).max(100).trim(),
  alamat: z.string().optional(),
  kota: z.string().optional(),
})

export async function createKampusAction(input: unknown) {
  const user = await requireAuthorizedUser(['Admin'])

  const parsed = CreateKampusSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: 'Input tidak valid',
      fieldErrors: parsed.error.flatten().fieldErrors
    }
  }

  // Lanjut ke database dengan data yang sudah valid
  const { data, error } = await supabase
    .from('kampus')
    .insert(parsed.data)
    .select('id')
    .single()

  // ... audit log, return
}
```

❌ SALAH
```typescript
// Input langsung ke database tanpa validasi
export async function createKampusAction(kode: string, nama: string) {
  await supabase.from('kampus').insert({ kode, nama })
}
```

### 2.4 Error Response Tidak Boleh Bocor Informasi Sensitif

✅ BENAR
```typescript
try {
  const { error } = await supabase.from('users').update(data).eq('id', id)
  if (error) {
    console.error('DB error:', error) // log di server
    return { error: 'Gagal menyimpan data. Coba lagi.' } // pesan aman untuk client
  }
} catch (e) {
  console.error('Unexpected error:', e)
  return { error: 'Terjadi kesalahan. Hubungi administrator.' }
}
```

❌ SALAH
```typescript
try {
  await supabase.from('users').update(data).eq('id', id)
} catch (e) {
  return { error: e.message } // bisa expose stack trace atau detail DB!
}
```

### 2.5 Webhook Payment Wajib Validasi Signature

✅ BENAR
```typescript
// src/app/api/payment-gateway/midtrans/finance/route.ts
import { createHmac } from 'crypto'

export async function POST(req: Request) {
  const body = await req.json()

  // Validasi signature Midtrans
  const signatureKey = createHmac('sha512',
    process.env.MIDTRANS_SERVER_KEY!
  )
  .update(`${body.order_id}${body.status_code}${body.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
  .digest('hex')

  if (signatureKey !== body.signature_key) {
    console.warn('Invalid Midtrans signature:', body.order_id)
    return new Response('Unauthorized', { status: 401 })
  }

  // Idempotency check
  const { data: existing } = await supabase
    .from('pembayaran')
    .select('id, status')
    .eq('provider_reference', body.transaction_id)
    .single()

  if (existing?.status === 'Terverifikasi') {
    return new Response('Already processed', { status: 200 })
  }

  // Proses update status
  // ...
  return new Response('OK', { status: 200 })
}
```

❌ SALAH
```typescript
export async function POST(req: Request) {
  const body = await req.json()
  // Langsung proses tanpa validasi signature!
  await updatePaymentStatus(body.order_id, 'paid')
}
```

---

## 3. Workflow

### Audit Login Flow

```text
User submit login
  → Auth berhasil → logAuditAction(module: 'auth', action: 'LOGIN_SUCCESS')
  → Auth gagal → logAuditAction(module: 'auth', action: 'LOGIN_FAILED')
  → Logout → logAuditAction(module: 'auth', action: 'LOGOUT')
```

### Audit CRUD Flow

```text
Server Action dipanggil
  → requireAuthorizedUser() — cek role
    → Zod validation — validasi input
      → Ambil old_data dari DB (untuk UPDATE/DELETE)
        → Eksekusi query DB
          → Jika sukses: logAuditAction(old_data, new_data)
            → Return { success: true }
          → Jika gagal: return { error: 'pesan aman' }
            (jangan audit jika operasi gagal)
```

---

## 4. Implementasi

### Audit Logger Helper

```typescript
// src/lib/admin/audit-logger.ts

export interface AuditLogParams {
  userId?: string
  module: string
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOGIN' | 'LOGOUT' |
          'LOGIN_FAILED' | 'IMPORT' | 'EXPORT' | 'APPROVE' | 'REJECT' | 'VERIFY'
  tableName: string
  recordId?: string
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  metadata?: Record<string, unknown>
}

export async function logAuditAction(params: AuditLogParams): Promise<void> {
  try {
    const adminSupabase = createAdminSupabaseClient()
    await adminSupabase.from('audit_logs').insert({
      id_user: params.userId ?? null,
      modul: params.module,
      aksi: params.action,
      table_name: params.tableName,
      record_id: params.recordId ?? null,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
    })
  } catch (error) {
    // Audit log error tidak boleh menggagalkan operasi utama
    console.error('Audit log failed (non-fatal):', error)
  }
}
```

### Cara Baca Audit Log di Dashboard

```typescript
// Query dengan filter
const { data, count } = await supabase
  .from('audit_logs')
  .select('*, users(full_name, email)', { count: 'exact' })
  .eq('modul', module)
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)
```

---

## 5. Security Rules

### Data Sensitif yang Harus Dilindungi

| Data | Proteksi |
|---|---|
| Password | Tidak pernah disimpan — Supabase Auth yang handle |
| Service role key | Hanya di env server-side, tidak pernah ke client |
| Midtrans server key | Hanya di env server-side |
| FCM server key | Hanya di env server-side |
| Data nilai mahasiswa | Hanya mahasiswa bersangkutan + dosen + admin |
| Data tagihan | Hanya mahasiswa bersangkutan + keuangan + admin |
| Data personal calon mahasiswa | Hanya staff PMB + admin + calon mahasiswa itu sendiri |

### Validasi Wajib

Setiap Server Action wajib:

1. **Auth check** — `requireUser()` atau `requireAuthorizedUser(roles)`
2. **Input validation** — `ZodSchema.safeParse(input)`
3. **Business rule check** — sesuai modul (status flow, ownership, periode aktif)
4. **RLS** — database layer protection otomatis

### Anti Bypass

- Jangan percaya `user_id` atau `role` yang dikirim dari client — selalu resolve dari session server
- Jangan skip auth check dengan alasan "sudah ada di src/proxy.ts"
- Jangan return data tanpa filter ownership (misal: return semua nilai, bukan nilai user yang login)

---

## 6. Anti Pattern

❌ Server Action tanpa auth check  
❌ Server Action tanpa Zod validation  
❌ Expose database error message ke client  
❌ Audit log di-skip untuk aksi CRUD penting  
❌ Webhook diproses tanpa signature validation  
❌ Webhook idempotency diabaikan — bisa proses dua kali  
❌ Hapus audit_logs dari UI  
❌ Simpan secret di kode atau git  
❌ Percaya input role/user_id dari client request  
❌ Return semua data tanpa filter scope user yang login  

---

## 7. Checklist AI

Sebelum menulis Server Action atau Route Handler, verifikasi:

- [ ] Apakah ada `requireAuthorizedUser` atau `requireUser`?
- [ ] Apakah input divalidasi dengan Zod?
- [ ] Apakah `logAuditAction` dipanggil setelah operasi berhasil?
- [ ] Apakah `old_data` diambil sebelum UPDATE/DELETE?
- [ ] Apakah error message aman (tidak expose detail DB)?
- [ ] Apakah webhook memvalidasi signature (untuk payment gateway)?
- [ ] Apakah webhook idempotent (tidak proses dua kali)?
- [ ] Apakah data yang di-return difilter berdasarkan kepemilikan user?
- [ ] Apakah secret tidak dikirim ke client?
- [ ] Apakah audit_logs tidak bisa dihapus dari UI?

---

## 8. Ringkasan

- Audit log: **wajib** untuk semua mutasi penting — login, CRUD, approval, import
- Audit log: **permanen** — tidak boleh dihapus dari UI
- Server Action: urutan wajib → **auth check → input validation → business rule → DB → audit log**
- Error response: **pesan aman** ke client, detail error hanya di server log
- Webhook: **signature validation + idempotency** — dua syarat wajib
- Secret: **tidak pernah ke client**, tidak pernah `NEXT_PUBLIC_` untuk key sensitif
- Data ownership: **filter per user yang login** — jangan return data lintas user
