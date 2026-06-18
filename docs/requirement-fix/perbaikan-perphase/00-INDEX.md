# Index Perbaikan per Phase

Tanggal: 18 Juni 2026  
Basis: `docs/requirement-fix/RANGKUMAN-SARAN-PERBAIKAN-URGENT-SIAKAD-GABUNGAN.md`

Folder ini memecah saran perbaikan urgent menjadi file per phase project. Urutannya mengikuti alur kerja SIAKAD: keamanan dulu, fondasi admin, PMB/keuangan, akademik/LMS, modul lanjutan, lalu production readiness.

## Daftar File

| File | Phase | Fokus |
| --- | --- | --- |
| `01-PHASE0-KEAMANAN-INFRASTRUKTUR.md` | Phase 0 | Secret, Git history, dependency security, env hygiene, gate teknis. |
| `02-PHASE1-FONDASI-ADMIN-AKSES.md` | Phase 1 | Seed user/role, menu/sidebar hardcoded sementara, access control, audit Server Action, type/error hygiene. |
| `03-PHASE2-PMB-KEUANGAN.md` | Phase 2 | PMB open settings, PMB/finance data seed untuk flow, payment/webhook, tagihan/pembayaran. |
| `04-PHASE3-AKADEMIK-LMS.md` | Phase 3 | Seed akademik, KRS, nilai, LMS, data fixture halaman tetap boleh hardcoded sementara. |
| `05-PHASE4-MODUL-LANJUTAN.md` | Phase 4 | EDOM, audit log, laporan, smoke test lanjutan; notifikasi ditunda/backlog. |
| `06-PHASE5-PRODUCTION-READINESS.md` | Phase 5 | Production readiness, smoke test per role, docs sync, release gate. |

## Aturan Eksekusi

1. Jangan lompat ke phase atas kalau Phase 0 belum aman.
2. Setiap phase harus punya bukti: type-check, lint/build bila relevan, dan smoke test area yang disentuh.
3. Jika menyentuh Supabase DEV, gunakan MCP `siakad_dev`.
4. Jangan commit secret, file env real, atau output terminal berisi secret.
5. Untuk sementara, menu/sidebar dan data fixture halaman boleh tetap hardcoded agar flow utama bisa diuji dulu.
6. Fitur notifikasi ditunda penuh dan tidak menjadi blocker phase aktif.
7. Update checklist phase setelah item selesai agar dokumen tidak jadi pajangan.
