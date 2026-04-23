-- single_stars: shadchan bookmarks a single
CREATE TABLE IF NOT EXISTS single_stars (
  shadchan_id  uuid NOT NULL REFERENCES shadchan_profiles(id) ON DELETE CASCADE,
  single_id    uuid NOT NULL REFERENCES singles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shadchan_id, single_id)
);

CREATE INDEX IF NOT EXISTS single_stars_shadchan_idx ON single_stars(shadchan_id);

ALTER TABLE single_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "single_stars_own" ON single_stars
  FOR ALL USING (
    shadchan_id IN (
      SELECT id FROM shadchan_profiles WHERE user_id = auth.uid()
    )
  );
