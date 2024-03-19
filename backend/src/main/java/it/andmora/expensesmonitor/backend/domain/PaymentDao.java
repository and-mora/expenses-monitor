package it.andmora.expensesmonitor.backend.domain;

import it.andmora.expensesmonitor.backend.domain.model.Payment;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PaymentDao {

  Mono<Payment> savePayment(Payment payment);

  Mono<Integer> getOverallBalance();

  Mono<Void> deletePayment(Integer id);

  Flux<String> getCategories();
}
