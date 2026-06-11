-- LMS: Learning Management System Extension

-- 1. Tabel Materi Kuliah
create table if not exists public.lms_materi (
  id uuid primary key default gen_random_uuid(),
  jadwal_id uuid not null references public.jadwal_kuliah(id) on delete cascade,
  judul text not null,
  deskripsi text,
  file_url text,
  file_type text check (file_type in ('pdf', 'doc', 'video', 'link', 'other')),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabel Tugas
create table if not exists public.lms_tugas (
  id uuid primary key default gen_random_uuid(),
  jadwal_id uuid not null references public.jadwal_kuliah(id) on delete cascade,
  judul text not null,
  instruksi text,
  deadline timestamptz not null,
  poin_max numeric(5,2) not null default 100,
  file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tabel Pengumpulan Tugas (Submissions)
create table if not exists public.lms_pengumpulan (
  id uuid primary key default gen_random_uuid(),
  tugas_id uuid not null references public.lms_tugas(id) on delete cascade,
  mahasiswa_id uuid not null references public.mahasiswa(id) on delete cascade,
  konten_teks text,
  file_url text,
  nilai numeric(5,2),
  umpan_balik text,
  graded_by uuid references public.users(id),
  graded_at timestamptz,
  submitted_at timestamptz not null default now(),
  unique (tugas_id, mahasiswa_id)
);

-- 4. Tabel Forum Diskusi
create table if not exists public.lms_forum_topik (
  id uuid primary key default gen_random_uuid(),
  jadwal_id uuid not null references public.jadwal_kuliah(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  judul text not null,
  konten text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Tabel Komentar Forum
create table if not exists public.lms_forum_komentar (
  id uuid primary key default gen_random_uuid(),
  topik_id uuid not null references public.lms_forum_topik(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  konten text not null,
  created_at timestamptz not null default now()
);

-- Indexing
create index if not exists idx_lms_materi_jadwal on public.lms_materi(jadwal_id);
create index if not exists idx_lms_tugas_jadwal on public.lms_tugas(jadwal_id);
create index if not exists idx_lms_pengumpulan_tugas on public.lms_pengumpulan(tugas_id);
create index if not exists idx_lms_forum_topik_jadwal on public.lms_forum_topik(jadwal_id);

-- Updated At Triggers
create trigger trg_lms_materi_updated before update on public.lms_materi for each row execute procedure public.set_updated_at();
create trigger trg_lms_tugas_updated before update on public.lms_tugas for each row execute procedure public.set_updated_at();
create trigger trg_lms_forum_topik_updated before update on public.lms_forum_topik for each row execute procedure public.set_updated_at();

-- RLS
alter table public.lms_materi enable row level security;
alter table public.lms_tugas enable row level security;
alter table public.lms_pengumpulan enable row level security;
alter table public.lms_forum_topik enable row level security;
alter table public.lms_forum_komentar enable row level security;

-- Audit Logs Integration
create trigger trg_audit_lms_materi after insert or update or delete on public.lms_materi for each row execute procedure public.handle_user_audit();
create trigger trg_audit_lms_tugas after insert or update or delete on public.lms_tugas for each row execute procedure public.handle_user_audit();
create trigger trg_audit_lms_pengumpulan after insert or update or delete on public.lms_pengumpulan for each row execute procedure public.handle_user_audit();
