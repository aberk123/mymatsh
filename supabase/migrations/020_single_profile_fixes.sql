-- Add photo_visibility and languages to singles
ALTER TABLE singles
  ADD COLUMN IF NOT EXISTS photo_visibility text NOT NULL DEFAULT 'shadchanim_only',
  ADD COLUMN IF NOT EXISTS languages        text;

-- New family fields
ALTER TABLE single_family_details
  ADD COLUMN IF NOT EXISTS father_hebrew_name  text,
  ADD COLUMN IF NOT EXISTS mother_hebrew_name  text,
  ADD COLUMN IF NOT EXISTS father_phone        text,
  ADD COLUMN IF NOT EXISTS mother_phone        text,
  ADD COLUMN IF NOT EXISTS father_email        text,
  ADD COLUMN IF NOT EXISTS mother_email        text,
  ADD COLUMN IF NOT EXISTS family_shul_name    text,
  ADD COLUMN IF NOT EXISTS family_shul_address text,
  ADD COLUMN IF NOT EXISTS family_rav_name     text,
  ADD COLUMN IF NOT EXISTS family_rav_phone    text,
  ADD COLUMN IF NOT EXISTS family_rav_shul     text;
