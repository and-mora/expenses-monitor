-- Add migration script here
CREATE SCHEMA IF NOT EXISTS expenses;

CREATE TABLE expenses.payments (
	id uuid DEFAULT gen_random_uuid(),
	accounting_date timestamp NULL,
	merchant_name varchar NULL,
	amount int4 NULL,
	category varchar NULL,
	description varchar NULL,
	CONSTRAINT payments_pk PRIMARY KEY (id)
);