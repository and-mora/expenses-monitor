-- Remove denormalized category column from payments and make category_id NOT NULL
BEGIN;

-- Ensure any existing rows have category_id set (previous migration should have backfilled)
ALTER TABLE IF EXISTS expenses.payments
  ALTER COLUMN category_id SET NOT NULL;

-- Drop the denormalized category column
ALTER TABLE IF EXISTS expenses.payments
  DROP COLUMN IF EXISTS category;

COMMIT;
