package it.andmora.expensesmonitor.domain;

import it.andmora.expensesmonitor.domain.entity.Payment;
import reactor.core.publisher.Mono;

public interface PaymentDao {

  Mono<Payment> savePayment(Payment payment);

  Mono<Integer> getOverallBalance();
}
