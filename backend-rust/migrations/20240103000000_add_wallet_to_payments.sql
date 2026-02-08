-- Add migration script here
-- Add wallet_id column to payments table
ALTER TABLE expenses.payments ADD COLUMN IF NOT EXISTS wallet_id UUID;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_wallets'
  ) THEN
    ALTER TABLE expenses.payments
    ADD CONSTRAINT fk_payments_wallets
    FOREIGN KEY (wallet_id) REFERENCES expenses.wallets(id);
  END IF;
END
$$;
