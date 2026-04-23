-- Junction table: links shadchanim to singles they represent
create table if not exists shadchan_singles (
  shadchan_id uuid not null references shadchan_profiles(id) on delete cascade,
  single_id   uuid not null references singles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (shadchan_id, single_id)
);

alter table shadchan_singles enable row level security;

create policy "shadchan_singles_select_own" on shadchan_singles
  for select to authenticated
  using (shadchan_id = (select id from shadchan_profiles where user_id = auth.uid()));

create policy "shadchan_singles_insert_own" on shadchan_singles
  for insert to authenticated
  with check (shadchan_id = (select id from shadchan_profiles where user_id = auth.uid()));

-- Back-fill: link every existing single to its uploading shadchan
insert into shadchan_singles (shadchan_id, single_id)
select created_by_shadchan_id, id
from singles
where created_by_shadchan_id is not null
on conflict do nothing;

-- Allow shadchanim to read singles they are linked to (additive policy)
create policy "shadchan_read_linked_singles" on singles
  for select to authenticated
  using (
    id in (
      select single_id from shadchan_singles
      where shadchan_id = (select id from shadchan_profiles where user_id = auth.uid())
    )
  );

-- Add import_summary column to import_batches
alter table import_batches add column if not exists import_summary jsonb;
