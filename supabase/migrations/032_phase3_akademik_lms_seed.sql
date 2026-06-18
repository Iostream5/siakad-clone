-- 032_phase3_akademik_lms_seed.sql
-- Seed Data Phase 3 Akademik Inti dan LMS

do $$
declare
  var_prodi_id uuid;
  var_tahun_akademik_id uuid;
  var_dosen_id uuid;
  var_mahasiswa_id uuid;
  var_mata_kuliah_id uuid;
  var_ruangan_id uuid;
  var_jadwal_id uuid;
  var_krs_header_id uuid;
  var_lms_materi_id uuid;
  var_lms_tugas_id uuid;
  var_lms_forum_topik_id uuid;
begin
  -- Get existing prodi
  select id into var_prodi_id from public.program_studi limit 1;
  if var_prodi_id is null then
    -- Insert prodi if not exists
    insert into public.program_studi (kode, nama, jenjang, akreditasi)
    values ('IF', 'Informatika', 'S1', 'A') returning id into var_prodi_id;
  end if;

  -- Get active tahun akademik
  select id into var_tahun_akademik_id from public.tahun_akademik where is_aktif = true limit 1;
  if var_tahun_akademik_id is null then
    insert into public.tahun_akademik (kode, nama, is_aktif)
    values ('20231', '2023/2024 Ganjil', true) returning id into var_tahun_akademik_id;
  end if;

  -- 1. Setup Dosen
  select id into var_dosen_id from public.dosen where nidn = '0123456789' limit 1;
  if var_dosen_id is null then
    insert into public.dosen (user_id, nidn, prodi_id)
    values ('00000000-0000-4000-8000-000000000003', '0123456789', var_prodi_id)
    returning id into var_dosen_id;
  end if;

  -- 2. Setup Mahasiswa
  select id into var_mahasiswa_id from public.mahasiswa where nim = '1234567890' limit 1;
  if var_mahasiswa_id is null then
    insert into public.mahasiswa (user_id, nim, prodi_id, angkatan, status)
    values ('00000000-0000-4000-8000-000000000004', '1234567890', var_prodi_id, 2023, 'Aktif')
    returning id into var_mahasiswa_id;
  end if;

  -- 3. Dosen Wali
  if not exists (select 1 from public.dosen_wali where id_dosen = var_dosen_id and id_mahasiswa = var_mahasiswa_id) then
    insert into public.dosen_wali (id_dosen, id_mahasiswa)
    values (var_dosen_id, var_mahasiswa_id);
  end if;

  -- 4. Mata Kuliah
  select id into var_mata_kuliah_id from public.mata_kuliah where kode = 'IF101' limit 1;
  if var_mata_kuliah_id is null then
    insert into public.mata_kuliah (kode, nama, sks, semester, prodi_id)
    values ('IF101', 'Pemrograman Dasar', 3, 1, var_prodi_id)
    returning id into var_mata_kuliah_id;
  end if;

  -- 5. Ruangan
  select id into var_ruangan_id from public.ruangan where kode = 'R101' limit 1;
  if var_ruangan_id is null then
    insert into public.ruangan (kode, nama, kapasitas)
    values ('R101', 'Ruang 101', 40)
    returning id into var_ruangan_id;
  end if;

  -- 6. Jadwal Kuliah
  select id into var_jadwal_id from public.jadwal_kuliah where mata_kuliah_id = var_mata_kuliah_id and tahun_akademik_id = var_tahun_akademik_id limit 1;
  if var_jadwal_id is null then
    insert into public.jadwal_kuliah (tahun_akademik_id, mata_kuliah_id, dosen_id, hari, jam_mulai, jam_selesai, ruangan, kapasitas, peserta, nama_kelas)
    values (var_tahun_akademik_id, var_mata_kuliah_id, var_dosen_id, 'Senin', '08:00', '10:30', 'R101', 40, 1, 'Kelas A')
    returning id into var_jadwal_id;
  end if;

  -- 7. KRS Header & Detail (Submitted state to test approval)
  select id into var_krs_header_id from public.krs_header where id_mahasiswa = var_mahasiswa_id and id_tahun_akademik = var_tahun_akademik_id limit 1;
  if var_krs_header_id is null then
    insert into public.krs_header (id_mahasiswa, id_tahun_akademik, status, total_sks)
    values (var_mahasiswa_id, var_tahun_akademik_id, 'Diajukan', 3)
    returning id into var_krs_header_id;

    insert into public.krs_detail (id_krs_header, id_jadwal)
    values (var_krs_header_id, var_jadwal_id);
  end if;

  -- 8. Nilai Akhir
  if not exists (select 1 from public.nilai_akhir where mahasiswa_id = var_mahasiswa_id and jadwal_id = var_jadwal_id) then
    insert into public.nilai_akhir (mahasiswa_id, jadwal_id, nilai_angka, nilai_huruf, published_at)
    values (var_mahasiswa_id, var_jadwal_id, 85, 'A', now());
  end if;

  -- 9. LMS Data
  -- Materi
  select id into var_lms_materi_id from public.lms_materi where jadwal_id = var_jadwal_id limit 1;
  if var_lms_materi_id is null then
    insert into public.lms_materi (jadwal_id, judul, deskripsi, file_type)
    values (var_jadwal_id, 'Pengenalan Algoritma', 'Materi awal tentang konsep algoritma.', 'pdf')
    returning id into var_lms_materi_id;
  end if;

  -- Tugas
  select id into var_lms_tugas_id from public.lms_tugas where jadwal_id = var_jadwal_id limit 1;
  if var_lms_tugas_id is null then
    insert into public.lms_tugas (jadwal_id, judul, instruksi, deadline, poin_max)
    values (var_jadwal_id, 'Tugas 1: Pseudocode', 'Buat pseudocode untuk menghitung luas lingkaran.', now() + interval '7 days', 100)
    returning id into var_lms_tugas_id;
  end if;

  -- Pengumpulan Tugas
  if not exists (select 1 from public.lms_pengumpulan where tugas_id = var_lms_tugas_id and mahasiswa_id = var_mahasiswa_id) then
    insert into public.lms_pengumpulan (tugas_id, mahasiswa_id, konten_teks, submitted_at, nilai)
    values (var_lms_tugas_id, var_mahasiswa_id, 'Berikut adalah pseudocode saya...', now(), 90);
  end if;

  -- Forum
  select id into var_lms_forum_topik_id from public.lms_forum_topik where jadwal_id = var_jadwal_id limit 1;
  if var_lms_forum_topik_id is null then
    insert into public.lms_forum_topik (jadwal_id, user_id, judul, konten, is_pinned)
    values (var_jadwal_id, '00000000-0000-4000-8000-000000000003', 'Diskusi Bab 1', 'Silakan bertanya tentang materi bab 1 di sini.', true)
    returning id into var_lms_forum_topik_id;
  end if;

end
$$;
