package it.andmora.expensesmonitor.dao;

import it.andmora.expensesmonitor.domain.PaymentDao;
import it.andmora.expensesmonitor.domain.entity.Payment;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Implementation of Dao consists of interconnections between the Dao interface and the repository.
 * It's used to decouple the interface for the use cases and the real implementation of persistance
 * layer
 */
@Component
class PaymentDaoImplSample implements PaymentDao {

  // custom repository interface

  @Override
  public Mono<Payment> savePayment(Payment payment) {
    return null;
  }

  @Override
  public Mono<Integer> getOverallBalance() {
    return null;
  }
}
