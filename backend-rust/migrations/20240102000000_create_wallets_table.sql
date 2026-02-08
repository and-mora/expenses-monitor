-- Add migration script here
-- Create wallets table
CREATE TABLE IF NOT EXISTS expenses.wallets (
  id uuid DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  CONSTRAINT wallets_pk PRIMARY KEY (id),
  CONSTRAINT unique_wallet_name UNIQUE (name)
);
