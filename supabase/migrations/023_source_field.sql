-- Add source field to singles for tracking creation origin
ALTER TABLE singles ADD COLUMN IF NOT EXISTS source text;

-- Backfill existing records
UPDATE singles SET source = 'shadchan' WHERE created_by_shadchan_id IS NOT NULL AND source IS NULL;
UPDATE singles SET source = 'parent_submitted' WHERE created_by_shadchan_id IS NULL AND parent_id IS NOT NULL AND source IS NULL;

-- Make child_id nullable in parents so parents can exist without a child record yet
ALTER TABLE parents ALTER COLUMN child_id DROP NOT NULL;

-- RLS: Update singles select policy to allow platform_admin to see all singles regardless of created_by_shadchan_id
-- (Shadchanim already see via junction table, null-shadchan singles become visible via admin/represent flows)
-- Run this if your existing policy filters on created_by_shadchan_id IS NOT NULL:
-- DROP POLICY IF EXISTS "shadchan_see_own_singles" ON singles;
-- CREATE POLICY "shadchan_see_singles" ON singles FOR SELECT USING (
--   created_by_shadchan_id = auth.uid()
--   OR id IN (SELECT single_id FROM shadchan_singles WHERE shadchan_id = auth.uid())
--   OR user_id = auth.uid()
-- );
