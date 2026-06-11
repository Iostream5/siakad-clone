insert into public.program_studi (id, kode, nama, jenjang)
values
  ('00000000-0000-0000-0000-000000000101', 'IF', 'Informatika', 'S1'),
  ('00000000-0000-0000-0000-000000000102', 'SI', 'Sistem Informasi', 'S1')
on conflict (id) do nothing;

insert into public.tahun_akademik (id, kode, nama, semester, tanggal_mulai, tanggal_selesai, is_aktif, is_krs_open)
values
  ('00000000-0000-0000-0000-000000000201', '2026G', '2026/2027 Ganjil', 'Ganjil', '2026-08-15', '2027-01-15', true, true)
on conflict (id) do nothing;

insert into public.pengumuman (id, judul, isi, target_role, is_active)
values
  ('00000000-0000-0000-0000-000000000301', 'KRS Dibuka', 'Periode KRS dibuka mulai 20 April 2026.', 'Mahasiswa', true),
  ('00000000-0000-0000-0000-000000000302', 'Rekonsiliasi UKT', 'Verifikasi pembayaran dilakukan maksimal H+1.', 'Keuangan', true)
on conflict (id) do nothing;
