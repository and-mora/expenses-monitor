package it.andmora.expensesmonitor.domain;

import it.andmora.expensesmonitor.domain.model.Payment;
import reactor.core.publisher.Mono;

public interface PaymentDao {

  Mono<Payment> savePayment(Payment payment);

  Mono<Integer> getOverallBalance();
}
