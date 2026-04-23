-- single_dating_history: shadchan-private dating history per single
CREATE TABLE IF NOT EXISTS single_dating_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  single_id        uuid NOT NULL REFERENCES singles(id) ON DELETE CASCADE,
  shadchan_id      uuid NOT NULL REFERENCES shadchan_profiles(id) ON DELETE CASCADE,
  person_name      text NOT NULL,
  date_approximate text,
  outcome          text,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS single_dating_history_single_idx ON single_dating_history(single_id);
CREATE INDEX IF NOT EXISTS single_dating_history_shadchan_idx ON single_dating_history(shadchan_id);

ALTER TABLE single_dating_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dating_history_own_shadchan" ON single_dating_history
  FOR ALL USING (
    shadchan_id IN (
      SELECT id FROM shadchan_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "dating_history_admin" ON single_dating_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'platform_admin')
  );
