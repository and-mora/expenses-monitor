-- Add user_id columns to core tables for multi-user support
ALTER TABLE expenses.wallets ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON expenses.wallets(user_id);

ALTER TABLE expenses.payments ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON expenses.payments(user_id);

ALTER TABLE expenses.payments_tags ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_tags_user_id ON expenses.payments_tags(user_id);
