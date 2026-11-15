-- Run once in Supabase SQL Editor to enable the admin-only "start over" button.
-- It keeps profiles/auth users but clears all six wedding planner tables.
alter table public.events add column if not exists sort_order integer not null default 0;

create or replace function public.reset_wedding_planner()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select public.wedding_user_role()) <> 'admin' then
    raise exception 'Only a wedding admin can reset the planner.' using errcode = '42501';
  end if;

  -- Row deletes are atomic with the inserts below and publish realtime delete events.
  delete from public.tasks;
  delete from public.events;
  delete from public.departments;
  delete from public.guests;
  delete from public.vendors;
  delete from public.payments;

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

  insert into public.events (id, name, sort_order) values
    ('evt-01', 'Mehendi', 0), ('evt-02', 'Haldi', 1), ('evt-03', 'Sangeet', 2),
    ('evt-04', 'Baraat', 3), ('evt-05', 'Shaadi', 4), ('evt-06', 'Reception', 5),
    ('evt-07', 'Vidaai', 6);

  return jsonb_build_object('departments', 24, 'events', 7, 'other_tables_cleared', true);
end;
$$;

revoke all on function public.reset_wedding_planner() from public, anon;
grant execute on function public.reset_wedding_planner() to authenticated;
