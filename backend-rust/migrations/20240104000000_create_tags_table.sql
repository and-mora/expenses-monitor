-- Create tags table
CREATE TABLE IF NOT EXISTS expenses.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR NOT NULL,
    value VARCHAR NOT NULL,
    UNIQUE(key, value)
);

-- Create payment_tags junction table
CREATE TABLE IF NOT EXISTS expenses.payment_tags (
    payment_id UUID NOT NULL REFERENCES expenses.payments(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES expenses.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (payment_id, tag_id)
);

