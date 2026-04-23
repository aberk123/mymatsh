-- Allow singles to self-register without being added by a shadchan first.

-- 1. created_by_shadchan_id is nullable — self-registered singles have no sponsoring shadchan
ALTER TABLE singles ALTER COLUMN created_by_shadchan_id DROP NOT NULL;

-- 2. name/gender can be blank on a freshly-created self-registration record
ALTER TABLE singles ALTER COLUMN first_name SET DEFAULT '';
ALTER TABLE singles ALTER COLUMN last_name SET DEFAULT '';
ALTER TABLE singles ALTER COLUMN gender DROP NOT NULL;

-- 3. self_labels: single's own tags visible to shadchanim when searching
ALTER TABLE singles ADD COLUMN IF NOT EXISTS self_labels text[] DEFAULT '{}';

-- 4. Singles may insert their own record (service role also bypasses RLS, belt-and-suspenders)
CREATE POLICY "singles_insert_self" ON singles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND current_user_role() = 'single'
  );
