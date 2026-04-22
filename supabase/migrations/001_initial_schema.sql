-- MyMatSH Initial Schema
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('shadchan','single','parent','advocate','maschil','org_admin','platform_admin');
create type user_status as enum ('pending','active','suspended');
create type single_status as enum ('available','draft','on_hold','engaged','married','inactive');
create type gender_type as enum ('male','female');
create type match_status as enum ('pending','current','going_out','on_hold','past','engaged','married');
create type task_type as enum ('follow_up','date_scheduled','on_hold','note','other');
create type task_status as enum ('pending','in_progress','on_hold','completed');
create type representation_status as enum ('pending','accepted','declined');
create type advocate_request_status as enum ('pending','active','closed');
create type parent_profile_status as enum ('pending','completed');
create type org_member_role as enum ('admin','member');
create type group_visibility as enum ('public','private');
create type payment_type as enum ('recurring','one_time');
create type parse_status as enum ('success','failed','partial');

-- ============================================================
-- USERS
-- ============================================================
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  phone text unique,
  role user_role not null,
  status user_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table users enable row level security;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  city text,
  primary_contact_name text,
  is_approved boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table organizations enable row level security;

-- ============================================================
-- SHADCHAN PROFILES
-- ============================================================
create table shadchan_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  title text,
  full_name text not null,
  city text,
  state text,
  country text,
  street text,
  postal_code text,
  phone text,
  email text,
  languages text[],
  availability text,
  best_contact_method text,
  second_best_contact_method text,
  best_day text,
  best_time text,
  years_experience text,
  shidduchim_made text,
  available_for_advocacy boolean not null default false,
  rates_for_services text,
  type_of_service text,
  hide_personal_info_from_profile boolean not null default false,
  reference_1 text,
  reference_2 text,
  is_approved boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references users(id),
  organization_id uuid references organizations(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table shadchan_profiles enable row level security;
create index idx_shadchan_profiles_user_id on shadchan_profiles(user_id);
create index idx_shadchan_profiles_org on shadchan_profiles(organization_id);

-- ============================================================
-- SINGLES
-- ============================================================
create table singles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  created_by_shadchan_id uuid not null references shadchan_profiles(id),
  parent_id uuid, -- FK added after parents table
  first_name text not null,
  last_name text not null,
  full_hebrew_name text,
  gender gender_type not null,
  dob date,
  age integer,
  phone text,
  email text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  height_inches integer,
  about_bio text,
  current_education text,
  occupation text,
  high_schools jsonb,
  eretz_yisroel text,
  current_yeshiva_seminary text,
  family_background text,
  siblings jsonb,
  "references" jsonb,
  looking_for text,
  plans text,
  hashkafa text,
  photo_url text,
  resume_url text,
  privacy_settings jsonb default '{"who_can_view":"shadchanim","share_photo":false}'::jsonb,
  pledge_amount integer,
  status single_status not null default 'draft',
  is_parent_verified boolean not null default false,
  parent_notification_sent_at timestamptz,
  ai_personality_data jsonb, -- AI_HOOK: questionnaire data stored here
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table singles enable row level security;
create index idx_singles_shadchan on singles(created_by_shadchan_id);
create index idx_singles_status on singles(status);
create index idx_singles_gender on singles(gender);
create index idx_singles_user_id on singles(user_id);

-- ============================================================
-- PARENTS
-- ============================================================
create table parents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  title text,
  full_name text not null,
  phone text,
  email text,
  city text,
  child_id uuid not null references singles(id) on delete cascade,
  created_by uuid references users(id),
  pledge_amount integer,
  pledge_confirmed_at timestamptz,
  profile_status parent_profile_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table parents enable row level security;
create index idx_parents_child on parents(child_id);
create index idx_parents_user on parents(user_id);

-- Add FK from singles to parents now that parents exists
alter table singles add constraint fk_singles_parent foreign key (parent_id) references parents(id) on delete set null;

-- ============================================================
-- ADVOCATES
-- ============================================================
create table advocates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  city text,
  bio text,
  languages text[],
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table advocates enable row level security;

-- ============================================================
-- MASCHILS
-- ============================================================
create table maschils (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  city text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table maschils enable row level security;

-- ============================================================
-- ORG MEMBERS
-- ============================================================
create table org_members (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  shadchan_id uuid not null references shadchan_profiles(id) on delete cascade,
  role org_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, shadchan_id)
);
alter table org_members enable row level security;

-- ============================================================
-- GROUPS
-- ============================================================
create table groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  visibility group_visibility not null default 'private',
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table groups enable row level security;

create table group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  shadchan_id uuid references shadchan_profiles(id) on delete cascade,
  advocate_id uuid references advocates(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table group_members enable row level security;

-- ============================================================
-- MATCHES (displayed as Suggestions)
-- ============================================================
create table matches (
  id uuid primary key default uuid_generate_v4(),
  shadchan_id uuid not null references shadchan_profiles(id),
  boy_id uuid not null references singles(id),
  girl_id uuid not null references singles(id),
  status match_status not null default 'pending',
  message text,
  suggested_by_name text,
  notified_boy boolean not null default false,
  notified_girl boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  -- AI_HOOK: match scoring integrates here
);
alter table matches enable row level security;
create index idx_matches_shadchan on matches(shadchan_id);
create index idx_matches_status on matches(status);

create table match_feedback (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  submitted_by uuid not null references shadchan_profiles(id),
  notes text,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table match_feedback enable row level security;

-- ============================================================
-- LABELS (private per Shadchan)
-- ============================================================
create table labels (
  id uuid primary key default uuid_generate_v4(),
  shadchan_id uuid not null references shadchan_profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(shadchan_id, name)
);
alter table labels enable row level security;

create table single_labels (
  id uuid primary key default uuid_generate_v4(),
  single_id uuid not null references singles(id) on delete cascade,
  label_id uuid not null references labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(single_id, label_id)
);
alter table single_labels enable row level security;

-- ============================================================
-- CALENDAR TASKS
-- ============================================================
create table calendar_tasks (
  id uuid primary key default uuid_generate_v4(),
  shadchan_id uuid not null references shadchan_profiles(id) on delete cascade,
  single_id uuid references singles(id) on delete set null,
  match_id uuid references matches(id) on delete set null,
  title text not null,
  type task_type not null default 'follow_up',
  due_date date not null,
  reminder_at timestamptz,
  status task_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table calendar_tasks enable row level security;
create index idx_tasks_shadchan on calendar_tasks(shadchan_id);
create index idx_tasks_due_date on calendar_tasks(due_date);

-- ============================================================
-- MESSAGES
-- ============================================================
create table messages (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid not null references users(id),
  to_user_id uuid not null references users(id),
  single_id uuid references singles(id) on delete set null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table messages enable row level security;
create index idx_messages_from on messages(from_user_id);
create index idx_messages_to on messages(to_user_id);

-- ============================================================
-- REPRESENTATION REQUESTS
-- ============================================================
create table representation_requests (
  id uuid primary key default uuid_generate_v4(),
  single_id uuid not null references singles(id) on delete cascade,
  shadchan_id uuid not null references shadchan_profiles(id) on delete cascade,
  status representation_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table representation_requests enable row level security;

-- ============================================================
-- ADVOCATE REQUESTS
-- ============================================================
create table advocate_requests (
  id uuid primary key default uuid_generate_v4(),
  single_id uuid not null references singles(id) on delete cascade,
  advocate_id uuid not null references advocates(id) on delete cascade,
  status advocate_request_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table advocate_requests enable row level security;

-- ============================================================
-- PROFILE QUESTIONS
-- ============================================================
create table profile_questions (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  created_by uuid not null references users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table profile_questions enable row level security;

-- ============================================================
-- NEWS
-- ============================================================
create table news (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  image_url text,
  release_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table news enable row level security;

-- ============================================================
-- DONATE & PAYMENTS
-- ============================================================
create table donate_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  type payment_type not null,
  amount integer not null,
  status text not null default 'pending',
  payment_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table donate_payments enable row level security;

-- ============================================================
-- CONTACT INQUIRIES
-- ============================================================
create table contact_inquiries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
alter table contact_inquiries enable row level security;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table notifications enable row level security;
create index idx_notifications_user on notifications(user_id);

-- ============================================================
-- ADMIN AUDIT LOG
-- ============================================================
create table admin_audit_log (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references users(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table admin_audit_log enable row level security;

-- ============================================================
-- RESUME PARSE LOGS
-- ============================================================
create table resume_parse_logs (
  id uuid primary key default uuid_generate_v4(),
  single_id uuid references singles(id) on delete set null,
  shadchan_id uuid not null references shadchan_profiles(id),
  file_name text not null,
  status parse_status not null,
  parsed_data jsonb,
  error_message text,
  created_at timestamptz not null default now()
);
alter table resume_parse_logs enable row level security;

-- ============================================================
-- AI PLACEHOLDER TABLES (structure only — no logic yet)
-- ============================================================
-- AI_HOOK: match scoring integrates here
create table ai_match_scores (
  id uuid primary key default uuid_generate_v4(),
  single_a_id uuid not null references singles(id) on delete cascade,
  single_b_id uuid not null references singles(id) on delete cascade,
  score float not null,
  factors jsonb,
  generated_at timestamptz not null default now()
);
alter table ai_match_scores enable row level security;

-- AI_HOOK: ai insights integrate here
create table ai_insights (
  id uuid primary key default uuid_generate_v4(),
  single_id uuid not null references singles(id) on delete cascade,
  insight_type text not null,
  content jsonb not null,
  generated_at timestamptz not null default now()
);
alter table ai_insights enable row level security;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to all tables with updated_at
do $$
declare
  t text;
begin
  foreach t in array array[
    'users','shadchan_profiles','singles','parents','advocates','maschils',
    'organizations','org_members','groups','group_members','matches',
    'match_feedback','labels','single_labels','calendar_tasks','messages',
    'representation_requests','advocate_requests','profile_questions','news',
    'donate_payments','notifications'
  ]
  loop
    execute format('
      create trigger trg_%s_updated_at
      before update on %s
      for each row execute function update_updated_at();
    ', t, t);
  end loop;
end;
$$;
