-- Make parents.child_id nullable so parents can sign up before their child's record exists
ALTER TABLE parents ALTER COLUMN child_id DROP NOT NULL;

-- Add color column to labels for the label library feature
ALTER TABLE labels ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#6B7280';
