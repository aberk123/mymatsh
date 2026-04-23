-- Rate limiting table for AI API routes
create table if not exists api_rate_limits (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  endpoint    text        not null,
  request_count integer   not null default 1,
  window_start timestamptz not null,
  primary key (user_id, endpoint)
);

alter table api_rate_limits enable row level security;

create policy "rate_limits_own" on api_rate_limits
  for all using (user_id = auth.uid());
