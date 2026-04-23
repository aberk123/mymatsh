-- User-level notification opt-out flags
alter table users
  add column if not exists email_notifications boolean not null default true,
  add column if not exists sms_notifications   boolean not null default true;
