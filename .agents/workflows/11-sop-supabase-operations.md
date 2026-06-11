---
description: SOP cara kerja dengan Supabase di SIAKAD. Mencakup strategi pemilihan client (browser/server/admin), pola query yang benar, pengelolaan storage, penggunaan MCP untuk validasi live, dan hal-hal yang sering salah saat bekerja dengan Supabase.
---

# SOP Operasi Supabase — SIAKAD STAI Al-Ittihad

## Tujuan

Supabase adalah tulang punggung seluruh sistem — auth, database, dan storage. Salah memilih client atau salah pola query bisa menyebabkan RLS bypass, data bocor, atau operasi yang tidak perlu memakan quota. SOP ini memastikan agent menggunakan Supabase dengan cara yang benar dan aman.

---

## FASE 1: STRATEGI PEMILIHAN CLIENT

### Langkah-langkah

STEP 1: Pahami tiga jenis client dan kapan masing-masing dipakai.

```
src/supabase/
  client.ts   → Browser Client
  server.ts   → Server Client
  admin.ts    → Admin Client (bypass RLS)
```

**Browser Client** (`createBrowserClient`):
- Dipakai di: `"use client"` component
- Untuk: read data yang sesuai RLS user yang login
- Tidak untuk: mutasi sensitif, operasi yang butuh service role
- Auth: session dari cookie browser user

**Server Client** (`createServerClient`):
- Dipakai di: Server Component, Server Action, Route Handler
- Untuk: hampir semua operasi server-side
- RLS: tetap aktif, menggunakan session user dari cookie
- Auth: membaca cookie dari request

**Admin Client** (`createAdminClient`):
- Dipakai di: Server-side ONLY, hanya saat perlu bypass RLS
- Untuk: seed, migration, operasi yang tidak punya user context
- JANGAN untuk: operasi normal yang bisa pakai server client
- Auth: menggunakan `SUPABASE_SERVICE_ROLE_KEY`

STEP 2: Decision tree pemilihan client.

```
Apakah kode ini berjalan di client (browser)?
  → YA → pakai Browser Client
  → TIDAK (server) → lanjut

Apakah operasi ini butuh bypass RLS?
  → TIDAK → pakai Server Client (default)
  → YA → apakah alasannya valid?
      Valid: seed, cross-tenant admin ops, webhook processing
      → pakai Admin Client
      Tidak valid: cukup tambahkan RLS policy yang benar
      → pakai Server Client + perbaiki policy
```

STEP 3: Contoh penggunaan yang benar.

```typescript
// ✅ BENAR — Server Action pakai server client
"use server";
import { createServerClient } from "@/supabase/server";

export async function getKampusList() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("kampus")
    .select("*")
    .is("deleted_at", null);
  if (error) throw error;
  return data;
}

// ✅ BENAR — Client component pakai browser client
"use client";
import { createBrowserClient } from "@/supabase/client";

export function NotifBadge() {
  const supabase = createBrowserClient();
  // hanya untuk read data milik user sendiri
}

// ❌ SALAH — Admin client di server action umum
export async function getKampusList() {
  const supabase = createAdminClient(); // tidak perlu bypass RLS di sini
  // ini akan melewati semua RLS — berbahaya
}
```

### Checklist

- [ ] Browser client hanya dipakai di `"use client"` component
- [ ] Server client dipakai untuk semua operasi server-side normal
- [ ] Admin client hanya dipakai saat bypass RLS benar-benar diperlukan dan alasannya jelas
- [ ] `SUPABASE_SERVICE_ROLE_KEY` tidak pernah dipakai di client-side code

---

## FASE 2: POLA QUERY YANG BENAR

### Langkah-langkah

STEP 1: Selalu handle error dan null dari query Supabase.

```typescript
// ✅ BENAR — handle error dan null
const { data, error } = await supabase
  .from("kampus")
  .select("*")
  .single();

if (error) throw error;          // error dari Supabase
if (!data) return null;          // data bisa null meski tidak error

// ❌ SALAH — langsung pakai data tanpa cek
const { data } = await supabase.from("kampus").select("*").single();
return data.nama; // crash jika data null
```

STEP 2: Gunakan select spesifik, hindari `select("*")` untuk tabel besar.

```typescript
// ✅ BENAR — pilih kolom yang dibutuhkan saja
const { data } = await supabase
  .from("mahasiswa")
  .select("id, nim, nama, status_mahasiswa, prodi_id")
  .eq("prodi_id", prodiId)
  .is("deleted_at", null);

// ❌ KURANG BAIK — ambil semua kolom termasuk yang tidak perlu
const { data } = await supabase
  .from("mahasiswa")
  .select("*"); // bisa sangat besar untuk tabel mahasiswa
```

STEP 3: Pola query dengan relasi (join).

```typescript
// ✅ BENAR — query dengan relasi menggunakan Supabase syntax
const { data } = await supabase
  .from("jadwal_kuliah")
  .select(`
    id,
    nama_kelas,
    hari,
    jam_mulai,
    jam_selesai,
    mata_kuliah:mata_kuliah_id (
      id, nama, sks
    ),
    dosen:dosen_id (
      id,
      users:user_id (full_name)
    )
  `)
  .eq("tahun_akademik_id", tahunAkademikId)
  .is("deleted_at", null);
```

STEP 4: Pola pagination yang benar.

```typescript
// ✅ BENAR — pagination dengan count
const page = 1;
const limit = 10;

const { data, count, error } = await supabase
  .from("mahasiswa")
  .select("*", { count: "exact" }) // count: "exact" untuk total
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
  .range((page - 1) * limit, page * limit - 1);

return {
  data: data ?? [],
  total: count ?? 0,
  totalPages: Math.ceil((count ?? 0) / limit),
};
```

### Checklist

- [ ] Semua query selalu handle `error` sebelum menggunakan `data`
- [ ] `data` dicek tidak null sebelum diakses
- [ ] Select spesifik kolom untuk tabel besar
- [ ] Semua query list menggunakan pagination
- [ ] Query aktif selalu include `.is("deleted_at", null)`

---

## FASE 3: SUPABASE STORAGE

### Langkah-langkah

STEP 1: Struktur bucket yang digunakan di SIAKAD.

```
pmb-payment-proofs/    → Bukti pembayaran PMB
  {pendaftaran_id}/{filename}

student-documents/     → Dokumen mahasiswa
  {mahasiswa_id}/{tipe_dokumen}/{filename}

course-materials/      → Materi LMS
  {jadwal_id}/{filename}

assignment-submissions/ → Submission tugas
  {tugas_id}/{mahasiswa_id}/{filename}
```

STEP 2: Template upload file yang aman.

```typescript
// ✅ BENAR — upload dengan validasi tipe dan ukuran
async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { maxSizeMB?: number; allowedTypes?: string[] }
) {
  const maxSize = (options?.maxSizeMB ?? 5) * 1024 * 1024;
  const allowedTypes = options?.allowedTypes ?? ["image/jpeg", "image/png", "application/pdf"];

  if (file.size > maxSize) {
    throw new Error(`File terlalu besar. Maksimal ${options?.maxSizeMB ?? 5}MB`);
  }
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipe file tidak diizinkan: ${file.type}`);
  }

  const supabase = createAdminClient(); // storage butuh admin untuk bypass bucket policy
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false }); // upsert: false → tidak overwrite

  if (error) throw error;
  return data.path;
}
```

STEP 3: Dapatkan URL file yang sudah diupload.

```typescript
// Public URL (untuk bucket public)
const { data } = supabase.storage
  .from("course-materials")
  .getPublicUrl(filePath);
const url = data.publicUrl;

// Signed URL (untuk bucket private, berlaku sementara)
const { data, error } = await supabase.storage
  .from("pmb-payment-proofs")
  .createSignedUrl(filePath, 3600); // 1 jam
const url = data?.signedUrl;
```

### Checklist

- [ ] File divalidasi tipe dan ukuran sebelum upload
- [ ] Path upload mengandung ID unik untuk mencegah tabrakan nama file
- [ ] Bucket sensitif menggunakan signed URL, bukan public URL
- [ ] Upload error ditangani dengan pesan yang jelas ke user

---

## FASE 4: PENGGUNAAN MCP UNTUK VALIDASI LIVE

### Langkah-langkah

STEP 1: Kapan menggunakan MCP Supabase.

Gunakan MCP `siakad_dev` (karena `STATUS_PROJECT = DEV`) untuk:
- Verifikasi apakah tabel sudah ada sebelum membuat migration
- Cek data yang ada sebelum membuat seed
- Debug query yang tidak berjalan sesuai harapan
- Verifikasi RLS policy sudah aktif
- Deteksi gap antara schema lokal dan schema live

STEP 2: Query verifikasi yang sering digunakan.

```sql
-- Cek semua tabel dan status RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Cek semua policy untuk tabel tertentu
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'nama_tabel';

-- Cek struktur tabel
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'nama_tabel'
ORDER BY ordinal_position;

-- Cek trigger yang ada
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Cek data untuk debug
SELECT COUNT(*) FROM public.nama_tabel WHERE deleted_at IS NULL;
```

STEP 3: Aturan penggunaan MCP.

```
✅ Boleh: SELECT untuk verifikasi dan debug
✅ Boleh: DDL verifikasi (cek tabel, kolom, policy)
✅ Boleh: INSERT/UPDATE untuk seed data yang diperlukan

⚠️  Hati-hati: UPDATE data yang sudah ada — pastikan filter benar
❌ Jangan: DROP TABLE atau DELETE massal tanpa backup
❌ Jangan: Gunakan MCP siakad (production) saat STATUS_PROJECT = DEV
❌ Jangan: Lakukan perubahan schema via MCP tanpa membuat migration file
```

### Checklist

- [ ] MCP `siakad_dev` digunakan sesuai `STATUS_PROJECT = DEV`
- [ ] Perubahan schema via MCP selalu diikuti dengan pembuatan migration file
- [ ] Query destruktif (DROP, DELETE massal) tidak dilakukan via MCP tanpa backup

---

## FASE 5: HAL YANG SERING SALAH

### Langkah-langkah

STEP 1: Daftar kesalahan umum dan cara menghindarinya.

| Kesalahan | Dampak | Cara Menghindari |
|-----------|--------|------------------|
| Pakai Admin Client di Server Action biasa | Bypass RLS, data bocor | Audit setiap penggunaan `createAdminClient` |
| Tidak cek `error` dari query | Silent failure, data corrupt | Selalu destructure dan cek `error` |
| Tidak filter `deleted_at IS NULL` | Data yang sudah dihapus muncul | Tambahkan `.is("deleted_at", null)` di semua query aktif |
| Select `*` di tabel besar | Performa buruk, data berlebih | Tentukan kolom yang dibutuhkan |
| Tidak handle null dari `.single()` | Runtime crash | Selalu cek `if (!data) return null` |
| Ubah schema di dashboard tanpa migration file | Schema lokal dan live tidak sinkron | Selalu buat migration file untuk setiap perubahan schema |

STEP 2: Verifikasi cepat jika query tidak berjalan sesuai harapan.

```typescript
// Debug: tambahkan logging sementara
const { data, error, count } = await supabase
  .from("kampus")
  .select("*", { count: "exact" })
  .is("deleted_at", null);

console.log("[DEBUG] kampus query:", {
  count,
  dataLength: data?.length,
  error: error?.message,
  // JANGAN log data penuh jika berisi data sensitif
});
```

### Checklist Akhir

```
□ Client yang digunakan sudah tepat (browser/server/admin)
□ Semua query handle error sebelum menggunakan data
□ Semua query aktif include filter deleted_at IS NULL
□ Pagination ada untuk semua query list
□ Storage upload divalidasi tipe dan ukuran
□ Bucket sensitif menggunakan signed URL
□ MCP hanya digunakan untuk siakad_dev saat STATUS_PROJECT = DEV
□ Perubahan schema via MCP selalu diikuti migration file
```

---

## Output yang Diharapkan

1. **Client yang tepat digunakan** — tidak ada admin client di tempat yang tidak perlu.
2. **Query aman** — semua error dihandle, null dicek, soft delete difilter.
3. **Storage terstruktur** — path konsisten, validasi file, URL yang sesuai visibility.
4. **MCP digunakan dengan benar** — hanya untuk dev, perubahan selalu diikuti migration file.
5. **Tidak ada data bocor** karena salah pilih client atau lupa filter RLS.
