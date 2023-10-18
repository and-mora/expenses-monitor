-- DROP SCHEMA expenses;

CREATE SCHEMA expenses AUTHORIZATION postgres;

-- DROP SEQUENCE expenses.payments_id_seq;

CREATE SEQUENCE expenses.payments_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;-- expenses.payments definition

-- Drop table

-- DROP TABLE expenses.payments;

CREATE TABLE expenses.payments (
	id serial4 NOT NULL,
	accounting_date timestamp NULL,
	merchant_name varchar NULL,
	amount int4 NULL,
	category varchar NULL,
	description varchar NULL,
	CONSTRAINT payments_pk PRIMARY KEY (id)
);


-- expenses.tags definition

-- Drop table

-- DROP TABLE expenses.tags;

CREATE TABLE expenses.tags (
	id int4 NOT NULL,
	"name" varchar NOT NULL,
	CONSTRAINT tags_pk PRIMARY KEY (id)
);


-- expenses.payment_tags definition

-- Drop table

-- DROP TABLE expenses.payment_tags;

CREATE TABLE expenses.payment_tags (
	tag int4 NOT NULL,
	payment int4 NOT NULL,
	CONSTRAINT paymenttag_fk_1 FOREIGN KEY (tag) REFERENCES expenses.tags(id)
);

alter database postgres set search_path = expenses;
