package it.andmora.expensesmonitor.backend.domain.usecase;

import it.andmora.expensesmonitor.backend.domain.model.Payment;
import reactor.core.publisher.Mono;

/**
 * Use case that implements the creation of a new Payment
 */
public interface PaymentCreator {

  Mono<Payment> createPayment(Payment payment);
}
