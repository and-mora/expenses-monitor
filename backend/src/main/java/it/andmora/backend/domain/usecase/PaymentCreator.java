package it.andmora.backend.domain.usecase;

import it.andmora.backend.domain.model.Payment;
import reactor.core.publisher.Mono;

/**
 * Use case that implements the creation of a new Payment
 */
public interface PaymentCreator {

  Mono<Payment> createPayment(Payment payment);
}
