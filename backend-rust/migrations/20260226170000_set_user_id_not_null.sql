-- Migration: set user_id NOT NULL on core tables
-- Timestamp: 2026-02-26 17:00:00 (UTC)
-- Assumes existing rows were backfilled with a valid user_id.

BEGIN;

-- Ensure columns exist (safe if backfill was performed manually earlier)
ALTER TABLE IF EXISTS expenses.wallets ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE IF EXISTS expenses.payments ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE IF EXISTS expenses.payments_tags ADD COLUMN IF NOT EXISTS user_id uuid;

-- Create indexes to speed up user-scoped queries
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON expenses.wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON expenses.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_tags_user_id ON expenses.payments_tags (user_id);

-- Enforce NOT NULL now that backfill has been run
ALTER TABLE expenses.wallets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE expenses.payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE expenses.payments_tags ALTER COLUMN user_id SET NOT NULL;

COMMIT;
