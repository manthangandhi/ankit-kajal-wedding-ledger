-- Optional cleanup for the simplified Wedding Desk.
-- Run in Supabase SQL Editor only after you have a private backup.
-- Empty optional tables and an empty legacy catch-all are removed. If any
-- table contains records, it is preserved and a NOTICE tells you which one.
-- This script never uses CASCADE and never deletes rows.

do $$
declare
  table_name text;
  row_count bigint;
  table_names text[] := array['issues', 'inventory', 'transport', 'wedding_records'];
begin
  foreach table_name in array table_names loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('lock table public.%I in access exclusive mode', table_name);
      execute format('select count(*) from public.%I', table_name) into row_count;
      if row_count = 0 then
        execute format('drop table public.%I', table_name);
        raise notice 'Dropped empty table public.%', table_name;
      else
        raise notice 'Kept public.% because it contains % rows; export or migrate those records before removal.', table_name, row_count;
      end if;
    end if;
  end loop;
end;
$$;
