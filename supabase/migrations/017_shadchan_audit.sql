-- Track admin actions on shadchan profiles
ALTER TABLE shadchan_profiles
  ADD COLUMN IF NOT EXISTS approved_by_admin_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES auth.users(id);
