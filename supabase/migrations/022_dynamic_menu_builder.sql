create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  href text not null,
  icon text,
  parent_key text,
  sort_order integer not null default 0,
  roles text[] not null default '{}',
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menus_parent_key on public.menus(parent_key);
create index if not exists idx_menus_sort_order on public.menus(sort_order);
create index if not exists idx_menus_active on public.menus(is_active);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_menus_updated') then
    create trigger trg_menus_updated
    before update on public.menus
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.menus enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'menus' and policyname = 'Service role manage menus'
  ) then
    create policy "Service role manage menus"
    on public.menus
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

