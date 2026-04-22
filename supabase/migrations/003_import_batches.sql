-- Add birth_month to singles (age column already exists)
alter table singles add column if not exists birth_month text;

-- Import batch status enum
do $$ begin
  create type import_batch_status as enum ('pending_review','shadchan_approved','admin_approved','rejected');
exception when duplicate_object then null;
end $$;

-- Import batches table
create table if not exists import_batches (
  id uuid primary key default uuid_generate_v4(),
  shadchan_id uuid not null references shadchan_profiles(id) on delete restrict,
  submitted_by_admin_id uuid not null references users(id) on delete restrict,
  status import_batch_status not null default 'pending_review',
  parsed_data jsonb not null default '[]',
  review_token uuid not null default uuid_generate_v4(),
  shadchan_comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table import_batches enable row level security;
create unique index if not exists idx_import_batches_token on import_batches(review_token);
create index if not exists idx_import_batches_status on import_batches(status);
create index if not exists idx_import_batches_shadchan on import_batches(shadchan_id);
