package it.andmora.backend.domain;

import it.andmora.backend.domain.model.Payment;
import reactor.core.publisher.Mono;

public interface PaymentDao {

  Mono<Payment> savePayment(Payment payment);

  Mono<Integer> getOverallBalance();
}
