create table if not exists public.user_menu_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  menu_key text not null,
  is_allowed boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, menu_key)
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_user_menu_permissions_updated'
  ) then
    create trigger trg_user_menu_permissions_updated
    before update on public.user_menu_permissions
    for each row execute procedure public.set_updated_at();
  end if;
end
$$;

alter table public.user_menu_permissions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_menu_permissions'
      and policyname = 'user menu permissions admin read'
  ) then
    create policy "user menu permissions admin read"
    on public.user_menu_permissions
    for select
    using (exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'Admin'
    ));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_menu_permissions'
      and policyname = 'user menu permissions admin write'
  ) then
    create policy "user menu permissions admin write"
    on public.user_menu_permissions
    for all
    using (exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'Admin'
    ))
    with check (exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'Admin'
    ));
  end if;
end
$$;
