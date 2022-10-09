package it.andmora.expensesmonitor.dao;

import it.andmora.expensesmonitor.domain.entity.Payment;

public interface PaymentDao {

  Payment savePayment(Payment payment);
}
