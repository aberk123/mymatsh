-- Track whether a shadchan is familiar with each single in their list
ALTER TABLE shadchan_singles
  ADD COLUMN IF NOT EXISTS is_familiar boolean NOT NULL DEFAULT false;
