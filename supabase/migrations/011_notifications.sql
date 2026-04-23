-- In-app notification system
create table if not exists notifications (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  type        text        not null,
  payload     jsonb       not null default '{}',
  is_read     boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table notifications enable row level security;

-- Users can only see and manage their own notifications
create policy "notifications_own" on notifications
  for all using (user_id = auth.uid());

create index if not exists notifications_user_unread
  on notifications (user_id, is_read, created_at desc);
