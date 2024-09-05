package it.andmora.expensesmonitor.backend.domain.usecase;

import java.util.UUID;
import reactor.core.publisher.Mono;

/**
 * Use case that implements the creation of a new Payment
 */
public interface PaymentDeleter {

  Mono<Void> deletePayment(UUID id);
}
