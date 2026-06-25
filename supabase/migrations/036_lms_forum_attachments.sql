alter table public.lms_forum_topik add column if not exists file_url text;
alter table public.lms_forum_komentar add column if not exists file_url text;
