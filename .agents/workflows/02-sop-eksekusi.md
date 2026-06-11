---
description: SOP eksekusi AI Agent saat mengimplementasikan fitur di project SIAKAD. Workflow ini memastikan kode mengikuti arsitektur aktual, aman, lengkap, dan bisa diverifikasi.
---

# SOP Eksekusi AI Agent — SIAKAD STAI Al-Ittihad

## Tujuan

Pastikan setiap eksekusi fitur menghasilkan kode nyata, mengikuti pola project, aman dari bocor data/secret, dan bisa dibuktikan lewat type-check, lint, build, serta smoke test. Tidak boleh pseudo-code, tidak boleh "nanti dilengkapi", tidak boleh nebak-nebak. Kita bukan dukun.

> Prasyarat: SOP Berpikir (`01-sop-berpikir.md`) sudah selesai dan tervalidasi sebelum eksekusi kode.

---

## Aturan Wajib

- Baca file aktual sebelum edit.
- Ikuti arsitektur dan pola existing, bukan pola dari ingatan.
- Jangan hardcode role, permission, menu, data kampus, atau konfigurasi yang harusnya dari database/settings.
- Jangan expose secret. `SUPABASE_SERVICE_ROLE_KEY` hanya server-side, tidak pernah masuk client atau `NEXT_PUBLIC_*`.
- Mutasi data wajib punya auth check, validasi input, error handling, dan audit log jika aksinya penting.
- Query list wajib pakai pagination.
- Data aktif wajib filter soft delete: `deleted_at IS NULL`.
- Aksi delete default-nya soft delete, bukan `DELETE`, kecuali memang hard delete diminta dan aman.
- Kalau ubah schema, migration harus idempoten dan punya RLS/policy yang sesuai.
- Setelah implementasi, jalankan gate teknis. Kalau gagal, perbaiki dulu. Jangan pura-pura hijau.

---

## FASE 1: Analisis Kode Existing

### Langkah

1. Baca penuh file yang akan diedit.
2. Cari source of truth fitur: route, module, action, helper, schema, dan komponen terkait.
3. Identifikasi pola existing:
   - naming file/fungsi;
   - struktur return;
   - error handling;
   - validasi Zod;
   - auth helper;
   - audit log;
   - pola UI dan state.
4. Cek tabel database yang dipakai:
   - tabel sudah ada atau belum;
   - kolom standar tersedia;
   - RLS/policy tersedia;
   - relasi/FK aman;
   - kebutuhan index.
5. Tentukan file yang perlu dibuat/diubah. Jangan melebar tanpa alasan.

### Checklist

- [ ] File existing sudah dibaca.
- [ ] Pola project sudah dipahami.
- [ ] Tabel/kolom/relasi sudah dicek.
- [ ] Scope file yang diedit jelas.
- [ ] Risiko data/security sudah dicatat.

---

## FASE 2: Implementasi Database

Gunakan fase ini hanya jika ada perubahan schema.

### Aturan Migration

- Simpan migration di `supabase/migrations/` dengan nomor urut berikutnya.
- Gunakan `snake_case`.
- Gunakan UUID primary key kecuali project jelas memakai pola lain.
- Kolom standar untuk tabel bisnis:
  - `id`
  - `created_at`
  - `updated_at`
  - `deleted_at`
  - `created_by`
  - `updated_by`
- DDL harus idempoten:
  - `create table if not exists`
  - `create index if not exists`
  - `add column if not exists`
  - constraint/trigger/policy pakai guard `do $$ begin if not exists (...) then ... end if; end $$;`
- Pasang trigger `set_updated_at` jika tabel punya `updated_at`.
- Aktifkan RLS untuk tabel sensitif.
- Tambahkan policy yang sesuai, minimal service role backend jika memang operasi backend butuh.

### Checklist

- [ ] Migration bernomor urut benar.
- [ ] DDL idempoten.
- [ ] Kolom standar tersedia.
- [ ] Index untuk FK dan query umum tersedia.
- [ ] Trigger `updated_at` tersedia jika perlu.
- [ ] RLS dan policy tersedia.
- [ ] Tidak ada perubahan schema yang merusak data existing.

---

## FASE 3: Implementasi Backend

### Struktur Umum

- Query logic taruh di helper/service sesuai pola project, misalnya `src/lib/admin/` atau lokasi existing yang sejenis.
- Server Action taruh di `src/actions/` atau lokasi existing yang dipakai fitur tersebut.
- Server Action mutasi wajib:
  1. pakai `"use server"`;
  2. cek user dengan `requireUser` atau `requireAuthorizedUser(["permission"])`;
  3. validasi input dengan Zod;
  4. panggil helper/service;
  5. tulis audit log untuk create/update/delete/approve/reject/import/export penting;
  6. return format konsisten: `{ success: boolean, data?: T, error?: string | FieldErrors }`.

### Aturan Query

- Query data aktif wajib filter `deleted_at` null.
- Query data per user/tenant wajib filter scope user/tenant.
- Jangan ambil semua kolom jika tidak perlu.
- Query list wajib pagination.
- Hindari logic permission di UI saja. Backend tetap jadi penjaga pintu.
- Error database jangan bocor mentah ke user jika mengandung detail sensitif.

### Checklist

- [ ] Auth check ada sebelum akses data.
- [ ] Input divalidasi Zod.
- [ ] Helper/service mengikuti pola existing.
- [ ] Return action konsisten.
- [ ] Audit log tersedia untuk aksi penting.
- [ ] Query aman dari data lintas user.
- [ ] Service role hanya server-side.
- [ ] Soft delete dipakai untuk delete normal.

---

## FASE 4: Implementasi Frontend

### Aturan UI

- Ikuti komponen, layout, dan style existing.
- Jangan bikin style baru kalau project sudah punya pola.
- Tabel/list idealnya punya:
  - search;
  - filter;
  - pagination;
  - sort jika datanya butuh;
  - action menu sesuai permission;
  - loading state;
  - empty state;
  - error state.
- Form wajib:
  - React Hook Form jika project memakainya;
  - Zod resolver atau validasi setara;
  - menampilkan field error dari server;
  - disable submit saat pending;
  - toast/feedback sukses dan gagal.
- Aksi destruktif wajib dialog konfirmasi.
- UI harus responsive dan tidak bocor stack trace.

### Checklist

- [ ] UI mengikuti pola existing.
- [ ] Loading, empty, error state tersedia.
- [ ] Form punya validasi client dan server.
- [ ] Error server ditampilkan dengan jelas.
- [ ] Aksi destruktif punya konfirmasi.
- [ ] Permission UI sesuai akses user.
- [ ] Mobile tidak rusak.

---

## FASE 5: Security Review

### Review Wajib

Cek semua file yang dibuat/diubah:

- Tidak ada secret di repo.
- Tidak ada `NEXT_PUBLIC_SERVICE_ROLE_KEY`.
- Tidak ada service role di client component.
- Tidak ada auth bypass.
- Tidak ada query tanpa scope yang bisa bocor data user lain.
- Tidak ada hardcode role/menu/permission yang harusnya dinamis.
- Tidak ada webhook tanpa signature validation.
- Webhook/payment harus idempotent.
- Error message tidak membocorkan detail internal.

### Checklist

- [ ] Secret tidak bocor.
- [ ] Auth dan permission dicek di server.
- [ ] Data isolation aman.
- [ ] Soft delete filter konsisten.
- [ ] Webhook aman jika ada.
- [ ] Error aman untuk user.

---

## FASE 6: QA dan Verifikasi Teknis

### Gate Wajib

Jalankan setelah implementasi selesai:

```bash
npm run type-check
npm run lint
npm run build
```

Jika salah satu gagal, perbaiki dulu. Jangan lanjut commit dengan build merah. Merah ya merah, bukan "hampir hijau".

### Smoke Test Manual

Buat daftar route yang terdampak, lalu cek:

- halaman list tampil;
- data muncul sesuai scope user;
- create berjalan;
- edit berjalan;
- soft delete berjalan;
- restore berjalan jika fitur ada;
- hard delete berjalan jika memang ada;
- search/filter/pagination berjalan;
- import/export berjalan jika ada;
- input invalid menampilkan error;
- empty state tampil saat data kosong;
- audit log tercatat untuk aksi penting.

### Checklist

- [ ] `npm run type-check` sukses.
- [ ] `npm run lint` sukses.
- [ ] `npm run build` sukses.
- [ ] Smoke test happy path lolos.
- [ ] Smoke test edge/error case lolos.
- [ ] Audit log dicek jika ada mutasi penting.
- [ ] Tidak ada regression di route sekitar.

---

## FASE 7: Final Review

### Cek Bersih-Bersih

Sebelum selesai, pastikan:

- tidak ada `console.log` debug;
- tidak ada TODO palsu;
- tidak ada kode mati yang dikomentari;
- tidak ada import/variable unused;
- tidak ada `any` yang tidak sengaja;
- tidak ada formatter/lint issue baru;
- tidak ada file env/secret ikut masuk;
- tidak ada perubahan unrelated.

### Cek Regression Dasar

Minimal pastikan fitur sekitar masih masuk akal:

- login tidak rusak;
- dashboard tetap tampil;
- sidebar/navigasi tetap jalan;
- route yang tidak disentuh tidak ikut hancur;
- permission tetap sesuai.

### Checklist Akhir

- [ ] Kode lengkap, bukan pseudo-code.
- [ ] Scope sesuai request.
- [ ] Migration ada jika schema berubah.
- [ ] Security issue tidak ditemukan.
- [ ] Gate teknis hijau atau kegagalan dijelaskan dengan bukti.
- [ ] Smoke test dicatat.
- [ ] Known issue dicatat jika ada.
- [ ] Siap review/commit.

---

## Output yang Diharapkan

Setelah SOP ini selesai, AI Agent harus memberi:

1. Ringkasan perubahan file.
2. Migration yang ditambahkan, jika ada.
3. Bukti gate teknis: type-check, lint, build.
4. Daftar smoke test dan hasilnya.
5. Catatan security review.
6. Known issues atau blocker, kalau ada.

Format final harus singkat, jelas, berbasis bukti. Jangan jualan mimpi.
