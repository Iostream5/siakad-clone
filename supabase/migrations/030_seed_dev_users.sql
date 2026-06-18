-- Seed public.users and public.user_roles for development environment

insert into public.users (id, username, email, full_name, role, is_active)
values
  ('00000000-0000-4000-8000-000000000001', 'admin', 'admin@kampus.ac.id', 'Admin SIAKAD', 'Admin', true),
  ('00000000-0000-4000-8000-000000000002', 'prodi', 'prodi@kampus.ac.id', 'Ketua Prodi Informatika', 'Prodi', true),
  ('00000000-0000-4000-8000-000000000003', 'dosen', 'dosen@kampus.ac.id', 'Dr. Ahmad Fauzi', 'Dosen', true),
  ('00000000-0000-4000-8000-000000000004', 'mahasiswa', 'mahasiswa@kampus.ac.id', 'Nadia Putri', 'Mahasiswa', true),
  ('00000000-0000-4000-8000-000000000005', 'staff', 'staff@kampus.ac.id', 'Staff Akademik', 'Staff', true),
  ('00000000-0000-4000-8000-000000000006', 'keuangan', 'keuangan@kampus.ac.id', 'Biro Keuangan', 'Keuangan', true),
  ('00000000-0000-4000-8000-000000000007', 'pimpinan', 'pimpinan@kampus.ac.id', 'Wakil Rektor', 'Pimpinan', true)
on conflict (id) do update set
  username = excluded.username,
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  is_active = excluded.is_active;

insert into public.user_roles (user_id, role)
values
  ('00000000-0000-4000-8000-000000000001', 'Admin'),
  ('00000000-0000-4000-8000-000000000002', 'Prodi'),
  ('00000000-0000-4000-8000-000000000003', 'Dosen'),
  ('00000000-0000-4000-8000-000000000004', 'Mahasiswa'),
  ('00000000-0000-4000-8000-000000000005', 'Staff'),
  ('00000000-0000-4000-8000-000000000006', 'Keuangan'),
  ('00000000-0000-4000-8000-000000000007', 'Pimpinan')
on conflict (user_id, role) do nothing;
