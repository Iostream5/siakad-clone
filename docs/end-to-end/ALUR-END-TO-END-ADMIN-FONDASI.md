# Alur End-to-End Admin Fondasi (Master Data & RBAC)

Dokumen ini menjelaskan flow operasional dan setup dasar aplikasi yang dilakukan oleh Admin sebelum modul-modul lain (PMB, Keuangan, Akademik, LMS) dapat digunakan. Ini mencakup manajemen Role-Based Access Control (RBAC), manajemen pengguna, dan setup master data akademik.

Status dokumen: draf alur operasional.

## Ringkasan Alur Besar

```text
Admin login
-> mengelola Role dan Permission (RBAC)
-> mengelola Menu Dinamis aplikasi
-> mengelola Users (Staf, Dosen, Admin lain)
-> mengelola Master Kampus (Kampus, Fakultas, Prodi)
-> mengelola Master Infrastruktur (Gedung, Ruangan)
-> mengelola Master Akademik (Tahun Akademik, Kurikulum, Mata Kuliah, Kelas)
-> Sistem siap digunakan untuk modul operasional (PMB, Akademik, dll)
```

## 1. Setup Role, Permission, dan Menu Dinamis (RBAC)

### Admin

- Login ke dashboard menggunakan akun dengan role `admin`.
- Membuka halaman manajemen Permission.
- Menambahkan daftar permission dengan format `module.action` (contoh: `users.read`, `pmb.verify`).
- Membuka halaman manajemen Role.
- Membuat role baru (jika belum ada) dan memberikan permission yang sesuai ke setiap role.
- Membuka halaman manajemen Menu.
- Menyusun hierarki menu dinamis untuk sidebar (termasuk menu parent dan child).
- Menentukan permission yang dibutuhkan untuk dapat melihat menu tersebut.

### Sistem

- Menyimpan data `permissions`, `roles`, dan `role_permissions` di database.
- Menyimpan struktur navigasi ke tabel `menus` dan `menu_permissions`.
- Merender sidebar secara dinamis berdasarkan role user yang sedang login dan permission yang dimilikinya.
- Menerapkan *route protection* pada `src/proxy.ts` dan Server Actions berdasarkan RBAC.

### Status Data

```text
roles.name = admin, prodi, keuangan, dosen, mahasiswa, dll
permissions.action = users.read, pmb.verify, dll
menus.status = Aktif
```

## 2. Manajemen Pengguna (Users)

### Admin

- Membuka halaman manajemen User.
- Melihat daftar semua pengguna yang terdaftar di sistem.
- Menambahkan user baru secara manual (contoh: untuk Staf, Dosen, atau Pimpinan).
- Mengisi data profil pengguna (nama, email, NIK/NIP, dll).
- Menugaskan satu atau lebih Role kepada user tersebut.
- Menonaktifkan (soft delete) user yang sudah tidak aktif.

### Sistem

- Membuat akun kredensial menggunakan Supabase Auth.
- Menyimpan data referensi user ke tabel `users`.
- Menyimpan profil detail ke `user_profiles`.
- Menyimpan pemetaan role ke tabel `user_roles`.

## 3. Setup Master Data Institusi

### Admin

- Membuka menu Master Data Kampus.
- Menambahkan data Kampus utama (Nama Institusi, Alamat, dll).
- Menambahkan data Fakultas yang berada di bawah Kampus tersebut.
- Menambahkan data Program Studi (Prodi) yang berada di bawah Fakultas terkait.

### Sistem

- Menyimpan hierarki data ke tabel `campuses`, `faculties`, dan `departments`.
- Memastikan relasi foreign key terbentuk (Prodi -> Fakultas -> Kampus).

## 4. Setup Master Infrastruktur Fisik

### Admin

- Membuka menu Gedung dan Ruangan.
- Menambahkan data Gedung yang ada di kampus.
- Menambahkan data Ruangan di dalam setiap Gedung.
- Mengatur kapasitas optimal dari masing-masing Ruangan.

### Sistem

- Menyimpan data ke tabel `buildings` (atau sejenisnya) dan `classrooms`.
- Data Ruangan nantinya akan digunakan dalam Penjadwalan Kuliah.

## 5. Setup Master Data Akademik

### Admin

- Membuka menu Tahun Akademik.
- Membuat Tahun Akademik dan Semester baru (contoh: 2026/2027 Ganjil).
- Menandai tahun akademik yang sedang *Aktif*.
- Mengatur periode penting (contoh: `is_krs_open`, `is_input_nilai_open`).
- Membuka menu Kurikulum.
- Membuat standar Kurikulum per Program Studi.
- Membuka menu Mata Kuliah.
- Mendaftarkan Mata Kuliah dan menghubungkannya dengan Kurikulum yang relevan.
- Membuka menu Kelas / Kelompok Belajar (`class_groups`).
- Membuat rombongan belajar awal untuk mahasiswa.

### Sistem

- Menyimpan ke tabel `academic_terms`, `curriculums`, `courses` (atau ekuivalen), dan `class_groups`.
- Menandai perubahan status tahun akademik (hanya ada satu tahun akademik yang aktif pada satu waktu).
- *Audit Log* mencatat setiap perubahan master data yang krusial.

## 6. Flow per Role

### Admin

Status: Draf (Sesuai spesifikasi Phase 1)

- Login sebagai admin utama.
- Setup seluruh entitas master data.
- Mengelola permission agar role lain tidak dapat mengubah master data.
- Memonitor log aktivitas (`audit_logs`) dari semua user.

Acceptance:
- Admin dapat melihat dan melakukan operasi CRUD pada seluruh master data.
- Aksi krusial oleh Admin terekam dalam *Audit Log*.
- UI merespons dinamis sesuai konfigurasi Menu Builder.

### Role Lain (Prodi, Dosen, dsb)

Status: Draf

- Hanya melihat (Read-only) master data tertentu yang relevan sesuai permission yang diset.
- Tidak dapat melihat menu konfigurasi RBAC (Role, Permission, Menu).

## 7. Gap yang Perlu Diimplementasikan

- Fitur Import/Export massal menggunakan Excel/CSV untuk entitas seperti Mahasiswa, Dosen, Ruangan, dan Mata Kuliah agar mempercepat proses setup.
- UI yang lebih intuitif untuk menautkan Permission ke Role (misalnya menggunakan checkbox matrix).
- Implementasi Soft Delete dan kemampuan me-restore (Restore) data master yang terhapus agar tidak merusak referensi data lama.

## 8. Definition of Done Flow Utama

Flow ini dianggap jalan jika semua bukti berikut terpenuhi:

- Admin berhasil login via Supabase Auth dan melihat dashboard.
- Admin bisa membuat Role baru dan mengatur Permission.
- Admin bisa mengatur Menu sidebar, dan menu tersebut otomatis hilang untuk user tanpa permission.
- Admin bisa membuat User baru dan login dengan user tersebut sukses.
- Admin bisa melengkapi data Kampus, Fakultas, dan Prodi tanpa error relasi.
- Admin bisa menambahkan Tahun Akademik dan mengaktifkannya.
- Audit Log mencatat siapa, kapan, dan apa yang diubah pada operasi krusial.
