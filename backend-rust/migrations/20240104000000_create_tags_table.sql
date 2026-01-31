-- Create payments_tags table (denormalized, aligned with Liquibase migration 006)
-- This replaces the normalized tags + payment_tags structure
CREATE TABLE IF NOT EXISTS expenses.payments_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR NOT NULL,
    value VARCHAR NOT NULL,
    payment_id UUID NOT NULL,
    CONSTRAINT paymenttag_fk_1 FOREIGN KEY (payment_id) REFERENCES expenses.payments(id) ON DELETE CASCADE
);

