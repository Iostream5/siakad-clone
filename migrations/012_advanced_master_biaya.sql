-- Update master_biaya to match advanced reference
alter table public.master_biaya 
add column if not exists tingkat_kelas text[], -- Array of strings (e.g., ['X', 'XI'])
add column if not exists jurusan text[],       -- Array of strings
add column if not exists jenis_kelamin text default 'Semua',
add column if not exists gelombang text,
add column if not exists jalur text,
add column if not exists terbit text default 'Sekali', -- Sekali / Rutin
add column if not exists boleh_angsur boolean default false,
add column if not exists is_mutasi boolean default false,
add column if not exists is_boarding boolean default false,
add column if not exists keterangan text,
add column if not exists status boolean default true;
