BEGIN;

CREATE TABLE IF NOT EXISTS expenses.bank_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT,
    connection_label TEXT,
    connection_status TEXT NOT NULL DEFAULT 'pending',
    encrypted_refresh_token BYTEA,
    oauth_state TEXT,
    oauth_state_expires_at TIMESTAMPTZ,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT NOT NULL DEFAULT 'never',
    last_sync_created_count INTEGER NOT NULL DEFAULT 0,
    last_sync_updated_count INTEGER NOT NULL DEFAULT 0,
    last_sync_duplicate_count INTEGER NOT NULL DEFAULT 0,
    last_sync_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT bank_connections_status_check CHECK (
        connection_status IN ('pending', 'connected', 'error', 'revoked')
    )
);

CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id
    ON expenses.bank_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_provider
    ON expenses.bank_connections(provider);
CREATE INDEX IF NOT EXISTS idx_bank_connections_oauth_state
    ON expenses.bank_connections(oauth_state);

CREATE UNIQUE INDEX IF NOT EXISTS bank_connections_user_provider_account_idx
    ON expenses.bank_connections(user_id, provider, provider_account_id)
    WHERE provider_account_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS expenses.staging_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    bank_connection_id UUID NOT NULL REFERENCES expenses.bank_connections(id) ON DELETE CASCADE,
    bank_transaction_id TEXT NOT NULL,
    amount_in_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    booking_date DATE NOT NULL,
    value_date DATE,
    creditor_name TEXT,
    debtor_name TEXT,
    remittance_info TEXT,
    suggested_category TEXT,
    suggested_merchant TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    imported_payment_id UUID REFERENCES expenses.payments(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT staging_transactions_status_check CHECK (
        status IN ('pending', 'reviewed', 'imported', 'rejected')
    ),
    CONSTRAINT staging_transactions_user_transaction_unique UNIQUE (user_id, bank_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_staging_transactions_user_status
    ON expenses.staging_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_staging_transactions_connection
    ON expenses.staging_transactions(bank_connection_id);
CREATE INDEX IF NOT EXISTS idx_staging_transactions_booking_date
    ON expenses.staging_transactions(booking_date);

COMMIT;
