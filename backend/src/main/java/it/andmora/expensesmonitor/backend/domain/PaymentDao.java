package it.andmora.expensesmonitor.backend.domain;

import it.andmora.expensesmonitor.backend.domain.model.Payment;
import java.util.UUID;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PaymentDao {

  Mono<Payment> savePayment(Payment payment);

  Mono<Integer> getOverallBalance();

  Mono<Void> deletePayment(UUID id);

  Flux<String> getCategories();

  Flux<Payment> getRecentPayments(int page, int size);
}
