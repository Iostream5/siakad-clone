# Phase 4 — Modul Lanjutan (EDOM, Notifikasi, Dashboard Per-Role)

> **Prioritas:** 🟢 Bisa ditunda — setelah core features matang  
> **Estimasi:** 3-5 hari  
> **Prasyarat:** Phase 0 + Phase 1 + Phase 2 + Phase 3 selesai

---

## Tujuan

Implementasi modul pelengkap yang meningkatkan nilai tambah SIAKAD: evaluasi dosen, notifikasi push, dan dashboard yang dipersonalisasi per role.

---

## Status Saat Ini

| Fitur | Status | Catatan |
|---|---|---|
| EDOM | ❌ Tidak ada | Tabel `edom_*` ada di migration, belum ada UI/action |
| Notifikasi Push (FCM) | ❌ Tidak ada | Tabel `notification_*` ada, action `notifications.ts` minimal |
| Halaman list notifikasi user | ❌ Tidak ada | Tidak ada `/dashboard/notifikasi` |
| Dashboard per-role | ⚠️ Parsial | Hanya Pimpinan punya view khusus |
| Tanstack Query | ❌ Tidak dipakai | Tercantum di PRD tapi 0 usage |
| Framer Motion | ❌ Tidak dipakai | Tercantum di PRD tapi 0 usage |

---

## Checklist Perbaikan

### 1. EDOM (Evaluasi Dosen Oleh Mahasiswa)

> **Status saat ini:** ❌ Tabel DB ada (`edom_*` di migration), belum ada UI  
> **Referensi PRD:** Phase 4 — "EDOM"

- [ ] **Verifikasi tabel EDOM di migration**
  - Tabel yang diharapkan:
    - `edom_questionnaires` — kuesioner/form evaluasi
    - `edom_questions` — pertanyaan per kuesioner
    - `edom_responses` — respon mahasiswa
    - `edom_response_answers` — jawaban per pertanyaan

- [ ] **Buat `src/app/dashboard/edom/page.tsx`**
  - **Role Mahasiswa:** Lihat daftar kelas yang bisa dievaluasi, isi form EDOM
  - **Role Admin/Prodi:** Lihat hasil EDOM, rekap per dosen, export
  - **Role Dosen:** Lihat hasil EDOM mereka (setelah semester selesai)

- [ ] **Buat module components:**
  - `src/modules/edom/edom-manager.tsx` — admin panel kelola kuesioner
  - `src/modules/edom/edom-form.tsx` — form isi EDOM untuk mahasiswa
  - `src/modules/edom/edom-results.tsx` — visualisasi hasil per dosen

- [ ] **Buat Server Actions `src/actions/edom.ts`**
  - `createQuestionnaireAction` — admin buat kuesioner
  - `submitEdomResponseAction` — mahasiswa submit evaluasi
  - `getEdomResultsAction` — ambil hasil per dosen/kelas
  - Auth check: mahasiswa hanya bisa isi EDOM kelas yang ada di KRS

- [ ] **Buat helpers `src/lib/admin/edom.ts`**
  - `getActiveQuestionnaires` — kuesioner yang sedang aktif
  - `getEdomResults(dosenId?, kelasId?)` — rekap hasil
  - `checkStudentEdomEligibility(mahasiswaId, kelasId)` — cek sudah isi atau belum

- [ ] **Aturan bisnis:**
  - Satu mahasiswa hanya bisa submit 1x per kelas per kuesioner
  - EDOM hanya bisa diisi selama periode evaluasi terbuka
  - Hasil EDOM anonim — dosen tidak bisa lihat siapa yang memberi nilai
  - Dosen hanya bisa lihat hasil setelah semester selesai

**File yang perlu dibuat:**
```
src/app/dashboard/edom/page.tsx         [NEW]
src/modules/edom/edom-manager.tsx       [NEW]
src/modules/edom/edom-form.tsx          [NEW]
src/modules/edom/edom-results.tsx       [NEW]
src/actions/edom.ts                     [NEW]
src/lib/admin/edom.ts                   [NEW]
```

---

### 2. Notifikasi In-App & Push (FCM)

> **Status saat ini:** ❌ Tabel ada, action minimal, belum ada UI  
> **Referensi PRD:** Phase 4 — "Firebase Cloud Messaging"

#### 2a. Notifikasi In-App (Prioritas lebih tinggi)

- [ ] **Buat `src/app/dashboard/notifikasi/page.tsx`**
  - Daftar notifikasi user: dibaca/belum dibaca
  - Filter: semua, belum dibaca
  - Klik notifikasi → tandai dibaca + navigate ke halaman terkait

- [ ] **Buat `src/modules/dashboard/notification-list.tsx`**
  - List notifikasi dengan badge unread count
  - Tombpol "Tandai semua dibaca"
  - Pagination

- [ ] **Tambah bell icon di topbar**
  - Badge jumlah notifikasi belum dibaca
  - Dropdown mini preview 5 notifikasi terbaru
  - Link "Lihat semua" ke `/dashboard/notifikasi`

- [ ] **Buat helper `src/lib/admin/notifications-user.ts`**
  - `getUserNotifications(userId, { page, unreadOnly })` — query notifikasi user
  - `markAsRead(notificationId, userId)` — tandai dibaca
  - `markAllAsRead(userId)` — tandai semua dibaca
  - `getUnreadCount(userId)` — untuk badge

- [ ] **Trigger notifikasi otomatis** untuk event penting:
  - KRS disetujui/ditolak → notif ke mahasiswa
  - Pembayaran terverifikasi → notif ke mahasiswa
  - PMB status berubah → notif ke calon mahasiswa
  - Tugas baru di LMS → notif ke mahasiswa di kelas
  - Nilai dipublish → notif ke mahasiswa

#### 2b. Push Notification (FCM) — Optional

- [ ] **Integrasi FCM (jika dibutuhkan)**
  - Service worker untuk receive push notification
  - Register device token ke `notification_devices`
  - Server-side push via FCM API

**File yang perlu dibuat:**
```
src/app/dashboard/notifikasi/page.tsx              [NEW]
src/modules/dashboard/notification-list.tsx        [NEW]
src/modules/dashboard/notification-bell.tsx        [NEW]
src/lib/admin/notifications-user.ts                [NEW]
src/actions/notifications.ts                       [MODIFY]
src/components/layout/topbar.tsx                   [MODIFY]
```

---

### 3. Dashboard Per-Role

> **Status saat ini:** ⚠️ Hanya Pimpinan punya view khusus, role lain pakai generic  
> **Dampak:** Dashboard tidak informatif untuk role selain Admin/Pimpinan

- [ ] **Dashboard Mahasiswa** — widget:
  - KRS aktif (MK yang diambil semester ini)
  - Jadwal hari ini
  - Tagihan aktif (yang belum lunas)
  - Notifikasi terbaru
  - IPK dan IPS terakhir
  - Tugas LMS yang mendekati deadline

- [ ] **Dashboard Dosen** — widget:
  - Kelas yang diampu semester ini
  - Jadwal mengajar hari ini
  - KRS yang perlu di-approve
  - Submission tugas yang belum dinilai
  - Statistik: jumlah mahasiswa bimbingan

- [ ] **Dashboard Keuangan** — widget:
  - Total pemasukan hari/minggu/bulan ini
  - Jumlah pembayaran yang perlu diverifikasi
  - Piutang outstanding
  - Grafik tren pembayaran

- [ ] **Dashboard Prodi** — widget:
  - Statistik mahasiswa per angkatan
  - KRS yang perlu di-approve
  - Jadwal kuliah prodi hari ini
  - Progres nilai (berapa % dosen sudah input)

**File yang perlu dibuat/dimodifikasi:**
```
src/modules/dashboard/mahasiswa-dashboard.tsx   [NEW]
src/modules/dashboard/dosen-dashboard.tsx       [NEW]
src/modules/dashboard/keuangan-dashboard.tsx    [NEW]
src/modules/dashboard/prodi-dashboard.tsx       [NEW]
src/app/dashboard/page.tsx                      [MODIFY]
```

---

### 4. Integrasi Tanstack Query

> **Status saat ini:** ❌ Tercantum di PRD tapi 0 usage di codebase  
> **Dampak:** Semua data fetching saat ini via Server Component/Action — tidak ada client-side cache

- [ ] **Evaluasi kebutuhan** — apakah perlu diimplementasi sekarang?
  - Server Components sudah handle sebagian besar data fetching
  - Tanstack Query berguna untuk: polling, optimistic updates, infinite scroll
  - Jika tidak dibutuhkan sekarang, **dokumentasikan sebagai keputusan arsitektur**

- [ ] **Jika diterapkan:**
  - Setup QueryClientProvider di root layout
  - Gunakan untuk fitur real-time: notifikasi bell, chat forum LMS
  - Prefetch data dari Server Component, hydrate di client

---

### 5. Integrasi Framer Motion

> **Status saat ini:** ❌ Tercantum di PRD tapi 0 usage  
> **Dampak:** UI kurang terasa "premium" tanpa animasi

- [ ] **Implementasi animasi dasar:**
  - Page transition di dashboard (fade in)
  - Sidebar expand/collapse animation
  - Modal open/close animation
  - Card hover effects
  - Tab switching transition

- [ ] **Jika tidak diterapkan, dokumentasikan sebagai keputusan**
  - Hapus dari PRD atau tandai sebagai "nice to have"

---

## Kriteria Selesai Phase 4

```bash
npm run type-check && npm run lint && npm run build

# Manual check:
✅ EDOM: mahasiswa bisa isi, admin bisa lihat hasil
✅ Notifikasi: bell icon di topbar, halaman list notifikasi
✅ Dashboard per-role: setiap role melihat widget yang relevan
✅ (Optional) Tanstack Query terintegrasi atau didokumentasikan
✅ (Optional) Framer Motion terintegrasi atau didokumentasikan
```
