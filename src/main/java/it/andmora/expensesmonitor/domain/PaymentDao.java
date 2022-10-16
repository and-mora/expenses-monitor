package it.andmora.expensesmonitor.domain;

import it.andmora.expensesmonitor.domain.entity.Payment;

public interface PaymentDao {

  Payment savePayment(Payment payment);
}
