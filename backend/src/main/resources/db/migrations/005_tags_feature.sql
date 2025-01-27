DROP TABLE expenses.payment_tags;
DROP TABLE expenses.tags;

CREATE TABLE expenses.tags (
  id uuid DEFAULT gen_random_uuid(),
  "key" varchar NOT NULL,
	"value" varchar NOT NULL,
	CONSTRAINT tags_pk PRIMARY KEY (id)
);

CREATE TABLE expenses.payment_tags (
	tag uuid NOT NULL,
	payment uuid NOT NULL,
	CONSTRAINT paymenttag_fk_1 FOREIGN KEY (tag) REFERENCES expenses.tags(id),
	CONSTRAINT paymenttag_fk_2 FOREIGN KEY (payment) REFERENCES expenses.payments(id)
);