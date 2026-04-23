-- Flat appearance / religious / lifestyle fields on singles
ALTER TABLE singles
  ADD COLUMN IF NOT EXISTS hair_color        text,
  ADD COLUMN IF NOT EXISTS eye_color         text,
  ADD COLUMN IF NOT EXISTS body_type         text,
  ADD COLUMN IF NOT EXISTS complexion        text,
  ADD COLUMN IF NOT EXISTS minyan_attendance text,
  ADD COLUMN IF NOT EXISTS shabbos_observance text,
  ADD COLUMN IF NOT EXISTS tznius_level      text,
  ADD COLUMN IF NOT EXISTS smoking           text,
  ADD COLUMN IF NOT EXISTS dietary_restrictions text,
  ADD COLUMN IF NOT EXISTS hobbies           text,
  ADD COLUMN IF NOT EXISTS personality_traits text;

-- ─── single_education ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS single_education (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  single_id               uuid NOT NULL REFERENCES singles(id) ON DELETE CASCADE,
  elementary_school       text,
  high_schools            jsonb,
  post_high_school        text,
  bachelors_degree        text,
  grad_degree             text,
  certifications          text,
  currently_in_school     boolean DEFAULT false,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (single_id)
);

ALTER TABLE single_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "single_education_read_own" ON single_education
  FOR SELECT USING (
    single_id IN (SELECT id FROM singles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM shadchan_singles ss
        JOIN shadchan_profiles sp ON sp.id = ss.shadchan_id
       WHERE ss.single_id = single_education.single_id AND sp.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "single_education_write_own" ON single_education
  FOR ALL USING (
    single_id IN (SELECT id FROM singles WHERE user_id = auth.uid())
  );

CREATE POLICY "single_education_shadchan_write" ON single_education
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shadchan_singles ss
        JOIN shadchan_profiles sp ON sp.id = ss.shadchan_id
       WHERE ss.single_id = single_education.single_id AND sp.user_id = auth.uid()
    )
  );

-- ─── single_family_details ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS single_family_details (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  single_id             uuid NOT NULL REFERENCES singles(id) ON DELETE CASCADE,
  fathers_name          text,
  fathers_occupation    text,
  mothers_name          text,
  mothers_maiden_name   text,
  mothers_occupation    text,
  num_siblings          int,
  siblings_detail       jsonb,
  grandparents          jsonb,
  family_notes          text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (single_id)
);

ALTER TABLE single_family_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "single_family_read" ON single_family_details
  FOR SELECT USING (
    single_id IN (SELECT id FROM singles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM shadchan_singles ss
        JOIN shadchan_profiles sp ON sp.id = ss.shadchan_id
       WHERE ss.single_id = single_family_details.single_id AND sp.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "single_family_write_own" ON single_family_details
  FOR ALL USING (
    single_id IN (SELECT id FROM singles WHERE user_id = auth.uid())
  );

CREATE POLICY "single_family_shadchan_write" ON single_family_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shadchan_singles ss
        JOIN shadchan_profiles sp ON sp.id = ss.shadchan_id
       WHERE ss.single_id = single_family_details.single_id AND sp.user_id = auth.uid()
    )
  );

-- ─── single_matching_criteria ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS single_matching_criteria (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  single_id           uuid NOT NULL REFERENCES singles(id) ON DELETE CASCADE,
  age_min             int,
  age_max             int,
  height_min          int,
  height_max          int,
  hashkafa_pref       text,
  location_pref       text,
  plans_pref          text,
  looking_for_traits  text,
  dealbreakers        text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (single_id)
);

ALTER TABLE single_matching_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "single_criteria_read" ON single_matching_criteria
  FOR SELECT USING (
    single_id IN (SELECT id FROM singles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM shadchan_singles ss
        JOIN shadchan_profiles sp ON sp.id = ss.shadchan_id
       WHERE ss.single_id = single_matching_criteria.single_id AND sp.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "single_criteria_write_own" ON single_matching_criteria
  FOR ALL USING (
    single_id IN (SELECT id FROM singles WHERE user_id = auth.uid())
  );

CREATE POLICY "single_criteria_shadchan_write" ON single_matching_criteria
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shadchan_singles ss
        JOIN shadchan_profiles sp ON sp.id = ss.shadchan_id
       WHERE ss.single_id = single_matching_criteria.single_id AND sp.user_id = auth.uid()
    )
  );

-- ─── single_references ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS single_references (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  single_id    uuid NOT NULL REFERENCES singles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  relationship text,
  phone        text,
  email        text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE single_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "single_references_read" ON single_references
  FOR SELECT USING (
    single_id IN (SELECT id FROM singles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM shadchan_singles ss
        JOIN shadchan_profiles sp ON sp.id = ss.shadchan_id
       WHERE ss.single_id = single_references.single_id AND sp.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "single_references_write_own" ON single_references
  FOR ALL USING (
    single_id IN (SELECT id FROM singles WHERE user_id = auth.uid())
  );

CREATE POLICY "single_references_shadchan_write" ON single_references
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shadchan_singles ss
        JOIN shadchan_profiles sp ON sp.id = ss.shadchan_id
       WHERE ss.single_id = single_references.single_id AND sp.user_id = auth.uid()
    )
  );

-- ─── single_photos ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS single_photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  single_id    uuid NOT NULL REFERENCES singles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url   text NOT NULL,
  position     int NOT NULL DEFAULT 0,
  caption      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS single_photos_single_id_idx ON single_photos(single_id);

ALTER TABLE single_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "single_photos_read" ON single_photos
  FOR SELECT USING (
    single_id IN (SELECT id FROM singles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM shadchan_singles ss
        JOIN shadchan_profiles sp ON sp.id = ss.shadchan_id
       WHERE ss.single_id = single_photos.single_id AND sp.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "single_photos_write_own" ON single_photos
  FOR ALL USING (
    single_id IN (SELECT id FROM singles WHERE user_id = auth.uid())
  );
