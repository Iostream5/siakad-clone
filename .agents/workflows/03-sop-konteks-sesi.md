# SOP Manajemen Konteks dan Kelanjutan Sesi — SIAKAD STAI Al-Ittihad

## Tujuan

AI Agent tidak punya memori antar sesi. SOP ini membuat sesi baru bisa cepat paham posisi project: apa yang sudah selesai, apa yang sedang dikerjakan, apa blocker-nya, dan apa langkah berikutnya. Jangan mulai dari nol kalau state project sudah tercatat. Jangan sok lupa, itu mahal.

---

## FASE 1: Rekonstruksi Konteks Awal Sesi

### Langkah wajib

1. Baca file status project sebelum mengerjakan apapun:

```text
1. docs/PRD-SIAKAD.md
   Stack final, acceptance criteria, dan aturan wajib.
2. docs/Ringkasan Project.md
   Status implementasi, gap, dan risiko saat ini.
3. docs/tahapan/TAHAPAN-PHASE-PENGERJAAN.md
   Phase aktif dan urutan task.
4. .agents/workflows/
   SOP kerja agent yang berlaku untuk sesi ini.
```

2. Identifikasi posisi kerja:
- Phase aktif: 0 / 1 / 2 / 3 / 4 / 5 / 6.
- Sub-task selesai, berjalan, belum mulai.
- Blocker dari sesi sebelumnya.
- File yang sudah dibuat atau diubah.

3. Verifikasi kondisi teknis sebelum lanjut:

```bash
npm run type-check
npm run lint
npm run build
```

Jika salah satu merah, prioritas pertama adalah memperbaikinya. Jangan tambah fitur di atas fondasi rusak, nanti nangis sendiri.

### Checklist

- [ ] PRD aktif sudah dibaca.
- [ ] Ringkasan project sudah dipahami.
- [ ] Phase aktif jelas.
- [ ] Status sub-task sudah dipetakan.
- [ ] Gate `type-check`, `lint`, dan `build` sudah dicek.
- [ ] Blocker lama sudah diketahui.

---

## FASE 2: Catatan Sesi dan Current Task

Repo ini tidak mewajibkan folder progress khusus. Jangan membuat atau mencari folder progress legacy. Jika perlu mencatat status lintas sesi, gunakan ringkasan sesi/final response atau dokumen progress yang memang sudah disediakan repo.

### Catatan Progress Opsional

Jika repo nanti menyediakan dokumen progress eksplisit, catat log kumulatif dengan format ringkas berikut. Jika tidak ada, tulis ringkasan ini di final response.

Format ringkas:

```markdown
# Progress Log SIAKAD

## Terakhir Diperbarui
[Tanggal dan waktu]

## Phase Aktif
Phase [N] — [Nama Phase]

## Ringkasan Status

| Phase | Status | Keterangan |
|-------|--------|------------|
| Phase 0 | Selesai | Production safety baseline |
| Phase 1 | Berjalan | Fondasi admin, x/y sub-task selesai |
| Phase 2 | Belum | PMB dan Keuangan |
| Phase 3 | Belum | Akademik dan LMS |
| Phase 4 | Belum | Laporan dan Monitoring |
| Phase 5 | Belum | Notifikasi dan EDOM |
| Phase 6 | Belum | Production Readiness |

## Log Perubahan

### [Tanggal] — Phase 1.4: User Management
**Status:** Selesai
**File dibuat:**
- src/actions/users.ts
- src/lib/admin/users.ts

**File dimodifikasi:**
- src/app/dashboard/master-data/pengguna/page.tsx

**Migration:** Tidak ada
**Gate:** type-check hijau | lint hijau | build hijau
**Catatan:** Soft delete, restore, dan hard delete sudah berjalan. Import/export Excel masuk task berikutnya.
```

### Catatan Task Aktif Opsional

Jika repo nanti menyediakan dokumen task aktif eksplisit, catat task berjalan dengan format ringkas berikut. Jika tidak ada, tulis status terbaru di final response.

Format ringkas:

```markdown
# Task Saat Ini

## Informasi Task
- **Phase:** Phase 1 — Fondasi Admin
- **Sub-task:** 1.5 — Master Data Akademik Dasar
- **Prioritas:** P1
- **Estimasi:** Satu sesi

## Deskripsi
Membuat CRUD master data sesuai urutan phase, termasuk helper, Server Action, UI, soft delete, restore, dan audit log.

## File yang Akan Dibuat
- [ ] src/lib/admin/kampus.ts
- [ ] src/actions/kampus.ts
- [ ] src/modules/master-data/kampus-manager.tsx
- [ ] src/app/dashboard/master-data/kampus/page.tsx

## File yang Akan Dimodifikasi
- [ ] src/lib/constants.ts

## Dependency
- [x] Tabel sudah ada.
- [x] Helper auth sudah ada.
- [x] Audit log tersedia.
- [ ] Permission terkait sudah di-seed.

## Progress
- [x] Helper selesai.
- [x] Server Action create/update selesai.
- [ ] Delete/restore berjalan.
- [ ] UI belum mulai.

## Blocker
Tidak ada.

## Catatan
Pola akan direplikasi untuk Fakultas, Program Studi, Ruangan, Kelas, Tahun Akademik, Kurikulum, Mata Kuliah, Dosen, dan Mahasiswa.
```

### Checklist

- [ ] Catatan status terbaru tersedia di final response atau dokumen progress yang memang ada.
- [ ] Catatan task aktif mencerminkan status nyata jika dokumen task tersedia.
- [ ] Entry mencatat file, migration, gate teknis, dan catatan penting.

---

## FASE 3: Transisi Antar Task

### Aturan urutan

Kerjakan task mengikuti urutan dokumen phase. Jangan lompat ke nomor lebih besar jika nomor sebelumnya belum selesai, kecuali blocker tercatat jelas.

Contoh urutan Phase 1:

```text
1.1 Auth dan Session
1.2 RBAC Roles dan Permissions
1.3 Dynamic Sidebar dan Menu Builder
1.4 User Management
1.5 Master Data:
    Kampus -> Fakultas -> Prodi -> Ruangan -> Kelas
    -> Tahun Akademik -> Kurikulum -> Mata Kuliah -> Dosen -> Mahasiswa
1.6 Import dan Export
1.7 Audit Log
1.8 Dashboard Admin Real Data
1.9 Quality Gate dan Dokumentasi
```

### Syarat task dianggap selesai

Task baru boleh dimulai hanya jika task sebelumnya memenuhi ini:

```text
- Semua file rencana sudah dibuat atau dimodifikasi.
- npm run type-check hijau.
- npm run lint hijau, tidak ada error baru.
- npm run build hijau.
- Smoke test manual lolos untuk route terdampak.
- Status task dicatat di final response atau dokumen progress yang memang ada.
```

Jika belum, lanjutkan task yang sama. Jangan pindah cuma karena bosan.

### Format blocker

Jika task tertahan, tulis jelas di final response atau dokumen task yang memang ada:

```markdown
## Blocker
**Masalah:** Import/export Excel belum selesai karena library `xlsx` belum ada.
**Dampak:** Phase 1.6 tertunda.
**Tindakan:** Install dependency dan verifikasi kompatibilitas.
**Dapat dilanjutkan oleh:** Sesi berikutnya setelah dependency tersedia.
```

### Checklist

- [ ] Task berikutnya sesuai urutan phase.
- [ ] Task sebelumnya benar-benar selesai.
- [ ] Blocker tertulis jika ada.
- [ ] Tidak ada task dilompati tanpa alasan.

---

## FASE 4: Dependency Antar Phase

### Urutan phase

```text
Phase 0 Production Safety
  wajib selesai sebelum Phase 1
Phase 1 Fondasi Admin
  wajib selesai sebelum Phase 2
Phase 2 PMB dan Keuangan
  wajib selesai sebelum Phase 3
Phase 3 Akademik dan LMS
  bisa paralel dengan Phase 4
Phase 4 Laporan dan Monitoring
Phase 5 Notifikasi dan EDOM
  wajib Phase 1-4 selesai
Phase 6 Production Readiness
  wajib semua phase selesai
```

### Alasan dependency

- Phase 2 butuh user management, role, menu, dan master data akademik dari Phase 1.
- Phase 3 butuh mahasiswa, dosen, master data Phase 1, dan tagihan dari Phase 2.
- Phase 5 butuh event dari Phase 1-4 sebagai trigger notifikasi.
- Phase 6 butuh semua fitur stabil, teruji, dan terdokumentasi.

### Dependency penting

| Sub-task | Membutuhkan |
|----------|-------------|
| PMB pendaftaran publik | `program_studi`, `tahun_akademik` |
| Generate NIM | User management dan role mahasiswa |
| KRS mahasiswa | Jadwal, KRS header/detail, mahasiswa aktif |
| Laporan akademik | KRS dan nilai |
| Notifikasi tagihan | Tagihan dan template notifikasi |

### Gap review akhir phase

Di akhir phase, tulis gap sebelum lanjut:

```markdown
## Gap Review — Akhir Phase 1

### Wajib ada sebelum Phase 2

- [x] Tabel `users`, `user_roles`.
- [x] Tabel `program_studi`, `fakultas`, `kampus`.
- [x] Tabel `tahun_akademik`, `kurikulum`.
- [x] Role system berjalan.
- [x] Permission `pmb.*` sudah di-seed.
- [ ] Import mahasiswa massal belum ada.
- [ ] CRUD UI `mahasiswa` belum selesai.
```

### Checklist

- [ ] Dependency phase diikuti.
- [ ] Tidak ada phase dilompati.
- [ ] Gap review dibuat di akhir phase.
- [ ] Blocker lintas phase terdokumentasi.

---

## FASE 5: Penanganan Sesi Terpotong

### Saat context hampir habis

Sebelum sesi berakhir, catat status terakhir di final response atau dokumen task yang memang ada:

```markdown
## Status Terakhir Saat Sesi Terpotong

**Waktu:** [timestamp]

**Progress terakhir:**
- [x] Helper `src/lib/admin/kampus.ts` selesai.
- [x] Server Action create/update selesai.
- [ ] Delete/restore belum selesai.
- [ ] UI manager belum mulai.

**Kondisi kode:**
- `npm run type-check`: hijau, terakhir dicek [jam].
- `npm run lint`: belum dicek setelah perubahan terakhir.
- `npm run build`: belum dicek setelah perubahan terakhir.

**Lanjutkan dengan:**
1. Selesaikan delete dan restore.
2. Buat UI manager.
3. Jalankan gate teknis.

**Jangan dilakukan tanpa baca ini:**
- Jangan timpa helper yang sudah final.
- Jangan buat migration baru jika tabel sudah ada.
```

### Saat sesi berikutnya mulai

1. Baca ringkasan sesi terakhir atau dokumen task yang memang ada.
2. Baca file yang sudah dibuat atau dimodifikasi.
3. Lanjutkan dari titik terakhir.
4. Jalankan gate teknis yang relevan.
5. Jangan buat ulang file yang sudah ada. Baca dulu, lalu modifikasi seperlunya.

### Checklist

- [ ] State terakhir tercatat.
- [ ] Gate terakhir dicatat.
- [ ] Instruksi sesi berikutnya eksplisit.
- [ ] File final ditandai agar tidak ditimpa.

---

## FASE 6: Final Review Per Sesi

Sebelum sesi selesai, lakukan review kecil:

```text
- Ringkasan pekerjaan selesai tersedia di final response atau dokumen progress yang memang ada.
- Status task terbaru tersedia di final response atau dokumen task yang memang ada.
- Gate teknis terakhir dicatat.
- Tidak ada kode setengah jadi tanpa catatan.
- Sesi berikutnya tahu harus lanjut dari mana.
- Tidak ada regression tersembunyi.
- Blocker terdokumentasi.
- Urutan phase tetap dipatuhi.
```

---

## Output yang Diharapkan

Setelah SOP ini dipakai:

1. Catatan progress selalu tersedia di final response atau dokumen progress yang memang ada.
2. Sesi baru cepat paham posisi pengerjaan.
3. Task selesai tidak dikerjakan ulang dari nol.
4. Urutan phase tetap ketat.
5. Blocker terlihat jelas.
6. Gate teknis selalu punya jejak status.
7. Agent tidak sok kreatif menghapus konteks penting. Iya, itu perlu ditulis.
