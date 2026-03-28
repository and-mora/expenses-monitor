BEGIN;

ALTER TABLE IF EXISTS expenses.categories
    ADD COLUMN IF NOT EXISTS user_id TEXT;

DROP INDEX IF EXISTS expenses.categories_lower_name_idx;

CREATE UNIQUE INDEX IF NOT EXISTS categories_user_id_lower_name_idx
    ON expenses.categories (user_id, lower(name));

CREATE INDEX IF NOT EXISTS categories_user_id_idx
    ON expenses.categories (user_id);

COMMIT;
