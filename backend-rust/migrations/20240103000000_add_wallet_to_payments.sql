-- Add migration script here
-- Add wallet_id column to payments table
ALTER TABLE expenses.payments ADD COLUMN wallet_id UUID;

-- Add foreign key constraint
ALTER TABLE expenses.payments
ADD CONSTRAINT fk_payments_wallets
FOREIGN KEY (wallet_id) REFERENCES expenses.wallets(id);
