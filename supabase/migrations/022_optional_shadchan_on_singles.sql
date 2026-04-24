-- Allow singles to exist without a shadchan creator (e.g. CSV bulk imports)
ALTER TABLE singles ALTER COLUMN created_by_shadchan_id DROP NOT NULL;
