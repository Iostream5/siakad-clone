---
trigger: always_on
---

# Database & Schema Rules

## Tujuan
Memastikan AI selalu menghasilkan query, migration, dan operasi database yang konsisten dengan konvensi Supabase PostgreSQL project ini.

---

## 1. Gambaran Umum

Database utama adalah **Supabase PostgreSQL**. Schema dikelola via file SQL di folder `supabase/migrations/`. Tidak ada Prisma schema. Tidak ada SQLite.

### Klien Supabase

| Klien | File | Kapan Digunakan |
|---|---|---|
| Browser Client | `src/supabase/client.ts` | Client Components saja — tidak untuk operasi sensitif |
| Server Client | `src/supabase/server.ts` | Server Components, Server Actions, Route Handlers |
| Admin Client | `src/supabase/admin.ts` | Bypass RLS — hanya server-side, jangan import di client |

### Tabel Utama Phase 1 (Sudah Ada di Database)

| Tabel | Keterangan | Soft Delete |
|---|---|---|
| `users` | User utama, FK ke `auth.users` | Ya (`deleted_at`) |
| `user_roles` | Relasi user ↔ role | Tidak |
| `roles` | Role dinamis | Tidak ada di migrasi awal; gunakan string check constraint |
| `role_menu_permissions` | Akses menu per role | Tidak |
| `user_menu_permissions` | Override akses menu per user | Tidak |
| `menus` | Dynamic sidebar | Ya |
| `audit_logs` | Log aktivitas — **tidak boleh dihapus dari UI** | **Tidak** |
| `settings` | Key-value sistem | Tidak |
| `notification_templates` | Template notifikasi | Tidak |
| `kampus` | Master data kampus | Ya |
| `fakultas` | Fakultas | Tidak (ada `is_active`) |
| `program_studi` | Program studi | Ya (`deleted_at`) |
| `ruangan` | Ruangan/gedung | Ya |
| `gedung` | Gedung | Ya |
| `kelas` | Kelas/kelompok belajar | Ya |
| `kurikulum` | Kurikulum per prodi | Ya |
| `tahun_akademik` | Tahun akademik & semester | Tidak |
| `dosen` | Data dosen | Ya |
| `mahasiswa` | Data mahasiswa | Ya |
| `mata_kuliah` | Mata kuliah | Ya |
| `jadwal_kuliah` | Jadwal kuliah | Tidak |
| `krs_header` / `krs_detail` | KRS mahasiswa | Tidak |
| `tagihan` / `pembayaran` | Keuangan | Tidak |
| `pmb_pendaftaran` | Pendaftaran PMB | Tidak |
| `pmb_pembayaran` | Pembayaran PMB | Tidak |
| `lms_*` | LMS | Tidak |
| `edom_*` | EDOM | Tidak |
| `notification_devices` / `notification_queue` | Notifikasi | Tidak |

---

## 2. Aturan Inti

### 2.1 Konvensi Penamaan

| Aturan | Contoh Benar | Contoh Salah |
|---|---|---|
| Nama tabel: `snake_case`, plural | `user_roles`, `audit_logs` | `UserRoles`, `userRole` |
| Nama kolom: `snake_case` | `created_at`, `deleted_at` | `createdAt`, `DeletedAt` |
| Primary key | `id UUID DEFAULT gen_random_uuid()` | `user_id`, `userId` sebagai PK |
| Foreign key | `user_id`, `role_id`, `faculty_id` | `userId`, `roleID` |
| Soft delete | `deleted_at TIMESTAMPTZ NULL` | `is_deleted BOOLEAN`, `isActive` |
| Timestamp | `TIMESTAMPTZ NOT NULL DEFAULT now()` | `TIMESTAMP` tanpa timezone |

### 2.2 Kolom Standar Wajib

Setiap tabel bisnis baru **WAJIB** memiliki kolom berikut:

✅ BENAR
```sql
CREATE TABLE public.nama_tabel (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ NULL  -- NULL = aktif, terisi = soft deleted
);

-- Trigger updated_at wajib dipasang
CREATE TRIGGER trg_nama_tabel_updated
BEFORE UPDATE ON public.nama_tabel
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

❌ SALAH
```sql
CREATE TABLE namatabel (
  ID SERIAL PRIMARY KEY,
  createdAt TIMESTAMP
  -- tidak ada deleted_at
  -- tidak ada trigger updated_at
);
```

### 2.3 Migration File

✅ BENAR
```bash
# Berurutan, bernomor urut, deskriptif
supabase/migrations/
  001_init.sql
  002_user_menu_permissions.sql
  023_nama_fitur_baru.sql  # selalu increment
```

❌ SALAH
```bash
# Jangan buat migration tanpa nomor urut
supabase/migrations/
  new_feature.sql
  fix.sql
```

Alasan: Migration tanpa urutan menyebabkan konflik saat apply ke database baru atau production.

### 2.4 RLS Wajib untuk Tabel Sensitif

✅ BENAR
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy untuk backend (service role)
CREATE POLICY "Service role manage users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy untuk user biasa
CREATE POLICY "Users read own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);
```

❌ SALAH
```sql
-- Lupa aktifkan RLS
-- Tidak ada policy — berarti tabel terbuka ke semua!
ALTER TABLE public.sensitive_data ENABLE ROW LEVEL SECURITY;
-- (tanpa CREATE POLICY → semua akses ditolak untuk non-service-role)
```

Alasan: Tabel sensitif tanpa RLS bisa diakses oleh siapa pun yang punya anon key.

### 2.5 Soft Delete Pattern

✅ BENAR
```typescript
// Soft delete — set deleted_at
const { error } = await supabase
  .from('users')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', userId)

// Query aktif — filter deleted_at
const { data } = await supabase
  .from('users')
  .select('*')
  .is('deleted_at', null)  // hanya yang aktif
```

❌ SALAH
```typescript
// Hard delete tanpa alasan
await supabase.from('users').delete().eq('id', userId)

// Query tanpa filter soft delete
await supabase.from('users').select('*')  // bisa dapat data yang sudah dihapus
```

---

## 3. Workflow

### Migration Workflow

```text
Identifikasi kebutuhan schema baru
  → Buat file baru: supabase/migrations/<nomor>_nama_fitur.sql
    → Tulis SQL dengan:
       - CREATE TABLE IF NOT EXISTS
       - ALTER TABLE ADD COLUMN IF NOT EXISTS
       - Trigger set_updated_at
       - RLS ENABLE + Policy
       - Index yang dibutuhkan
    → Test di Supabase dev (MCP siakad_dev)
      → Commit migration file
```

### Query Pattern

```text
Server Action / Server Component
  → Import createServerSupabaseClient()
    → Query dengan filter yang tepat:
       - .is('deleted_at', null) untuk soft delete
       - .eq('tenant_id', tenantId) untuk multi-tenant jika berlaku
       - .select('kolom1, kolom2') bukan .select('*')
    → Handle error dari Supabase
      → Return data atau error ke UI
```

---

## 4. Implementasi

### Query yang Aman dan Efisien

```typescript
// ✅ Query dengan kolom spesifik + filter + pagination
const { data, error, count } = await supabase
  .from('mahasiswa')
  .select('id, user_id, nim, angkatan, status_mahasiswa, prodi_id', { count: 'exact' })
  .is('deleted_at', null)
  .eq('status_mahasiswa', 'AKTIF')
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)

if (error) {
  console.error('Query mahasiswa failed:', error.message)
  return { data: [], count: 0, error: error.message }
}

// ✅ Insert dengan returning
const { data: newRecord, error: insertError } = await supabase
  .from('kampus')
  .insert({ kode: 'STI', nama: 'STAI Al-Ittihad' })
  .select('id, kode, nama')
  .single()
```

### Tabel dengan Status/Enum

Gunakan check constraint untuk status — konsisten dengan pola yang sudah ada:

```sql
-- Contoh: status mahasiswa
CREATE TABLE public.mahasiswa (
  ...
  status_mahasiswa TEXT NOT NULL DEFAULT 'CALON'
    CHECK (status_mahasiswa IN ('CALON', 'AKTIF', 'NON-AKTIF', 'CUTI', 'LULUS', 'DO')),
  ...
);
```

---

## 5. Security Rules

- **Admin client** (`src/supabase/admin.ts`) hanya untuk operasi yang butuh bypass RLS — jangan import di Client Components atau route publik
- **Service role key** tidak pernah `NEXT_PUBLIC_`, tidak pernah dikirim ke browser
- Setiap tabel baru yang sensitif **wajib** RLS + policy service_role
- `audit_logs` tidak boleh di-`DELETE` dari UI biasa — bersifat permanen
- Query ke tabel data mahasiswa/keuangan/nilai wajib filter berdasarkan user yang login — jangan return semua data lintas user

---

## 6. Anti Pattern

❌ `SELECT *` pada tabel besar tanpa pagination  
❌ Hard delete pada tabel bisnis tanpa konfirmasi dan alasan  
❌ Query tanpa filter `deleted_at IS NULL` pada tabel dengan soft delete  
❌ Import admin client di Client Component  
❌ Buat tabel tanpa RLS untuk data yang seharusnya sensitif  
❌ Buat migration file tanpa nomor urut  
❌ Modifikasi migration yang sudah di-apply ke production  
❌ Gunakan `TIMESTAMP` tanpa timezone — selalu `TIMESTAMPTZ`  
❌ Buat kolom tanpa trigger `set_updated_at` untuk `updated_at`  

---

## 7. Checklist AI

Sebelum menulis query atau migration, verifikasi:

- [ ] Apakah tabel sudah ada di `supabase/migrations/`?
- [ ] Apakah kolom `id`, `created_at`, `updated_at`, `deleted_at` sudah ada?
- [ ] Apakah trigger `set_updated_at` sudah dipasang?
- [ ] Apakah RLS sudah diaktifkan untuk tabel sensitif?
- [ ] Apakah policy `service_role` sudah dibuat?
- [ ] Apakah query memfilter `deleted_at IS NULL`?
- [ ] Apakah query menggunakan kolom spesifik, bukan `SELECT *`?
- [ ] Apakah pagination diterapkan untuk query daftar?
- [ ] Apakah migration file bernomor urut (increment dari yang terakhir)?
- [ ] Apakah menggunakan client yang tepat (browser/server/admin)?

---

## 8. Ringkasan

- Database: **Supabase PostgreSQL** — bukan SQLite, bukan Prisma
- Schema: **SQL files di `supabase/migrations/`** bernomor urut
- Kolom wajib: `id (UUID)`, `created_at`, `updated_at`, `deleted_at`
- Trigger: **`set_updated_at`** wajib di setiap tabel baru
- Soft delete: **`deleted_at TIMESTAMPTZ NULL`** — bukan `is_deleted`
- Query: **kolom spesifik + filter `deleted_at IS NULL` + pagination**
- RLS: **wajib aktif** untuk tabel sensitif + policy service_role
- Client: **browser/server/admin** sesuai konteks — admin hanya server-side
