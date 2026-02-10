-- Create categories table and add category_id to payments
BEGIN;

CREATE TABLE IF NOT EXISTS expenses.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure case-insensitive uniqueness on category name via expression index
CREATE UNIQUE INDEX IF NOT EXISTS categories_lower_name_idx ON expenses.categories (lower(name));

-- Add category_id to payments (nullable for safe rollout)
ALTER TABLE IF EXISTS expenses.payments
  ADD COLUMN IF NOT EXISTS category_id UUID NULL;

-- Backfill: link existing payments to newly created categories
INSERT INTO expenses.categories (name)
SELECT DISTINCT trim(category) FROM expenses.payments
WHERE category IS NOT NULL AND trim(category) <> ''
ON CONFLICT (lower(name)) DO NOTHING;

UPDATE expenses.payments p
SET category_id = c.id
FROM expenses.categories c
WHERE lower(trim(p.category)) = lower(c.name)
  AND p.category_id IS NULL;

COMMIT;
