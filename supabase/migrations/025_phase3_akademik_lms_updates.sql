-- 025_phase3_akademik_lms_updates.sql
-- Fixes and enhancements for Phase 3 Akademik Inti dan LMS

-- Pastikan policy backend service role tersedia untuk LMS tables
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lms_materi' and policyname = 'Service role manage lms_materi'
  ) then
    create policy "Service role manage lms_materi" on public.lms_materi for all to service_role using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lms_tugas' and policyname = 'Service role manage lms_tugas'
  ) then
    create policy "Service role manage lms_tugas" on public.lms_tugas for all to service_role using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lms_pengumpulan' and policyname = 'Service role manage lms_pengumpulan'
  ) then
    create policy "Service role manage lms_pengumpulan" on public.lms_pengumpulan for all to service_role using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lms_forum_topik' and policyname = 'Service role manage lms_forum_topik'
  ) then
    create policy "Service role manage lms_forum_topik" on public.lms_forum_topik for all to service_role using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lms_forum_komentar' and policyname = 'Service role manage lms_forum_komentar'
  ) then
    create policy "Service role manage lms_forum_komentar" on public.lms_forum_komentar for all to service_role using (true) with check (true);
  end if;
end
$$;
