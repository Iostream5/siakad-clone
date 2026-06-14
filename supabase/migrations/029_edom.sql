create table if not exists public.edom_questionnaires (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik_id uuid not null references public.tahun_akademik(id),
  judul text not null,
  deskripsi text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.edom_questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.edom_questionnaires(id) on delete cascade,
  kategori text not null,
  pertanyaan text not null,
  tipe text not null check (tipe in ('RATING', 'ESSAY')),
  urutan integer not null default 0,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.edom_responses (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.edom_questionnaires(id),
  mahasiswa_id uuid not null references public.mahasiswa(id),
  jadwal_id uuid not null references public.jadwal_kuliah(id),
  saran text,
  submitted_at timestamptz not null default now(),
  unique (questionnaire_id, mahasiswa_id, jadwal_id)
);

create table if not exists public.edom_response_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.edom_responses(id) on delete cascade,
  question_id uuid not null references public.edom_questions(id),
  nilai_rating integer check (nilai_rating >= 1 and nilai_rating <= 5),
  jawaban_essay text,
  created_at timestamptz not null default now()
);

create index if not exists idx_edom_questionnaires_ta on public.edom_questionnaires(tahun_akademik_id);
create index if not exists idx_edom_responses_jadwal on public.edom_responses(jadwal_id);

-- Triggers for updated_at
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_edom_questionnaires_updated') then
    create trigger trg_edom_questionnaires_updated
    before update on public.edom_questionnaires
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_edom_questions_updated') then
    create trigger trg_edom_questions_updated
    before update on public.edom_questions
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.edom_questionnaires enable row level security;
alter table public.edom_questions enable row level security;
alter table public.edom_responses enable row level security;
alter table public.edom_response_answers enable row level security;

insert into public.menus (key, label, href, icon, parent_key, sort_order, roles) values
('edom', 'EDOM', '/dashboard/edom', 'Star', null, 55, '{"Admin", "Mahasiswa", "Dosen", "Prodi"}')
on conflict (key) do update set roles = '{"Admin", "Mahasiswa", "Dosen", "Prodi"}';
