package it.andmora.expensesmonitor.usecase;

import it.andmora.expensesmonitor.domain.entity.Payment;

/**
 * Use case that implements the creation of a new Payment
 */
public interface PaymentCreator {

  Payment createPayment(Payment payment);
}
