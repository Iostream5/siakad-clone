alter table public.program_studi
add column if not exists fakultas_id uuid references public.fakultas(id);

create index if not exists idx_program_studi_fakultas_id
on public.program_studi(fakultas_id);

with first_faculty as (
  select id
  from public.fakultas
  order by created_at asc
  limit 1
)
update public.program_studi
set fakultas_id = (select id from first_faculty)
where fakultas_id is null
  and exists (select 1 from first_faculty);
