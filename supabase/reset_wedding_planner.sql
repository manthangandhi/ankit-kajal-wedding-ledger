-- DESTRUCTIVE: run once in Supabase SQL Editor to empty planner data.
-- It preserves profiles/auth.users and installs the optional Add Departments button.
begin;

alter table public.events add column if not exists sort_order integer not null default 0;

-- Remove rows from known legacy tracker tables too, if they still exist.
do $$
declare
  table_name text;
  legacy_tables text[] := array['issues', 'inventory', 'transport', 'wedding_records'];
begin
  foreach table_name in array legacy_tables loop
    if exists (
      select 1
      from pg_catalog.pg_class as cls
      join pg_catalog.pg_namespace as nsp on nsp.oid = cls.relnamespace
      where nsp.nspname = 'public'
        and cls.relname = table_name
        and cls.relkind in ('r', 'p')
    ) then
      execute format('delete from public.%I', table_name);
    end if;
  end loop;
end;
$$;

delete from public.tasks;
delete from public.events;
delete from public.departments;
delete from public.guests;
delete from public.vendors;
delete from public.payments;

drop function if exists public.reset_wedding_planner();

create or replace function public.load_starter_departments()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select public.wedding_user_role()) <> 'admin' then
    raise exception 'Only a wedding admin can add departments.' using errcode = '42501';
  end if;
  if exists (select 1 from public.departments) then
    raise exception 'Departments already exist; no starter rows were added.' using errcode = '23505';
  end if;

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
    ('dept-23', 'Communication & Announcements'), ('dept-24', 'Troubleshooting & Contingency');

  return 24;
end;
$$;

revoke all on function public.load_starter_departments() from public, anon;
grant execute on function public.load_starter_departments() to authenticated;

commit;
