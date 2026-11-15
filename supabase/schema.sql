-- Ankit & Kajal Wedding Ledger
-- Run once in Supabase SQL Editor. Each tracker section has its own table.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  role text not null default 'pending'
    check (role in ('pending', 'viewer', 'editor', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id text primary key,
  name text not null,
  lead text not null default '',
  phone text not null default '',
  backup text not null default '',
  "backupPhone" text not null default '',
  status text not null default 'Unassigned',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  department text not null default '',
  owner text not null default '',
  due text not null default '',
  priority text not null default 'Medium',
  status text not null default 'Not Started',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.events (
  id text primary key,
  name text not null,
  date text not null default '',
  venue text not null default '',
  captain text not null default '',
  phone text not null default '',
  status text not null default 'Planning',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.guests (
  id text primary key,
  name text not null,
  phone text not null default '',
  side text not null default 'Other',
  rsvp text not null default 'Pending',
  party integer,
  room text not null default '',
  arrival text not null default '',
  transport text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.vendors (
  id text primary key,
  name text not null,
  service text not null default '',
  contact text not null default '',
  phone text not null default '',
  amount numeric(12,2),
  paid numeric(12,2),
  arrival text not null default '',
  status text not null default 'Enquiry',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.payments (
  id text primary key,
  item text not null,
  category text not null default '',
  vendor text not null default '',
  amount numeric(12,2),
  paid numeric(12,2),
  due text not null default '',
  status text not null default 'Pending',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.issues (
  id text primary key,
  title text not null,
  department text not null default '',
  owner text not null default '',
  severity text not null default 'Medium',
  status text not null default 'Open',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.inventory (
  id text primary key,
  item text not null,
  category text not null default '',
  quantity numeric(10,2),
  owner text not null default '',
  location text not null default '',
  status text not null default 'Needed',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.transport (
  id text primary key,
  name text not null,
  driver text not null default '',
  phone text not null default '',
  pickup text not null default '',
  drop text not null default '',
  departure text not null default '',
  guests text not null default '',
  status text not null default 'Planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create or replace function public.create_wedding_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles as existing_profile (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    'pending'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = case
          when existing_profile.display_name = '' then excluded.display_name
          else existing_profile.display_name
        end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_wedding_profile on auth.users;
create trigger on_auth_user_created_wedding_profile
  after insert on auth.users
  for each row execute procedure public.create_wedding_profile();

create or replace function public.wedding_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select profile.role from public.profiles as profile where profile.id = (select auth.uid())),
    'pending'
  );
$$;

revoke all on function public.wedding_user_role() from public, anon;
grant execute on function public.wedding_user_role() to authenticated;

alter table public.profiles enable row level security;
drop policy if exists "members can see their own profile; admins can see all" on public.profiles;
create policy "members can see their own profile; admins can see all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.wedding_user_role()) = 'admin');
drop policy if exists "admins can change account roles" on public.profiles;
create policy "admins can change account roles"
  on public.profiles for update to authenticated
  using ((select public.wedding_user_role()) = 'admin')
  with check ((select public.wedding_user_role()) = 'admin');
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (role) on public.profiles to authenticated;

create or replace function public.touch_wedding_record()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
  table_names text[] := array[
    'departments', 'tasks', 'events', 'guests', 'vendors',
    'payments', 'issues', 'inventory', 'transport'
  ];
begin
  foreach table_name in array table_names loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', 'approved members read', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select public.wedding_user_role()) in (''viewer'', ''editor'', ''admin''))', 'approved members read', table_name);
    execute format('drop policy if exists %I on public.%I', 'editors and admins add', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.wedding_user_role()) in (''editor'', ''admin''))', 'editors and admins add', table_name);
    execute format('drop policy if exists %I on public.%I', 'editors and admins update', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.wedding_user_role()) in (''editor'', ''admin'')) with check ((select public.wedding_user_role()) in (''editor'', ''admin''))', 'editors and admins update', table_name);
    execute format('drop policy if exists %I on public.%I', 'editors and admins delete', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select public.wedding_user_role()) in (''editor'', ''admin''))', 'editors and admins delete', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('drop trigger if exists touch_updated_at on public.%I', table_name);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute procedure public.touch_wedding_record()', table_name);
    begin
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    exception
      when duplicate_object or undefined_object then null;
    end;
  end loop;
end;
$$;

insert into public.departments (id, name) values
  ('dept-01', 'Invitations & RSVP'), ('dept-02', 'Guest Reception'),
  ('dept-03', 'Accommodation'), ('dept-04', 'Transportation'),
  ('dept-05', 'VIP & Elderly Care'), ('dept-06', 'Haldi & Mehendi'),
  ('dept-07', 'Sangeet & Entertainment'), ('dept-08', 'Wedding Rituals'),
  ('dept-09', 'Baraat & Procession'), ('dept-10', 'Bride & Groom Readiness'),
  ('dept-11', 'Venue Management'), ('dept-12', 'Decoration & Florals'),
  ('dept-13', 'Catering & Food'), ('dept-14', 'Photography & Video'),
  ('dept-15', 'Sound, Light & Technical'), ('dept-16', 'Vendor Coordination'),
  ('dept-17', 'Inventory & Gifts'), ('dept-18', 'Finance & Payments'),
  ('dept-19', 'Security & Valuables'), ('dept-20', 'Medical & Emergency'),
  ('dept-21', 'Parking & Traffic'), ('dept-22', 'Family Coordination'),
  ('dept-23', 'Communication & Announcements'), ('dept-24', 'Troubleshooting & Contingency')
on conflict (id) do nothing;

insert into public.events (id, name) values
  ('evt-01', 'Mehendi'), ('evt-02', 'Haldi'), ('evt-03', 'Sangeet'),
  ('evt-04', 'Baraat'), ('evt-05', 'Shaadi'), ('evt-06', 'Reception'), ('evt-07', 'Vidaai')
on conflict (id) do nothing;
