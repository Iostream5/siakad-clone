---
description: SOP pengelolaan database migration untuk SIAKAD. Mencakup cara membuat migration baru, memverifikasi schema live vs lokal, backup sebelum apply, dan strategi rollback database yang aman.
---

# SOP Database Migration — SIAKAD STAI Al-Ittihad

## Tujuan

Memastikan setiap perubahan schema database dilakukan dengan aman, terurut, idempoten, dan dapat di-rollback. Migration yang ceroboh adalah penyebab utama data corrupt di production.

---

## FASE 1: ANALISIS KEBUTUHAN MIGRATION

### Langkah-langkah

STEP 1: Tentukan apakah migration benar-benar diperlukan.

Migration diperlukan jika:
- Menambah tabel baru
- Menambah atau mengubah kolom
- Menambah index atau constraint
- Mengubah RLS policy
- Menambah trigger atau function

Migration TIDAK diperlukan jika:
- Hanya perubahan kode aplikasi
- Perubahan seed data yang sudah pakai `ON CONFLICT`
- Perubahan di layer Supabase Storage atau Auth settings

STEP 2: Cek nomor migration terakhir.

```bash
ls supabase/migrations/ | sort | tail -5
# Output contoh:
# 020_finance_payment_gateway.sql
# 021_academic_foundation_extensions.sql
# 022_dynamic_menu_builder.sql
```

Nomor berikutnya adalah `023`. Gunakan format: `NNN_nama_deskriptif.sql`.

STEP 3: Verifikasi tabel yang akan disentuh belum ada konflik.

Sebelum menulis migration, cek kondisi live via MCP atau Supabase dashboard:

```sql
-- Cek apakah tabel sudah ada
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Cek kolom tabel existing
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'nama_tabel'
ORDER BY ordinal_position;
```

### Checklist

- [ ] Konfirmasi migration memang diperlukan (bukan cukup dengan perubahan kode)
- [ ] Nomor urut migration sudah dicek
- [ ] Kondisi tabel di database live sudah diverifikasi
- [ ] Tidak ada migration lain yang sedang bermasalah

---

## FASE 2: PENULISAN MIGRATION

### Langkah-langkah

STEP 1: Ikuti aturan ketat penulisan migration.

**Wajib:**
- Semua `CREATE TABLE` menggunakan `IF NOT EXISTS`
- Semua `ALTER TABLE ADD COLUMN` menggunakan `IF NOT EXISTS`
- Semua trigger dibungkus `DO $$ ... $$` dengan pengecekan `pg_trigger`
- Semua policy dibungkus `DO $$ ... $$` dengan pengecekan `pg_policies`
- Semua `INSERT` seed menggunakan `ON CONFLICT DO NOTHING` atau `DO UPDATE`

**Dilarang:**
- `DROP TABLE` tanpa `IF EXISTS` — berbahaya di production
- `ALTER TABLE DROP COLUMN` tanpa backup plan
- Migration tanpa RLS untuk tabel sensitif
- Memodifikasi migration lama yang sudah diapply

STEP 2: Struktur file migration yang benar.

```sql
-- supabase/migrations/023_nama_fitur.sql
-- Deskripsi singkat apa yang dilakukan migration ini

-- 1. Tabel baru (jika ada)
create table if not exists public.nama_tabel (
  id          uuid        not null default gen_random_uuid() primary key,
  nama        text        not null,
  deleted_at  timestamptz null,
  created_by  uuid        null references public.users(id) on delete set null,
  updated_by  uuid        null references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Kolom tambahan ke tabel existing (jika ada)
alter table public.tabel_lain
  add column if not exists kolom_baru text;

-- 3. Index
create index if not exists idx_nama_tabel_deleted
  on public.nama_tabel(deleted_at)
  where deleted_at is null;

-- 4. Trigger
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_nama_tabel_updated'
  ) then
    create trigger trg_nama_tabel_updated
    before update on public.nama_tabel
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- 5. RLS
alter table public.nama_tabel enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'nama_tabel'
      and policyname = 'Service role manage nama_tabel'
  ) then
    create policy "Service role manage nama_tabel"
    on public.nama_tabel for all to service_role
    using (true) with check (true);
  end if;
end $$;

-- 6. Seed data (jika ada)
insert into public.nama_tabel (nama)
values ('Contoh Data')
on conflict do nothing;
```

STEP 3: Test migration secara lokal sebelum apply ke Supabase dev.

```bash
# Jalankan migration via Supabase CLI (jika tersedia)
npx supabase db push

# Atau jalankan langsung via SQL editor Supabase dashboard
# Paste isi file migration dan jalankan
```

### Checklist

- [ ] Semua DDL menggunakan `IF NOT EXISTS` atau dibungkus guard
- [ ] Trigger dibungkus `DO $$ ... $$` dengan cek `pg_trigger`
- [ ] Policy dibungkus `DO $$ ... $$` dengan cek `pg_policies`
- [ ] RLS diaktifkan untuk tabel sensitif
- [ ] Seed data menggunakan `ON CONFLICT`
- [ ] File disimpan dengan nama dan nomor urut yang benar

---

## FASE 3: APPLY MIGRATION KE SUPABASE DEV

### Langkah-langkah

STEP 1: Backup data penting sebelum apply migration yang berisiko.

Migration yang berisiko (butuh backup):
- `ALTER TABLE DROP COLUMN`
- `DROP TABLE`
- Mengubah constraint yang sudah ada data
- Migration yang memperbarui data massal

```sql
-- Backup tabel sebelum migration berisiko
CREATE TABLE public._backup_nama_tabel_YYYYMMDD
AS SELECT * FROM public.nama_tabel;
```

STEP 2: Apply migration ke Supabase dev.

Karena `STATUS_PROJECT` adalah `DEV`, gunakan MCP `siakad_dev` atau Supabase dashboard SQL editor.

Urutan apply yang aman:
1. Jalankan migration SQL di SQL editor
2. Verifikasi tidak ada error
3. Cek tabel, kolom, dan index yang dibuat
4. Jalankan `npm run type-check` dan `npm run build`

STEP 3: Verifikasi hasil migration.

```sql
-- Verifikasi tabel ada
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'nama_tabel';

-- Verifikasi RLS aktif
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'nama_tabel';

-- Verifikasi index ada
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'nama_tabel';

-- Verifikasi policy ada
SELECT policyname FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'nama_tabel';
```

### Checklist

- [ ] Backup dibuat untuk migration berisiko
- [ ] Migration diapply ke Supabase dev (bukan production langsung)
- [ ] Tidak ada error SQL saat apply
- [ ] Tabel, kolom, index, dan policy diverifikasi ada
- [ ] RLS aktif diverifikasi
- [ ] `npm run type-check` dan `npm run build` tetap hijau setelah migration

---

## FASE 4: STRATEGI ROLLBACK MIGRATION

### Langkah-langkah

STEP 1: Buat rollback script bersamaan dengan migration.

Setiap migration yang signifikan harus punya rollback script yang ditulis bersamaan:

```sql
-- rollback/023_nama_fitur_rollback.sql
-- Jalankan ini HANYA jika perlu rollback migration 023

-- Hapus tabel baru (jika migration hanya tambah tabel)
DROP TABLE IF EXISTS public.nama_tabel;

-- Hapus kolom tambahan (jika migration tambah kolom ke tabel existing)
ALTER TABLE public.tabel_lain
  DROP COLUMN IF EXISTS kolom_baru;

-- Hapus index
DROP INDEX IF EXISTS public.idx_nama_tabel_deleted;
```

STEP 2: Prosedur rollback darurat di production.

Jika migration sudah terlanjur apply di production dan bermasalah:

```sql
-- 1. Restore dari backup (jika ada)
INSERT INTO public.nama_tabel
SELECT * FROM public._backup_nama_tabel_YYYYMMDD
ON CONFLICT (id) DO UPDATE SET
  nama = EXCLUDED.nama,
  updated_at = now();

-- 2. Hapus backup setelah restore berhasil
DROP TABLE IF EXISTS public._backup_nama_tabel_YYYYMMDD;
```

STEP 3: Catat rollback di final response atau dokumen progress jika repo menyediakannya.

```markdown
### [Tanggal] — ROLLBACK Migration 023

**Alasan:** Constraint baru di kolom `kode` menyebabkan data existing yang
  punya kode null tidak bisa diupdate.

**Tindakan:**
- Kolom `kode` di-drop kembali
- Data tidak corrupt karena kolom baru, belum ada data masuk

**Perbaikan:** Migration 024 akan ditambahkan dengan default value untuk
  kolom `kode` agar data existing tidak terpengaruh.
```

### Checklist

- [ ] Rollback script tersedia untuk migration signifikan
- [ ] Backup tersedia untuk migration yang mengubah data existing
- [ ] Rollback diverifikasi berjalan di dev sebelum dibutuhkan di production
- [ ] Rollback terdokumentasi di final response atau dokumen progress jika dijalankan

---

## FASE 5: SINKRONISASI LOKAL VS LIVE

### Langkah-langkah

STEP 1: Pastikan migration lokal dan Supabase dev selalu sinkron.

Aturan sinkronisasi:
- File migration di `supabase/migrations/` adalah sumber kebenaran
- Jangan ubah schema langsung di Supabase dashboard tanpa membuat file migration
- Setiap perubahan di dashboard harus segera direkam sebagai migration file

STEP 2: Deteksi gap antara lokal dan live.

Jika ada perbedaan antara schema lokal dan Supabase live (seperti tabel `edom_*` dan `notification_devices` yang ada di live tapi tidak di migrasi lokal — lihat `clone-dumps/siakad_live_schema_patch.sql`):

```
1. Identifikasi tabel yang ada di live tapi tidak di migration lokal
2. Buat migration patch untuk menangkap perbedaan tersebut
3. Simpan sebagai file migration baru (contoh: 023_live_schema_patch.sql)
4. Pastikan file patch idempoten (IF NOT EXISTS)
```

STEP 3: Catat setiap migration baru yang diapply di final response atau dokumen progress jika repo menyediakannya.

```markdown
### [Tanggal] — Migration 023: Fitur Baru

**File:** supabase/migrations/023_nama_fitur.sql
**Diapply ke:** Supabase DEV (siakad_dev)
**Tabel baru:** nama_tabel
**Kolom baru:** -
**Status:** ✅ Sukses
**Verifikasi:** RLS aktif, index ada, build hijau
```

### Checklist Akhir

```
□ Nomor migration urut dan tidak ada gap
□ Semua migration idempoten (bisa dijalankan ulang tanpa error)
□ Schema lokal dan Supabase dev sinkron
□ Tidak ada perubahan schema yang dilakukan langsung di dashboard tanpa file migration
□ Rollback script tersedia untuk migration berisiko
□ Catatan migration diperbarui setelah apply
□ build tetap hijau setelah migration
```

---

## Output yang Diharapkan

Setelah SOP ini dijalankan, kondisi yang harus tercapai:

1. **Migration tersimpan sebagai file** di `supabase/migrations/` dengan nomor urut yang benar.
2. **Migration idempoten** — aman dijalankan berulang tanpa error.
3. **Schema live dan lokal sinkron** — tidak ada tabel atau kolom yang hanya ada di salah satu.
4. **Rollback tersedia** untuk migration yang berisiko.
5. **Build tetap hijau** setelah migration diapply.
