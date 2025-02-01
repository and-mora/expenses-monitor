DROP TABLE expenses.payment_tags;
DROP TABLE expenses.tags;

CREATE TABLE expenses.payments_tags (
  id uuid DEFAULT gen_random_uuid(),
	"key" varchar NOT NULL,
	"value" varchar NOT NULL,
	payment_id uuid NOT NULL,
	CONSTRAINT paymenttag_pk PRIMARY KEY (id),
	CONSTRAINT paymenttag_fk_1 FOREIGN KEY (payment_id) REFERENCES expenses.payments(id)
);