-- Add enum type for category kind and backfill values
BEGIN;

-- Add textual `kind` column in schema `expenses` and backfill values
-- Add column with default to avoid breaking inserts during rollout
ALTER TABLE IF EXISTS expenses.categories
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'expense';

-- Backfill `kind` based on historical payments sums per category
WITH sums AS (
  SELECT p.category_id AS cid, SUM(p.amount) AS total
  FROM expenses.payments p
  WHERE p.category_id IS NOT NULL
  GROUP BY p.category_id
)
UPDATE expenses.categories c
SET kind = CASE WHEN s.total > 0 THEN 'income' ELSE 'expense' END
FROM sums s
WHERE c.id = s.cid;

-- Optionally create an index for faster filtering by kind
CREATE INDEX IF NOT EXISTS categories_kind_idx ON expenses.categories (kind);

COMMIT;
