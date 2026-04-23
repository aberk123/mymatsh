-- Convert shadchan preference fields to arrays so shadchanim can select multiple values.

-- 1. Add age_bracket (new column — did not exist before)
ALTER TABLE shadchan_profiles
  ADD COLUMN IF NOT EXISTS age_bracket text[] DEFAULT '{}';

-- 2. Convert best_contact_method: text → text[]
--    Merge existing second_best_contact_method into the array so no data is lost.
ALTER TABLE shadchan_profiles
  ALTER COLUMN best_contact_method TYPE text[]
  USING (
    CASE
      WHEN best_contact_method IS NULL AND second_best_contact_method IS NULL
        THEN '{}'::text[]
      WHEN best_contact_method IS NULL
        THEN ARRAY[second_best_contact_method]
      WHEN second_best_contact_method IS NULL OR second_best_contact_method = best_contact_method
        THEN ARRAY[best_contact_method]
      ELSE ARRAY[best_contact_method, second_best_contact_method]
    END
  );

-- 3. Convert best_day: text → text[]
ALTER TABLE shadchan_profiles
  ALTER COLUMN best_day TYPE text[]
  USING (
    CASE
      WHEN best_day IS NULL THEN '{}'::text[]
      ELSE ARRAY[best_day]
    END
  );
