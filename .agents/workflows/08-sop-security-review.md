---
description: SOP security review untuk SIAKAD. Checklist keamanan berlapis yang harus diverifikasi di setiap task: RLS database, Server Action authorization, webhook signature, secret management, dan data isolation antar role.
---

# SOP Security Review — SIAKAD STAI Al-Ittihad

## Tujuan

Keamanan bukan fitur terpisah yang dikerjakan di akhir. Setiap task yang menyentuh data atau mutasi harus melewati security review ini. Satu celah di Server Action atau satu tabel tanpa RLS bisa membocorkan data seluruh kampus.

---

## FASE 1: REVIEW LAYER DATABASE (RLS)

### Langkah-langkah

STEP 1: Verifikasi RLS aktif untuk semua tabel sensitif.

Tabel berikut **wajib** RLS aktif. Cek via Supabase dashboard atau query:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- rowsecurity = true → RLS aktif ✅
-- rowsecurity = false → BERBAHAYA ❌
```

Daftar tabel yang wajib RLS:

| Tabel | Alasan |
|-------|--------|
| `users` | Data pribadi seluruh user |
| `user_roles` | Hak akses user |
| `menus` | Konfigurasi sistem |
| `settings` | Konfigurasi sensitif termasuk API key |
| `audit_logs` | Log aktivitas tidak boleh dimanipulasi |
| `pmb_pendaftaran` | Data calon mahasiswa |
| `pmb_pembayaran` | Data pembayaran |
| `tagihan` | Data keuangan mahasiswa |
| `pembayaran` | Riwayat pembayaran |
| `mahasiswa` | Data akademik mahasiswa |
| `nilai_akhir` | Nilai akademik |
| `krs_header` | KRS mahasiswa |
| `lms_pengumpulan` | Submission tugas |
| `notification_devices` | Token FCM user |
| `notification_queue` | Antrian notifikasi |
| `edom_responses` | Jawaban evaluasi |

STEP 2: Verifikasi policy yang benar sudah ada.

Setiap tabel sensitif minimal harus punya dua policy:

```sql
-- Policy 1: Service role bisa semua (untuk backend)
CREATE POLICY "Service role manage nama_tabel"
ON public.nama_tabel FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Policy 2: User hanya bisa baca datanya sendiri (contoh notifikasi)
CREATE POLICY "User read own notifikasi"
ON public.notifikasi FOR SELECT
USING (auth.uid() = id_user);
```

STEP 3: Pastikan tidak ada tabel yang terbuka ke `anon` tanpa alasan.

```sql
-- Cek policy yang memberi akses ke anon
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND 'anon' = ANY(roles::text[]);
-- Jika ada hasil: review apakah memang disengaja
```

Tabel yang boleh dibaca `anon` (tanpa login):
- `pengumuman` — pengumuman publik kampus
- `program_studi` — info prodi untuk halaman PMB publik

Semua tabel lain: tidak boleh `anon`.

### Checklist

- [ ] RLS aktif untuk semua tabel sensitif (lihat daftar di atas)
- [ ] Policy service role ada untuk setiap tabel sensitif
- [ ] Tidak ada tabel sensitif terbuka ke `anon`
- [ ] Policy user-specific ada untuk tabel per-user (notifikasi, KRS, nilai)

---

## FASE 2: REVIEW LAYER SERVER ACTION

### Langkah-langkah

STEP 1: Setiap Server Action mutasi wajib punya auth check.

```typescript
// ✅ BENAR — auth check sebelum apapun
export async function createKampusAction(data: unknown) {
  const user = await requireAuthorizedUser(["campuses.create"]);
  // ... lanjut hanya jika user valid dan punya permission
}

// ❌ SALAH — tidak ada auth check
export async function createKampusAction(data: unknown) {
  const supabase = await createServerClient();
  await supabase.from("kampus").insert(data); // siapapun bisa panggil ini
}
```

STEP 2: Verifikasi semua file `src/actions/` sudah punya auth check.

```bash
# Cari Server Action yang tidak punya requireUser atau requireAuthorizedUser
grep -rn "export async function" src/actions/ | grep -v "^Binary"
# Lalu manual review setiap fungsi mutasi
```

Pola yang wajib ada di setiap action mutasi:
```
1. requireUser() atau requireAuthorizedUser(["permission"])
2. z.safeParse(formData) untuk validasi input
3. try-catch untuk error handling
4. Return format konsisten: { success, data?, error? }
5. Error message ke client tidak mengandung detail internal
```

STEP 3: Pastikan read action juga aman untuk data sensitif.

Tidak semua read action bebas diakses. Contoh:

```typescript
// ✅ BENAR — mahasiswa hanya bisa baca nilainya sendiri
export async function getMyNilaiAction() {
  const user = await requireUser();
  // query dengan filter user.id — bukan query semua nilai
  return getNilaiByMahasiswaId(user.studentId);
}

// ❌ SALAH — semua nilai bisa dibaca siapapun yang login
export async function getAllNilaiAction() {
  const user = await requireUser(); // hanya cek login, tidak cek scope
  return getAllNilai(); // tidak ada filter per mahasiswa
}
```

### Checklist

- [ ] Semua action mutasi punya `requireAuthorizedUser` dengan permission spesifik
- [ ] Semua action read untuk data sensitif punya filter scope yang benar
- [ ] Input divalidasi Zod sebelum menyentuh database
- [ ] Error message ke client tidak bocorkan detail internal atau SQL
- [ ] Tidak ada action yang bisa dipanggil dari browser tanpa session

---

## FASE 3: REVIEW SECRET DAN ENVIRONMENT

### Langkah-langkah

STEP 1: Audit environment variables.

```bash
# Cek secret yang tidak sengaja masuk git
git log --all --full-history -- .env.local
git log --all --full-history -- .env

# Cek file env yang ter-track
git ls-files | grep -i "\.env"
# Hanya .env.example yang boleh ada
```

STEP 2: Verifikasi secret tidak bocor ke client bundle.

Aturan prefix env:
- `NEXT_PUBLIC_*` → masuk ke client bundle, terlihat di browser → **HANYA untuk non-secret**
- Tanpa prefix → server-only → **untuk semua secret**

```bash
# ✅ BOLEH pakai NEXT_PUBLIC_
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # anon key memang publik

# ❌ JANGAN pakai NEXT_PUBLIC_ untuk ini
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MIDTRANS_SERVER_KEY=SB-...        # ini BERBAHAYA
```

STEP 3: Verifikasi service role hanya dipakai server-side.

```bash
# Cari penggunaan admin client di file yang salah
grep -rn "createAdminClient\|service_role" src/
# Pastikan tidak ada di file dengan "use client" directive
# Pastikan tidak ada di file di bawah src/app yang bisa diakses client
```

### Checklist

- [ ] `.env.local` tidak ada di git history
- [ ] `.env.example` ada dan lengkap tanpa nilai secret
- [ ] `SUPABASE_SERVICE_ROLE_KEY` tidak punya prefix `NEXT_PUBLIC_`
- [ ] Semua payment gateway server key tidak punya prefix `NEXT_PUBLIC_`
- [ ] Admin client (`createAdminClient`) hanya dipanggil di server-side code
- [ ] Tidak ada secret yang ditulis hardcode di dalam kode

---

## FASE 4: REVIEW WEBHOOK SECURITY

### Langkah-langkah

STEP 1: Setiap webhook payment wajib validasi signature.

```typescript
// ✅ BENAR — validasi signature Midtrans sebelum proses
export async function POST(request: Request) {
  const body = await request.text(); // baca sebagai raw text
  const payload = JSON.parse(body);

  // Validasi signature
  const expectedSignature = createMidtransSignature(
    payload.order_id,
    payload.status_code,
    payload.gross_amount,
    process.env.MIDTRANS_SERVER_KEY!,
  );

  if (payload.signature_key !== expectedSignature) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Baru proses setelah signature valid
  await processPayment(payload);
  return Response.json({ ok: true });
}

// ❌ SALAH — langsung proses tanpa validasi signature
export async function POST(request: Request) {
  const payload = await request.json();
  await processPayment(payload); // siapapun bisa kirim payload palsu
}
```

STEP 2: Pastikan webhook idempoten.

```typescript
// ✅ BENAR — cek apakah sudah diproses sebelumnya
const existing = await getPaymentByProviderReference(
  payload.transaction_id
);

if (existing?.status === "Terverifikasi") {
  // Sudah diproses, return 200 tapi tidak proses ulang
  return Response.json({ ok: true, message: "Already processed" });
}
// Lanjut proses hanya jika belum
```

STEP 3: Webhook error tidak boleh bocorkan detail internal.

```typescript
// ✅ BENAR — log detail di server, kirim pesan aman ke caller
catch (error) {
  console.error("[Webhook] Processing failed:", error);
  return Response.json(
    { error: "Internal processing error" }, // pesan generik
    { status: 500 }
  );
}

// ❌ SALAH — error detail bocor ke response
catch (error) {
  return Response.json({ error: error.message }, { status: 500 });
  // error.message bisa berisi SQL, stack trace, atau info internal
}
```

### Checklist

- [ ] Semua Route Handler webhook memvalidasi signature
- [ ] Webhook idempoten — tidak memproses ulang transaksi yang sudah selesai
- [ ] Error response webhook tidak mengandung detail internal
- [ ] Server key untuk validasi signature diambil dari env, bukan hardcode
- [ ] Webhook endpoint tidak butuh session tapi tetap validasi signature

---

## FASE 5: REVIEW DATA ISOLATION ANTAR ROLE

### Langkah-langkah

STEP 1: Verifikasi setiap role hanya melihat data yang sesuai haknya.

| Role | Yang boleh dilihat | Yang tidak boleh dilihat |
|------|-------------------|--------------------------|
| Mahasiswa | Data diri sendiri, KRS sendiri, nilai sendiri, tagihan sendiri | Data mahasiswa lain |
| Dosen | Kelas yang dia ajar, nilai mahasiswa di kelasnya | Nilai kelas dosen lain |
| Prodi | Data prodi terkait | Data prodi lain |
| Keuangan | Tagihan dan pembayaran semua mahasiswa | Nilai akademik |
| Pimpinan | Ringkasan dan laporan | Detail sensitif individual |
| Admin | Semua data | — |

STEP 2: Test data isolation secara manual.

```
Scenario: Mahasiswa A tidak boleh melihat nilai Mahasiswa B

1. Login sebagai Mahasiswa A
2. Buka halaman nilai
3. Verifikasi hanya nilai A yang tampil
4. Coba akses URL nilai milik B secara langsung
5. Harus redirect atau tampil 403/404
```

STEP 3: Verifikasi Server Action tidak bisa di-bypass dengan manipulasi ID.

```typescript
// ✅ BENAR — selalu filter dengan ID user yang sedang login
export async function getMyKrsAction() {
  const user = await requireUser();
  // Cari mahasiswa_id dari user yang login
  const mahasiswa = await getMahasiswaByUserId(user.id);
  if (!mahasiswa) return { success: false, error: "Data mahasiswa tidak ditemukan" };
  // Query dengan mahasiswa.id — tidak bisa diganti dari luar
  return getKrsByMahasiswaId(mahasiswa.id);
}

// ❌ SALAH — menerima mahasiswaId dari input luar
export async function getKrsAction(mahasiswaId: string) {
  const user = await requireUser();
  // user bisa kirim mahasiswaId milik orang lain
  return getKrsByMahasiswaId(mahasiswaId);
}
```

### Checklist

- [ ] Mahasiswa hanya bisa akses data diri sendiri (nilai, KRS, tagihan)
- [ ] Dosen hanya bisa akses kelas yang dia ajar
- [ ] Prodi hanya bisa akses data prodi terkait (jika aturan scope aktif)
- [ ] ID sensitif tidak diterima dari input user eksternal — selalu resolve dari session
- [ ] Direct URL access ke data orang lain di-handle (redirect atau 403)

---

## FASE 6: FINAL SECURITY CHECKLIST

### Checklist Akhir Per Task

```
□ RLS aktif untuk semua tabel yang disentuh task ini
□ Policy service role ada untuk backend
□ Tidak ada tabel sensitif baru terbuka ke anon
□ Semua Server Action mutasi punya requireAuthorizedUser
□ Input divalidasi Zod sebelum menyentuh database
□ Error ke client tidak bocorkan detail internal
□ Tidak ada secret baru pakai NEXT_PUBLIC_ prefix
□ Admin client hanya dipakai server-side
□ Webhook memvalidasi signature dan idempoten
□ Data isolation antar role sudah diverifikasi
□ ID sensitif tidak diterima dari input user luar
```

---

## Output yang Diharapkan

Setelah SOP Security Review dijalankan:

1. **Tidak ada tabel sensitif tanpa RLS** — semua data terlindungi di level database.
2. **Tidak ada Server Action tanpa auth check** — semua mutasi memerlukan session valid dan permission yang tepat.
3. **Tidak ada secret yang bocor** — baik ke client bundle, git history, maupun response error.
4. **Data isolation terjaga** — setiap role hanya melihat data yang menjadi haknya.
5. **Webhook aman** — signature divalidasi, idempoten, dan tidak bocor informasi internal.
