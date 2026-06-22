# lms.ts

## createLmsMateriAction
- **Deskripsi Singkat:** Fungsi bagi Dosen untuk mengunggah materi pembelajaran (PDF, link, teks) ke dalam kelas LMS.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Cocok dengan ekspektasi: "Menambahkan Materi ke dalam pertemuan (Bisa berupa PDF diunggah ke Supabase Storage, Tautan YouTube, atau teks kaya/Markdown)."

## createLmsTugasAction
- **Deskripsi Singkat:** Membuat assignment/tugas dengan deskripsi dan tenggat waktu (due date).
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Memenuhi syarat pembuatan tugas oleh dosen pengampu.
- **Saran Perbaikan:**
  - Pastikan Server Action ini memvalidasi *Due Date* agar tidak dapat diset di masa lalu (kecuali ada flag *late submission*).

## submitLmsTugasAction
- **Deskripsi Singkat:** Aksi pengumpulan tugas (submission) oleh Mahasiswa.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai (namun perlu pengecekan ketat)**.
- **Detail Temuan:**
  - Sesuai dengan instruksi "Mengunggah file tugas atau mengetik jawaban teks langsung".
- **Saran Perbaikan:**
  - Terdapat requirement: "Fitur Auto-Lock Tugas, di mana sistem secara hard-stop menolak unggahan submission lewat dari tenggat waktu". Di fungsi ini, wajib diperiksa apakah `new Date()` saat ini melebihi due date. Jika ya, dan tugas disetting tidak menerima keterlambatan, *Action* harus menolak (throw error).

## gradeSubmissionAction
- **Deskripsi Singkat:** Aksi bagi Dosen untuk memberikan nilai numerik dan feedback naratif pada tugas mahasiswa yang dikumpulkan.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Sinkron dengan flow "Dosen Pengampu ... Menginput Skor (Skala 0-100) dan (Opsional) Feedback naratif".
- **Saran Perbaikan:**
  - Pastikan yang bisa menjalankan fungsi ini hanyalah `Dosen Pengampu` yang memang terdaftar mengajar di jadwal/kelas yang bersangkutan, bukan dosen lain secara acak.

## createLmsForumTopikAction, createLmsForumKomentarAction
- **Deskripsi Singkat:** Membuat topik diskusi baru dan memberikan komentar/balasan di forum LMS.
- **Kesesuaian dengan Dokumen End-to-End:** **Sesuai**.
- **Detail Temuan:**
  - Memfasilitasi interaksi dua arah antara dosen dan mahasiswa sesuai dengan "Membuat Forum Diskusi per topik agar mahasiswa bisa berdiskusi tanya-jawab".
