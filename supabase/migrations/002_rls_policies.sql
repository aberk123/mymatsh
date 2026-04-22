-- MyMatSH Row Level Security Policies
-- Assumes auth.uid() returns the authenticated user's UUID matching users.id

-- Helper function: get current user's role
create or replace function current_user_role()
returns user_role as $$
  select role from users where id = auth.uid()
$$ language sql security definer stable;

-- Helper function: get shadchan profile id for current user
create or replace function current_shadchan_id()
returns uuid as $$
  select id from shadchan_profiles where user_id = auth.uid()
$$ language sql security definer stable;

-- ============================================================
-- USERS
-- ============================================================
-- Users can read their own record; admins can read all
create policy "users_select_own" on users
  for select using (id = auth.uid() or current_user_role() = 'platform_admin');

create policy "users_update_own" on users
  for update using (id = auth.uid());

create policy "users_insert_admin" on users
  for insert with check (current_user_role() = 'platform_admin');

-- ============================================================
-- SHADCHAN PROFILES
-- ============================================================
-- Shadchans can read all approved profiles; admin reads all
create policy "shadchan_profiles_select" on shadchan_profiles
  for select using (
    is_approved = true
    or user_id = auth.uid()
    or current_user_role() = 'platform_admin'
  );

create policy "shadchan_profiles_insert_own" on shadchan_profiles
  for insert with check (user_id = auth.uid());

create policy "shadchan_profiles_update_own" on shadchan_profiles
  for update using (user_id = auth.uid() or current_user_role() = 'platform_admin');

create policy "shadchan_profiles_delete_admin" on shadchan_profiles
  for delete using (current_user_role() = 'platform_admin');

-- ============================================================
-- SINGLES
-- ============================================================
-- Shadchan sees only their own singles; admin sees all; single sees own record
create policy "singles_select" on singles
  for select using (
    created_by_shadchan_id = current_shadchan_id()
    or user_id = auth.uid()
    or current_user_role() = 'platform_admin'
    or exists (select 1 from parents where user_id = auth.uid() and child_id = singles.id)
  );

create policy "singles_insert_shadchan" on singles
  for insert with check (
    created_by_shadchan_id = current_shadchan_id()
    or current_user_role() = 'platform_admin'
  );

create policy "singles_update" on singles
  for update using (
    created_by_shadchan_id = current_shadchan_id()
    or user_id = auth.uid()
    or current_user_role() = 'platform_admin'
  );

create policy "singles_delete_shadchan" on singles
  for delete using (
    created_by_shadchan_id = current_shadchan_id()
    or current_user_role() = 'platform_admin'
  );

-- ============================================================
-- PARENTS
-- ============================================================
create policy "parents_select" on parents
  for select using (
    user_id = auth.uid()
    or current_user_role() in ('platform_admin','shadchan')
  );

create policy "parents_insert" on parents
  for insert with check (
    user_id = auth.uid()
    or current_user_role() in ('platform_admin','shadchan')
  );

create policy "parents_update_own" on parents
  for update using (user_id = auth.uid() or current_user_role() = 'platform_admin');

-- ============================================================
-- ADVOCATES & MASCHILS
-- ============================================================
create policy "advocates_select" on advocates
  for select using (
    user_id = auth.uid()
    or is_approved = true
    or current_user_role() = 'platform_admin'
  );

create policy "advocates_insert_own" on advocates
  for insert with check (user_id = auth.uid());

create policy "advocates_update" on advocates
  for update using (user_id = auth.uid() or current_user_role() = 'platform_admin');

create policy "maschils_select" on maschils
  for select using (
    user_id = auth.uid()
    or current_user_role() = 'platform_admin'
  );

create policy "maschils_insert_own" on maschils
  for insert with check (user_id = auth.uid());

create policy "maschils_update" on maschils
  for update using (user_id = auth.uid() or current_user_role() = 'platform_admin');

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create policy "organizations_select" on organizations
  for select using (is_approved = true or current_user_role() = 'platform_admin');

create policy "organizations_manage_admin" on organizations
  for all using (current_user_role() = 'platform_admin');

-- ============================================================
-- MATCHES — Shadchan sees only their own
-- ============================================================
create policy "matches_select" on matches
  for select using (
    shadchan_id = current_shadchan_id()
    or current_user_role() = 'platform_admin'
  );

create policy "matches_insert_shadchan" on matches
  for insert with check (
    shadchan_id = current_shadchan_id()
    or current_user_role() = 'platform_admin'
  );

create policy "matches_update" on matches
  for update using (
    shadchan_id = current_shadchan_id()
    or current_user_role() = 'platform_admin'
  );

-- ============================================================
-- LABELS — strictly private per Shadchan
-- ============================================================
create policy "labels_own_shadchan" on labels
  for all using (
    shadchan_id = current_shadchan_id()
    or current_user_role() = 'platform_admin'
  );

create policy "single_labels_own_shadchan" on single_labels
  for all using (
    exists (
      select 1 from labels l where l.id = single_labels.label_id
        and (l.shadchan_id = current_shadchan_id() or current_user_role() = 'platform_admin')
    )
  );

-- ============================================================
-- CALENDAR TASKS — private per Shadchan
-- ============================================================
create policy "calendar_tasks_own" on calendar_tasks
  for all using (
    shadchan_id = current_shadchan_id()
    or current_user_role() = 'platform_admin'
  );

-- ============================================================
-- MESSAGES
-- ============================================================
create policy "messages_own" on messages
  for select using (from_user_id = auth.uid() or to_user_id = auth.uid());

create policy "messages_insert_own" on messages
  for insert with check (from_user_id = auth.uid());

create policy "messages_update_recipient" on messages
  for update using (to_user_id = auth.uid());

-- ============================================================
-- REPRESENTATION & ADVOCATE REQUESTS
-- ============================================================
create policy "represent_requests_select" on representation_requests
  for select using (
    shadchan_id = current_shadchan_id()
    or exists (select 1 from singles s where s.id = representation_requests.single_id and s.user_id = auth.uid())
    or current_user_role() = 'platform_admin'
  );

create policy "represent_requests_insert" on representation_requests
  for insert with check (
    exists (select 1 from singles s where s.id = representation_requests.single_id and s.user_id = auth.uid())
    or current_user_role() in ('platform_admin','shadchan')
  );

create policy "represent_requests_update" on representation_requests
  for update using (
    shadchan_id = current_shadchan_id()
    or current_user_role() = 'platform_admin'
  );

create policy "advocate_requests_select" on advocate_requests
  for select using (
    advocate_id in (select id from advocates where user_id = auth.uid())
    or exists (select 1 from singles s where s.id = advocate_requests.single_id and s.user_id = auth.uid())
    or current_user_role() = 'platform_admin'
  );

create policy "advocate_requests_insert" on advocate_requests
  for insert with check (
    exists (select 1 from singles s where s.id = advocate_requests.single_id and s.user_id = auth.uid())
  );

-- ============================================================
-- PROFILE QUESTIONS, NEWS — admin writes, all read
-- ============================================================
create policy "profile_questions_select" on profile_questions
  for select using (is_active = true or current_user_role() = 'platform_admin');

create policy "profile_questions_manage_admin" on profile_questions
  for all using (current_user_role() = 'platform_admin');

create policy "news_select" on news
  for select using (true);

create policy "news_manage_admin" on news
  for all using (current_user_role() = 'platform_admin');

-- ============================================================
-- CONTACT INQUIRIES — public insert, admin reads
-- ============================================================
create policy "contact_inquiries_insert" on contact_inquiries
  for insert with check (true);

create policy "contact_inquiries_select_admin" on contact_inquiries
  for select using (current_user_role() = 'platform_admin');

create policy "contact_inquiries_delete_admin" on contact_inquiries
  for delete using (current_user_role() = 'platform_admin');

-- ============================================================
-- NOTIFICATIONS — own only
-- ============================================================
create policy "notifications_own" on notifications
  for all using (user_id = auth.uid());

-- ============================================================
-- AUDIT LOG — admin insert, admin reads
-- ============================================================
create policy "audit_log_insert_admin" on admin_audit_log
  for insert with check (current_user_role() = 'platform_admin');

create policy "audit_log_select_admin" on admin_audit_log
  for select using (current_user_role() = 'platform_admin');

-- ============================================================
-- DONATE PAYMENTS
-- ============================================================
create policy "donate_payments_own" on donate_payments
  for select using (user_id = auth.uid() or current_user_role() = 'platform_admin');

-- ============================================================
-- RESUME PARSE LOGS
-- ============================================================
create policy "resume_parse_logs_own" on resume_parse_logs
  for all using (
    shadchan_id = current_shadchan_id()
    or current_user_role() = 'platform_admin'
  );

-- ============================================================
-- GROUPS
-- ============================================================
create policy "groups_select" on groups
  for select using (
    visibility = 'public'
    or created_by = auth.uid()
    or exists (select 1 from group_members gm
      join shadchan_profiles sp on sp.id = gm.shadchan_id
      where gm.group_id = groups.id and sp.user_id = auth.uid())
    or current_user_role() = 'platform_admin'
  );

create policy "groups_insert" on groups
  for insert with check (created_by = auth.uid());

create policy "groups_update_creator" on groups
  for update using (created_by = auth.uid() or current_user_role() = 'platform_admin');
