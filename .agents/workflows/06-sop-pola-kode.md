---
description: Pola kode standar yang wajib diikuti oleh AI Agent saat mengimplementasikan fitur di SIAKAD. Berisi template ringkas untuk Server Action, helper query, UI komponen, migration SQL, audit log, dan pola kerja agar agent tidak mengarang pola sendiri.
---

# SOP Pola Kode Standar — SIAKAD STAI Al-Ittihad

## Tujuan

Dokumen ini menjaga fitur SIAKAD konsisten dan aman. Agent wajib pakai pola ini saat menambah migration, helper query, Server Action, form client, audit log, atau fitur baru.

Prinsip utama:

1. Ikuti struktur repo aktif, bukan ingatan training.
2. Supabase adalah jalur data utama runtime.
3. Validasi input sebelum menyentuh database.
4. Mutasi penting wajib lewat auth, permission, audit log, dan cache revalidation.
5. Jangan commit secret, env lokal, token, atau log kredensial.
6. Cek env sebelum MCP: DEV pakai `siakad-dev`, production pakai `siakad`.

---

## FASE 1: Migration SQL

Migration wajib idempoten, aman diulang, dan mengikuti pola Supabase/Postgres. Nomor file 3 digit urut dari migration terakhir.

### Template tabel baru

```sql
-- supabase/migrations/NNN_nama_fitur.sql

create table if not exists public.nama_tabel (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kode text not null unique,
  deskripsi text,
  parent_id uuid null references public.parent_tabel(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_by uuid null references public.users(id) on delete set null,
  updated_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_nama_tabel_active
  on public.nama_tabel(is_active)
  where deleted_at is null;

create index if not exists idx_nama_tabel_parent
  on public.nama_tabel(parent_id)
  where deleted_at is null;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_nama_tabel_updated') then
    create trigger trg_nama_tabel_updated
    before update on public.nama_tabel
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.nama_tabel enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nama_tabel'
      and policyname = 'Service role manage nama_tabel'
  ) then
    create policy "Service role manage nama_tabel"
    on public.nama_tabel
    for all to service_role
    using (true)
    with check (true);
  end if;
end $$;
```

### Ubah tabel dan seed

```sql
alter table public.nama_tabel
  add column if not exists kolom_baru text,
  add column if not exists kolom_lain boolean not null default false;

create index if not exists idx_nama_tabel_kolom_baru
  on public.nama_tabel(kolom_baru)
  where deleted_at is null and kolom_baru is not null;

insert into public.nama_tabel (kode, nama, is_active)
values ('KODE1', 'Nama Satu', true), ('KODE2', 'Nama Dua', true)
on conflict (kode) do update set
  nama = excluded.nama,
  is_active = excluded.is_active;
```

Checklist migration:

- Nomor migration urut.
- DDL pakai `if not exists` bila memungkinkan.
- Kolom standar ada: `id`, `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`.
- Trigger `public.set_updated_at()` dipasang.
- RLS aktif dan policy service role tersedia.
- Seed memakai `on conflict` agar aman diulang.

---

## FASE 2: Helper Query

Helper query berada di `src/lib/...`, bukan di UI. Tugasnya bicara dengan Supabase, menormalisasi filter, mengatur pagination, dan melempar error.

Lokasi umum:

```text
src/lib/admin/nama-modul.ts
src/lib/<domain>/nama-modul.ts
```

Template ringkas:

```typescript
import { createServerClient } from "@/supabase/server";

export interface NamaTabelRow { id: string; nama: string; kode: string; deleted_at: string | null; }

export interface NamaTabelFilters {
  search?: string;
  isActive?: boolean;
  showDeleted?: boolean;
  page?: number;
  limit?: number;
}

export async function getNamaTabelList(filters: NamaTabelFilters = {}) {
  const supabase = await createServerClient();
  const { search, isActive, showDeleted = false, page = 1, limit = 10 } = filters;

  let query = supabase
    .from("nama_tabel")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  query = showDeleted
    ? query.not("deleted_at", "is", null)
    : query.is("deleted_at", null);

  if (isActive !== undefined) query = query.eq("is_active", isActive);
  if (search?.trim()) {
    const keyword = search.trim();
    query = query.or(`nama.ilike.%${keyword}%,kode.ilike.%${keyword}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as NamaTabelRow[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getNamaTabelById(id: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("nama_tabel")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;
  return data as NamaTabelRow | null;
}

export async function createNamaTabel(input: { nama: string; kode: string; createdBy: string }) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("nama_tabel")
    .insert({ nama: input.nama, kode: input.kode, created_by: input.createdBy, updated_by: input.createdBy })
    .select()
    .single();

  if (error) throw error;
  return data as NamaTabelRow;
}
```

Mutasi update/delete mengikuti pola yang sama: payload eksplisit, filter `id`, filter `deleted_at is null`, `.select().single()`, lalu `throw error` jika gagal. Soft delete isi `deleted_at`. Hard delete hanya untuk data yang sudah soft-deleted dan memang diminta.

Checklist helper:

- Types jelas: Row, Filters, CreateInput, UpdateInput bila perlu.
- List query punya pagination, search, dan filter soft delete.
- Query aktif selalu `deleted_at is null`.
- Helper throw error, jangan diam-diam return palsu. Nanti debugging nangis kecil.

---

## FASE 3: Server Action

Server Action adalah gerbang mutasi dari UI. Wajib ada auth, permission, validasi Zod, try-catch, audit log, dan revalidation.

Template ringkas:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthorizedUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/admin/audit-logger";
import { createNamaTabel, getNamaTabelById, updateNamaTabel } from "@/lib/admin/nama-modul";

const createSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  kode: z.string().min(1, "Kode wajib diisi").max(20),
  deskripsi: z.string().max(500).optional(),
});

const updateSchema = createSchema.extend({
  id: z.string().uuid("ID tidak valid"),
  isActive: z.boolean().optional(),
});

type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string | Record<string, string[]> };

export async function createNamaTabelAction(formData: unknown): Promise<ActionResult> {
  const user = await requireAuthorizedUser(["nama_modul.create"]);
  const parsed = createSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  try {
    const data = await createNamaTabel({ ...parsed.data, createdBy: user.id });
    await createAuditLog({ userId: user.id, modul: "nama_tabel", aksi: "CREATE", tableName: "nama_tabel", recordId: data.id, newData: data });
    revalidatePath("/dashboard/path-ke-halaman");
    return { success: true, message: "Data berhasil dibuat" };
  } catch (error) {
    console.error("[Server] createNamaTabelAction failed:", error);
    return { success: false, error: "Gagal membuat data. Silakan coba lagi." };
  }
}
```

Action update/delete/restore mengikuti pola yang sama: validasi `id`, ambil data lama bila perlu audit `oldData`, panggil helper, tulis audit log, `revalidatePath`, lalu balas `ActionResult`.

Checklist Server Action:

- `"use server"` di baris pertama file action.
- `requireAuthorizedUser([...permission])` ada di setiap action.
- Zod validasi semua input.
- Error user aman, tanpa detail internal.
- Mutasi mencatat `createAuditLog`.
- `revalidatePath` dipanggil setelah mutasi berhasil.
- Return type konsisten `ActionResult<T>`.

---

## FASE 4: Audit Log

Audit log wajib untuk mutasi penting. SELECT biasa tidak perlu dicatat, kecuali export/download data sensitif.

Template:

```typescript
await createAuditLog({
  userId: user.id,
  modul: "nama_modul",
  aksi: "CREATE",
  tableName: "nama_tabel",
  recordId: data.id,
  oldData: existingData,
  newData: data,
});
```

Aksi wajib:

| Modul | Aksi |
| --- | --- |
| Auth | LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT |
| Users | CREATE, UPDATE, SOFT_DELETE, RESTORE, HARD_DELETE, CHANGE_ROLE |
| Roles/Permissions | CREATE, UPDATE, DELETE, ASSIGN, REVOKE |
| Menus | CREATE, UPDATE, DELETE, REORDER |
| Master Data | CREATE, UPDATE, SOFT_DELETE, RESTORE, HARD_DELETE, IMPORT |
| PMB | STATUS_CHANGE, PAYMENT_VERIFY, GENERATE_NIM |
| Keuangan | CREATE_TAGIHAN, VERIFY_PAYMENT, REJECT_PAYMENT |
| KRS | SUBMIT, APPROVE, REJECT |
| Nilai | INPUT, UPDATE, PUBLISH |
| Settings | UPDATE |

Boleh diabaikan: SELECT biasa, pagination, search, filter, state UI lokal, dan export non-sensitif.

---

## FASE 5: Form Client Component

Form client hanya mengurus UX: validasi awal, loading state, error field, submit action, toast, dan callback sukses. Logic database jangan ditaruh di sini.

Pola minimal:

```typescript
"use client";

const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues,
});

async function onSubmit(values: FormValues) {
  setIsSubmitting(true);
  try {
    const result = isEdit
      ? await updateNamaTabelAction({ ...values, id })
      : await createNamaTabelAction(values);

    if (!result.success) {
      if (typeof result.error === "object") setServerFieldErrors(result.error);
      else toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Berhasil");
    onSuccess();
  } finally {
    setIsSubmitting(false);
  }
}
```

Checklist form:

- `"use client"` ada.
- `useForm` memakai `zodResolver`.
- `isSubmitting` mencegah double submit.
- Field error dari server dipasang ke field terkait.
- Toast sukses/gagal tersedia.
- Tombol submit punya loading state dan tombol batal tersedia.

---

## FASE 6: Manajemen Konteks Agent

Sebelum coding:

- Baca file terkait fitur, action, helper, route, dan schema yang sudah ada.
- Cek dokumentasi Next lokal di `node_modules/next/dist/docs/` bila menyentuh API Next.
- Cek env/status project sebelum memakai MCP.
- Pastikan tidak membaca, mencetak, atau menaruh secret ke output yang akan dicommit.
- Jika ada perubahan user di working tree, jangan revert kecuali diminta.

Saat coding:

- Ikuti pola lokal terdekat.
- Patch kecil dan sesuai scope.
- Jangan tambah abstraction kalau belum perlu.
- Jangan ubah layout/behavior kalau request hanya copy atau dokumen.
- Untuk perubahan DB, pakai migration dan cek advisor bila relevan.

Saat verifikasi:

- Jalankan test/lint/typecheck sesuai scope.
- Untuk dokumen, minimal cek panjang file dan diff.
- Untuk fitur runtime, verifikasi route/action/helper yang tersentuh.
- Laporkan kalau test tidak dijalankan dan alasannya.

---

## Output yang Diharapkan

Agent yang mengikuti SOP ini akan menghasilkan kode yang:

1. Konsisten dengan codebase.
2. Aman: auth, permission, validasi, RLS, audit log.
3. Lengkap: bukan pseudo-code setengah matang.
4. Mudah direview karena pola predictable.
5. Tidak membocorkan secret. Ini dasar, bukan fitur premium.

Dokumen ini adalah referensi hidup. Jika pola repo berubah, update SOP ini.