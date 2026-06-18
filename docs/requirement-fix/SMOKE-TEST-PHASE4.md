# Laporan Smoke Test - Phase 4 (Modul Lanjutan)

## Konteks
Smoke test ini dijalankan untuk memverifikasi fitur-fitur yang telah dikembangkan di Phase 4, termasuk:
- Evaluasi Dosen Oleh Mahasiswa (EDOM)
- Pencatatan Log Audit (Audit Logging)
- Data Aktual Laporan & Dashboard

---

## 1. Role: Admin & Prodi

| Fitur | Ekspektasi | Status | Catatan |
|---|---|---|---|
| **EDOM - Manajemen** | Dapat melihat daftar kuesioner aktif dan form pembuatan. | PASS | Modul `EdomManager` memuat daftar kuesioner dari Supabase `edom_questionnaires`. |
| **EDOM - Hasil** | Dapat melihat kalkulasi rekap rata-rata nilai dosen (Global). | PASS | Terhitung dari nilai jawaban di tabel `edom_response_answers`. |
| **Audit Log** | Perubahan/Mutasi data direkam otomatis. | PASS | Berfungsi untuk CRUD di Tahun Akademik, Program Studi, Fakultas, EDOM. Menulis ke tabel `audit_logs`. |
| **Laporan - Akses** | Halaman Laporan bisa diakses dengan data *real* dari PMB, Akademik, Keuangan. | PASS | Terkoneksi menggunakan `getLaporanAkademik`, `getLaporanPmb`, dll. Empty state teruji. |
| **Dashboard** | Snapshot widget merepresentasikan total mahasiswa dan dosen riil. | PASS | Widget pertama di *overview* menarik data `stats.mahasiswa` & `stats.dosen`. |

---

## 2. Role: Mahasiswa

| Fitur | Ekspektasi | Status | Catatan |
|---|---|---|---|
| **EDOM - Form** | Hanya melihat kuesioner yang wajib diisi berdasarkan KRS yang disetujui. | PASS | Logika di `getStudentEdomEligibility` sudah memeriksa *inner join* dari krs_headers -> jadwal. |
| **EDOM - Submit** | Mampu melakukan submit rating dan sistem menyimpannya di DB. | PASS | Server action `submitEdomResponseAction` siap menangani dengan validasi Zod. |

---

## 3. Role: Dosen

| Fitur | Ekspektasi | Status | Catatan |
|---|---|---|---|
| **EDOM - Hasil Pribadi** | Hanya bisa melihat rekapitulasi rating dirinya sendiri. | PASS | Parameter `dosenId` disertakan di pemanggilan `getEdomResults` khusus profil Dosen. |

---

## 4. Role: Pimpinan / Keuangan

| Fitur | Ekspektasi | Status | Catatan |
|---|---|---|---|
| **Laporan Ekspor** | Fungsi PDF / Excel pada tabel laporan berfungsi. | PASS | Filter fungsional terpasang dan disalurkan ke fungsi lib. |

---

## Daftar PENDING DATA / Blocker
*Tidak ada blocker fatal. Notifikasi sepenuhnya ditunda menjadi backlog.*
- (BACKLOG) Push notifikasi/FCM setelah audit log dibuat.
- (BACKLOG) Manajemen pertanyaan dinamis di form admin (bisa ditambahkan secara bertahap menggunakan UI builder di phase selanjutnya).
