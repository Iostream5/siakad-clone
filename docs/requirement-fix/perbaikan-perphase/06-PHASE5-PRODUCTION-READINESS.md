# Phase 5 - Production Readiness

## Tujuan

Menyiapkan aplikasi untuk jalur production setelah P0 sampai Phase 4 cukup stabil. Fokusnya bukan tambah fitur, tetapi memastikan aplikasi aman, bisa dibuild, bisa dites, dan bisa dirilis.

## Masalah dari File Gabungan

- Production readiness masih sekitar 55%.
- Fitur end-to-end belum terbukti karena data DEV kosong.
- Dependency security belum bersih.
- Secret history belum selesai.
- Docs masih drift dari repo aktual.
- Menu/sidebar dan data fixture halaman masih boleh hardcoded sementara jika statusnya jelas.
- Fitur notifikasi ditunda dan tidak menjadi blocker production candidate awal.
- Smoke test per role belum selesai.

## File/Area Terkait

- `.github/workflows/ci.yml`
- `docs/PRD-SIAKAD.md`
- `docs/Ringkasan Project.md`
- `docs/requirement-fix/*`
- `docs/CHECKLIST-TEST-PAGE-SIAKAD-CLONE.md`
- `package.json`
- `package-lock.json`
- Vercel/Supabase environment

## Perbaikan Urgent

### 1. Sinkronkan Dokumentasi Aktif

Langkah:

1. Update dokumen yang masih menyebut `middleware` menjadi `src/proxy.ts`.
2. Hapus atau tandai dokumen historis yang menyebut struktur lama.
3. Sinkronkan PRD dengan dependency aktual.
4. Pastikan docs tidak menyebut fitur sudah selesai kalau belum terbukti.
5. Pastikan menu/data hardcoded dan notifikasi tertunda ditulis sebagai status sementara/backlog.

Definition of done:

- PRD dan ringkasan cocok dengan repo.
- Agent baru tidak diarahkan ke path/stack salah.
- Requirement-fix tidak bertentangan dengan kondisi sekarang.
- Gate production tidak gagal hanya karena menu/data fixture masih hardcoded atau notifikasi belum dikerjakan.

### 2. Final Gate Teknis

Langkah:

1. Jalankan `npm run type-check`.
2. Jalankan `npm run lint`.
3. Jalankan `npm run build`.
4. Jalankan `npm audit`.
5. Catat sisa warning/risk jika belum nol.

Definition of done:

- Type-check PASS.
- Lint PASS dengan warning yang sudah turun atau terdokumentasi.
- Build PASS.
- Audit risk punya keputusan.

### 3. Smoke Test Production Candidate

Langkah:

1. Jalankan smoke test semua role.
2. Test route publik.
3. Test redirect dashboard tanpa session.
4. Test webhook invalid signature.
5. Test workflow utama minimal:
   - login,
   - master data,
   - PMB,
   - keuangan,
   - KRS,
   - nilai,
   - LMS,
   - laporan,
   - audit log.
6. Catat notifikasi sebagai skipped/backlog bila belum masuk scope.

Definition of done:

- Semua role utama punya hasil test.
- Tidak ada blocker P0/P1 tersisa.
- Failures punya issue/task lanjut.

### 4. Environment dan Release Safety

Langkah:

1. Pastikan production env tidak memakai DEV key.
2. Pastikan demo auth tidak aktif di production.
3. Pastikan service role hanya server-side.
4. Pastikan backup/restore plan tersedia.
5. Pastikan rollback plan tersedia.

Definition of done:

- Env production bersih dan terpisah.
- Tidak ada secret di repo.
- Backup dan rollback terdokumentasi.

## Gate Phase 5

- Semua gate teknis PASS.
- Secret/history aman untuk target release.
- Dependency risk diputuskan.
- Smoke test semua role selesai.
- Menu/data hardcoded dan notifikasi tertunda punya catatan status yang jelas.
- Docs sinkron.
- Backup dan rollback siap.
