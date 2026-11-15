-- Ankit & Kajal Wedding Ledger
-- Run this whole file once in Supabase SQL Editor.
-- The browser uses only a publishable/anon key. Row-level security below
-- keeps pending accounts out and gives approved users role-based access.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  role text not null default 'pending'
    check (role in ('pending', 'viewer', 'editor', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.wedding_records (
  record_type text not null check (record_type in (
    'departments', 'tasks', 'events', 'guests', 'vendors',
    'payments', 'issues', 'inventory', 'transport'
  )),
  record_id text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (record_type, record_id)
);

create index if not exists wedding_records_type_idx
  on public.wedding_records (record_type);

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

-- This helper runs as its owner so profile checks do not recurse through RLS.
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
alter table public.wedding_records enable row level security;

drop policy if exists "members can see their own profile; admins can see all" on public.profiles;
create policy "members can see their own profile; admins can see all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.wedding_user_role()) = 'admin');

drop policy if exists "admins can change account roles" on public.profiles;
create policy "admins can change account roles"
  on public.profiles for update to authenticated
  using ((select public.wedding_user_role()) = 'admin')
  with check ((select public.wedding_user_role()) = 'admin');

drop policy if exists "approved members can read wedding records" on public.wedding_records;
create policy "approved members can read wedding records"
  on public.wedding_records for select to authenticated
  using ((select public.wedding_user_role()) in ('viewer', 'editor', 'admin'));

drop policy if exists "editors and admins can add wedding records" on public.wedding_records;
create policy "editors and admins can add wedding records"
  on public.wedding_records for insert to authenticated
  with check ((select public.wedding_user_role()) in ('editor', 'admin'));

drop policy if exists "editors and admins can update wedding records" on public.wedding_records;
create policy "editors and admins can update wedding records"
  on public.wedding_records for update to authenticated
  using ((select public.wedding_user_role()) in ('editor', 'admin'))
  with check ((select public.wedding_user_role()) in ('editor', 'admin'));

drop policy if exists "editors and admins can delete wedding records" on public.wedding_records;
create policy "editors and admins can delete wedding records"
  on public.wedding_records for delete to authenticated
  using ((select public.wedding_user_role()) in ('editor', 'admin'));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (role) on public.profiles to authenticated;

revoke all on public.wedding_records from anon, authenticated;
grant select, insert, update, delete on public.wedding_records to authenticated;

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

drop trigger if exists wedding_records_touch_updated_at on public.wedding_records;
create trigger wedding_records_touch_updated_at
  before update on public.wedding_records
  for each row execute procedure public.touch_wedding_record();

-- Realtime lets signed-in coordinators see another member's changes promptly.
do $$
begin
  alter publication supabase_realtime add table public.wedding_records;
exception
  when duplicate_object or undefined_object then null;
end;
$$;

-- Start with the 24 team areas and the seven wedding events. Running this
-- setup more than once will not overwrite data already entered by the family.
insert into public.wedding_records (record_type, record_id, data)
select
  'departments',
  'dept-' || lpad(item.ordinality::text, 2, '0'),
  jsonb_build_object(
    'id', 'dept-' || lpad(item.ordinality::text, 2, '0'),
    'name', item.name,
    'lead', '', 'phone', '', 'backup', '', 'backupPhone', '',
    'status', 'Unassigned', 'notes', ''
  )
from unnest(array[
  'Invitations & RSVP', 'Guest Reception', 'Accommodation', 'Transportation',
  'VIP & Elderly Care', 'Haldi & Mehendi', 'Sangeet & Entertainment',
  'Wedding Rituals', 'Baraat & Procession', 'Bride & Groom Readiness',
  'Venue Management', 'Decoration & Florals', 'Catering & Food',
  'Photography & Video', 'Sound, Light & Technical', 'Vendor Coordination',
  'Inventory & Gifts', 'Finance & Payments', 'Security & Valuables',
  'Medical & Emergency', 'Parking & Traffic', 'Family Coordination',
  'Communication & Announcements', 'Troubleshooting & Contingency'
]) with ordinality as item(name, ordinality)
on conflict (record_type, record_id) do nothing;

insert into public.wedding_records (record_type, record_id, data)
select
  'events',
  'evt-' || lpad(item.ordinality::text, 2, '0'),
  jsonb_build_object(
    'id', 'evt-' || lpad(item.ordinality::text, 2, '0'),
    'name', item.name, 'date', '', 'venue', '', 'captain', '', 'phone', '',
    'status', 'Planning', 'notes', ''
  )
from unnest(array['Mehendi', 'Haldi', 'Sangeet', 'Baraat', 'Shaadi', 'Reception', 'Vidaai'])
  with ordinality as item(name, ordinality)
on conflict (record_type, record_id) do nothing;
