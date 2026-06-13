# Phase 2 — PMB & Keuangan (Gap Perbaikan)

> **Prioritas:** 🟡 Penting — selesaikan setelah Phase 1  
> **Estimasi:** 2-3 hari  
> **Prasyarat:** Phase 0 + Phase 1 selesai

---

## Tujuan

Mematangkan modul PMB dan Keuangan yang sudah ada. Sebagian besar fitur Phase 2 sudah diimplementasi — dokumen ini fokus pada gap yang ditemukan saat audit.

---

## Status Saat Ini

| Fitur | Status | Catatan |
|---|---|---|
| PMB Workflow (pendaftaran → NIM) | ✅ Ada | `pmb-manager.tsx` (40KB), `pmb.ts` action (15KB) |
| PMB Publik (`/pmb`, `/pmb/daftar`) | ✅ Ada | Halaman publik dan form daftar |
| PMB Dashboard (tab-based) | ✅ Ada | Overview, pendaftar, pembayaran, seleksi, registrasi NIM |
| Generate NIM (idempotent) | ✅ Ada | Di `pmb.ts` action |
| Keuangan Dashboard | ✅ Ada | `finance-manager.tsx` (multi-tab) |
| Tagihan & Pembayaran | ✅ Ada | Generate tagihan, verifikasi pembayaran |
| Payment Gateway Config | ✅ Ada | Halaman pengaturan Midtrans |
| Webhook Midtrans PMB | ✅ Ada | Signature validation + idempotency |
| Webhook Midtrans Finance | ✅ Ada | Signature validation + idempotency |
| Master Biaya | ✅ Ada | CRUD master biaya di keuangan |
| **Registrasi Semester** | ❌ **Placeholder** | Hanya infografis 3 step |
| Cash flow tracking | ⚠️ Parsial | Tab ada tapi perlu verifikasi fungsionalitas |

---

## Checklist Perbaikan

### 1. 🔴 Registrasi Semester — Implementasi Fungsional

> **Status saat ini:** ❌ Halaman hanya menampilkan 3 card step — tidak ada CRUD  
> **File:** `src/app/dashboard/registrasi/page.tsx` (22 baris, placeholder)  
> **Dampak:** Alur daftar ulang semester tidak bisa dijalankan  
> **Referensi PRD:** Phase 2 — "Sinkronisasi status mahasiswa dari pembayaran"

- [ ] **Buat `src/modules/master-data/registrasi-manager.tsx`**
  - **Tab Mahasiswa:** Daftar mahasiswa yang perlu daftar ulang
    - Filter: tahun akademik, prodi, status registrasi
    - Status: Belum Daftar Ulang, Menunggu Verifikasi, Lunas, Dispensasi
    - Tombol "Generate Daftar Ulang Massal" (per prodi/angkatan)
  - **Tab Verifikasi (role Keuangan):**
    - Daftar mahasiswa yang sudah bayar tapi belum diverifikasi
    - Tombol verifikasi pelunasan
    - Tombol dispensasi dengan catatan alasan
  - **Tab Riwayat:**
    - Semester sebelumnya, status registrasi per mahasiswa

- [ ] **Buat Server Action `src/actions/registrasi.ts`**
  - `generateRegistrasiAction` — buat record daftar ulang per mahasiswa
  - `verifyRegistrasiAction` — verifikasi pelunasan
  - `grantDispensasiAction` — berikan dispensasi
  - Semua dengan: auth check + Zod + audit log

- [ ] **Buat/modifikasi tabel jika perlu**
  - Cek apakah tabel `registrasi_semester` atau sejenisnya sudah ada di migration
  - Jika belum, buat migration baru:
    ```sql
    CREATE TABLE public.registrasi_semester (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mahasiswa_id UUID NOT NULL REFERENCES public.mahasiswa(id),
      tahun_akademik_id UUID NOT NULL REFERENCES public.tahun_akademik(id),
      status TEXT NOT NULL DEFAULT 'BELUM'
        CHECK (status IN ('BELUM', 'MENUNGGU', 'LUNAS', 'DISPENSASI')),
      tagihan_id UUID REFERENCES public.tagihan(id),
      catatan TEXT,
      verified_by UUID REFERENCES public.users(id),
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(mahasiswa_id, tahun_akademik_id)
    );
    ```

- [ ] **Update `src/app/dashboard/registrasi/page.tsx`**
  - Ganti placeholder dengan RegistrasiManager component
  - Fetch data dari helper

**File yang perlu dibuat/dimodifikasi:**
```
supabase/migrations/027_registrasi_semester.sql  [NEW] (jika tabel belum ada)
src/lib/admin/registrasi.ts                      [NEW]
src/actions/registrasi.ts                        [NEW]
src/modules/master-data/registrasi-manager.tsx   [NEW]
src/app/dashboard/registrasi/page.tsx            [MODIFY]
```

---

### 2. PMB — Polish & Edge Cases

> **Status saat ini:** ⚠️ Fungsional tapi ada area yang perlu dipoles

- [ ] **Verifikasi status flow searah**
  - Pastikan UI tidak memungkinkan status mundur (Accepted → Submitted)
  - Cek tombol aksi hanya muncul sesuai status valid

- [ ] **PMB publik — error handling**
  - Form daftar: tampilkan error yang jelas jika program studi tidak tersedia
  - Form daftar: cek apakah periode PMB masih terbuka

- [ ] **PMB calon mahasiswa view**
  - Pastikan calon mahasiswa bisa melihat status pendaftaran mereka di `/dashboard/keuangan`
  - Portal pembayaran PMB sudah terintegrasi

- [ ] **Export data PMB**
  - Pastikan admin bisa export data pendaftar ke Excel (untuk laporan offline)

---

### 3. Keuangan — Polish & Verifikasi

> **Status saat ini:** ⚠️ Fitur utama ada, perlu polish

- [ ] **Generate tagihan massal — verifikasi idempotency**
  - Cek tidak ada tagihan duplikat saat generate ulang
  - Cek ada validasi mahasiswa aktif sebelum generate

- [ ] **Verifikasi pembayaran manual**
  - Pastikan flow: upload bukti → menunggu → verifikasi/tolak berjalan
  - Pastikan audit log tercatat

- [ ] **Laporan keuangan**
  - Verifikasi tab laporan di keuangan menampilkan data akurat
  - Total pemasukan, piutang, jumlah lunas vs belum lunas

- [ ] **Cash flow tab**
  - Verifikasi pencatatan arus kas masuk sudah terintegrasi dengan pembayaran terverifikasi
  - Cek idempotency: pembayaran yang sama tidak boleh masuk 2x ke cash flow

---

### 4. Xendit Integration (Future-Proof)

> **Status saat ini:** ❌ Belum ada — PRD menyebut Midtrans + Xendit  
> **Prioritas:** Rendah untuk sekarang, tapi catat sebagai item yang dibutuhkan

- [ ] **Siapkan arsitektur payment gateway abstraction**
  - Buat interface/abstract layer untuk payment gateway
  - Midtrans dan Xendit mengimplementasi interface yang sama
  - Webhook handler per provider di route terpisah

- [ ] **(Optional) Buat Route Handler Xendit**
  - `/api/payment-gateway/xendit/callback` — skeleton

---

## Kriteria Selesai Phase 2

```bash
npm run type-check && npm run lint && npm run build

# Manual check:
✅ Registrasi semester: mahasiswa bisa daftar ulang, keuangan bisa verifikasi
✅ Generate daftar ulang massal tidak duplikat
✅ PMB flow lengkap: Draft → Submitted → Waiting Payment → Verified → Accepted → Registered
✅ Generate NIM idempotent dan berfungsi
✅ Webhook Midtrans PMB dan Finance diproses dengan benar
✅ Generate tagihan massal idempotent
✅ Verifikasi pembayaran manual berjalan
✅ Audit log tercatat untuk semua aksi keuangan dan PMB
```
