# Rangkuman Saran Perbaikan Urgent SIAKAD (Gabungan)

Tanggal: 18 Juni 2026
Status project: DEV
Basis: Audit kode aktual + `docs/AUDIT-FITUR-WORKFLOW-SIAKAD-2026-06-18.md` + `docs/PRD-SIAKAD.md` + Rules `.agents/rules/*`

---

## Status Ringkas

| Gate | Kondisi |
| --- | --- |
| `npm run type-check` | ✅ PASS |
| `npm run lint` | ⚠️ PASS, 264 warning (`any`, unused vars, React Compiler) |
| `npm run build` | ✅ PASS (59 routes) |
| `npm audit` | ❌ 9 vulnerabilities (3 high) |
| Fitur end-to-end | ❌ Belum terbukti — data DEV hampir semua kosong |
| Production readiness | ❌ ~55% |

## Verdict

Project belum siap disebut semua fitur berjalan baik. Fondasi sudah hidup, tetapi ada beberapa hal urgent yang harus dibereskan sebelum demo serius, user testing luas, atau production readiness.

Prioritas paling penting: keamanan secret/history, dependency rentan, data DEV untuk test workflow, dynamic menu database, EDOM, dan audit mutasi. Ini dulu. Fitur baru nanti. Bayi sistemnya jangan dikasih sepatu balap dulu.

---

## Urutan Perbaikan Paling Urgent (P0)

| Prioritas | Area | Kenapa Urgent | Target Selesai |
| --- | --- | --- | --- |
| P0-1 | Secret dan Git history | History masih pernah menyentuh pola env/secret. Kalau push publik/shared, ini berbahaya. | Secret sudah rotate/revoke, history bersih, tracked files aman. |
| P0-2 | Dependency security | `npm audit` menemukan 9 vulnerability, 3 high, termasuk `next`, `xlsx`, dan `ws` (transitive). | `next` naik ke versi patched, strategi `xlsx` diputuskan. |
| P0-3 | Seed data DEV | Banyak workflow tidak bisa dibuktikan karena tabel bisnis masih kosong. | Data minimal semua role dan flow utama tersedia. |
| P0-4 | Dynamic sidebar DB | `menus` kosong, jadi sidebar masih fallback hardcoded. | `menus` terisi dari definisi menu dan UI memakai data DB. |
| P0-5 | EDOM | Action masih placeholder dan service membaca tabel yang tidak ada. | Kontrak tabel final, service/action/UI sinkron, flow minimal jalan. |
| P0-6 | PMB open setting | Form PMB masih hardcoded open. | Status buka/tutup PMB dibaca dari `settings`. |
| P0-7 | Audit mutasi penting | `audit_logs` masih kosong, belum terbukti semua aksi penting tercatat. | Mutasi utama punya audit log dan bisa dicek di DB. |

---

## Detail Saran P0

### 1. 🔴 Bereskan Secret dan Git History

**Masalah:**

- Current tracked files relatif aman, tetapi history Git masih menunjukkan jejak env/secret pattern lama dari commit awal.
- `.gitignore` saja tidak cukup karena history lama tetap bisa kebaca.

**Risiko:** Jika repo di-push ke remote publik/shared, semua secret yang pernah masuk history bisa diambil siapa saja.

**Langkah:**

1. Rotate semua key di Supabase dashboard (service role key, anon key).
2. Rotate key payment gateway jika sudah pernah di-commit.
3. Bersihkan history Git dengan `git filter-repo` atau `BFG Repo-Cleaner` jika repo akan dipush ke remote publik/shared.
4. Force push ke semua remote setelah dibersihkan.
5. Verifikasi: `git log --all -p -- "*env*" | grep -i "service_role\|eyJ"` harus kosong.
6. Jangan tulis raw secret di dokumen, issue, PR, chat, atau log.

**Definition of done:**

- Current tracked files tidak mengandung secret real.
- History Git tidak lagi menemukan marker secret lama.
- Key lama sudah tidak valid.
- Tim tahu perlu re-clone/reset jika history rewrite dilakukan.

**Rules:** 01-project-context §2.2, 07-production §2.1

---

### 2. 🔴 Patch Dependency Rentan

**Masalah:**

- `npm audit` menemukan 9 vulnerability, 3 high.

| Package | Severity | Fix |
| --- | --- | --- |
| `next` 16.2.4 | High | Upgrade ke ≥16.2.9 |
| `xlsx` 0.18.5 | High | Tidak ada fix otomatis — perlu evaluasi alternatif (`sheetjs` community, `exceljs`) |
| `ws` (transitive) | High | `npm audit fix` |

**Langkah:**

```bash
# Upgrade next
npm install next@latest

# Fix yang bisa otomatis
npm audit fix

# Jalankan ulang validasi
npm run type-check
npm run lint
npm run build
```

Untuk `xlsx`, pilih salah satu:
- ganti library import/export (misal `exceljs`),
- batasi penggunaan hanya untuk file internal terpercaya,
- atau dokumentasikan risk acceptance sementara.

**Definition of done:**

- Build tetap hijau setelah upgrade.
- Risiko `xlsx` punya keputusan jelas.
- `npm audit` turun signifikan atau semua sisa risiko terdokumentasi.

---

### 3. 🔴 Seed Data DEV untuk Bukti Workflow

**Masalah:**

- DEV DB punya schema luas, tetapi data bisnis masih kosong.
- Tanpa data, fitur kelihatan ada tapi belum terbukti jalan.

| Tabel | Rows saat ini | Minimum untuk demo |
| --- | --- | --- |
| `users` | 1 | 5+ (1 per role utama) |
| `user_roles` | 0 | 5+ |
| `program_studi` | 0 | 2+ |
| `dosen` | 0 | 3+ |
| `mahasiswa` | 0 | 5+ |
| `mata_kuliah` | 0 | 5+ |
| `jadwal_kuliah` | 0 | 3+ |
| `menus` | 0 | Semua menu dari fallback definition |
| `pmb_pendaftaran` | 0 | 3+ (berbagai status) |
| `tagihan` | 0 | 5+ |
| `krs_header` | 0 | 2+ |
| `audit_logs` | 0 | Otomatis terisi setelah seed + operasi |

Data minimal lain yang juga perlu disiapkan: kampus, fakultas, tahun akademik aktif, ruangan, pembayaran sample, calon mahasiswa, user keuangan, dan materi/tugas/forum LMS sample.

**Langkah:**

1. Buat `supabase/seed-dev.sql` berisi insert data minimal per tabel di atas.
2. Pastikan user di `public.users` terhubung ke `auth.users` Supabase.
3. Isi tabel `menus` dari definisi di `src/lib/access-control.ts` → `menuDefinitions`.
4. Jalankan seed dan verifikasi login + sidebar muncul dari database.

**Definition of done:**

- Login role utama bisa diuji.
- Dashboard tidak hanya empty state.
- Flow PMB, KRS, nilai, LMS, dan keuangan bisa dicoba minimal satu skenario.

**Rules:** 04-ui-components (sidebar dari DB), 02-database-schema (query membutuhkan data)

---

### 4. 🔴 Jadikan Sidebar Benar-Benar Database-Driven

**Masalah:**

- Kode sudah mendukung tabel `menus`, tapi DEV `menus` masih kosong.
- Aplikasi masih fallback ke menu hardcoded. PRD AC #6 dan Rule 04 mensyaratkan sidebar dari database.

**Langkah:**

1. Buat SQL insert dari `menuDefinitions` di `src/lib/access-control.ts`, masukkan ke `supabase/seed-dev.sql` atau migration baru.
2. Pastikan `role_menu_permissions` dan `user_menu_permissions` bisa override akses, isi minimal untuk role Admin.
3. Test sidebar untuk Admin, Prodi, Dosen, Mahasiswa, Keuangan, dan Pimpinan.
4. Verifikasi: hapus fallback sementara, pastikan sidebar masih muncul dari DB.

**File terkait:**
- [access-control.ts](src/lib/admin/access-control.ts) — `getFallbackMenuRows()` L60-73
- [constants.ts](src/lib/constants.ts) — `sidebarItems` L89-171 (hardcoded)

**Definition of done:**

- `menus` tidak kosong.
- Menu Builder menampilkan data DB.
- Sidebar berubah sesuai role dan permission.
- Fallback hanya dipakai saat DB gagal, bukan kondisi normal.

---

### 5. 🔴 Fix EDOM sampai Minimal Jalan

**Masalah:**

- `createQuestionnaireAction` dan `submitEdomResponseAction` masih placeholder.
- Service layer mereferensi `edom_questionnaires`, tapi tabel di database (migration 029) bernama `edom_questions`, `edom_responses`, dan `edom_response_answers`.
- UI hanya menampilkan empty state.

**Langkah:**

1. Tentukan kontrak final EDOM (rekomendasi: ikuti migration → `edom_questions`), atau tambah migration `edom_questionnaires` bila memang diperlukan.
2. Update service di `src/lib/admin/edom.ts` agar sesuai nama tabel aktual.
3. Update action di `src/actions/edom.ts` dari placeholder ke implementasi nyata.
4. Implement flow minimal: admin kelola pertanyaan, mahasiswa submit evaluasi (satu kali per kelas/dosen), dosen/admin lihat rekap.

**Definition of done:**

- Tidak ada query ke tabel yang tidak ada.
- Mahasiswa bisa submit EDOM satu kali per kelas/dosen.
- Hasil EDOM bisa direkap, akses sesuai role.

---

### 6. 🔴 Pindahkan Status PMB Open ke Settings

**Masalah:**

- `/pmb/daftar` masih memakai `isPmbOpen = true`.
- Ini tidak sesuai workflow production karena PMB harus bisa dibuka/tutup dari konfigurasi, bukan diedit lewat kode.

**Langkah:**

1. Tambah key `pmb_registration_open` di tabel `settings` (atau gunakan field di `tahun_akademik`).
2. Buat helper untuk membaca setting PMB aktif.
3. Admin bisa ubah status buka/tutup dari halaman settings; public form membaca setting tersebut.

**Definition of done:**

- PMB bisa ditutup tanpa edit kode.
- Saat ditutup, form pendaftaran tidak bisa submit dan pesan ke user jelas ("Pendaftaran ditutup").

**Rules:** 05-business-modules (PMB flow), 01-project-context (tidak hardcode)

---

### 7. 🔴 Audit Server Action Mutasi dan Audit Log

**Masalah:**

- Banyak action sudah pakai guard, tetapi belum diaudit semua.
- `audit_logs` masih kosong, belum terbukti semua aksi penting tercatat.

**Checklist per action file:**

| File | Auth Check | Zod Validation | Audit Log | Error Safe |
| --- | --- | --- | --- | --- |
| `auth.ts` | ✅ | ✅ | ✅ | ⚠️ |
| `kampus.ts` | ✅ | ✅ | Delegated | ✅ |
| `users.ts` | ✅ | ⚠️ Manual | ✅ | ❌ leak |
| `pmb.ts` | ✅ | ✅ | ✅ | ⚠️ leak |
| `finance.ts` | ✅ | ⚠️ Partial | ✅ | ⚠️ leak |
| `faculties.ts` | ✅ | ✅ | ? | ? |
| `krs.ts` | ✅ | ? | ? | ? |
| `lms.ts` | ✅ | ? | ? | ? |
| `grades.ts` | ✅ | ? | ? | ? |
| `settings.ts` | ✅ | ? | ? | ? |
| `menus.ts` | ✅ | ? | ? | ? |
| `access-control.ts` | ✅ | ? | ? | ? |

**Langkah:**

1. Audit semua action create/update/delete/approve/verify, mulai dari modul paling penting: auth, users, menu access, PMB, finance, KRS, nilai.
2. Walk-through setiap file, centang 4 kolom di atas, perbaiki yang kurang.
3. Pastikan ada: auth server-side, role/permission check, validasi input, audit log setelah sukses, error message aman.

**Definition of done:**

- Mutasi penting tidak bisa dipanggil tanpa role yang benar.
- Audit log masuk saat create/update/delete/approve/verify.
- Error tidak membocorkan secret atau detail internal berbahaya.

---

## P1 — Kritis (Setelah P0 Selesai)

### 8. 🟡 Bersihkan `any` Type (~50+ Instance) & Lint Warning

**Masalah:** TypeScript strict mode tidak efektif karena `any` tersebar di `src/modules/` dan `src/lib/admin/`. Total ada 264 warning lint (`any`, unused vars, React Compiler) yang perlu dibersihkan bertahap.

**File terburuk (prioritas tinggi):**

| File | Jumlah `any` | Contoh |
| --- | --- | --- |
| `src/modules/reports/report-panel.tsx` | 5 | `akademikData: any[]`, `pmbData: any[]` |
| `src/modules/master-data/user-manager.tsx` | 3 | Props `any`, `items.map((item: any)` |
| `src/modules/master-data/ruangan-manager.tsx` | 6 | Props `any`, iterator `any` |
| `src/modules/master-data/jadwal-kuliah-manager.tsx` | 5 | Props `any`, list `any[]` |
| `src/modules/lms/*.tsx` | 12+ | `user: any`, `tugas: any`, `jadwal: any` |
| `src/lib/admin/reports.ts` | 5 | `any` di query result mapping |
| `src/lib/admin/audit-logger.ts` | 3 | `oldData?: any`, `newData?: any` |

**Langkah:**

1. Mulai dari `audit-logger.ts` — ganti `any` → `Record<string, unknown> | null`.
2. Lanjut ke `modules/reports/` — buat interface per report data shape.
3. Lanjut ke `modules/master-data/` — buat interface props per manager.
4. Lanjut ke `modules/lms/` — buat interface per LMS entity.
5. Terakhir `lib/admin/reports.ts` dan `lib/admin/grades.ts`.

**Rules:** 08-coding-standards §2.1

---

### 9. 🟡 Sanitize Error Messages ke Client

**Masalah:** Beberapa Server Action mengirim `error.message` dari Supabase langsung ke client, yang bisa berisi detail database (constraint name, kolom DB, dll).

**Lokasi yang perlu diperbaiki:**

```typescript
// ❌ src/actions/users.ts L40
message: error.message

// ❌ src/actions/pmb.ts L196
message: error instanceof Error ? error.message : "..."
```

**Perbaikan:**

```typescript
// ✅ Pattern yang benar
if (error) {
  console.error('[updateUserAction]', error.message);  // log di server
  return { error: 'Gagal menyimpan data. Coba lagi.' };  // pesan aman ke client
}
```

**Rules:** 06-audit-security §2.4

---

### 10. 🟡 Fix Import Order di `finance.ts`

**Masalah:** Import statements muncul SETELAH function definition di `src/actions/finance.ts` — melanggar convention.

```typescript
// ❌ src/actions/finance.ts
export async function requestFinancePaymentGatewayAction(...) { ... }

// Import setelah function — ini yang salah
import { getMahasiswaByUserId } from "@/lib/admin/mahasiswa";
import { requireUser, requireAuthorizedUser } from "@/lib/auth";
```

**Langkah:** Pindahkan semua import ke bagian atas file sebelum function definitions.

**Rules:** 08-coding-standards §2.5

---

### 11. 🟡 Fix Audit Action Typo di `forgotPasswordAction`

**Masalah:** Reset password request dicatat sebagai `LOGIN_SUCCESS` — menyesatkan audit log.

```typescript
// ❌ src/actions/auth.ts L177
action: "LOGIN_SUCCESS",
message: "Request reset password berhasil",
```

**Perbaikan:** Tambah action type baru `RESET_PASSWORD_REQUEST` atau gunakan `UPDATE` dengan modul `auth`.

**Rules:** 06-audit-security §2.1

---

### 12. 🟡 Sinkronkan Dokumen dengan Repo Aktual

**Dokumen yang drift:**

| Dokumen | Masalah |
| --- | --- |
| `docs/Ringkasan Project.md` L197 | Masih menyebut "Middleware melindungi route dashboard" — harusnya proxy.ts |
| `docs/Ringkasan Project.md` L144, 168 | Menyebut `src/db`, `migrate.ts`, `seed.ts`, `reset.ts` — tidak ada di repo |
| `docs/requirement-fix/00-RINGKASAN-AUDIT.md` | Bilang CI/CD belum ada dan forgot-password belum ada — keduanya sudah ada |
| `docs/PRD-SIAKAD.md` | Mencantumkan TanStack Query tapi yang terinstall hanya TanStack Table |
| `docs/PRD-SIAKAD.md` §8 | Folder structure tidak sesuai aktual |

Selain itu, sinkronkan juga `docs/PRD-SIAKAD.md`, `docs/Ringkasan Project.md`, dan `docs/requirement-fix/*` secara keseluruhan dengan kondisi repo terkini.

---

## P2 — Penting (Setelah P0–P1 Selesai)

### 13. Halaman CRUD Gedung

Tabel `gedung` dan helper `src/lib/admin/gedung.ts` sudah ada, tapi tidak ada halaman CRUD di `src/app/dashboard/master-data/gedung/`.

### 14. Import/Export Excel Merata

Verifikasi dan lengkapi import/export di semua master data manager, bukan hanya kampus.

### 15. Ganti Data Hardcoded ke Database

`dashboardMetrics`, `studentBilling`, `offeredCourses` di [constants.ts](src/lib/constants.ts) masih hardcoded. Ganti dengan query ke database.

### 16. Smoke Test Per Role dan Script Smoke Tambahan

Buat dan jalankan smoke test manual per role (Admin, Prodi, Dosen, Mahasiswa, Keuangan, Pimpinan) sesuai checklist di `docs/CHECKLIST-TEST-PAGE-SIAKAD-CLONE.md`. Tambahkan juga script smoke otomatis untuk route publik, redirect dashboard, dan webhook invalid signature.

### 17. Hapus File `env` dan `env.local` di Root

Ada 2 file bernama `env` dan `env.local` (tanpa dot) di root project yang kemungkinan duplikat tidak disengaja dari `.env.local`. Hapus atau rename.

---

## Jangan Dikerjakan Dulu

Tunda dulu:

- Fitur baru besar di luar flow utama.
- FCM/push notification real.
- Dashboard chart cantik tapi datanya belum valid.
- Payment gateway production switch.
- Redesign UI besar-besaran.

Alasannya sederhana: fondasi workflow dan data test belum cukup. Kalau lapisan bawah belum kuat, lapisan atas cuma jadi hiasan yang gampang jatuh.

---

## Quick Win — Bisa Dikerjakan < 30 Menit

| # | Item | Effort |
| --- | --- | --- |
| A | Fix audit action typo di `forgotPasswordAction` | 5 menit |
| B | Fix import order di `src/actions/finance.ts` | 10 menit |
| C | Ganti `any` di `audit-logger.ts` → `Record<string, unknown>` | 5 menit |
| D | Hapus file `env` dan `env.local` di root | 2 menit |
| E | Update `Ringkasan Project.md` — ganti "middleware" → "proxy.ts" | 5 menit |
| F | Update `requirement-fix/00-RINGKASAN-AUDIT.md` — tandai CI/CD dan forgot-password sudah ada | 10 menit |

---

## Urutan Eksekusi yang Disarankan

```text
HARI 1 — Quick Wins + Security
├── Quick Win A-F (30 menit)
├── P0.1: Rotate secrets + plan git cleanup (1 jam)
└── P0.2: Upgrade next + npm audit fix (30 menit)

HARI 2-3 — Data & Database
├── P0.3: Buat seed-dev.sql + seed data (4-6 jam)
├── P0.4: Isi tabel menus dari menuDefinitions (2 jam)
├── P0.5: Fix EDOM table mismatch (2 jam)
└── P0.6: Fix PMB open dari settings (1 jam)

HARI 4-6 — Code Quality & Audit
├── P0.7: Mulai audit Server Action mutasi (PMB, finance, KRS) (4 jam)
├── P1.8: Bersihkan any type batch 1 — audit-logger, reports (4 jam)
├── P1.8: Bersihkan any type batch 2 — master-data managers (4 jam)
├── P1.8: Bersihkan any type batch 3 — LMS modules (4 jam)
├── P1.9: Sanitize error messages (2 jam)
└── P1.11: Lanjutkan audit semua Server Actions (4 jam)

HARI 7 — Docs & Verification
├── P1.12: Sinkronkan semua dokumen (2 jam)
├── P2.16: Smoke test per role + script smoke tambahan (4 jam)
└── Verifikasi: npm run type-check && lint && build
```

**Estimasi total: ~7-10 hari kerja (1 developer)**

---

## Kesimpulan

Project ini punya fondasi arsitektur yang benar dan stack yang sesuai PRD. Masalah utama bukan di desain sistem, melainkan di:

1. **Data kosong** — tidak bisa buktikan apapun jalan.
2. **Type safety longgar** — `any` melemahkan TypeScript strict.
3. **Secret hygiene** — history Git belum bersih.
4. **Dokumen drift** — beberapa docs tidak mencerminkan kondisi aktual.

Perbaikan paling urgent bukan tambah fitur, tapi membuat fitur yang sudah ada benar-benar bisa dibuktikan jalan.

Urutan aman:

1. Amankan secret dan dependency.
2. Siapkan data DEV.
3. Benahi menu DB dan EDOM.
4. Pindahkan konfigurasi hardcoded ke settings.
5. Audit mutasi dan audit log.
6. Baru lanjut bersihkan kualitas kode (`any`, error handling, docs).
7. Baru lanjut polish dan fitur tambahan (P2).

Selesaikan P0 dulu, baru project ini bisa di-demo dengan percaya diri — naik kelas dari "bisa dibuka" menjadi "bisa diuji serius".
