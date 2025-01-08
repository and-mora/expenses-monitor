CREATE TABLE expenses.wallets (
  id uuid DEFAULT gen_random_uuid(),
  name varchar NULL,
  CONSTRAINT wallets_pk PRIMARY KEY (id)
);
