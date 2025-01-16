-- Add wallet_id column to payments table
ALTER TABLE payments ADD COLUMN wallet_id UUID;

-- Add foreign key constraint
ALTER TABLE payments
ADD CONSTRAINT fk_payments_wallets
FOREIGN KEY (wallet_id) REFERENCES wallets(id);

-- Add unique constraint to wallet name
ALTER TABLE wallets
ADD CONSTRAINT unique_wallet_name UNIQUE (name);
