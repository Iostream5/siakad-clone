create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_user_roles_updated'
  ) then
    create trigger trg_user_roles_updated
    before update on public.user_roles
    for each row execute function public.set_updated_at();
  end if;
end
$$;

create table if not exists public.role_menu_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara')),
  menu_key text not null,
  is_allowed boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role, menu_key)
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_role_menu_permissions_updated'
  ) then
    create trigger trg_role_menu_permissions_updated
    before update on public.role_menu_permissions
    for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara'));

alter table public.role_menu_permissions drop constraint if exists role_menu_permissions_role_check;
alter table public.role_menu_permissions add constraint role_menu_permissions_role_check
  check (role in ('Admin', 'Prodi', 'Dosen', 'Mahasiswa', 'Staff', 'Keuangan', 'Pimpinan', 'Bendahara'));

insert into public.user_roles (user_id, role)
select u.id, u.role
from public.users u
where u.deleted_at is null
on conflict (user_id, role) do nothing;

alter table public.user_roles enable row level security;
alter table public.role_menu_permissions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Service role manage user_roles'
  ) then
    create policy "Service role manage user_roles"
    on public.user_roles
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'role_menu_permissions' and policyname = 'Service role manage role_menu_permissions'
  ) then
    create policy "Service role manage role_menu_permissions"
    on public.role_menu_permissions
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;
