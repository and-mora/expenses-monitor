package it.andmora.expensesmonitor.domain;

import it.andmora.expensesmonitor.domain.entity.Payment;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

public interface PaymentDao {

  Mono<Payment> savePayment(Payment payment);
}
