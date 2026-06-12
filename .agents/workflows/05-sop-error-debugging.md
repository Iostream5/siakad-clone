---
description: SOP penanganan error, debugging, dan rollback ketika terjadi masalah selama pengerjaan. Workflow ini memastikan agent tidak panik, tidak membuat perubahan acak, dan menyelesaikan masalah secara sistematis tanpa merusak bagian lain yang sudah bekerja.
---

# SOP Penanganan Error, Debugging, dan Rollback — SIAKAD STAI Al-Ittihad

## Tujuan

Saat muncul error type-check, lint, build, runtime, atau database, agent wajib diagnosis dulu, baru fix. Jangan tebak-tebakan kaya dukun CLI: baca error, cari root cause, ubah secukupnya, lalu verifikasi. Debugging acak yang menyentuh banyak file biasanya cuma mengubah satu bug jadi satu kampung bug.

---

## FASE 1: TRIASE ERROR

### Prioritas

| Kategori | Gejala | Prioritas |
|---|---|---|
| **Build Error** | `npm run build` gagal, type error, import hilang | KRITIS: hentikan task, fix dulu |
| **Runtime Error** | Halaman crash, Server Action throw, data kosong | KRITIS: fix sebelum lanjut |
| **Migration Error** | SQL gagal, constraint violation | KRITIS: jangan apply migration lain |
| **Logic Error** | Data salah, filter/pagination kacau | TINGGI: fix sebelum task berikut |
| **UI Error** | Layout pecah, komponen tidak render | TINGGI: fix sebelum PR |
| **Lint Warning** | unused variable, dependency warning | RENDAH: catat, fix akhir task |
| **Performance** | query lambat, loading lama | RENDAH: catat backlog |

### Langkah

1. Baca pesan error lengkap dari atas sampai bawah.
2. Fokus pada error pertama yang valid; error berikutnya sering cuma efek domino.
3. Catat file, baris, jenis error, dan perubahan terakhir sebelum error muncul.
4. Tentukan status:
   - **Regresi:** muncul setelah perubahan terakhir. Fokus ke diff terbaru.
   - **Error baru:** kode baru belum pernah diuji.
   - **Error laten:** sudah ada sebelum scope ini. Jangan dibetulkan diam-diam; catat dulu.

### Checklist

- [ ] Kategori dan prioritas error jelas.
- [ ] File, baris, dan jenis error diketahui.
- [ ] Sudah dibedakan regresi, error baru, atau error laten.
- [ ] Fix belum dimulai sebelum root cause masuk akal.

---

## FASE 2: BUILD ERROR DAN TYPE ERROR

### Langkah

1. Jalankan cek dengan output cukup:

```bash
npm run type-check 2>&1 | head -100
```

2. Perbaiki dari error pertama yang paling akar.
3. Setelah satu fix, cek ulang:

```bash
npm run type-check 2>&1 | head -50
```

4. Ulangi sampai bersih. Jangan borongan kalau belum paham.

### Pola Error Umum

**Cannot find module**

- Penyebab: path salah atau file tidak ada.
- Fix: cek file target dan import path.
- Jangan: tambah `@ts-ignore` atau `any`.

**Type '...' is not assignable to type '...'**

- Penyebab: return/data tidak sesuai kontrak tipe.
- Fix: baca tipe yang diminta, sesuaikan return/interface.
- Jangan: `as any` demi biar diam. Itu bukan fix, itu lakban.

**Property '...' does not exist on type '...'**

- Penyebab: akses field yang tidak ada di tipe.
- Fix: cek shape data asli; tambahkan ke interface kalau memang valid.
- Jangan: optional chaining untuk menyembunyikan salah tipe.

**Object is possibly null/undefined**

- Penyebab: nullable belum di-handle.
- Fix: pakai guard/early return.
- Jangan: `!` kalau tidak benar-benar yakin.

### Contoh

Benar:

```typescript
interface KampusRow {
  id: string;
  nama: string;
  kode: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
```

Salah:

```typescript
const kampus = data as any;
const deletedAt = kampus.deleted_at;
```

### Checklist

- [ ] Error dibaca berurutan.
- [ ] Root cause ditemukan, bukan cuma gejala.
- [ ] Tidak pakai `any`, `@ts-ignore`, atau cast asal.
- [ ] `type-check` dijalankan ulang.
- [ ] Tidak muncul error baru akibat fix.

---

## FASE 3: RUNTIME ERROR

### Lokasi yang Harus Dicek

- Server Component saat render.
- Server Action saat mutasi.
- Client Component saat interaksi.
- API Route Handler saat request.
- Database query saat eksekusi.

### Logging Aman

Logging boleh, tapi jangan bocorkan secret, password, token, service role key, data pribadi, atau payload sensitif.

```typescript
console.error("[DEBUG kampus.ts] Query error:", {
  errorCode: error.code,
  errorMessage: error.message,
});
```

Untuk Server Action, log detail di server, kirim pesan aman ke client:

```typescript
export async function createKampusAction(data: unknown) {
  try {
    // logic
  } catch (error) {
    console.error("[Server] createKampusAction failed:", error);
    return { success: false, error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}
```

Jangan kirim `error.message` mentah ke client. Bisa berisi SQL, path internal, nama tabel, atau detail sistem. Iya, bocor dikit tetap bocor.

### Isolasi Masalah

Jika Server Action gagal:

1. Test dengan data minimal yang valid.
2. Cek helper query di luar action.
3. Cek Supabase client.
4. Cek session user.

Jika query Supabase gagal:

```typescript
const { data, error } = await supabase.from("kampus").select("*");

if (error) {
  console.error("[Query] kampus select failed:", error.code, error.message);
  throw error;
}

if (!data) return [];
```

### Checklist

- [ ] Lokasi error jelas: server, client, API, atau database.
- [ ] Logging aman dan sementara.
- [ ] Error diperkecil ke kasus paling sederhana.
- [ ] Query Supabase selalu cek `error` sebelum `data`.
- [ ] Pesan ke user tidak mengandung detail internal.

---

## FASE 4: MIGRATION ERROR

### Aturan Utama

Jangan apply migration lain sebelum error migration selesai. Database yang setengah berubah itu bukan lucu, itu kerja bakti gratis.

### Pola Error SQL

**duplicate key value violates unique constraint**

```sql
INSERT INTO public.settings (key, value)
VALUES ('some.key', '{}')
ON CONFLICT (key) DO NOTHING;
```

**relation "..." already exists**

```sql
CREATE TABLE IF NOT EXISTS public.contoh_tabel (
  id uuid primary key default gen_random_uuid()
);
```

**column "..." already exists**

```sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_login_ip text;
```

**violates foreign key constraint**

Fix urutan data: insert parent dulu, hapus data pelanggar, atau ubah urutan `INSERT`.

### Verifikasi State Database

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'nama_tabel';

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'nama_tabel';

SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'nama_tabel';
```

### Checklist

- [ ] Tidak apply migration lain sebelum beres.
- [ ] Error SQL dan root cause dipahami.
- [ ] Fix idempoten memakai `IF NOT EXISTS` atau `ON CONFLICT` bila relevan.
- [ ] State database dicek setelah fix.
- [ ] RLS/constraint penting tidak rusak.

---

## FASE 5: ROLLBACK

### Kapan Rollback

Rollback kode jika:

- Build gagal dan fix cepat tidak aman.
- Ada regresi di fitur penting.
- Perubahan keluar scope.

Rollback database jika:

- Migration korup data.
- Mengunci tabel penting terlalu lama.
- Tidak bisa lanjut dengan aman.

### Rollback Kode

Cek dulu diff, jangan asal sapu satu repo. Nanti nangisnya berjamaah.

```bash
git diff src/actions/kampus.ts
git checkout -- src/actions/kampus.ts
```

Jika sudah commit:

```bash
git log --oneline -5
git revert HEAD
```

### Rollback Database

Supabase tidak punya rollback otomatis. Backup dulu data terdampak, rollback manual, lalu verifikasi.

```sql
CREATE TABLE public._backup_kampus AS SELECT * FROM public.kampus;

ALTER TABLE public.kampus DROP COLUMN IF EXISTS kolom_baru;
DROP TABLE IF EXISTS public.tabel_baru;
ALTER TABLE public.kampus DROP CONSTRAINT IF EXISTS nama_constraint;

DROP TABLE IF EXISTS public._backup_kampus;
```

### Dokumentasi Rollback

Catat rollback di final response atau dokumen progress jika repo menyediakannya:

```markdown
### [Tanggal] - ROLLBACK: Phase 1.5 Kampus Manager

**Alasan:** Build gagal karena import circular.
**File:** src/modules/master-data/kampus-manager.tsx.
**Database:** Tidak ada rollback database.
**Rencana:** Pisahkan table component, ulangi tanpa circular import.
**Status:** Rollback selesai.
```

### Checklist

- [ ] Alasan rollback jelas.
- [ ] Rollback tepat sasaran, bukan reset brutal.
- [ ] Build/type/lint diverifikasi lagi.
- [ ] Rollback dicatat di final response atau dokumen progress jika repo menyediakannya.
- [ ] Rencana fix ulang sudah ada.

---

## FASE 6: PENCEGAHAN ERROR BERULANG

Setelah error selesai, lakukan root cause analysis:

- Kenapa error terjadi?
- Apakah pola sama ada di file lain?
- Apa guard agar tidak terulang?

Cari pola sejenis:

```bash
rg "pattern_yang_salah" src
```

Jika error berasal dari aturan yang belum terdokumentasi, tambahkan catatan ke workflow terkait.

### Checklist Akhir

- [ ] Error sudah diperbaiki dan diverifikasi.
- [ ] `npm run type-check` hijau.
- [ ] `npm run lint` hijau, jika relevan.
- [ ] `npm run build` hijau, jika relevan.
- [ ] Pola sama di file lain sudah dicek.
- [ ] Error signifikan dicatat di final response atau dokumen progress jika repo menyediakannya.
- [ ] Tidak ada scope creep akibat debugging.
- [ ] Rollback, jika ada, terdokumentasi.

---

## Output yang Diharapkan

1. **Error teratasi:** type-check, lint, dan build kembali hijau sesuai kebutuhan task.
2. **Root cause jelas:** tahu mengapa error terjadi dan cara mencegahnya.
3. **Tidak ada regresi baru:** fix tidak merusak fitur lain.
4. **Rollback terdokumentasi:** jika dilakukan, alasan dan dampaknya tercatat.
5. **Scope tetap jinak:** debugging tidak berubah jadi refactor liar.
