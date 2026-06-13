# Ringkasan Audit & Roadmap Perbaikan SIAKAD

Tanggal Audit: 13 Juni 2026  
Status Project: **DEV**  
Basis: PRD-SIAKAD.md v2.0 + Kode Aktual  
Tujuan: Panduan perbaikan bertahap sampai production-ready

---

## Ikhtisar Kesiapan

| Aspek | Skor | Catatan |
|---|---|---|
| **Halaman (Routes)** | ~80% | 37 dari ~49 halaman sudah ada |
| **Server Actions** | ~85% | 24 action file, sebagian besar sudah auth check |
| **Database/Migration** | ~90% | 26 migration files, RLS sebagian aktif |
| **UI/UX Quality** | ~70% | Fungsional tapi belum premium di beberapa area |
| **Security** | ~75% | Demo auth terlindungi, tapi `any` type masih banyak |
| **Infrastructure** | ~60% | CI/CD belum ada, error pages belum ada |
| **Production Readiness** | ~50% | Banyak gate belum terpenuhi |

---

## Struktur Dokumen

| File | Cakupan | Estimasi Effort |
|---|---|---|
| [01-PHASE0-KEAMANAN-DASAR.md](./01-PHASE0-KEAMANAN-DASAR.md) | Keamanan, error pages, CI/CD, `any` cleanup | 2-3 hari |
| [02-PHASE1-FONDASI-ADMIN.md](./02-PHASE1-FONDASI-ADMIN.md) | Auth lengkap, Gedung, import/export, profil user | 3-5 hari |
| [03-PHASE2-PMB-KEUANGAN.md](./03-PHASE2-PMB-KEUANGAN.md) | Registrasi semester, PMB polish, keuangan polish | 2-3 hari |
| [04-PHASE3-AKADEMIK-LMS.md](./04-PHASE3-AKADEMIK-LMS.md) | KHS, transkrip, LMS admin, kalender akademik | 3-5 hari |
| [05-PHASE4-MODUL-LANJUTAN.md](./05-PHASE4-MODUL-LANJUTAN.md) | EDOM, notifikasi, dashboard per-role | 3-5 hari |
| [06-PHASE5-PRODUCTION.md](./06-PHASE5-PRODUCTION.md) | Deployment, backup, smoke test, monitoring | 2-3 hari |

**Total estimasi: ~15-24 hari kerja** (1 developer)

---

## Temuan Kritis

> ⚠️ Item yang harus diperbaiki sebelum demo atau user testing

1. **Forgot/Reset Password** — belum ada halaman dan action
2. **Custom Error Pages** — tidak ada `not-found.tsx`, `error.tsx`, halaman 403
3. **CI/CD** — folder `.github/workflows/` belum ada
4. **`any` type** — tersebar di 5+ file page/module
5. **Import/Export Excel** — `excel-generator.ts` ada tapi tidak digunakan di satupun master data manager
6. **Registrasi Semester** — halaman hanya placeholder statis
7. **Tanstack Query** — tercantum di PRD tapi tidak digunakan sama sekali
8. **Framer Motion** — tercantum di PRD tapi tidak digunakan di halaman manapun
9. **LMS Admin/Prodi** — hardcode `classes = []`
10. **Gedung** — tabel dan helper ada, tapi tidak ada halaman CRUD

---

## Prioritas Eksekusi

```text
URGENT (minggu 1)
├── Phase 0: Keamanan & Infrastruktur Dasar
│   ├── Custom error pages (not-found, error, 403)
│   ├── Bersihkan any type di semua page files
│   └── Setup CI/CD GitHub Actions
│
├── Phase 1 Gap: Auth & Master Data
│   ├── Forgot/Reset Password
│   ├── Halaman Gedung
│   └── Import/Export Excel di semua master data
│
PENTING (minggu 2-3)
├── Phase 2 Gap: Registrasi Semester
│   └── Implementasi fungsional (bukan placeholder)
│
├── Phase 3 Gap: Akademik & LMS
│   ├── KHS dan Transkrip
│   ├── LMS Admin/Prodi view
│   └── Kalender Akademik
│
BISA DITUNDA (minggu 4+)
├── Phase 4: Modul Lanjutan
│   ├── EDOM
│   ├── Notifikasi push
│   └── Dashboard per-role
│
└── Phase 5: Production Readiness
    ├── Smoke test semua role
    ├── Backup strategy
    └── Monitoring & alerting
```

---

## Catatan

- Dokumen ini dan sub-dokumen per-phase adalah **living documents** — update seiring progress
- Setiap item yang selesai, tandai `[x]` di dokumen phase terkait
- Sebelum klaim selesai per-phase, jalankan: `npm run type-check && npm run lint && npm run build`
- PRD aktif tetap di `docs/PRD-SIAKAD.md` — dokumen ini adalah **suplemen perbaikan**
