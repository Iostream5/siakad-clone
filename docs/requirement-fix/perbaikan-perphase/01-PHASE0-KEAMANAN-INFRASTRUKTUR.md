# Phase 0 - Keamanan dan Infrastruktur Dasar

## Tujuan

Membuat repo aman untuk dikembangkan, dites, dan dipush ke remote tanpa membawa risiko fatal seperti secret bocor, dependency rentan, atau gate teknis palsu.

## Masalah dari File Gabungan

- History Git masih pernah menyentuh pola env/secret dari commit awal.
- `npm audit` menemukan 9 vulnerability, termasuk 3 high.
- Dependency penting yang perlu perhatian: `next`, `xlsx`, dan `ws` transitive.
- Ada file env root non-dot yang perlu dicek/hapus/rapikan agar tidak membingungkan.
- Lint masih PASS dengan 264 warning.

## File/Area Terkait

- `.gitignore`
- `.env.example`
- `docker.env.example`
- `env`
- `env.local`
- `.env.local`
- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`

## Perbaikan Urgent

### 1. Rotate Secret dan Bersihkan History

Langkah:

1. Rotate semua key yang pernah muncul di history, terutama Supabase dan payment gateway jika pernah dipakai.
2. Bersihkan history dengan `git filter-repo` atau BFG jika repo akan dipush ke remote publik/shared.
3. Force push setelah history bersih.
4. Instruksikan kolaborator untuk re-clone atau reset branch setelah rewrite.
5. Verifikasi ulang current tree dan history.

Definition of done:

- Current tracked files tidak mengandung secret real.
- History tidak lagi menemukan marker secret lama.
- Key lama sudah tidak valid.
- Tim tahu langkah sync ulang.

### 2. Patch Dependency Security

Langkah:

1. Upgrade `next` ke versi patched yang kompatibel.
2. Jalankan `npm audit fix` untuk fix otomatis yang aman.
3. Putuskan strategi `xlsx`:
   - ganti library,
   - batasi pemakaian,
   - atau dokumentasikan risk acceptance sementara.
4. Jalankan ulang `npm run type-check`, `npm run lint`, `npm run build`, dan `npm audit`.

Definition of done:

- Build tetap hijau.
- `next` sudah patched.
- Risiko `xlsx` punya keputusan jelas.
- Sisa audit risk terdokumentasi.

### 3. Rapikan Env Root

Langkah:

1. Cek file env mana yang benar-benar dipakai Next.js.
2. Hapus atau dokumentasikan file `env` dan `env.local` jika hanya duplikat lokal.
3. Pastikan `.env.example` tidak berisi value secret.
4. Pastikan `.gitignore` tetap mengabaikan env real.

Definition of done:

- Tidak ada env real tracked.
- File env lokal tidak membingungkan.
- Developer tahu file env mana yang harus dibuat.

## Gate Phase 0

- `npm run type-check` PASS.
- `npm run lint` PASS, warning turun atau dicatat.
- `npm run build` PASS.
- `npm audit` membaik atau risk acceptance tertulis.
- Secret lama sudah rotate/revoke.
- Current tree dan history aman untuk skenario push yang ditargetkan.

