-- 1. Add private_photo_url to shadchan_singles
ALTER TABLE shadchan_singles
  ADD COLUMN IF NOT EXISTS private_photo_url text;

-- 2. Create private-photos storage bucket (private — public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-photos',
  'private-photos',
  false,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: each shadchan can only access their own folder
CREATE POLICY "private_photos_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'private-photos'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM shadchan_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "private_photos_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'private-photos'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM shadchan_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "private_photos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'private-photos'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM shadchan_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "private_photos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'private-photos'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM shadchan_profiles WHERE user_id = auth.uid()
    )
  );

-- 3. Create shadchan_private_notes table (one note per shadchan per single)
CREATE TABLE IF NOT EXISTS shadchan_private_notes (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shadchan_id uuid NOT NULL REFERENCES shadchan_profiles(id) ON DELETE CASCADE,
  single_id  uuid NOT NULL REFERENCES singles(id) ON DELETE CASCADE,
  note_text  text NOT NULL DEFAULT '',
  image_url  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shadchan_id, single_id)
);

ALTER TABLE shadchan_private_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "private_notes_own" ON shadchan_private_notes
  FOR ALL TO authenticated
  USING (shadchan_id = (SELECT id FROM shadchan_profiles WHERE user_id = auth.uid()))
  WITH CHECK (shadchan_id = (SELECT id FROM shadchan_profiles WHERE user_id = auth.uid()));

-- Migrate existing notes from calendar_tasks
INSERT INTO shadchan_private_notes (shadchan_id, single_id, note_text, created_at, updated_at)
SELECT
  shadchan_id,
  single_id,
  COALESCE(notes, ''),
  created_at,
  COALESCE(updated_at, created_at)
FROM calendar_tasks
WHERE type = 'note'
  AND single_id IS NOT NULL
  AND notes IS NOT NULL
  AND notes <> ''
ON CONFLICT (shadchan_id, single_id) DO NOTHING;

-- 4. Create single_public_notes table
CREATE TABLE IF NOT EXISTS single_public_notes (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  single_id  uuid NOT NULL REFERENCES singles(id) ON DELETE CASCADE,
  shadchan_id uuid NOT NULL REFERENCES shadchan_profiles(id) ON DELETE CASCADE,
  note_text  text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_notes_single ON single_public_notes(single_id, created_at DESC);

ALTER TABLE single_public_notes ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read public notes
CREATE POLICY "public_notes_select" ON single_public_notes
  FOR SELECT TO authenticated
  USING (true);

-- Insert: caller must own the linked shadchan profile
CREATE POLICY "public_notes_insert" ON single_public_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    shadchan_id = (SELECT id FROM shadchan_profiles WHERE user_id = auth.uid())
  );

-- Delete: author or platform_admin
CREATE POLICY "public_notes_delete" ON single_public_notes
  FOR DELETE TO authenticated
  USING (
    shadchan_id = (SELECT id FROM shadchan_profiles WHERE user_id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'platform_admin'
  );
