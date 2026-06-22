-- Flow 10 per role advanced repair:
-- PMB seleksi terstruktur, kalender akademik DEV parity, dan EDOM compatibility repair.

create table if not exists public.pmb_passing_grade (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik_id uuid references public.tahun_akademik(id) on delete set null,
  prodi_id uuid references public.program_studi(id) on delete cascade,
  jalur_pendaftaran text not null default 'Semua',
  jenis_pendaftaran text not null default 'Semua',
  gelombang text,
  minimum_skor numeric not null default 60 check (minimum_skor >= 0 and minimum_skor <= 100),
  is_active boolean not null default true,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_pmb_passing_grade_scope
  on public.pmb_passing_grade (
    coalesce(tahun_akademik_id::text, 'all'),
    coalesce(prodi_id::text, 'all'),
    jalur_pendaftaran,
    jenis_pendaftaran,
    coalesce(gelombang, 'all')
  );

create table if not exists public.pmb_jadwal_seleksi (
  id uuid primary key default gen_random_uuid(),
  pmb_pendaftaran_id uuid not null references public.pmb_pendaftaran(id) on delete cascade,
  tipe text not null default 'Wawancara' check (tipe in ('Wawancara', 'Tes Tulis', 'Administrasi', 'Lainnya')),
  scheduled_at timestamptz not null,
  lokasi text,
  interviewer_id uuid references public.dosen(id) on delete set null,
  status text not null default 'Terjadwal' check (status in ('Terjadwal', 'Selesai', 'Batal')),
  catatan text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pmb_pendaftaran_id)
);

create table if not exists public.pmb_komponen_seleksi (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  bobot numeric not null default 100 check (bobot > 0 and bobot <= 100),
  skor_maks numeric not null default 100 check (skor_maks > 0),
  is_active boolean not null default true,
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nama)
);

create table if not exists public.pmb_nilai_seleksi (
  id uuid primary key default gen_random_uuid(),
  pmb_pendaftaran_id uuid not null references public.pmb_pendaftaran(id) on delete cascade,
  komponen_id uuid not null references public.pmb_komponen_seleksi(id) on delete cascade,
  skor numeric not null check (skor >= 0),
  catatan text,
  dinilai_oleh uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pmb_pendaftaran_id, komponen_id)
);

insert into public.pmb_komponen_seleksi (nama, bobot, skor_maks, urutan)
values
  ('Wawancara', 60, 100, 1),
  ('SKD / Tes Dasar', 40, 100, 2)
on conflict (nama) do nothing;

create table if not exists public.kalender_akademik (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik_id uuid references public.tahun_akademik(id) on delete cascade,
  judul text not null,
  deskripsi text,
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  kategori text not null check (kategori in ('KRS', 'UTS', 'UAS', 'LIBUR', 'WISUDA', 'LAINNYA')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kalender_akademik_tahun on public.kalender_akademik(tahun_akademik_id, tanggal_mulai);

create table if not exists public.edom_questionnaires (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik_id uuid not null references public.tahun_akademik(id) on delete cascade,
  judul text not null,
  deskripsi text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.edom_questions add column if not exists questionnaire_id uuid references public.edom_questionnaires(id) on delete cascade;
alter table public.edom_questions add column if not exists kategori text;
alter table public.edom_questions add column if not exists pertanyaan text;
alter table public.edom_questions add column if not exists tipe text;
alter table public.edom_questions add column if not exists urutan integer default 0;
alter table public.edom_questions add column if not exists is_required boolean default true;
alter table public.edom_questions add column if not exists deleted_at timestamptz;

update public.edom_questions
set
  kategori = coalesce(kategori, category),
  pertanyaan = coalesce(pertanyaan, question_text),
  tipe = coalesce(tipe, 'RATING'),
  urutan = coalesce(urutan, sort_order),
  is_required = coalesce(is_required, true);

alter table public.edom_responses add column if not exists questionnaire_id uuid references public.edom_questionnaires(id) on delete set null;
alter table public.edom_responses add column if not exists saran text;

update public.edom_responses
set saran = coalesce(saran, comment);

alter table public.edom_response_answers add column if not exists nilai_rating integer check (nilai_rating >= 1 and nilai_rating <= 5);
alter table public.edom_response_answers add column if not exists jawaban_essay text;

update public.edom_response_answers
set nilai_rating = coalesce(nilai_rating, score);

create index if not exists idx_edom_questionnaires_ta on public.edom_questionnaires(tahun_akademik_id);
create index if not exists idx_edom_questions_questionnaire on public.edom_questions(questionnaire_id);
create index if not exists idx_edom_responses_questionnaire on public.edom_responses(questionnaire_id);
create unique index if not exists idx_edom_unique_questionnaire_student_jadwal
  on public.edom_responses(questionnaire_id, mahasiswa_id, jadwal_id)
  where questionnaire_id is not null;

alter table public.pmb_passing_grade enable row level security;
alter table public.pmb_jadwal_seleksi enable row level security;
alter table public.pmb_komponen_seleksi enable row level security;
alter table public.pmb_nilai_seleksi enable row level security;
alter table public.kalender_akademik enable row level security;
alter table public.edom_questionnaires enable row level security;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    if not exists (select 1 from pg_trigger where tgname = 'trg_pmb_passing_grade_updated') then
      create trigger trg_pmb_passing_grade_updated before update on public.pmb_passing_grade
      for each row execute function public.set_updated_at();
    end if;
    if not exists (select 1 from pg_trigger where tgname = 'trg_pmb_jadwal_seleksi_updated') then
      create trigger trg_pmb_jadwal_seleksi_updated before update on public.pmb_jadwal_seleksi
      for each row execute function public.set_updated_at();
    end if;
    if not exists (select 1 from pg_trigger where tgname = 'trg_pmb_komponen_seleksi_updated') then
      create trigger trg_pmb_komponen_seleksi_updated before update on public.pmb_komponen_seleksi
      for each row execute function public.set_updated_at();
    end if;
    if not exists (select 1 from pg_trigger where tgname = 'trg_pmb_nilai_seleksi_updated') then
      create trigger trg_pmb_nilai_seleksi_updated before update on public.pmb_nilai_seleksi
      for each row execute function public.set_updated_at();
    end if;
    if not exists (select 1 from pg_trigger where tgname = 'trg_kalender_akademik_updated') then
      create trigger trg_kalender_akademik_updated before update on public.kalender_akademik
      for each row execute function public.set_updated_at();
    end if;
    if not exists (select 1 from pg_trigger where tgname = 'trg_edom_questionnaires_updated') then
      create trigger trg_edom_questionnaires_updated before update on public.edom_questionnaires
      for each row execute function public.set_updated_at();
    end if;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kalender_akademik' and policyname = 'Everyone can read active calendar') then
    create policy "Everyone can read active calendar" on public.kalender_akademik for select using (is_active = true);
  end if;
end
$$;
