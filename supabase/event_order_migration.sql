-- Run once in the Supabase SQL Editor to enable saved drag-and-drop event order.
alter table public.events
  add column if not exists sort_order integer not null default 0;

with ordered as (
  select id,
         row_number() over (
           order by case when nullif(date, '') is null then 1 else 0 end,
                    date, created_at, id
         ) - 1 as new_order
  from public.events
)
update public.events as events
set sort_order = ordered.new_order
from ordered
where events.id = ordered.id;
